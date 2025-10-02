# Wrapper for Gemini API calls

import os
import re
import json
import time
from typing import Optional, Any, Tuple
import google.genai as genai
from google.genai import errors as genai_errors
import logging

logger = logging.getLogger(__name__)


class QuotaExceededError(Exception):
    def __init__(self, message, retry_after=None, key_source: Optional[str] = None):
        super().__init__(message)
        self.retry_after = retry_after
        self.key_source = key_source

def _make_client(api_key: Optional[str] = None, api_key_source: Optional[str] = None):
    """
    Create a genai client. Prefer provided api_key, then env var GOOGLE_GENAI_API_KEY.
    If no key is provided, Client() will rely on default environment credentials if available.
    """
    env_key = os.environ.get("GOOGLE_GENAI_API_KEY")
    key = api_key or env_key
    # Determine key source if not provided
    if api_key:
        source = api_key_source or "explicit"
        logger.info("Creating genai client with explicit api_key provided by caller (source=%s).", source)
    elif env_key:
        source = api_key_source or "server_env"
        logger.info("Creating genai client using server environment GOOGLE_GENAI_API_KEY (source=%s).", source)
    else:
        source = api_key_source or "default_credentials"
        logger.info("Creating genai client with default credentials (no explicit API key) (source=%s).", source)

    # avoid logging secrets; but record the source on the client for error reporting
    if key:
        client = genai.Client(api_key=key)
    else:
        client = genai.Client()
    try:
        setattr(client, "_llm_key_source", source)
    except Exception:
        pass
    return client

def _choose_model(client: genai.Client) -> str:
    """
    Try to pick a model name that supports text generation. Fallback to sensible defaults.
    """
    try:
        # If the operator set a preferred model(s) via env, use them deterministically
        preferred = os.environ.get("GOOGLE_GENAI_PREFERRED_MODEL")
        if preferred:
            # allow comma-separated list; prefer first entry
            pref_list = [p.strip() for p in preferred.split(",") if p.strip()]
            if pref_list:
                # Try to confirm availability by listing models and matching names; if not found, still return first preferred to be deterministic
                try:
                    models = client.models.list()
                    available = set((getattr(m, "name", None) or getattr(m, "model", None) or str(m)) for m in models)
                    for p in pref_list:
                        # exact match preferred, otherwise substring match
                        if p in available:
                            logger.info("Using preferred model (exact match): %s", p)
                            return p
                    for p in pref_list:
                        for a in available:
                            if p.lower() in (a or "").lower():
                                logger.info("Using preferred model (substring match): %s -> %s", p, a)
                                return a
                except Exception:
                    # if listing failed, fall back to returning the first preferred model name directly
                    logger.info("Could not list models; returning preferred model: %s", pref_list[0])
                    return pref_list[0]

        # Deterministic ordered candidate list (no randomness)
        candidates = ["gemini-2.5-flash",
            "gemini-1.5", "gemini-1.5-flash",
            "gemini-1.0", "text-bison@001", "text-bison-001", "text-bison"
        ]

        models = client.models.list()
        names = [getattr(m, "name", None) or getattr(m, "model", None) or str(m) for m in models]

        # select the first candidate that appears in the provider list
        for c in candidates:
            for n in names:
                if n and c in (n or ""):
                    logger.info("Selected model by deterministic candidate match: %s", n)
                    return n

        # otherwise, pick the first non-embedding-like model name
        for n in names:
            if n and not any(k in (n or "").lower() for k in ("embed", "embedding", "gecko", "similarity")):
                logger.info("Falling back to first non-embedding model: %s", n)
                return n

        if names:
            logger.info("Falling back to first available model: %s", names[0])
            return names[0]
    except Exception as e:
        logger.warning("Could not list models: %s", e)
    # last-resort fallback (may still fail if not available)
    return "text-bison@001"

def _extract_json_from_text(text: str) -> Tuple[Optional[Any], Optional[str]]:
    """
    Try to extract JSON object/array from free text. Returns (parsed_obj, raw_json_text) or (None, None)
    """
    if not text:
        return None, None
    # try to find first JSON substring starting at first '{' or '['
    idx_obj = min([i for i in (text.find('{'), text.find('[')) if i >= 0] + [ -1 ])
    if idx_obj == -1:
        # fallback: try to find ```json ... ```
        m = re.search(r"```json(.*?)```", text, re.S | re.I)
        if m:
            candidate = m.group(1).strip()
            try:
                return json.loads(candidate), candidate
            except Exception:
                return None, candidate
        return None, None
    # progressive parsing: expand closing braces/brackets and try loads
    for end in range(idx_obj + 1, len(text) + 1):
        candidate = text[idx_obj:end]
        try:
            parsed = json.loads(candidate)
            return parsed, candidate
        except Exception:
            continue
    # final fallback: extract balanced braces/brackets using simple heuristic
    try:
        # extract between first '{' and last '}' or first '[' and last ']'
        if text[idx_obj] == '{' and '}' in text:
            candidate = text[idx_obj:text.rfind('}')+1]
        elif text[idx_obj] == '[' and ']' in text:
            candidate = text[idx_obj:text.rfind(']')+1]
        else:
            candidate = text
        return json.loads(candidate), candidate
    except Exception:
        # try to pull JSON from triple-backticks block
        m = re.search(r"```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```", text, re.S)
        if m:
            try:
                return json.loads(m.group(1)), m.group(1)
            except Exception:
                return None, m.group(1)
    return None, None

def _call_model_with_retry(client: genai.Client, model_name: str, contents: str, retries: int = 2, delay: float = 0.5) -> str:
    last_exc = None
    for attempt in range(retries):
        try:
            resp = client.models.generate_content(model=model_name, contents=contents)
            text = getattr(resp, "text", None) or getattr(resp, "content", None) or str(resp)
            return text.strip()
        except Exception as e:
            # Detect quota / resource-exhausted errors and fail fast so callers can fallback
            last_exc = e
            msg = str(e)
            is_quota = False
            try:
                if isinstance(e, genai_errors.ClientError):
                    status = getattr(e, 'status_code', None)
                    if status == 429:
                        is_quota = True
            except Exception:
                pass
            if not is_quota and ("RESOURCE_EXHAUSTED" in msg or "quota" in msg.lower() or "exceeded" in msg.lower()):
                is_quota = True

            if is_quota:
                # try to extract retry seconds if present
                retry_after = None
                m = re.search(r"retry.*?(\d+(?:\.\d+)?)s", msg, re.I)
                if m:
                    try:
                        retry_after = float(m.group(1))
                    except Exception:
                        retry_after = None
                # capture key source from client, if set
                key_src = None
                try:
                    key_src = getattr(client, "_llm_key_source", None)
                except Exception:
                    key_src = None
                logger.warning("Model call attempt %d failed due to quota/resource limits: %s; retry_after=%s; key_source=%s", attempt+1, e, retry_after, key_src)
                # raise a specific error so analyzer can disable LLM features for this request
                raise QuotaExceededError(msg, retry_after, key_source=key_src)

            logger.warning("Model call attempt %d failed: %s", attempt+1, e)
            time.sleep(delay)
    logger.exception("All model attempts failed: %s", last_exc)
    raise last_exc

def get_summary(code: str, api_key: Optional[str] = None, api_key_source: Optional[str] = None) -> str:
    client = _make_client(api_key, api_key_source=api_key_source)
    try:
        model_name = _choose_model(client)
        prompt = f"""You are a concise, technical assistant. Produce a code summary (max 200 words).
Return ONLY a JSON object with keys: "summary" (string, concise) and "key_points" (array of short strings).
Do not include any explanation outside the JSON.
Code:
```
{code}
```"""
        raw = _call_model_with_retry(client, model_name, prompt)
        parsed, raw_json = _extract_json_from_text(raw)
        if parsed and isinstance(parsed, dict) and "summary" in parsed:
            return json.dumps(parsed)  # return JSON string for downstream parsing
        # fallback: return raw text prefixed with error marker if not JSON
        return raw
    except Exception as e:
        logger.exception("LLM summary call failed")
        return f"__LLM_ERROR__: {str(e)}"

def get_comments(code: str, metrics: dict, api_key: Optional[str] = None, api_key_source: Optional[str] = None) -> str:
    client = _make_client(api_key, api_key_source=api_key_source)
    prompt = f"""You are a code reviewer. Analyze the code and metrics and return ONLY a JSON array.
Each item must be an object with: line (int|null), column (int|null), severity ('error'|'warning'|'info'), category (Performance|Readability|Security|Maintainability|Style|Other), message (string), suggestion (string|null).
Do not include additional text.
Code:
```
{code}
```
Metrics: {json.dumps(metrics)}
"""
    try:
        model_name = _choose_model(client)
        raw = _call_model_with_retry(client, model_name, prompt)
        parsed, raw_json = _extract_json_from_text(raw)
        if parsed:
            return json.dumps(parsed)
        return raw
    except Exception as e:
        logger.exception("LLM comments call failed")
        return f"__LLM_ERROR__: {str(e)}"

def get_tags(code: str, metrics: dict, api_key: Optional[str] = None, api_key_source: Optional[str] = None) -> str:
    client = _make_client(api_key, api_key_source=api_key_source)
    prompt = f"""Identify up to 6 tags for this code sample. Return ONLY a JSON array of strings, e.g. ["Performance","Security"].
Code:
```
{code}
```
Metrics: {json.dumps(metrics)}
"""
    try:
        model_name = _choose_model(client)
        raw = _call_model_with_retry(client, model_name, prompt)
        parsed, raw_json = _extract_json_from_text(raw)
        if parsed:
            return json.dumps(parsed)
        return raw
    except Exception as e:
        logger.exception("LLM tags call failed")
        return f"__LLM_ERROR__: {str(e)}"

def get_library_docs(code: str, api_key: Optional[str] = None, api_key_source: Optional[str] = None) -> str:
    client = _make_client(api_key, api_key_source=api_key_source)
    prompt = f"""Extract library dependencies and produce usage snippets where applicable.
Return ONLY a JSON object: {{ "dependencies": [{{"name":..., "version":null, "reason": "..."}}, ...], "usage_notes": ["..."] }}
Code:
```
{code}
```"""
    try:
        model_name = _choose_model(client)
        raw = _call_model_with_retry(client, model_name, prompt)
        parsed, raw_json = _extract_json_from_text(raw)
        if parsed:
            return json.dumps(parsed)
        return raw
    except Exception as e:
        logger.exception("LLM docs call failed")
        return f"__LLM_ERROR__: {str(e)}"

from typing import Optional
import json
from .metrics import analyze_metrics
from .gemini_client import get_summary, get_comments, get_tags, get_library_docs
from .validators import validate_comments, validate_tags, validate_summary, validate_docs
import logging

logger = logging.getLogger(__name__)

def run_analysis(code: str, features: dict, mode: str = "local", api_key: Optional[str] = None):
    """
    Orchestrate analysis. Always runs local static metrics.
    If mode == "cloud" and api_key provided, use Gemini for summary/comments.
    Returns a dict; LLM errors are returned in 'llm_errors' fields rather than raising.
    """
    results = {}

    # Always compute local metrics
    if features.get("metrics", True):
        try:
            results["metrics"] = analyze_metrics(code)
        except Exception as e:
            logger.exception("Local metrics analysis failed")
            results["metrics_error"] = str(e)

    # Determine if LLM-backed features should be used
    use_llm = (mode == "cloud") and bool(api_key)

    if use_llm:
        # summary
        if features.get("summary", True):
            try:
                logger.info("Calling LLM summary: api_key_provided=%s", bool(api_key))
                summary_text = get_summary(code, api_key=api_key)
                parsed = None
                try:
                    parsed = json.loads(summary_text) if isinstance(summary_text, str) and (summary_text.strip().startswith("{") or summary_text.strip().startswith("[")) else summary_text
                except Exception:
                    parsed = summary_text
                cleaned, summ_errs = validate_summary(parsed)
                if summ_errs:
                    results["summary_validation_errors"] = summ_errs
                results["summary"] = cleaned
            except Exception as e:
                logger.exception("Error getting summary")
                results["summary_error"] = str(e)

        # review/comments
        if features.get("review", True):
            try:
                logger.info("Calling LLM comments: api_key_provided=%s", bool(api_key))
                comments_text = get_comments(code, results.get("metrics", {}), api_key=api_key)
                parsed = None
                try:
                    parsed = json.loads(comments_text) if isinstance(comments_text, str) and (comments_text.strip().startswith("[") or comments_text.strip().startswith("{")) else comments_text
                except Exception:
                    parsed = comments_text
                cleaned_comments, comment_errs = validate_comments(parsed if parsed is not None else [])
                results["comments"] = cleaned_comments
                if comment_errs:
                    results["comments_validation_errors"] = comment_errs
                # keep raw if not parseable
                if isinstance(parsed, str) and parsed.startswith("__LLM_ERROR__"):
                    results["comments_error"] = parsed
            except Exception as e:
                logger.exception("Error getting comments")
                results["comments_error"] = str(e)

        # tags via LLM
        if features.get("tags", True):
            try:
                logger.info("Calling LLM tags: api_key_provided=%s", bool(api_key))
                tags_text = get_tags(code, results.get("metrics", {}), api_key=api_key)
                parsed = None
                try:
                    parsed = json.loads(tags_text) if isinstance(tags_text, str) and tags_text.strip().startswith("[") else tags_text
                except Exception:
                    parsed = tags_text
                cleaned_tags, tags_errs = validate_tags(parsed if parsed is not None else [])
                results["tags"] = cleaned_tags
                if tags_errs:
                    results["tags_validation_errors"] = tags_errs
            except Exception as e:
                logger.exception("Error getting tags")
                results["tags_error"] = str(e)

        # docs placeholder
        if features.get("docs", True):
            try:
                logger.info("Calling LLM docs: api_key_provided=%s", bool(api_key))
                docs_text = get_library_docs(code, api_key=api_key)
                parsed = None
                try:
                    parsed = json.loads(docs_text) if isinstance(docs_text, str) and (docs_text.strip().startswith("{") or docs_text.strip().startswith("[")) else docs_text
                except Exception:
                    parsed = docs_text
                cleaned_docs, docs_errs = validate_docs(parsed)
                results["docs"] = cleaned_docs
                if docs_errs:
                    results["docs_validation_errors"] = docs_errs
            except Exception as e:
                logger.exception("Error getting library docs")
                results["docs_error"] = str(e)
    else:
        # When not using LLM, produce heuristic tags and empty docs
        if features.get("tags", True):
            try:
                mi = results.get("metrics", {}).get("mi_avg")
                cc = results.get("metrics", {}).get("cc_avg")
                heur = []
                if cc and cc > 10:
                    heur.append("Performance")
                if mi and mi < 60:
                    heur.append("Readability")
                results["tags"] = heur
            except Exception:
                results["tags_error"] = "tagging failed"
        if features.get("docs", True):
            results["docs"] = []

    return results

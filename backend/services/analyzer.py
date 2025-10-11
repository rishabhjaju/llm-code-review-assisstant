from typing import Optional
import json
from .metrics import analyze_metrics
from .gemini_client import get_summary, get_comments, get_tags, get_library_docs, QuotaExceededError
from . import gemini_client
from .validators import validate_comments, validate_tags, validate_summary, validate_docs
import logging

logger = logging.getLogger(__name__)


def run_analysis(code: str, features: dict, mode: str = "local", api_key: Optional[str] = None, api_key_source: Optional[str] = None):
    """
    Orchestrate analysis. Always runs local static metrics.
    If mode == "cloud" and api_key provided, use Gemini for summary/comments.
    Returns a dict; LLM errors are returned in 'llm_disabled' fields rather than raising.
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
        llm_disabled_reason = None
        retry_after = None

        try:
            # SUMMARY
            if features.get("summary", True):
                try:
                    logger.info("Calling LLM summary: api_key_provided=%s, api_key_source=%s", bool(api_key), api_key_source)
                    summary_text = get_summary(code, api_key=api_key, api_key_source=api_key_source)
                    parsed = None
                    try:
                        if isinstance(summary_text, str) and (summary_text.strip().startswith("{") or summary_text.strip().startswith("[")):
                            parsed = json.loads(summary_text)
                        else:
                            parsed = summary_text
                    except Exception:
                        # If parsing failed, preserve raw
                        parsed = summary_text

                    cleaned, summ_errs = validate_summary(parsed)
                    if summ_errs:
                        results["summary_validation_errors"] = summ_errs
                    results["summary"] = cleaned
                except QuotaExceededError:
                    # re-raise to outer handler
                    raise
                except Exception as e:
                    logger.exception("Error getting summary")
                    results["summary_error"] = str(e)

            # COMMENTS / REVIEW
            if features.get("review", True):
                try:
                    logger.info("Calling LLM comments: api_key_provided=%s, api_key_source=%s", bool(api_key), api_key_source)
                    comments_text = get_comments(code, results.get("metrics", {}), api_key=api_key, api_key_source=api_key_source)
                    parsed = None
                    try:
                        if isinstance(comments_text, str) and (comments_text.strip().startswith("[") or comments_text.strip().startswith("{")):
                            parsed = json.loads(comments_text)
                        else:
                            parsed = comments_text
                    except Exception:
                        parsed = comments_text

                    cleaned_comments, comment_errs = validate_comments(parsed if parsed is not None else [])
                    results["comments"] = cleaned_comments
                    if comment_errs:
                        results["comments_validation_errors"] = comment_errs
                    if isinstance(parsed, str) and parsed.startswith("__LLM_ERROR__"):
                        results["comments_error"] = parsed
                except QuotaExceededError:
                    raise
                except Exception as e:
                    logger.exception("Error getting comments")
                    results["comments_error"] = str(e)

            # TAGS
            if features.get("tags", True):
                try:
                    logger.info("Calling LLM tags: api_key_provided=%s, api_key_source=%s", bool(api_key), api_key_source)
                    tags_text = get_tags(code, results.get("metrics", {}), api_key=api_key, api_key_source=api_key_source)
                    parsed = None
                    try:
                        if isinstance(tags_text, str) and tags_text.strip().startswith("["):
                            parsed = json.loads(tags_text)
                        else:
                            parsed = tags_text
                    except Exception:
                        parsed = tags_text

                    cleaned_tags, tags_errs = validate_tags(parsed if parsed is not None else [])
                    results["tags"] = cleaned_tags
                    if tags_errs:
                        results["tags_validation_errors"] = tags_errs
                except QuotaExceededError:
                    raise
                except Exception as e:
                    logger.exception("Error getting tags")
                    results["tags_error"] = str(e)

            # DOCS
            if features.get("docs", True):
                try:
                    logger.info("Calling LLM docs: api_key_provided=%s, api_key_source=%s", bool(api_key), api_key_source)
                    docs_text = get_library_docs(code, api_key=api_key, api_key_source=api_key_source)
                    parsed = None
                    try:
                        if isinstance(docs_text, str) and (docs_text.strip().startswith("{") or docs_text.strip().startswith("[")):
                            parsed = json.loads(docs_text)
                        else:
                            parsed = docs_text
                    except Exception:
                        parsed = docs_text

                    cleaned_docs, docs_errs = validate_docs(parsed)
                    results["docs"] = cleaned_docs
                    if docs_errs:
                        results["docs_validation_errors"] = docs_errs
                except QuotaExceededError:
                    raise
                except Exception as e:
                    logger.exception("Error getting library docs")
                    results["docs_error"] = str(e)

        except QuotaExceededError as exc:
            # If a quota / RESOURCE_EXHAUSTED error occurred in the gemini client, disable LLM features for this request
            logger.warning("LLM quota exceeded, disabling LLM for this request: %s", exc)
            llm_disabled_reason = str(exc)
            retry_after = getattr(exc, 'retry_after', None)
            key_src = getattr(exc, 'key_source', None)
            # annotate which key source triggered the quota
            results["llm_disabled_key_source"] = key_src
        except Exception as exc:
            # unknown exception bubbled up
            logger.exception("Unhandled exception during LLM calls")
            results["llm_error"] = str(exc)
            llm_disabled_reason = str(exc)

        if llm_disabled_reason:
            # mark in results and provide heuristic-only fallbacks for LLM-driven fields
            results["llm_disabled"] = True
            results["llm_disabled_reason"] = llm_disabled_reason
            if retry_after is not None:
                results["llm_retry_after_seconds"] = retry_after
            # ensure tags/docs/comments/summary exist at least as heuristics/local results
            if "tags" not in results:
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
                    results.setdefault("tags", [])
            if "docs" not in results:
                results["docs"] = []
            if "comments" not in results:
                results["comments"] = []
            if "summary" not in results:
                results["summary"] = ""

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
    # Post-process docs to attach probable documentation URLs for known libraries
    try:
        docs_links = []
        # simple static mapping for common libraries / packages -> canonical docs
        DOC_URLS = {
            'requests': 'https://docs.python-requests.org/',
            'numpy': 'https://numpy.org/doc/',
            'pandas': 'https://pandas.pydata.org/docs/',
            'flask': 'https://flask.palletsprojects.com/en/latest/',
            'django': 'https://docs.djangoproject.com/en/stable/',
            'sqlalchemy': 'https://docs.sqlalchemy.org/',
            'react': 'https://reactjs.org/docs/getting-started.html',
            'express': 'https://expressjs.com/',
            'lodash': 'https://lodash.com/docs/',
            'axios': 'https://axios-http.com/docs/intro',
            'matplotlib': 'https://matplotlib.org/stable/contents.html',
            'bits/stdc++.h': 'https://en.cppreference.com/w/cpp/header/bits/stdc++.h',
        }

        seen = set()
        raw_docs = results.get('docs') or []

        def make_link(name: str, url: str = None, snippet: str = None, source: str = 'heuristic', confidence: float = 0.6):
            lid = (name or '')
            return {
                'id': lid,
                'name': name,
                'url': url or None,
                'canonical_url': url or None,
                'snippet': snippet or None,
                'source': source,
                'confidence': confidence
            }

        for d in raw_docs:
            try:
                name = None
                url = None
                snippet = None
                if isinstance(d, dict):
                    name = d.get('name') or d.get('title') or d.get('library')
                    url = d.get('url')
                    snippet = d.get('snippet') or d.get('description')
                else:
                    s = str(d)
                    snippet = s if len(s) < 200 else s[:200] + '...'
                    if '—' in s:
                        name = s.split('—', 1)[0].strip()
                    elif ' - ' in s:
                        name = s.split(' - ', 1)[0].strip()
                    else:
                        # take first token as a guess
                        name = s.split()[0].strip().strip('[],()')

                if not name:
                    continue
                key = name.lower()
                if key in seen:
                    continue
                seen.add(key)

                if url:
                    docs_links.append(make_link(name=name, url=url, snippet=snippet, source='llm', confidence=0.9))
                    continue

                # if we have a known canonical mapping
                if key in DOC_URLS:
                    docs_links.append(make_link(name=name, url=DOC_URLS[key], snippet=snippet, source='known', confidence=0.95))
                    continue

                # special handling: bits/stdc++.h or stdc++ variations
                if 'bits/stdc' in key or 'stdc++' in key:
                    docs_links.append(make_link(name='bits/stdc++.h', url=DOC_URLS.get('bits/stdc++.h'), snippet='GCC-specific convenience header', source='known', confidence=0.9))
                    continue

                # fallback: provide a google search link as url
                search_url = f"https://www.google.com/search?q={key.replace(' ', '+')}"
                docs_links.append(make_link(name=name, url=search_url, snippet=snippet, source='search', confidence=0.5))
            except Exception:
                continue

        # also dedupe by canonical_url/name
        if docs_links:
            results['docs_links'] = docs_links
        else:
            results['docs_links'] = []
    except Exception:
        results.setdefault('docs_links', [])
    return results

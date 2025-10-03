import re
from typing import Any, List, Dict, Tuple, Optional
from pydantic import ValidationError
from models.schemas import CommentModel, SummaryModel, DocsModel

def validate_comments(raw: Any) -> Tuple[List[Dict], List[str]]:
    """
    Validate/clean comments using Pydantic CommentModel.
    Returns (cleaned_list_of_dicts, errors_list)
    """
    errors: List[str] = []
    cleaned: List[Dict] = []

    if not isinstance(raw, list):
        errors.append("comments must be a JSON array")
        return [], errors

    for idx, item in enumerate(raw):
        try:
            # allow strings by trying to eval/parse? Keep strict: expect dict-like
            if not isinstance(item, dict):
                errors.append(f"comment[{idx}] is not an object")
                continue
            c = CommentModel.parse_obj(item)
            cleaned.append(c.dict())
        except ValidationError as ve:
            # collect each field error
            errs = "; ".join([f"{e['loc'][0]}: {e['msg']}" for e in ve.errors()])
            errors.append(f"comment[{idx}] validation error: {errs}")
        except Exception as e:
            errors.append(f"comment[{idx}] unexpected error: {str(e)}")
    return cleaned, errors

def validate_tags(raw: Any) -> Tuple[List[str], List[str]]:
    errors: List[str] = []
    cleaned: List[str] = []
    if isinstance(raw, list):
        for i, t in enumerate(raw):
            if t is None:
                continue
            s = str(t).strip()
            if s:
                cleaned.append(s)
    else:
        errors.append("tags must be an array of strings")
    return cleaned, errors

def validate_summary(raw: Any) -> Tuple[Optional[Dict[str, Any]], List[str]]:
    errors: List[str] = []
    if raw is None:
        errors.append("summary missing")
        return None, errors
    # If raw is a string, try to coerce into SummaryModel
    try:
        if isinstance(raw, str):
            sm = SummaryModel.parse_obj({"summary": raw})
        else:
            sm = SummaryModel.parse_obj(raw)
        return sm.dict(), errors
    except ValidationError as ve:
        errs = [f"{e['loc'][0]}: {e['msg']}" for e in ve.errors()]
        errors.extend(errs)
        return None, errors
    except Exception as e:
        errors.append(str(e))
        return None, errors

def validate_docs(raw: Any) -> Tuple[List[str], List[str]]:
    errors: List[str] = []
    cleaned: List[str] = []
    if raw is None:
        return [], errors
    try:
        if isinstance(raw, dict):
            dm = DocsModel.parse_obj(raw)
            # produce friendly list of dependency strings if present
            deps = dm.dependencies or []
            for d in deps:
                if isinstance(d, dict):
                    name = d.get("name") or d.get("package") or str(d)
                    reason = d.get("reason") or ""
                    cleaned.append(f"{name} — {reason}".strip(" — "))
                else:
                    cleaned.append(str(d))
            # include usage notes
            for n in (dm.usage_notes or []):
                if n:
                    cleaned.append(str(n))
        elif isinstance(raw, list):
            cleaned = [str(x) for x in raw]
        elif isinstance(raw, str):
            if raw.strip():
                cleaned = [raw.strip()]
    except ValidationError as ve:
        errors.extend([f"{e['loc'][0]}: {e['msg']}" for e in ve.errors()])
    except Exception as e:
        errors.append(str(e))
    return cleaned, errors
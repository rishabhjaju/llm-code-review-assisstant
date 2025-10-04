# Routes for file analysis

from fastapi import APIRouter, UploadFile, Form, HTTPException, Body, Response, Request
from typing import Optional, Any
import json
from services.analyzer import run_analysis
from services import gemini_client
from utils.file_utils import validate_file_lines
from services.exporter import build_sarif, build_export_payload
from models.schemas import AnalyzeResponse, ExportRequestModel  # added ExportRequestModel
from services.history_store import list_history, save_entry, clear_history
import logging

router_logger = logging.getLogger("backend.routers.analyze")

router = APIRouter()

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_file(
    request: Request,
    file: UploadFile,
    mode: str = Form("cloud"),
    features: str = Form("{}"),
    api_key: Optional[str] = Form(None)
):
    content = (await file.read()).decode("utf-8")

    if not validate_file_lines(content):
        raise HTTPException(status_code=400, detail="File exceeds 500 lines limit.")

    try:
        features_dict = json.loads(features)
    except Exception:
        features_dict = {}

    # Prefer api_key from form, then Authorization Bearer header, then X-API-Key
    used_key = api_key
    if not used_key and request is not None:
        auth = request.headers.get('authorization') or request.headers.get('x-api-key')
        if auth:
            auth = auth.strip()
            if auth.lower().startswith('bearer '):
                used_key = auth.split(None, 1)[1].strip()
            else:
                used_key = auth

    # Normalize/trim the key and determine source for debugging (do NOT log the key itself)
    key_source = 'none'
    if api_key:
        key_source = 'form'
    elif request is not None and (request.headers.get('authorization') or request.headers.get('x-api-key')):
        key_source = 'header'

    if used_key:
        used_key = used_key.strip() or None

    # Log non-sensitive info to help debug exhausted-key issues
    try:
        llm_enabled = (mode == 'cloud') and bool(used_key)
        router_logger.info("analyze request: mode=%s, key_source=%s, llm_enabled=%s, file_len=%d",
                           mode, key_source, llm_enabled, len(content))
    except Exception:
        pass

    # pass key_source for improved diagnostics when LLM calls fail
    results = run_analysis(content, features_dict, mode, api_key=used_key, api_key_source=key_source)

    # FastAPI will validate/serialize to response_model; ensure keys exist and types align.
    # Normalize fields to match AnalyzeResponse keys (use None when missing)
    normalized = {
        "summary": results.get("summary"),
        "summary_validation_errors": results.get("summary_validation_errors"),
        "summary_error": results.get("summary_error"),
        "metrics": results.get("metrics"),
        "metrics_error": results.get("metrics_error"),
        "comments": results.get("comments"),
        "comments_validation_errors": results.get("comments_validation_errors"),
        "comments_error": results.get("comments_error"),
        "comments_raw": results.get("comments_raw"),
        "tags": results.get("tags"),
        "tags_validation_errors": results.get("tags_validation_errors"),
        "tags_error": results.get("tags_error"),
        "tags_raw": results.get("tags_raw"),
        "docs": results.get("docs"),
    "docs_links": results.get("docs_links"),
        "docs_validation_errors": results.get("docs_validation_errors"),
        "docs_error": results.get("docs_error"),
        "docs_raw": results.get("docs_raw"),
        "llm_disabled": results.get("llm_disabled"),
        "llm_disabled_reason": results.get("llm_disabled_reason"),
        "llm_retry_after_seconds": results.get("llm_retry_after_seconds"),
        "llm_error": results.get("llm_error"),
    }

    return normalized


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get('/llm/models')
async def list_llm_models(request: Request, api_key: Optional[str] = None):
    """
    Debug endpoint: list models visible to the provided API key.
    Provide `api_key` as query param or via Authorization: Bearer <key> / X-API-Key header.
    """
    used_key = api_key
    if not used_key and request is not None:
        auth = request.headers.get('authorization') or request.headers.get('x-api-key')
        if auth:
            auth = auth.strip()
            if auth.lower().startswith('bearer '):
                used_key = auth.split(None, 1)[1].strip()
            else:
                used_key = auth

    try:
        client = gemini_client._make_client(used_key)
        models = client.models.list()
        out = []
        for m in models:
            name = getattr(m, 'name', None) or getattr(m, 'model', None) or str(m)
            out.append({'name': name})
        return {'models': out, 'key_provided': bool(used_key)}
    except Exception as e:
        router_logger.exception("Failed to list models: %s", e)
        raise HTTPException(status_code=502, detail=f"Could not list models: {e}")


# New export endpoint
@router.post("/export")
async def export_results(payload: ExportRequestModel = Body(...)):
    """
    Accepts ExportRequestModel Pydantic payload and returns attachment.
    """
    filename = (payload.filename or "analysis")
    fmt = (payload.format or "sarif").lower()
    comments = payload.comments or []
    metrics = payload.metrics
    tags = payload.tags
    summary = payload.summary

    # validate basic types (Pydantic already helped) 
    if not isinstance(comments, list):
        raise HTTPException(status_code=400, detail="comments must be an array")

    if fmt == "json":
        content = build_export_payload(comments, metrics, tags, summary)
        body = json.dumps(content, indent=2)
        out_name = f"{filename}.json"
        headers = {"Content-Disposition": f'attachment; filename="{out_name}"'}
        return Response(content=body, media_type="application/json", headers=headers)
    elif fmt in ("sarif", "sarif.json"):
        metadata = {"filename": filename, "tool_name": "LLM Code Review Assistant"}
        sarif_obj = build_sarif(comments, metadata)
        body = json.dumps(sarif_obj, indent=2)
        out_name = f"{filename}.sarif.json"
        headers = {"Content-Disposition": f'attachment; filename="{out_name}"'}
        return Response(content=body, media_type="application/json", headers=headers)
    else:
        raise HTTPException(status_code=400, detail="unsupported export format")


# History endpoints (server-side persistence)
@router.get('/history')
async def get_history(limit: int = 50):
    items = list_history(limit)
    return {'items': items}


@router.post('/history')
async def post_history(payload: dict = Body(...)):
    # Expect payload to be same shape as export payload + timestamp
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail='invalid payload')
    saved = save_entry(payload)
    return saved


@router.delete('/history')
async def delete_history():
    clear_history()
    return {'status': 'cleared'}
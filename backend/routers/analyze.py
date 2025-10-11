
"""Routes for file analysis and lightweight history storage.

This router exposes the endpoints used by the frontend: /analyze, /history, /export and /health.
It centralizes API-key extraction and keeps behavior stable while simplifying code paths.
"""

from fastapi import APIRouter, UploadFile, Form, HTTPException, Body, Request
from typing import Optional, Tuple
import json
from services.analyzer import run_analysis
from utils.file_utils import validate_file_lines
from services.history_store import list_history, save_entry, clear_history
import logging
from fastapi.responses import StreamingResponse
from services.pdf_exporter import build_pdf_report

router_logger = logging.getLogger("backend.routers.analyze")

router = APIRouter()


def _extract_api_key(request: Optional[Request], form_key: Optional[str]) -> Tuple[Optional[str], str]:
    """Return (api_key, key_source) where key_source is one of: 'form', 'header', 'none'."""
    if form_key:
        k = form_key.strip() or None
        return k, 'form'
    if not request:
        return None, 'none'
    auth = request.headers.get('authorization') or request.headers.get('x-api-key')
    if not auth:
        return None, 'none'
    auth = auth.strip()
    if auth.lower().startswith('bearer '):
        return (auth.split(None, 1)[1].strip() or None), 'header'
    return (auth or None), 'header'


@router.post("/analyze")
async def analyze_file(
    request: Request,
    file: UploadFile,
    mode: str = Form("cloud"),
    features: str = Form("{}"),
    api_key: Optional[str] = Form(None),
):
    """Analyze uploaded file. Returns a JSON object with summary, metrics, comments, tags, docs, etc."""
    content = (await file.read()).decode("utf-8")

    if not validate_file_lines(content):
        raise HTTPException(status_code=400, detail="File exceeds 500 lines limit.")

    try:
        features_dict = json.loads(features)
    except Exception:
        features_dict = {}

    used_key, key_source = _extract_api_key(request, api_key)

    try:
        llm_enabled = (mode == 'cloud') and bool(used_key)
        router_logger.info("analyze request: mode=%s, key_source=%s, llm_enabled=%s, file_len=%d",
                           mode, key_source, llm_enabled, len(content))
    except Exception:
        pass

    results = run_analysis(content, features_dict, mode, api_key=used_key, api_key_source=key_source)

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
        "llm_disabled_key_source": results.get("llm_disabled_key_source"),
    }

    return normalized


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get('/history')
async def get_history(limit: int = 50):
    items = list_history(limit)
    return {'items': items}


@router.post('/history')
async def post_history(payload: dict = Body(...)):
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail='invalid payload')
    saved = save_entry(payload)
    return saved


@router.delete('/history')
async def delete_history():
    clear_history()
    return {'status': 'cleared'}


@router.post('/export')
async def export_report(payload: dict = Body(...)):
    # payload should be the analysis JSON object; generate a PDF and return as attachment
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail='invalid payload')
    try:
        pdf_bytes = build_pdf_report(payload)
        # return a StreamingResponse backed by the raw bytes
        return StreamingResponse(iter([pdf_bytes]), media_type='application/pdf', headers={
            'Content-Disposition': 'attachment; filename="code_review_report.pdf"'
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
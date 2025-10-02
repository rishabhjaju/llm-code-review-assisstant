# Routes for file analysis

from fastapi import APIRouter, UploadFile, Form, HTTPException
from typing import Optional
import json
from services.analyzer import run_analysis
from utils.file_utils import validate_file_lines

router = APIRouter()

@router.post("/analyze")
async def analyze_file(
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

    results = run_analysis(content, features_dict, mode, api_key=api_key)
    return results


@router.get("/health")
async def health():
    return {"status": "ok"}
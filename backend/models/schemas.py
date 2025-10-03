# Pydantic request/response models

from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, validator

class CommentModel(BaseModel):
    line: Optional[int] = None
    column: Optional[int] = None
    severity: Literal['error', 'warning', 'info'] = 'info'
    category: str = Field(default='Other')
    message: str
    suggestion: Optional[str] = None

    @validator('line', 'column', pre=True, always=True)
    def coerce_positive_int(cls, v):
        if v is None or v == "":
            return None
        try:
            iv = int(v)
            return iv if iv >= 0 else None
        except Exception:
            return None

    @validator('severity', pre=True, always=True)
    def normalize_severity(cls, v):
        if not v:
            return 'info'
        s = str(v).lower()
        if s not in ('error', 'warning', 'info'):
            return 'info'
        return s

    @validator('category', pre=True, always=True)
    def normalize_category(cls, v):
        if not v:
            return 'Other'
        s = str(v).strip()
        allowed = {"Performance","Readability","Security","Maintainability","Style","Other"}
        return s if s in allowed else 'Other'

    @validator('message')
    def message_must_not_be_empty(cls, v):
        # ensure we coerce to string and strip whitespace; use Python's strip() not .trim()
        s = (v or '')
        try:
            s = s.strip()
        except Exception:
            s = str(v).strip()
        if not s:
            raise ValueError('message must be non-empty')
        return s

class SummaryModel(BaseModel):
    summary: str
    key_points: List[str] = []

    @validator('summary')
    def trim_summary(cls, v):
        return v.strip()

    @validator('key_points', pre=True)
    def coerce_key_points(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            return [p.strip() for p in v.split(',') if p.strip()]
        if isinstance(v, list):
            return [str(x).strip() for x in v]
        return []

class DependencyModel(BaseModel):
    name: str
    version: Optional[str] = None
    reason: Optional[str] = None

class DocsModel(BaseModel):
    dependencies: Optional[List[Dict[str, Any]]] = []
    usage_notes: Optional[List[str]] = []

    @validator('usage_notes', pre=True)
    def coerce_usage_notes(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            return [v.strip()]
        if isinstance(v, list):
            return [str(x).strip() for x in v]
        return []

class MetricsModel(BaseModel):
    cc_avg: Optional[float] = None
    mi_avg: Optional[float] = None
    pylint_score: Optional[float] = None
    naming_quality: Optional[float] = None
    execution_time_estimate_ms: Optional[float] = None
    oop_compliance: Optional[float] = None
    coding_standards: Optional[float] = None
    lines: Optional[int] = None
    func_count: Optional[int] = None
    class_count: Optional[int] = None

class AnalyzeResponse(BaseModel):
    summary: Optional[SummaryModel] = None
    summary_validation_errors: Optional[List[str]] = None
    summary_error: Optional[str] = None

    metrics: Optional[MetricsModel] = None
    metrics_error: Optional[str] = None

    comments: Optional[List[CommentModel]] = None
    comments_validation_errors: Optional[List[str]] = None
    comments_error: Optional[str] = None
    comments_raw: Optional[str] = None

    tags: Optional[List[str]] = None
    tags_validation_errors: Optional[List[str]] = None
    tags_error: Optional[str] = None
    tags_raw: Optional[str] = None

    docs: Optional[List[str]] = None
    docs_validation_errors: Optional[List[str]] = None
    docs_error: Optional[str] = None
    docs_raw: Optional[str] = None

    # LLM disabled / quota metadata
    llm_disabled: Optional[bool] = None
    llm_disabled_reason: Optional[str] = None
    llm_retry_after_seconds: Optional[float] = None
    llm_disabled_key_source: Optional[str] = None

class ExportRequestModel(BaseModel):
    filename: Optional[str] = "analysis"
    format: Literal["json", "sarif"] = "sarif"
    comments: Optional[List[Dict[str, Any]]] = []
    metrics: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = []
    summary: Optional[Any] = None

# helper typing aliases
CommentList = List[CommentModel]
Summary = SummaryModel
Docs = DocsModel

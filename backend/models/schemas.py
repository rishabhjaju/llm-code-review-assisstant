# Pydantic request/response models

from pydantic import BaseModel
from typing import List, Optional

class AnalyzeFeatures(BaseModel):
    summary: bool = True
    review: bool = True
    metrics: bool = True
    tags: bool = True
    docs: bool = True

class AnalyzeRequest(BaseModel):
    mode: str = "local"  # "local" or "cloud"
    features: AnalyzeFeatures

class Comment(BaseModel):
    line: int
    severity: str
    message: str
    suggestion: Optional[str] = None

class Metrics(BaseModel):
    cc_avg: float
    mi_avg: float
    pylint_score: float
    naming_quality: float

class AnalyzeResponse(BaseModel):
    summary: Optional[str] = None
    metrics: Optional[Metrics] = None
    comments: Optional[List[Comment]] = None
    tags: Optional[List[str]] = None
    docs: Optional[List[str]] = None

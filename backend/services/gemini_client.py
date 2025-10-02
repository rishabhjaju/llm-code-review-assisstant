# Wrapper for Gemini API calls

import os
from typing import Optional
import google.genai as genai

def _make_client(api_key: Optional[str] = None):
    """
    Create a genai client. Prefer provided api_key, then env var GOOGLE_GENAI_API_KEY.
    If no key is provided, Client() will rely on default environment credentials if available.
    """
    key = api_key or os.environ.get("GOOGLE_GENAI_API_KEY")
    if key:
        return genai.Client(api_key=key)
    return genai.Client()

def get_summary(code: str, api_key: Optional[str] = None) -> str:
    client = _make_client(api_key)
    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents=f"Summarize the following code in <=200 words:\n\n{code}"
    )
    return response.text.strip()

def get_comments(code: str, metrics: dict, api_key: Optional[str] = None) -> str:
    client = _make_client(api_key)
    prompt = f"""You are a code reviewer.
Code:
{code}

Metrics:
{metrics}

Provide review comments as a JSON array. Each item must include: line (int), column (optional int), severity (error|warning|info), message (string), suggestion (optional string). Return only the JSON array."""
    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents=prompt
    )
    return response.text.strip()

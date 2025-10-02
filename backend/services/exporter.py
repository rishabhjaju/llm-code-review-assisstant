import json
from typing import List, Dict, Any, Optional

def _map_severity_to_sarif_level(sev: str) -> str:
    sev = (sev or "").lower()
    if sev == "error":
        return "error"
    if sev == "warning":
        return "warning"
    return "note"

def build_sarif(comments: List[Dict[str, Any]], metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Build a minimal SARIF v2.1.0 structure from review comments.
    """
    metadata = metadata or {}
    file_uri = metadata.get("filename", "file")
    tool_name = metadata.get("tool_name", "LLM Code Review Assistant")

    results = []
    for c in comments:
        start_line = c.get("line") if isinstance(c.get("line"), int) and c.get("line") > 0 else 1
        start_col = c.get("column") if isinstance(c.get("column"), int) and c.get("column") > 0 else 1
        level = _map_severity_to_sarif_level(c.get("severity", "info"))
        rule_id = c.get("category", "LLM")
        message_text = c.get("message", "")
        if c.get("suggestion"):
            message_text = f"{message_text} Suggestion: {c.get('suggestion')}"
        result = {
            "ruleId": rule_id,
            "level": level,
            "message": {"text": message_text},
            "locations": [
                {
                    "physicalLocation": {
                        "artifactLocation": {"uri": file_uri},
                        "region": {"startLine": start_line, "startColumn": start_col}
                    }
                }
            ]
        }
        results.append(result)

    sarif = {
        "version": "2.1.0",
        "$schema": "https://schemastore.azurewebsites.net/schemas/json/sarif-2.1.0.json",
        "runs": [
            {
                "tool": {
                    "driver": {
                        "name": tool_name,
                        "informationUri": "https://example.com/llm-code-review",
                        "rules": []  # optional: could list rules metadata
                    }
                },
                "results": results
            }
        ]
    }
    return sarif

def build_export_payload(comments: List[Dict[str, Any]], metrics: Optional[Dict[str, Any]] = None, tags: Optional[List[str]] = None, summary: Optional[Any] = None) -> Dict[str, Any]:
    """
    Build a JSON payload for exporting raw review results.
    """
    return {
        "comments": comments,
        "metrics": metrics or {},
        "tags": tags or [],
        "summary": summary or None
    }
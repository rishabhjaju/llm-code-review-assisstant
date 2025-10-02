import json
import os
from typing import List, Dict, Any

STORE_PATH = os.path.join(os.path.dirname(__file__), '..', 'data')
HISTORY_FILE = os.path.join(STORE_PATH, 'history.json')

os.makedirs(STORE_PATH, exist_ok=True)

def _read_all() -> List[Dict[str, Any]]:
    if not os.path.exists(HISTORY_FILE):
        return []
    try:
        with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def _write_all(items: List[Dict[str, Any]]):
    with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
        json.dump(items, f, indent=2, default=str)

def list_history(limit: int = 50) -> List[Dict[str, Any]]:
    items = _read_all()
    return items[:limit]

def save_entry(entry: Dict[str, Any]) -> Dict[str, Any]:
    items = _read_all()
    items.insert(0, entry)
    # keep up to 200 entries
    items = items[:200]
    _write_all(items)
    return entry

def clear_history():
    _write_all([])
    return []

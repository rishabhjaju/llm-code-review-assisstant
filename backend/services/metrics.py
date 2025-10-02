# Local static analysis (radon, pylint, AST)

import subprocess
import tempfile
import ast
from typing import Dict, Any
from radon.complexity import cc_visit
from radon.metrics import mi_visit

def _analyze_python_names(code: str):
    try:
        tree = ast.parse(code)
    except Exception:
        return {"avg_name_len": 0, "naming_quality": 0.0, "func_count": 0, "class_count": 0}

    name_lengths = []
    func_count = 0
    class_count = 0
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            func_count += 1
            name_lengths.append(len(node.name))
        if isinstance(node, ast.ClassDef):
            class_count += 1
            name_lengths.append(len(node.name))
        if isinstance(node, ast.Name):
            name_lengths.append(len(node.id))

    avg_len = sum(name_lengths) / max(len(name_lengths), 1)
    good_names = sum(1 for L in name_lengths if L >= 3)
    naming_quality = good_names / max(len(name_lengths), 1)
    return {"avg_name_len": avg_len, "naming_quality": round(naming_quality, 3), "func_count": func_count, "class_count": class_count}

def analyze_metrics(code: str) -> Dict[str, Any]:
    """
    Return metrics: cc_avg, mi_avg, pylint_score, naming_quality, execution_time_estimate_ms,
    oop_compliance, coding_standards, lines, func_count, class_count
    """
    # Cyclomatic complexity
    try:
        complexity = cc_visit(code)
        avg_cc = sum([c.complexity for c in complexity]) / max(len(complexity), 1)
    except Exception:
        avg_cc = 0.0

    # Maintainability Index
    try:
        mi_scores = mi_visit(code, True)
        if isinstance(mi_scores, dict):
            avg_mi = sum(mi_scores.values()) / max(len(mi_scores), 1)
        else:
            avg_mi = float(mi_scores)
    except Exception:
        avg_mi = 0.0

    # Pylint score (best-effort)
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".py") as tmp:
            tmp.write(code.encode())
            tmp.flush()
            pylint_output = subprocess.getoutput(f"pylint {tmp.name} -sn --score=y")
        try:
            pylint_score = float(pylint_output.split()[-1])
        except Exception:
            pylint_score = 0.0
    except Exception:
        pylint_score = 0.0

    # Naming heuristics
    name_info = _analyze_python_names(code)
    naming_quality = name_info.get("naming_quality", 0.0)

    # OOP compliance heuristic
    oop_score = 0.0
    try:
        tree = ast.parse(code)
        class_nodes = [n for n in ast.walk(tree) if isinstance(n, ast.ClassDef)]
        if class_nodes:
            classes_with_method = 0
            for cls in class_nodes:
                if any(isinstance(m, ast.FunctionDef) for m in cls.body):
                    classes_with_method += 1
            oop_score = classes_with_method / max(len(class_nodes), 1)
    except Exception:
        oop_score = 0.0

    lines = code.count("\n") + 1
    execution_time_estimate_ms = max(1.0, (lines / 100.0) * (avg_cc + 1.0) * 10.0)
    coding_standards = min(100.0, max(0.0, pylint_score))

    return {
        "cc_avg": round(avg_cc, 3),
        "mi_avg": round(avg_mi, 3),
        "pylint_score": round(pylint_score, 2),
        "naming_quality": round(naming_quality, 3),
        "execution_time_estimate_ms": round(execution_time_estimate_ms, 2),
        "oop_compliance": round(oop_score, 3),
        "coding_standards": round(coding_standards, 2),
        "lines": lines,
        "func_count": name_info.get("func_count", 0),
        "class_count": name_info.get("class_count", 0),
    }

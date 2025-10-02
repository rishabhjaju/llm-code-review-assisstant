# File validation (lines count, type)

def validate_file_lines(content: str, max_lines: int = 500) -> bool:
    lines = content.splitlines()
    return len(lines) <= max_lines

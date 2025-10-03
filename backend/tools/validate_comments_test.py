# Simple script to validate sample comment objects against the project's Pydantic CommentModel
# Run from the repo: python backend/tools/validate_comments_test.py

from models.schemas import CommentModel

sample_comments = [
    {
      "line": 5,
      "column": 1,
      "severity": "warning",
      "category": "Security",
      "message": "Accessing HKEY_LOCAL_MACHINE requires elevated privileges on Windows and may raise PermissionError for non-admin processes.",
      "suggestion": "Catch PermissionError and surface a clear message or check for required privileges before attempting registry access; document that the script requires admin rights."
    },
    {
      "line": 10,
      "column": 1,
      "severity": "info",
      "category": "Maintainability",
      "message": "The function mixes side-effects (printing) with returning a numerical score. This reduces reusability for callers who may want structured output.",
      "suggestion": "Separate concerns: return a structured result (list of devices + score) and move printing into a separate CLI or presentation layer."
    },
    {
      "line": 18,
      "column": 1,
      "severity": "warning",
      "category": "Maintainability",
      "message": "Inferring the device serial number from the registry instance key name is brittle; instance key formats may vary by vendor.",
      "suggestion": "Validate the parsed serial with a regex and fall back to 'Unknown' or a vendor-specific parser when the pattern doesn't match."
    },
    {
      "line": 24,
      "column": 1,
      "severity": "warning",
      "category": "Other",
      "message": "The code adjusts FILETIME timestamps using a fixed offset for IST rather than using timezone-aware datetimes.",
      "suggestion": "Use zoneinfo (Python 3.9+) or pytz to produce timezone-aware datetimes (e.g., convert via UTC then astimezone(ZoneInfo('Asia/Kolkata'))). Avoid manual offsets."
    },
    {
      "line": 30,
      "column": 1,
      "severity": "info",
      "category": "Style",
      "message": "Several except blocks use overly broad exception handling.",
      "suggestion": "Catch specific exceptions (e.g., FileNotFoundError, OSError, PermissionError, ValueError) and log the error details. Avoid bare except Exception unless re-raising."
    },
    {
      "line": 36,
      "column": 1,
      "severity": "warning",
      "category": "Performance",
      "message": "Enumerating the entire USB registry tree can be slow on systems with many devices or nested keys.",
      "suggestion": "Consider iterating lazily (generators) or adding an explicit limit, and cache previously-seen entries when used repeatedly."
    },
    {
      "line": 42,
      "column": 1,
      "severity": "warning",
      "category": "Maintainability",
      "message": "Registry keys opened with winreg.OpenKey are not always explicitly closed, which may leak handles.",
      "suggestion": "Use try/finally with winreg.CloseKey or a context manager wrapper so keys are always closed after reading."
    },
    {
      "line": 48,
      "column": 1,
      "severity": "info",
      "category": "Readability",
      "message": "The FILETIME -> datetime conversion is implemented manually; the constants are not documented and could be confusing.",
      "suggestion": "Use a clear helper function and inline formula: unix_ts = (filetime - 116444736000000000) / 10_000_000; then datetime.fromtimestamp(unix_ts, tz=timezone.utc). Document the constant meaning."
    },
    {
      "line": 54,
      "column": 1,
      "severity": "warning",
      "category": "Other",
      "message": "Output uses plain print statements for machine-consumable data, which makes parsing by other tools harder.",
      "suggestion": "Provide an option to emit JSON (or structured output) and use the logging module for human-readable messages."
    },
    {
      "line": 62,
      "column": 1,
      "severity": "info",
      "category": "Style",
      "message": "Magic numbers are used for scoring (3, 2, 0) without named constants or a comment explaining the rationale.",
      "suggestion": "Define named constants (e.g., SCORE_NONE = 3) and add a short docstring describing the scoring rules so future maintainers understand the mapping."
    },
    {
      "line": 70,
      "column": 1,
      "severity": "warning",
      "category": "Maintainability",
      "message": "There are no platform guards or unit tests; running this on non-Windows platforms will raise ModuleNotFoundError for winreg.",
      "suggestion": "Add an early platform check (if sys.platform != 'win32': raise RuntimeError('Windows only')) and add unit tests that mock winreg so behavior can be validated on CI."
    }
]


def test_comments(comments):
    for i, c in enumerate(comments):
        try:
            cm = CommentModel.parse_obj(c)
            print(f"comment[{i}] OK ->", cm.dict())
        except Exception as e:
            print(f"comment[{i}] FAILED:", e)


if __name__ == "__main__":
    test_comments(sample_comments)

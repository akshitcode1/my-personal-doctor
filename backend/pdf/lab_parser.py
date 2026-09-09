"""
Lab report parser — extracts biomarker values from raw PDF/OCR text
and flags them against clinical normal ranges.
"""
import json
import re
from pathlib import Path
from typing import Optional

import anthropic

from backend.config.settings import settings

_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

_RANGES_PATH = Path(__file__).parent.parent / "data" / "normal_ranges.json"
_RANGES: dict = {}


def _load_ranges() -> dict:
    global _RANGES
    if not _RANGES and _RANGES_PATH.exists():
        with open(_RANGES_PATH, encoding="utf-8") as f:
            _RANGES = json.load(f)
    return _RANGES


def _flag(value: float, normal_min: float, normal_max: float) -> str:
    if value < normal_min * 0.7:
        return "critical_low"
    if value > normal_max * 1.3:
        return "critical_high"
    if value < normal_min:
        return "low"
    if value > normal_max:
        return "high"
    return "normal"


def _parse_regex(text: str, ranges: dict) -> list[dict]:
    """Try simple pattern matching: 'Name: value unit' or 'Name value unit'."""
    results = []
    seen: set = set()

    for key, meta in ranges.items():
        aliases = meta.get("aliases", [key])
        pattern_names = "|".join(re.escape(a) for a in aliases)
        # Match: "Name: 14.5 g/dL" or "Name 14.5 g/dL"
        pattern = rf"(?i)(?:{pattern_names})[:\s]+(\d+\.?\d*)\s*({re.escape(meta['unit'])}|%|mmol/L|mg/dL|g/dL|U/L|mEq/L|ng/mL|pg/mL|IU/L|cells/μL|10\^3/μL|10\^6/μL|fl|pg)?"
        for m in re.finditer(pattern, text):
            try:
                val = float(m.group(1))
                unit = m.group(2) or meta["unit"]
                if key in seen:
                    continue
                seen.add(key)
                results.append({
                    "name": key,
                    "display_name": meta["display_name"],
                    "value": val,
                    "unit": unit,
                    "normal_min": meta["normal_min"],
                    "normal_max": meta["normal_max"],
                    "flag": _flag(val, meta["normal_min"], meta["normal_max"]),
                    "category": meta["category"],
                    "description": meta["description"],
                })
            except (ValueError, IndexError):
                continue

    return results


_LLM_EXTRACT_PROMPT = (
    "Extract all lab test results from this medical report text. "
    "Return a JSON array of objects:\n"
    '[{"test_name": "...", "value": 12.3, "unit": "g/dL"}]\n'
    "Include only rows with a clear numeric value. No extra text."
)


async def parse_lab_report(text: str) -> list[dict]:
    """Parse lab text → list of flagged biomarker results."""
    ranges = _load_ranges()

    # First attempt: regex
    results = _parse_regex(text, ranges)

    # If regex found < 3 biomarkers, fall back to Haiku for extraction
    if len(results) < 3:
        try:
            response = await _client.messages.create(
                model="claude-haiku-4-5",
                max_tokens=800,
                system=_LLM_EXTRACT_PROMPT,
                messages=[{"role": "user", "content": text[:3000]}],
            )
            raw = response.content[0].text.strip()
            raw = re.sub(r"```(?:json)?", "", raw).strip("`").strip()
            extracted: list = json.loads(raw) if raw.startswith("[") else []

            for item in extracted:
                name_raw = item.get("test_name", "").lower().strip()
                val = item.get("value")
                unit = item.get("unit", "")
                if val is None:
                    continue
                # Match against known biomarkers
                matched_key: Optional[str] = None
                for key, meta in ranges.items():
                    aliases = [a.lower() for a in meta.get("aliases", [key])]
                    if name_raw in aliases or any(a in name_raw for a in aliases):
                        matched_key = key
                        break
                if matched_key and matched_key not in {r["name"] for r in results}:
                    meta = ranges[matched_key]
                    try:
                        fval = float(val)
                        results.append({
                            "name": matched_key,
                            "display_name": meta["display_name"],
                            "value": fval,
                            "unit": unit or meta["unit"],
                            "normal_min": meta["normal_min"],
                            "normal_max": meta["normal_max"],
                            "flag": _flag(fval, meta["normal_min"], meta["normal_max"]),
                            "category": meta["category"],
                            "description": meta["description"],
                        })
                    except (ValueError, TypeError):
                        continue
        except Exception:
            pass

    # Sort by category, then name
    results.sort(key=lambda r: (r["category"], r["display_name"]))
    return results

"""Rank parsed bindict files by useful table signals.

The bindict parser can recover thousands of anonymous Python table payloads.
This helper builds a compact discovery report so combat/gameplay data can be
promoted into typed project data without manual JSON spelunking.
"""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path
from typing import Any


SIGNALS: dict[str, list[str]] = {
    "formula": ["formula", "damage_formula", "dmg_formula", "factor", "coeff", "coefficient", "rate"],
    "damage": ["damage", "dmg", "attack", "crit", "weak", "weakspot", "vulnerability", "element"],
    "weapon": ["weapon", "gun", "bullet", "magazine", "fire_rate", "reload", "ammo"],
    "keyword": ["keyword", "kw", "burn", "frost", "shock", "surge", "shrapnel", "bounce", "bomber", "vortex"],
    "buff": ["buff", "status", "effect", "modifier", "prop", "tag", "stack"],
    "enemy": ["enemy", "monster", "boss", "elite", "target", "normal"],
    "item": ["item", "equip", "mod", "armor", "calibration", "deviation"],
}


def flatten_strings(value: Any, out: list[str], limit: int = 20_000) -> None:
    if len(out) >= limit:
        return
    if isinstance(value, dict):
        for key, item in value.items():
            out.append(str(key))
            flatten_strings(item, out, limit)
            if len(out) >= limit:
                return
    elif isinstance(value, list):
        for item in value:
            flatten_strings(item, out, limit)
            if len(out) >= limit:
                return
    elif isinstance(value, (str, int, float, bool)) and value is not None:
        out.append(str(value))


def collect_keys(value: Any, counter: Counter[str]) -> None:
    if isinstance(value, dict):
        for key, item in value.items():
            counter[str(key)] += 1
            collect_keys(item, counter)
    elif isinstance(value, list):
        for item in value:
            collect_keys(item, counter)


def score_text(text: str) -> tuple[int, dict[str, int]]:
    category_scores: dict[str, int] = {}
    for category, needles in SIGNALS.items():
        total = 0
        for needle in needles:
            total += len(re.findall(re.escape(needle), text, flags=re.IGNORECASE))
        if total:
            category_scores[category] = total
    score = sum(value * (3 if key in {"formula", "damage", "keyword"} else 2) for key, value in category_scores.items())
    return score, category_scores


def summarize_file(file_record: dict[str, Any]) -> dict[str, Any]:
    strings: list[str] = []
    collect = file_record.get("parsed") or file_record.get("result") or file_record
    flatten_strings(collect, strings)
    text = "\n".join(strings)
    score, category_scores = score_text(text)
    keys: Counter[str] = Counter()
    collect_keys(collect, keys)
    sample_values = [value for value in strings if len(value) > 2][:30]
    return {
        "score": score,
        "categoryScores": category_scores,
        "path": file_record.get("path") or file_record.get("file") or file_record.get("source"),
        "output": file_record.get("output"),
        "extension": file_record.get("extension"),
        "topKeys": keys.most_common(30),
        "sampleValues": sample_values,
    }


def main() -> int:
    cli = argparse.ArgumentParser(description="Create a ranked discovery report from bindict_scan.json.")
    cli.add_argument("scan_json", help="Path to bindict_parser recursive scan JSON")
    cli.add_argument("-o", "--output", required=True, help="Output report JSON")
    cli.add_argument("--limit", type=int, default=250, help="Max ranked candidates to include")
    args = cli.parse_args()

    source = Path(args.scan_json).resolve()
    scan = json.loads(source.read_text(encoding="utf-8"))
    files = scan.get("files", []) if isinstance(scan, dict) else scan

    ranked = []
    global_keys: Counter[str] = Counter()
    for file_record in files:
        if not isinstance(file_record, dict) or not file_record.get("parsed"):
            continue
        summary = summarize_file(file_record)
        if summary["score"] <= 0:
            continue
        ranked.append(summary)
        for key, count in summary["topKeys"]:
            global_keys[key] += count

    ranked.sort(key=lambda item: item["score"], reverse=True)
    report = {
        "source": str(source),
        "candidateCount": len(ranked),
        "globalTopKeys": global_keys.most_common(100),
        "candidates": ranked[: args.limit],
    }

    output = Path(args.output).resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "candidateCount": report["candidateCount"],
        "written": str(output),
        "topScore": ranked[0]["score"] if ranked else 0,
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

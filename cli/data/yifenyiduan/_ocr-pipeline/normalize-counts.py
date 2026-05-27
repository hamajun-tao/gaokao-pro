#!/usr/bin/env python3
"""Normalize the (unused, provenance-only) `count` column of rank-table JSONs.

In a 一分一段表 the `cumulative` column is the canonical published 位次 (rank) —
it is the ONLY column the product serves (scoreToRank/rankToScore). `count`
(本段人数) is by definition its first difference: count[i] = cum[i] - cum[i-1].

Legacy OCR files sometimes carry null / mis-transcribed `count` cells that break
running-sum integrity. This script recomputes `count` from `cumulative` so the
dataset is internally consistent, WITHOUT EVER ALTERING the served `cumulative`
column — so no rank lookup changes for any file. Idempotent: files whose count
column already equals the first difference are left byte-untouched.

Refuses to touch a file unless scores are strictly descending and cumulative is
strictly non-decreasing (the structural invariants); such a file is reported as
STRUCTURAL and skipped for manual review.
"""
import json
import sys
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent


def normalize(path: Path):
    d = json.loads(path.read_text(encoding="utf-8"))
    rows = d.get("rows")
    if not isinstance(rows, list) or not rows:
        return "EMPTY", 0

    # structural invariants on the canonical columns
    prev_s = prev_c = None
    for r in rows:
        s, c = r.get("score"), r.get("cumulative")
        if not isinstance(s, int) or not isinstance(c, int):
            return "STRUCTURAL (non-int score/cumulative)", 0
        if prev_s is not None and s >= prev_s:
            return "STRUCTURAL (scores not strictly descending)", 0
        if prev_c is not None and c < prev_c:
            return "STRUCTURAL (cumulative decreases)", 0
        prev_s, prev_c = s, c

    changed = 0
    prev_c = 0
    for r in rows:
        derived = r["cumulative"] - prev_c
        if r.get("count") != derived:
            r["count"] = derived
            changed += 1
        prev_c = r["cumulative"]

    if d.get("count") != len(rows):
        d["count"] = len(rows)
        changed += 1  # also count the header fix as a change

    if changed:
        path.write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
    return ("NORMALIZED" if changed else "clean"), changed


def main():
    targets = sys.argv[1:] or [str(p) for p in sorted(DATA_DIR.glob("*.json"))]
    norm = clean = struct = 0
    for t in targets:
        p = Path(t) if "/" in t else DATA_DIR / (t if t.endswith(".json") else t + ".json")
        status, n = normalize(p)
        if status == "NORMALIZED":
            norm += 1
            print(f"NORMALIZED {p.name}: recomputed {n} count cells from cumulative")
        elif status.startswith("STRUCTURAL"):
            struct += 1
            print(f"SKIP {p.name}: {status}", file=sys.stderr)
        else:
            clean += 1
    print(f"\n{norm} normalized, {clean} already clean, {struct} structural-skip")


if __name__ == "__main__":
    main()

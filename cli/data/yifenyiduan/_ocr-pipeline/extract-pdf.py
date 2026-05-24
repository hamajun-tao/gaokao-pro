#!/usr/bin/env python3
"""
OCR pipeline for province 一分一段 PDF → JSON.

Usage:
    python extract-pdf.py <pdf-url-or-path> <province-pinyin> <year> <track> > out.json

Track keys: physics | history | combined | science | liberal

Requires: pdftoppm (poppler), tesseract with chi_sim language pack.

The 一分一段 PDFs are image-only (rasterized table screenshots), so we:
  1. Convert each PDF page → PNG (pdftoppm -r 200)
  2. OCR each PNG with tesseract -l chi_sim
  3. Regex-extract rows of the form "<score> <count>" where score ∈ [200, 750]
  4. Sort + dedupe + emit RankTable JSON shape (count→cumulative we compute
     as the value the table gives — note Henan's table uses cumulative
     directly in the count column).
"""
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path


def ocr_pdf(pdf_path: str) -> str:
    """Convert PDF to PNGs, OCR each, return concatenated text."""
    with tempfile.TemporaryDirectory() as td:
        # 1. PDF → PNGs
        subprocess.run(
            ["pdftoppm", "-r", "200", pdf_path, f"{td}/p", "-png"],
            check=True,
        )
        pages = sorted(Path(td).glob("p-*.png"))
        all_text = []
        for p in pages:
            r = subprocess.run(
                ["tesseract", str(p), "-", "-l", "chi_sim"],
                check=True,
                capture_output=True,
                text=True,
            )
            all_text.append(r.stdout)
        return "\n".join(all_text)


# Two-number rows: <score in [200, 750]> ... <count in [1, 999999]>
ROW_RE = re.compile(r"(?<!\d)(\d{3})\s+(\d{1,6})(?!\d)")


def parse_rows(text: str) -> list[dict]:
    seen = {}
    for line in text.splitlines():
        for m in ROW_RE.finditer(line):
            score = int(m.group(1))
            count = int(m.group(2))
            if 200 <= score <= 750 and 1 <= count <= 9_999_999:
                # Prefer the LARGER count for duplicates — usually the true row,
                # since OCR sometimes returns small partial numbers.
                if score not in seen or count > seen[score]:
                    seen[score] = count
    rows = sorted(
        ({"score": s, "cumulative": c} for s, c in seen.items()),
        key=lambda r: -r["score"],
    )
    # Enforce monotonic: cumulative must be non-decreasing as score decreases
    # (i.e. as we walk down the sorted list, cumulative should grow). Drop
    # rows that violate monotonicity (these are usually OCR misreads).
    clean = []
    last = 0
    for r in rows:
        if r["cumulative"] >= last:
            clean.append(r)
            last = r["cumulative"]
    return clean


def main():
    if len(sys.argv) != 5:
        print("usage: extract-pdf.py <pdf-path-or-url> <province-pinyin> <year> <track>", file=sys.stderr)
        sys.exit(1)
    pdf_arg, province, year, track = sys.argv[1:]
    if pdf_arg.startswith("http"):
        # download
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tf:
            subprocess.run(["curl", "-sSL", "-o", tf.name, pdf_arg, "-H", "User-Agent: Mozilla/5.0"], check=True)
            pdf_path = tf.name
    else:
        pdf_path = pdf_arg

    text = ocr_pdf(pdf_path)
    rows = parse_rows(text)

    province_name = {
        "henan": "河南", "shandong": "山东", "guangdong": "广东", "jiangsu": "江苏",
        "hebei": "河北", "sichuan": "四川", "anhui": "安徽", "hubei": "湖北",
        "hunan": "湖南", "fujian": "福建", "jiangxi": "江西", "zhejiang": "浙江",
        "shanghai": "上海", "beijing": "北京", "tianjin": "天津", "chongqing": "重庆",
    }.get(province, province)

    out = {
        "province": province,
        "province_name": province_name,
        "year": int(year),
        "track": track,
        "source": pdf_arg if pdf_arg.startswith("http") else "local PDF",
        "extraction": "pdftoppm + tesseract -l chi_sim",
        "count": len(rows),
        "rows": [{"score": r["score"], "count": 0, "cumulative": r["cumulative"]} for r in rows],
    }
    print(json.dumps(out, ensure_ascii=False, separators=(",", ":")))


if __name__ == "__main__":
    main()

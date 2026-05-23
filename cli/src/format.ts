// Terminal table formatter — used when stdout is a TTY (interactive run).
// Pipe-target runs still get JSON for jq / Claude Code.
import type { RecommendOutput, RecommendCandidate } from "./recommend.js";

export function isTty(): boolean {
  return Boolean(process.stdout.isTTY);
}

function pad(s: string, w: number): string {
  // 中文 char ≈ 2 columns, ASCII ≈ 1. Width-aware padding.
  let used = 0;
  for (const ch of s) {
    used += ch.charCodeAt(0) > 127 ? 2 : 1;
  }
  return s + " ".repeat(Math.max(0, w - used));
}

function colW(rows: string[][], col: number): number {
  let w = 0;
  for (const r of rows) {
    const cell = r[col] ?? "";
    let used = 0;
    for (const ch of cell) used += ch.charCodeAt(0) > 127 ? 2 : 1;
    if (used > w) w = used;
  }
  return w;
}

export function renderTable(rows: string[][], opts: { gap?: number } = {}): string {
  const gap = opts.gap ?? 2;
  if (rows.length === 0) return "(empty)";
  const cols = Math.max(...rows.map((r) => r.length));
  const widths = Array.from({ length: cols }, (_, c) => colW(rows, c));
  const sep = " ".repeat(gap);
  return rows
    .map((r) =>
      r.map((cell, i) => (i === cols - 1 ? cell ?? "" : pad(cell ?? "", widths[i]))).join(sep)
    )
    .join("\n");
}

function labelTags(c: RecommendCandidate): string {
  const tags: string[] = [];
  if (c.is985) tags.push("985");
  if (c.is211 && !c.is985) tags.push("211");
  if (c.dualClass === "双一流" && !c.is985 && !c.is211) tags.push("双一流");
  return tags.join(" ");
}

export function formatRecommend(out: RecommendOutput, opts: { explain?: boolean } = {}): string {
  const lines: string[] = [];
  const q = out.query;
  lines.push(
    `gaokao-pro recommend  score=${q.score}  ${q.province.name}(${q.province.reform})  ` +
      `subjects=${q.subjects.join("/")}  track=${q.trackName}  ` +
      (q.rank !== undefined ? `rank=${q.rank}  ` : "") +
      `evaluated=${out.evaluated}  skipped=${out.buckets.skipped}`
  );

  const order: Array<{ key: "冲" | "稳" | "保" | "out"; label: string }> = [
    { key: "冲", label: "冲  REACH" },
    { key: "稳", label: "稳  MATCH" },
    { key: "保", label: "保  SAFETY" },
    { key: "out", label: "—  out of range" }
  ];

  for (const { key, label } of order) {
    const items = out.buckets[key];
    if (items.length === 0) continue;
    lines.push("");
    lines.push(`[${label}]  ${items.length} school${items.length === 1 ? "" : "s"}`);
    const rows: string[][] = [
      ["  school", "delta", `min(${items[0]?.baselineYear ?? "—"})`, "city", "tags", "belong"]
    ];
    for (const c of items) {
      rows.push([
        `  ${c.name}`,
        (c.delta >= 0 ? "+" : "") + c.delta,
        String(c.baselineMinScore),
        c.city,
        labelTags(c),
        c.belong
      ]);
    }
    lines.push(renderTable(rows));
    if (opts.explain) {
      for (const c of items.slice(0, 3)) {
        const reason =
          key === "冲"
            ? `差 ${Math.abs(c.delta)} 分（基线 ${c.baselineMinScore}，${c.baselineYear} ${c.baselineTrackName}）— 有希望但需要更高发挥`
            : key === "稳"
              ? `贴近基线 ${c.baselineMinScore}（${c.baselineYear} ${c.baselineTrackName}），同分段稳妥选择`
              : key === "保"
                ? `高于基线 ${c.delta} 分，作为兜底足够稳`
                : `分差 ${c.delta} 超出 ±25 分窗口，不建议`;
        lines.push(`    · ${c.name}: ${reason}`);
      }
    }
  }
  return lines.join("\n");
}

export function formatTop(rows: Array<{
  schoolName: string;
  baselineMinScore: number;
  delta: number;
  baselineYear: number;
  city: string;
  tags: string;
  belong: string;
}>): string {
  const out: string[][] = [
    ["  rank", "school", "delta", "min(year)", "city", "tags", "belong"]
  ];
  rows.forEach((r, i) => {
    out.push([
      `  ${String(i + 1).padStart(2)}`,
      r.schoolName,
      (r.delta >= 0 ? "+" : "") + r.delta,
      `${r.baselineMinScore} (${r.baselineYear})`,
      r.city,
      r.tags,
      r.belong
    ]);
  });
  return renderTable(out);
}

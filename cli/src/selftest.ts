// selftest — 3-stage end-to-end smoke that confirms the whole stack works.
// Stage 1: upstream API works (school/31/info.json).
// Stage 2: local school index loads and has expected shape.
// Stage 3: 一分一段 table loads and looks up correctly.
//
// Designed to be the single command a new install runs to know it's healthy.
import { getSchoolInfo } from "./gaokao-cn.js";
import { loadIndex } from "./index-loader.js";
import { loadRankTable, scoreToRank } from "./rank-table.js";

type Result = { stage: string; ok: boolean; ms?: number; reason?: string };

async function timed(stage: string, fn: () => Promise<void> | void): Promise<Result> {
  const t = Date.now();
  try {
    await fn();
    return { stage, ok: true, ms: Date.now() - t };
  } catch (e) {
    return { stage, ok: false, ms: Date.now() - t, reason: e instanceof Error ? e.message : String(e) };
  }
}

export async function runSelftest(): Promise<{ ok: boolean; results: Result[] }> {
  const results: Result[] = [];

  results.push(
    await timed("upstream gaokao.cn", async () => {
      const info = await getSchoolInfo(31);
      if (info.name !== "北京大学") throw new Error(`expected 北京大学, got ${info.name}`);
      if (!info.pro_type_min || Object.keys(info.pro_type_min).length === 0) {
        throw new Error("pro_type_min missing");
      }
    })
  );

  results.push(
    await timed("local school index", () => {
      const idx = loadIndex();
      if (idx.rows.length < 2000) throw new Error(`only ${idx.rows.length} schools (expected ≥2000)`);
      if (!idx.rows[0]?.pro_type_min) throw new Error("rows[0].pro_type_min missing");
    })
  );

  results.push(
    await timed("一分一段 (beijing 2024 combined)", () => {
      const table = loadRankTable(11, 2024, "combined");
      if (!table) throw new Error("beijing 2024 combined not loaded");
      if (table.rows.length < 200) throw new Error(`only ${table.rows.length} rows`);
      const rank = scoreToRank(table, 650);
      if (!rank || rank <= 0) throw new Error(`scoreToRank(650) = ${rank}`);
    })
  );

  return { ok: results.every((r) => r.ok), results };
}

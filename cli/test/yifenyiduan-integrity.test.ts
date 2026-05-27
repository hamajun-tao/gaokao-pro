// Integrity guard for EVERY 一分一段表 data file. The product serves the
// `cumulative` column as 位次 (rank) via scoreToRank/rankToScore, so these
// invariants must hold for every shipped file or rank lookups go silently wrong:
//   - non-empty rows; integer score/count/cumulative
//   - scores strictly descending (loader assumes this ordering)
//   - cumulative strictly non-decreasing (it's a running total / rank)
//   - running-sum integrity: Σ count[0..i] == cumulative[i]
//   - the `count` header equals rows.length
// A regression here means someone shipped a malformed or mis-transcribed table.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test, assert } from "./_harness.js";

const DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "data", "yifenyiduan");
const files = readdirSync(DIR).filter((f) => /^[a-z]+-\d{4}-[a-z]+\.json$/.test(f)).sort();

test(`yifenyiduan: discovered data files (expect a healthy corpus)`, () => {
  assert(files.length >= 100, `only ${files.length} rank-table files found`);
});

for (const f of files) {
  test(`yifenyiduan integrity: ${f}`, () => {
    const d = JSON.parse(readFileSync(resolve(DIR, f), "utf8")) as {
      count?: number;
      rows: Array<{ score: number; count: number; cumulative: number }>;
    };
    assert(Array.isArray(d.rows) && d.rows.length > 0, `${f}: no rows`);

    let running = 0;
    let prevScore: number | null = null;
    let prevCum: number | null = null;
    d.rows.forEach((r, i) => {
      assert(
        Number.isInteger(r.score) && Number.isInteger(r.count) && Number.isInteger(r.cumulative),
        `${f}: row ${i} has non-integer score/count/cumulative`
      );
      assert(r.count >= 0, `${f}: row ${i} negative count ${r.count}`);
      running += r.count;
      assert(running === r.cumulative, `${f}: running-sum break at row ${i} (score ${r.score}): Σcount=${running} != cumulative=${r.cumulative}`);
      if (prevScore !== null) assert(r.score < prevScore, `${f}: scores not strictly descending at row ${i}: ${prevScore} -> ${r.score}`);
      if (prevCum !== null) assert(r.cumulative >= prevCum, `${f}: cumulative decreased at row ${i}: ${prevCum} -> ${r.cumulative}`);
      prevScore = r.score;
      prevCum = r.cumulative;
    });

    if (d.count !== undefined) {
      assert(d.count === d.rows.length, `${f}: count header ${d.count} != rows.length ${d.rows.length}`);
    }
  });
}

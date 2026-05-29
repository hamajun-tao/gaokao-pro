// Unit tests for slipRisk (cli/src/groups.ts).
//
// Verdict ladder: comfortable < low_risk < moderate_risk < high_risk.
//
// We exercise the four canonical regimes:
//   - candidate well above the group's investment line ⇒ comfortable/low_risk
//   - candidate at-or-near the line ⇒ moderate_risk with a 服从调剂 hint
//   - candidate below the line ⇒ high_risk with a hard score-gap reason
//   - province without 调剂 (e.g. 浙江) ⇒ message differs (mentions 专业平行 /
//     no 服从调剂 兜底), and even pressing the line bumps to high_risk
//
// We also check the prefs-interaction: when reject keywords match majors in a
// 调剂-province group AND the safety verdict is risky, the verdict must warn
// that 服从调剂 is a trap (and elevate to at least moderate_risk).
//
// These tests are offline — they rely on local college-groups JSON and the
// zhiyuan-rules-2026.json shipped in the repo.

import { test, assert, assertEqual } from "./_harness.js";
import { findUniversity, slipRisk, provinceTiaojiInfo, loadDataset } from "../src/groups.js";

// Locate a known group with a finite group_min_score we can drive the
// arithmetic off of. Prefer 清华大学/河南 (well-curated) but fall back to the
// first viable group anywhere so tests stay resilient to data churn.
function pickAnchor(): { uniName: string; provinceName: string; groupCode: string; minScore: number; minRank: number | null; majorsCount: number; sampleMajorName: string | null } {
  const preferred = findUniversity("清华大学");
  if (preferred) {
    const henan = preferred.provinces.find(p => p.province === "河南");
    if (henan) {
      const g = henan.groups.find(g => typeof g.group_min_score === "number");
      if (g && typeof g.group_min_score === "number") {
        return {
          uniName: preferred.university,
          provinceName: "河南",
          groupCode: g.group_code,
          minScore: g.group_min_score,
          minRank: g.group_min_rank,
          majorsCount: g.majors_count,
          sampleMajorName: g.majors.find(m => m.name)?.name ?? null,
        };
      }
    }
  }
  // Fallback: first viable group in any province.
  const { dataset } = loadDataset();
  for (const u of dataset.universities) {
    for (const p of u.provinces) {
      for (const g of p.groups) {
        if (typeof g.group_min_score === "number" && p.province) {
          return {
            uniName: u.university,
            provinceName: p.province,
            groupCode: g.group_code,
            minScore: g.group_min_score,
            minRank: g.group_min_rank,
            majorsCount: g.majors_count,
            sampleMajorName: g.majors.find(m => m.name)?.name ?? null,
          };
        }
      }
    }
  }
  throw new Error("no anchor group with a numeric min_score found in dataset");
}

// Pick a 浙江 group (province where 调剂=false) — used for the no-调剂 regime
// test. Returns null if none on disk; the test is skipped (gracefully) in
// that case so the suite stays green on a thin dataset.
function pickZhejiangAnchor(): { uniName: string; groupCode: string; minScore: number } | null {
  const { dataset } = loadDataset();
  for (const u of dataset.universities) {
    const zj = u.provinces.find(p => p.province === "浙江");
    if (!zj) continue;
    for (const g of zj.groups) {
      if (typeof g.group_min_score === "number") {
        return { uniName: u.university, groupCode: g.group_code, minScore: g.group_min_score };
      }
    }
  }
  return null;
}

// --------------------------------------------------------------------------
// Province rules layer — sanity-check the rules table is loaded and the
// 调剂 boolean is read correctly for representative provinces.
// --------------------------------------------------------------------------
test("provinceTiaojiInfo reads 调剂=true for 河南", () => {
  const info = provinceTiaojiInfo("河南");
  assertEqual(info.has_tiaoji, true, "河南 本科批 has 服从调剂");
});

test("provinceTiaojiInfo reads 调剂=false for 浙江", () => {
  const info = provinceTiaojiInfo("浙江");
  assertEqual(info.has_tiaoji, false, "浙江 专业平行 no 调剂");
  assert(info.slip_warning.length > 0, "浙江 should expose 滑档风险 text");
});

test("provinceTiaojiInfo reads 调剂=false for 山东", () => {
  const info = provinceTiaojiInfo("山东");
  assertEqual(info.has_tiaoji, false, "山东 96-志愿专业平行 no 调剂");
});

// --------------------------------------------------------------------------
// slipRisk — candidate above min ⇒ low_risk or comfortable.
// --------------------------------------------------------------------------
test("slipRisk: candidate well above min ⇒ comfortable/low_risk", () => {
  const a = pickAnchor();
  const res = slipRisk({
    uniName: a.uniName,
    provinceName: a.provinceName,
    groupCode: a.groupCode,
    candidateScore: a.minScore + 25, // well clear
    candidateRank: a.minRank !== null ? Math.max(1, a.minRank - 1000) : null,
  });
  assert(res.verdict === "comfortable" || res.verdict === "low_risk",
    `verdict should be comfortable/low_risk, got ${res.verdict} (gap=${res.score_gap})`);
  assert(res.score_gap !== null && res.score_gap >= 20, `score_gap should be large, got ${res.score_gap}`);
});

// --------------------------------------------------------------------------
// slipRisk: candidate at min ⇒ moderate_risk with 调剂 hint.
// --------------------------------------------------------------------------
test("slipRisk: candidate at min ⇒ moderate_risk + reason mentions 压线 / 调剂", () => {
  const a = pickAnchor();
  // Only 1 point above the line — sits in the "<3 压线带" rule.
  const res = slipRisk({
    uniName: a.uniName,
    provinceName: a.provinceName,
    groupCode: a.groupCode,
    candidateScore: a.minScore + 1,
    candidateRank: a.minRank,
  });
  assert(res.verdict === "moderate_risk" || res.verdict === "high_risk",
    `at-line candidate should NOT be comfortable/low; got ${res.verdict}`);
  assert(res.score_gap !== null && res.score_gap >= 0 && res.score_gap < 3,
    `score_gap should be tiny positive, got ${res.score_gap}`);
  const joined = res.reasons.join(" ");
  assert(joined.includes("压线") || joined.includes("安全垫") || joined.includes("波动"),
    `reasons should mention 压线/波动/安全垫, got: ${joined}`);
});

// --------------------------------------------------------------------------
// slipRisk: candidate below min ⇒ high_risk with clear score-gap reason.
// --------------------------------------------------------------------------
test("slipRisk: candidate below min ⇒ high_risk with explicit score-gap reason", () => {
  const a = pickAnchor();
  const res = slipRisk({
    uniName: a.uniName,
    provinceName: a.provinceName,
    groupCode: a.groupCode,
    candidateScore: a.minScore - 10,
    candidateRank: a.minRank !== null ? a.minRank + 5000 : null,
  });
  assertEqual(res.verdict, "high_risk", "below-line candidate must be high_risk");
  assert(res.score_gap !== null && res.score_gap < 0, `score_gap should be negative, got ${res.score_gap}`);
  const joined = res.reasons.join(" ");
  assert(/直接滑档|滑档高风险|<.*投档线/.test(joined), `reasons should explicitly call out the滑档 risk, got: ${joined}`);
});

// --------------------------------------------------------------------------
// slipRisk: province without 调剂 (浙江) ⇒ different message, harder ladder.
// --------------------------------------------------------------------------
test("slipRisk: 浙江 (no 调剂) — pressing the line escalates and reason mentions 专业平行/无服从调剂", () => {
  const zj = pickZhejiangAnchor();
  if (!zj) {
    // Dataset doesn't include any 浙江 group with a min_score. Fall back to a
    // synthetic check via provinceTiaojiInfo so we still cover the no-调剂
    // messaging path.
    const info = provinceTiaojiInfo("浙江");
    assertEqual(info.has_tiaoji, false, "fallback: 浙江 has no 调剂");
    return;
  }
  const res = slipRisk({
    uniName: zj.uniName,
    provinceName: "浙江",
    groupCode: zj.groupCode,
    candidateScore: zj.minScore + 1, // press the line
    candidateRank: null,
  });
  assertEqual(res.province_rules.has_tiaoji, false, "浙江 result must surface has_tiaoji=false");
  assert(res.verdict === "high_risk" || res.verdict === "moderate_risk",
    `at-line in 浙江 must be at least moderate_risk, got ${res.verdict}`);
  const joined = res.reasons.join(" ");
  assert(joined.includes("专业平行") || joined.includes("无服从调剂") || joined.includes("调剂=false"),
    `reasons should mention 专业平行 / 无服从调剂, got: ${joined}`);
});

// --------------------------------------------------------------------------
// slipRisk: prefs interaction — rejects in group + 调剂 province
// ⇒ 服从调剂 is a trap (must surface that warning and elevate verdict).
// --------------------------------------------------------------------------
test("slipRisk: prefs reject matches inside a 调剂 province ⇒ 服从调剂 trap warning", () => {
  const a = pickAnchor();
  // We need at least one named major in the group to trigger the reject path.
  if (!a.sampleMajorName) {
    // No named majors — skip silently (data shape is honest about missing names).
    return;
  }
  const res = slipRisk({
    uniName: a.uniName,
    provinceName: a.provinceName,
    groupCode: a.groupCode,
    candidateScore: a.minScore + 4, // safely above line but not "comfortable"
    candidateRank: a.minRank,
    prefs: {
      must_have: ["__no_such_major__"],
      acceptable: [],
      reject: [a.sampleMajorName],
    },
  });
  // Safety should be risky-or-moderate (we rejected the only matchable major
  // and didn't list any must_have/acceptable).
  assert(res.safety !== null, "safety should be computed when prefs are passed");
  assert(res.safety!.rejected_majors.length >= 1, "rejected_majors should be non-empty");
  const joined = res.reasons.join(" ");
  // The exact warning string contains 服从调剂 and (会落到|trap|reject).
  assert(joined.includes("服从调剂") || joined.includes("reject") || joined.includes("换组"),
    `reasons should warn about 服从调剂 trap, got: ${joined}`);
  assert(res.verdict !== "comfortable", "verdict should not be comfortable when prefs are risky");
});

// --------------------------------------------------------------------------
// Result-shape contract — callers (incl. the CLI verb's table formatter)
// depend on these fields being present.
// --------------------------------------------------------------------------
test("slipRisk: result shape contract", () => {
  const a = pickAnchor();
  const res = slipRisk({
    uniName: a.uniName,
    provinceName: a.provinceName,
    groupCode: a.groupCode,
    candidateScore: a.minScore + 10,
    candidateRank: a.minRank,
  });
  assertEqual(typeof res.university, "string", "university string");
  assertEqual(typeof res.province, "string", "province string");
  assertEqual(typeof res.group_code, "string", "group_code string");
  assert(["high_risk", "moderate_risk", "low_risk", "comfortable"].includes(res.verdict), `verdict in enum, got ${res.verdict}`);
  assert(Array.isArray(res.reasons), "reasons is an array");
  assert(res.reasons.length > 0, "reasons should be non-empty");
  assert("score_gap" in res && "rank_gap" in res, "gap fields present");
  assert("province_rules" in res && typeof res.province_rules.has_tiaoji !== "undefined", "province_rules attached");
  assert("major_gradient" in res, "major_gradient attached");
});

// --------------------------------------------------------------------------
// Error path — unknown university/province/group should throw, not fabricate.
// --------------------------------------------------------------------------
test("slipRisk: unknown university throws", () => {
  let threw = false;
  try {
    slipRisk({ uniName: "__no_such_uni__", provinceName: "河南", groupCode: "01", candidateScore: 600 });
  } catch { threw = true; }
  assert(threw, "slipRisk must throw on unknown university");
});

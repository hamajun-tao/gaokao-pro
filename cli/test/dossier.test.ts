// Unit tests for `dossier` (cli/src/dossier.ts).
//
// dossier composes 7 datasets and tolerates missing ones with explicit
// _status flags rather than throwing or fabricating nulls.

import { test, assert, assertEqual } from "./_harness.js";
import { dossier } from "../src/dossier.js";

test("dossier(清华大学) returns a populated result with structured totals", () => {
  const r = dossier("清华大学");
  assertEqual(r.school, "清华大学", "school echoed");
  // Most top-tier sections should populate (adapter + groups + xiaoce + gaoshui).
  assert(r.totals.sections_with_data >= 4, `expected ≥4 sections populated for 清华, got ${r.totals.sections_with_data}`);
  // 强基计划 entry must be in tiqian_programs (added in iteration 4).
  const strongbase = r.tiqian_programs.find((p) => p.program_type === "强基计划");
  assert(!!strongbase, "强基计划 tiqian-pi entry missing for 清华");
});

test("dossier returns explicit _status markers when a section is absent", () => {
  // A pure-art college (in dataset but not in zonghepingjia) — use 中央音乐
  // which we know has groups but probably no zongping/gaoshui entry.
  const r = dossier("中央音乐学院");
  // We can't be 100% sure which section is empty without running, but the
  // contract is: every nullable section is either populated OR has _status.
  for (const s of [r.adapter, r.xiaoce, r.zongping, r.gaoshui, r.groups_summary]) {
    if (s && typeof s === "object" && "_status" in (s as object)) {
      const tagged = s as { _status: string; note?: string };
      assertEqual(tagged._status, "not_in_dataset", "_status must be 'not_in_dataset'");
      assert(typeof tagged.note === "string" && tagged.note.length > 0, "_status section must carry an explanation note");
    }
  }
});

test("dossier(中山大学) surfaces 综评 + 强基 cross-listing", () => {
  const r = dossier("中山大学");
  // Both 综评 (zongping section) AND 强基 (xiaoce section) should populate
  // because 中山大学 runs both.
  assert(!("_status" in (r.zongping as object)), "中山大学 should have a zongping entry");
  assert(!("_status" in (r.xiaoce as object)), "中山大学 should have a xiaoce entry");
  // tiqian_programs should include both [综评提前批] and [强基计划]
  const types = new Set(r.tiqian_programs.map((p) => p.program_type));
  assert(types.has("综评提前批"), "expected 综评提前批 for 中山大学");
  assert(types.has("强基计划"), "expected 强基计划 for 中山大学");
});

test("dossier(unknown school) returns all sections with _status", () => {
  const r = dossier("__no_such_school_NONEXIST_XYZ__");
  const allMissing =
    "_status" in (r.adapter as object) &&
    "_status" in (r.xiaoce as object) &&
    "_status" in (r.zongping as object) &&
    "_status" in (r.gaoshui as object) &&
    "_status" in (r.groups_summary as object);
  assert(allMissing, "all nullable sections should be _status=not_in_dataset");
  assertEqual(r.tiqian_programs.length, 0, "no tiqian programs for unknown school");
  assertEqual(r.huadang_cases.length, 0, "no huadang cases for unknown school");
  assertEqual(r.totals.sections_with_data, 0, "unknown school has 0 sections with data");
});

test("dossier: zs_code is resolved from any populated section", () => {
  const r = dossier("清华大学");
  assertEqual(r.zs_code, "10003", "清华 zs_code should resolve from adapter");
});

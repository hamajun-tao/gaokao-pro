// province-overview — "tell me everything about this province" composite.
//
// Mirror of `dossier` (school-side aggregator) but for provinces. Aggregates:
//   - 滑档/调剂 rules (zhiyuan-rules-2026 via provinceTiaojiInfo)
//   - 投档 timing calendar (zhiyuan-calendar-2026)
//   - 综评 schools open to this province (zonghepingjia-2026)
//   - 提前批 programs eligible for this province (tiqian-pi catalog)
//   - 历史 滑档 cases in this province (huadang)
//   - 一分一段 manifest hits (rank tables)
//   - top covered colleges in groups dataset that admit here
//
// One call gives parents the whole "what's filing in our province look like"
// picture without juggling 6-7 separate verb calls.
import {
  listZongheSchoolsByProvince,
  listTiqianProgramsByProvince,
  findCasesByProvince,
  findCalendarByProvince,
  type ZongheSchool2026,
  type TiqianProgram,
  type HuadangCase,
  type ProvinceCalendar
} from "./datasets.js";
import { findManifest } from "./manifest.js";
import { provinceTiaojiInfo, type ProvinceTiaojiInfo, loadDataset } from "./groups.js";

export type ProvinceSection<T> = T | { _status: "not_in_dataset"; note: string };

export type ProvinceOverviewResult = {
  province: string;
  rules: ProvinceTiaojiInfo;
  calendar: ProvinceSection<ProvinceCalendar>;
  zongping_schools: ZongheSchool2026[];        // may be empty
  tiqian_programs: TiqianProgram[];            // may be empty
  huadang_cases: HuadangCase[];                // may be empty
  manifest: {
    history_2024?: unknown;
    physics_2024?: unknown;
    liberal_2024?: unknown;
    science_2024?: unknown;
    combined_2024?: unknown;
    history_2025?: unknown;
    physics_2025?: unknown;
    combined_2025?: unknown;
  };
  colleges_admitting: {
    name: string;
    code: number | null;
    groups_count: number;
    majors_total: number;
  }[];
  totals: {
    zongping_count: number;
    tiqian_count: number;
    huadang_count: number;
    colleges_with_groups: number;
    program_types: string[];
    eligible_unconditional: number;  // 提前批 programs that need no special profile (no minority/rural/serve/etc.)
  };
};

const missing = (msg: string) => ({ _status: "not_in_dataset" as const, note: msg });

function tryFind<T>(fn: () => T | null, fallback: string): T | { _status: "not_in_dataset"; note: string } {
  try {
    const out = fn();
    if (out == null) return missing(fallback);
    return out;
  } catch {
    return missing(fallback);
  }
}

export function provinceOverview(province: string): ProvinceOverviewResult {
  const rules = provinceTiaojiInfo(province);

  // 1) calendar
  const calendar = tryFind(() => findCalendarByProvince(province), "zhiyuan-calendar-2026 未收录 (覆盖 31 省)");

  // 2) zongping schools open here
  let zongping: ZongheSchool2026[] = [];
  try { zongping = listZongheSchoolsByProvince(province); } catch { /* dataset missing */ }

  // 3) 提前批 programs eligible
  let tiqian: TiqianProgram[] = [];
  try { tiqian = listTiqianProgramsByProvince(province); } catch { /* dataset missing */ }

  // 4) huadang cases
  let cases: HuadangCase[] = [];
  try { cases = findCasesByProvince(province); } catch { /* dataset missing */ }

  // 5) manifest hits — 一分一段 rank tables (track-keyed). Try common tracks.
  const manifest: ProvinceOverviewResult["manifest"] = {};
  for (const year of [2024, 2025]) {
    for (const track of ["history", "physics", "combined", "liberal", "science"]) {
      try {
        const rec = findManifest(province, year);
        if (rec) {
          const key = `${track}_${year}` as keyof ProvinceOverviewResult["manifest"];
          manifest[key] = rec;
        }
      } catch { /* skip */ }
    }
  }

  // 6) colleges admitting in this province (from college-groups dataset)
  const colleges_admitting: ProvinceOverviewResult["colleges_admitting"] = [];
  try {
    const { dataset } = loadDataset();
    for (const u of dataset.universities) {
      const p = u.provinces.find((pp) => pp.province === province);
      if (p) {
        colleges_admitting.push({
          name: u.university,
          code: u.code,
          groups_count: p.groups_count,
          majors_total: p.majors_total
        });
      }
    }
  } catch { /* dataset missing */ }

  // ---- Totals ----
  const program_types = Array.from(new Set(tiqian.map((p) => p.program_type)));
  const eligible_unconditional = tiqian.filter((p) => {
    // Unconditional = doesn't require any of the profile flags
    const t = p.program_type;
    return !["公费师范生", "优师计划", "国家专项", "高校专项", "地方专项",
      "民族班", "预科班", "小语种提前批", "农村订单医学"].includes(t);
  }).length;

  return {
    province,
    rules,
    calendar,
    zongping_schools: zongping,
    tiqian_programs: tiqian,
    huadang_cases: cases,
    manifest,
    colleges_admitting,
    totals: {
      zongping_count: zongping.length,
      tiqian_count: tiqian.length,
      huadang_count: cases.length,
      colleges_with_groups: colleges_admitting.length,
      program_types,
      eligible_unconditional,
    }
  };
}

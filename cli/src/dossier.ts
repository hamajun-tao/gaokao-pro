// dossier — "everything we know about this school" one-call composite.
//
// Aggregates per-school facts from across the project's curated datasets so
// parents don't have to fan out across 6-7 separate verbs:
//
//   - school adapter (招生网 URL, contact, program offer flags)
//   - 校测 detail (强基/综评 笔试/面试/体测/录取分配)
//   - 综评 by-school (覆盖省份, ratio, seats, 校测含)
//   - 高水平运动队 (sports + tier_required + score_path)
//   - 提前批 catalog hits (programs this school runs)
//   - 院校专业组 summary (province coverage + group/major counts)
//   - 滑档历史 cases involving this school (huadang)
//
// Each section is independently nullable — if the dataset doesn't have the
// school, the section is null with a `_status: "not_in_dataset"` field so
// parents can see "we tried, no data" instead of guessing.
import {
  findSchoolAdapter,
  findXiaoceDetailBySchool,
  loadZonghepingjia2026,
  loadGaoshuiYundongdui2025,
  listTiqianProgramsBySchool,
  loadHuadangCases,
  type SchoolAdapter,
  type XiaoceSchoolDetail,
  type ZongheSchool2026,
  type GaoshuiSchool2025,
  type TiqianProgram,
  type HuadangCase
} from "./datasets.js";
import { findUniversity, datasetStats } from "./groups.js";

export type DossierSection<T> = T | { _status: "not_in_dataset"; note: string };

export type DossierResult = {
  school: string;
  zs_code: string | null;
  adapter: DossierSection<SchoolAdapter>;
  xiaoce: DossierSection<XiaoceSchoolDetail>;
  zongping: DossierSection<{ entry: ZongheSchool2026; provinces: string[] }>;
  gaoshui: DossierSection<{ school: GaoshuiSchool2025; sports_count: number }>;
  tiqian_programs: TiqianProgram[];      // list — may be empty
  groups_summary: DossierSection<{
    university: string;
    code: number | null;
    year: number;
    provinces_count: number;
    groups_count: number;
    majors_total: number;
    province_names: string[];
  }>;
  huadang_cases: HuadangCase[];          // list — may be empty
  totals: {
    sections_with_data: number;
    sections_missing: number;
    tiqian_program_count: number;
    huadang_case_count: number;
  };
};

const missing = (msg: string) => ({ _status: "not_in_dataset" as const, note: msg });

export function dossier(schoolName: string): DossierResult {
  // 1) adapter
  const adapter = findSchoolAdapter(schoolName);

  // 2) xiaoce
  const xiaoce = findXiaoceDetailBySchool(schoolName);

  // 3) zongping — by-school file is keyed by school name
  let zongpingHit: { entry: ZongheSchool2026; provinces: string[] } | null = null;
  try {
    const file = loadZonghepingjia2026();
    const entry = file.schools.find((s) => typeof s.school === "string" && s.school.includes(schoolName));
    if (entry) zongpingHit = { entry, provinces: entry.provinces ?? [] };
  } catch { /* dataset missing — treat as not-in-dataset */ }

  // 4) gaoshui — find by name substring
  let gaoshuiHit: { school: GaoshuiSchool2025; sports_count: number } | null = null;
  try {
    const file = loadGaoshuiYundongdui2025();
    const entry = file.schools.find((s) => typeof s.school === "string" && s.school.includes(schoolName));
    if (entry) gaoshuiHit = { school: entry, sports_count: entry.sports?.length ?? 0 };
  } catch { /* dataset missing */ }

  // 5) tiqian-pi programs run by this school
  let tiqianPrograms: TiqianProgram[] = [];
  try {
    tiqianPrograms = listTiqianProgramsBySchool(schoolName);
  } catch { /* dataset missing */ }

  // 6) groups summary (院校专业组 dataset)
  let groupsSummary: DossierResult["groups_summary"] = missing("学校未在 college-groups 数据集中（数据集约 140 校）");
  try {
    const u = findUniversity(schoolName);
    if (u) {
      let majors = 0, groups = 0;
      const provNames: string[] = [];
      for (const p of u.provinces) {
        majors += p.majors_total;
        groups += p.groups_count;
        provNames.push(p.province);
      }
      groupsSummary = {
        university: u.university,
        code: u.code,
        year: u.year,
        provinces_count: u.provinces.length,
        groups_count: groups,
        majors_total: majors,
        province_names: provNames
      };
    }
  } catch { /* groups dataset issue */ }

  // 7) huadang cases involving this school
  let huadangCases: HuadangCase[] = [];
  try {
    const file = loadHuadangCases();
    huadangCases = file.cases.filter((c) => typeof c.school === "string" && c.school.includes(schoolName));
  } catch { /* dataset missing */ }

  // Decide which sections are populated.
  const adapterSec: DossierSection<SchoolAdapter> = adapter ?? missing(`schools-adapters-2024.json 未收录 ${schoolName}`);
  const xiaoceSec: DossierSection<XiaoceSchoolDetail> = xiaoce ?? missing("xiaoce-detail-2025.json 未收录 (覆盖 59 校)");
  const zongpingSec: DossierSection<{ entry: ZongheSchool2026; provinces: string[] }> = zongpingHit ?? missing("zonghepingjia-2026.json 未收录 (覆盖 40 校)");
  const gaoshuiSec: DossierSection<{ school: GaoshuiSchool2025; sports_count: number }> = gaoshuiHit ?? missing("gaoshui-yundongdui-2025.json 未收录 (覆盖 39 校)");

  const sectionData = [adapterSec, xiaoceSec, zongpingSec, gaoshuiSec, groupsSummary];
  let sections_with_data = 0;
  let sections_missing = 0;
  for (const s of sectionData) {
    if (s && typeof s === "object" && "_status" in (s as object)) sections_missing++;
    else sections_with_data++;
  }
  // tiqian + huadang are lists; non-empty counts as "with data"
  if (tiqianPrograms.length > 0) sections_with_data++; else sections_missing++;
  if (huadangCases.length > 0) sections_with_data++; else sections_missing++;

  const zs_code = adapter?.zs_code ?? xiaoce?.zs_code ?? zongpingHit?.entry.zs_code ?? gaoshuiHit?.school.zs_code ?? null;

  // datasetStats is read once so we surface dataset-level coverage in the
  // calling tool's UX layer (not embedded here to keep the result lean).
  void datasetStats;

  return {
    school: schoolName,
    zs_code,
    adapter: adapterSec,
    xiaoce: xiaoceSec,
    zongping: zongpingSec,
    gaoshui: gaoshuiSec,
    tiqian_programs: tiqianPrograms,
    groups_summary: groupsSummary,
    huadang_cases: huadangCases,
    totals: {
      sections_with_data,
      sections_missing,
      tiqian_program_count: tiqianPrograms.length,
      huadang_case_count: huadangCases.length
    }
  };
}

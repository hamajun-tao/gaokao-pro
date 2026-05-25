// employment — look up a school's 2024 就业质量报告 key statistics.
//
// Reads cli/data/datasets/employment-2024.json. Fields are factual data points
// extracted from each school's official report (本科 only): 就业率 / 升学率 /
// 出国出境率 / 平均月薪 / top 行业 / top 地域 / top 雇主. null = not publicly
// disclosed in that school's report.
//
// The original 就业质量报告 PDFs are copyrighted by each university; this
// verb returns only the statistical facts plus the source URL the user can
// open to read the report directly.
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveAlias } from "./aliases.js";

const __filename = fileURLToPath(import.meta.url);
const SRC_DIR = dirname(__filename);

const CANDIDATE_DATA_DIRS = [
  resolve(SRC_DIR, "..", "data", "datasets"),
  resolve(SRC_DIR, "..", "..", "data", "datasets")
];

export type EmploymentUndergrad = {
  total_grads: number | null;
  employment_rate_pct: number | null;
  further_study_rate_pct: number | null;
  domestic_grad_school_pct: number | null;
  abroad_pct: number | null;
  direct_employment_pct: number | null;
  avg_monthly_salary_yuan: number | null;
  top_industries: string[];
  top_regions: string[];
  top_employers: string[];
};

export type EmploymentRecord = {
  school: string;
  zs_code: string;
  year: number;
  source_url: string;
  undergrad: EmploymentUndergrad;
};

type EmploymentFile = {
  _meta?: unknown;
  schools: EmploymentRecord[];
};

let cache: EmploymentFile | null = null;

function loadFile(): EmploymentFile {
  if (cache) return cache;
  for (const d of CANDIDATE_DATA_DIRS) {
    const p = resolve(d, "employment-2024.json");
    if (existsSync(p)) {
      cache = JSON.parse(readFileSync(p, "utf8")) as EmploymentFile;
      return cache;
    }
  }
  throw new Error("employment-2024.json not found in cli/data/datasets/");
}

export function findEmployment(query: string): EmploymentRecord | null {
  const file = loadFile();
  const q = query.trim();
  const byCode = file.schools.find((s) => s.zs_code === q);
  if (byCode) return byCode;
  const canonical = resolveAlias(q);
  const byCanonical = file.schools.find((s) => s.school === canonical);
  if (byCanonical) return byCanonical;
  const byExact = file.schools.find((s) => s.school === q);
  if (byExact) return byExact;
  const substr = file.schools.filter((s) => s.school.includes(q)).sort((a, b) => a.school.length - b.school.length);
  return substr[0] ?? null;
}

export function listEmploymentCoverage(): { school: string; zs_code: string; year: number }[] {
  const file = loadFile();
  return file.schools.map((s) => ({ school: s.school, zs_code: s.zs_code, year: s.year }));
}

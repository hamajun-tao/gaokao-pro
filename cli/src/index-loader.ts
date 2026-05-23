// Loads cli/data/school-index.json.gz — the local school corpus built by `probe`.
// Exposes filters by province / labels / level / type / belong.
import { readFileSync, existsSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const SRC_DIR = dirname(__filename);
// Look for the gzipped index first (npm-shipped), then the legacy uncompressed
// docs path (dev convenience).
const CANDIDATE_PATHS = [
  // From src/ via tsx: cli/src/ → cli/data/
  resolve(SRC_DIR, "..", "data", "school-index.json.gz"),
  // From dist/ compiled: cli/dist/ → cli/data/
  resolve(SRC_DIR, "..", "..", "data", "school-index.json.gz"),
  // Legacy uncompressed paths
  resolve(SRC_DIR, "..", "..", "docs", "school-index.json"),
  resolve(SRC_DIR, "..", "..", "..", "docs", "school-index.json")
];

export type SchoolRow = {
  gaokao_cn_id: number;
  zs_code: string;
  name: string;
  province: string;
  city: string;
  level: string;
  type: string;
  nature: string;
  belong: string;
  f985: boolean;
  f211: boolean;
  dual_class: string;
  pro_type_min: Record<string, Array<{ year: number; type: Record<string, string> }>>;
};

export type SchoolIndex = {
  generated_at: string;
  rows: SchoolRow[];
};

let cached: SchoolIndex | null = null;

export function loadIndex(): SchoolIndex {
  if (cached) return cached;
  let lastErr: unknown = null;
  for (const path of CANDIDATE_PATHS) {
    if (!existsSync(path)) continue;
    try {
      const buf = readFileSync(path);
      const raw = path.endsWith(".gz") ? gunzipSync(buf).toString("utf8") : buf.toString("utf8");
      cached = JSON.parse(raw) as SchoolIndex;
      return cached;
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(
    `school-index not found in any of: ${CANDIDATE_PATHS.join(", ")}. ` +
      `Run \`pnpm probe\` to build it. Last error: ${lastErr}`
  );
}

export type IndexFilter = {
  level?: string;          // e.g. "本科"
  type?: string;           // e.g. "综合类"
  nature?: string;         // e.g. "公办"
  belong?: string;         // e.g. "教育部"
  f985?: boolean;
  f211?: boolean;
  dualClass?: boolean;     // true → must be 双一流
};

export function filterIndex(index: SchoolIndex, f: IndexFilter): SchoolRow[] {
  return index.rows.filter((r) => {
    if (f.level !== undefined && r.level !== f.level) return false;
    if (f.type !== undefined && r.type !== f.type) return false;
    if (f.nature !== undefined && r.nature !== f.nature) return false;
    if (f.belong !== undefined && r.belong !== f.belong) return false;
    if (f.f985 === true && !r.f985) return false;
    if (f.f211 === true && !r.f211) return false;
    if (f.dualClass === true && r.dual_class !== "双一流") return false;
    return true;
  });
}

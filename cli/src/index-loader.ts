// Loads cli/data/school-index.json.gz — the local school corpus built by `probe`.
// Exposes filters by province / labels / level / type / belong.
import { readFileSync, existsSync } from "node:fs";
import { resolveAlias } from "./aliases.js";
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

// Guard against a corrupt/malicious .gz expanding without bound (real index is
// ~7MB; cap well above that so a bad file errors cleanly instead of OOMing).
const MAX_DECOMPRESSED_BYTES = 64 * 1024 * 1024;

export function loadIndex(): SchoolIndex {
  if (cached) return cached;
  let lastErr: unknown = null;
  for (const path of CANDIDATE_PATHS) {
    if (!existsSync(path)) continue;
    try {
      const buf = readFileSync(path);
      const raw = path.endsWith(".gz")
        ? gunzipSync(buf, { maxOutputLength: MAX_DECOMPRESSED_BYTES }).toString("utf8")
        : buf.toString("utf8");
      const parsed = JSON.parse(raw) as SchoolIndex;
      // Sanity check the shape before caching so a corrupt file fails here with
      // a clear message rather than as a downstream undefined-deref.
      if (!parsed || !Array.isArray(parsed.rows)) {
        throw new Error(`malformed index (missing rows array) at ${path}`);
      }
      cached = parsed;
      return cached;
    } catch (e) {
      // gunzipSync throws ERR_BUFFER_TOO_LARGE when maxOutputLength is exceeded.
      lastErr = e;
    }
  }
  throw new Error(
    `school-index not found or unreadable in any of: ${CANDIDATE_PATHS.join(", ")}. ` +
      `Run \`pnpm probe\` to (re)build it. Last error: ${lastErr}`
  );
}

// Expose the index's build timestamp so callers can surface data age without
// re-parsing the file. Returns null if generated_at is missing/unparseable.
export function getIndexAge(): { generatedAt: Date; daysOld: number } | null {
  const ts = loadIndex().generated_at;
  const generatedAt = ts ? new Date(ts) : null;
  if (!generatedAt || Number.isNaN(generatedAt.getTime())) return null;
  const daysOld = Math.floor((Date.now() - generatedAt.getTime()) / 86_400_000);
  return { generatedAt, daysOld };
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

export type ResolveResult =
  | { ok: true; row: SchoolRow; matchedBy: "zs_code" | "id" | "name" | "substring" }
  | { ok: false; reason: "empty" | "notfound" | "ambiguous"; query: string; candidates?: SchoolRow[] };

// The ONE place that turns a user-typed school argument
// (name | 简称 | 5-digit 院校代码 | gaokao.cn id) into a concrete index row.
// Refuses unknown / ambiguous input instead of guessing — this is what makes
// the id-based verbs (school/plan/actual/scores) impossible to 搞错.
export function resolveSchool(query: string | undefined): ResolveResult {
  const q = (query ?? "").trim();
  if (!q) return { ok: false, reason: "empty", query: "" };
  const { rows } = loadIndex();

  // 1) exact 5-digit 院校代码
  const byZs = rows.find((r) => r.zs_code === q);
  if (byZs) return { ok: true, row: byZs, matchedBy: "zs_code" };

  // 2) pure-numeric → gaokao.cn internal id; must exist in the index, otherwise
  //    it is almost certainly a wrong guess — refuse rather than query blind.
  if (/^\d+$/.test(q)) {
    const byId = rows.find((r) => r.gaokao_cn_id === Number(q));
    return byId
      ? { ok: true, row: byId, matchedBy: "id" }
      : { ok: false, reason: "notfound", query: q };
  }

  // 3) alias (简称) → canonical, then exact name
  const canonical = resolveAlias(q);
  const exact = rows.filter((r) => r.name === canonical);
  if (exact.length === 1) return { ok: true, row: exact[0], matchedBy: "name" };

  // 4) substring — accept only when unambiguous; otherwise surface candidates
  const subs = rows.filter((r) => r.name.includes(canonical));
  if (subs.length === 1) return { ok: true, row: subs[0], matchedBy: "substring" };
  if (subs.length > 1) {
    subs.sort((a, b) => a.name.length - b.name.length);
    return { ok: false, reason: "ambiguous", query: q, candidates: subs.slice(0, 8) };
  }
  return { ok: false, reason: "notfound", query: q };
}

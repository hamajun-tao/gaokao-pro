// manifest — 一分一段表 source URL manifest lookup.
//
// 62 records (31 provinces × {2024, 2025}) covering official 一分一段表 URLs
// from 省考试院 / eol.cn / gaokao.cn. Each record carries year_verified_from
// so callers know how strongly the year was checked.
//
// Use cases:
//   - resolve "I'm in 河南, score 660, rank 2025" → URL to look up the
//     official table
//   - cross-check a third-party rank lookup against the authoritative source
//   - feed Claude Code a list of PDFs to OCR offline
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const SRC_DIR = dirname(__filename);

const CANDIDATE_DATA_DIRS = [
  resolve(SRC_DIR, "..", "data", "datasets"),
  resolve(SRC_DIR, "..", "..", "data", "datasets")
];

export type ManifestRecord = {
  province: string;
  year: number;
  regime: string;                       // "3+3" | "3+1+2" | "old(文/理)" | "3+1+2(首届)" | etc.
  tracks: string[];                     // e.g. ["物理类","历史类"] | ["综合改革"] | ["文科","理科"]
  source_url: string | null;
  source_url_history?: string | null;
  source_url_li?: string | null;
  source_url_2?: string | null;
  source_pdf_url?: string | null;
  source_org: string | null;
  year_verified_from: string;           // "url"|"title"|"body"|"pdf_filename"|"unverified" or combos
  format: string;                       // "html_table"|"pdf"|"image"|"jpg_attachment"|"excel"|"not_published"
  notes?: string;
};

type ManifestFile = {
  _meta?: unknown;
  records: ManifestRecord[];
};

let cache: ManifestFile | null = null;

function loadFile(): ManifestFile {
  if (cache) return cache;
  for (const d of CANDIDATE_DATA_DIRS) {
    const p = resolve(d, "yifenyiduan-manifest.json");
    if (existsSync(p)) {
      cache = JSON.parse(readFileSync(p, "utf8")) as ManifestFile;
      return cache;
    }
  }
  throw new Error("yifenyiduan-manifest.json not found in cli/data/datasets/");
}

// Province aliases — accept pinyin / GB id / partial Chinese matches.
const PROVINCE_ALIASES: Record<string, string> = {
  // GB codes
  "11": "北京", "12": "天津", "13": "河北", "14": "山西", "15": "内蒙古",
  "21": "辽宁", "22": "吉林", "23": "黑龙江", "31": "上海", "32": "江苏",
  "33": "浙江", "34": "安徽", "35": "福建", "36": "江西", "37": "山东",
  "41": "河南", "42": "湖北", "43": "湖南", "44": "广东", "45": "广西",
  "46": "海南", "50": "重庆", "51": "四川", "52": "贵州", "53": "云南",
  "54": "西藏", "61": "陕西", "62": "甘肃", "63": "青海", "64": "宁夏",
  "65": "新疆",
  // pinyin (lowercase)
  "beijing": "北京", "tianjin": "天津", "hebei": "河北", "shanxi": "山西",
  "neimenggu": "内蒙古", "neimeng": "内蒙古", "liaoning": "辽宁", "jilin": "吉林",
  "heilongjiang": "黑龙江", "shanghai": "上海", "jiangsu": "江苏", "zhejiang": "浙江",
  "anhui": "安徽", "fujian": "福建", "jiangxi": "江西", "shandong": "山东",
  "henan": "河南", "hubei": "湖北", "hunan": "湖南", "guangdong": "广东",
  "guangxi": "广西", "hainan": "海南", "chongqing": "重庆", "sichuan": "四川",
  "guizhou": "贵州", "yunnan": "云南", "xizang": "西藏", "tibet": "西藏",
  "shaanxi": "陕西", "shanxi-shaanxi": "陕西", "gansu": "甘肃", "qinghai": "青海",
  "ningxia": "宁夏", "xinjiang": "新疆"
};

function resolveProvince(q: string): string {
  const trimmed = q.trim();
  return PROVINCE_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

export function findManifest(provinceQuery: string, year: number): ManifestRecord | null {
  const file = loadFile();
  const province = resolveProvince(provinceQuery);
  return file.records.find((r) => r.province === province && r.year === year) ?? null;
}

export function listManifestProvinces(year?: number): ManifestRecord[] {
  const file = loadFile();
  if (typeof year === "number") {
    return file.records.filter((r) => r.year === year);
  }
  return file.records;
}

export function manifestStats(): {
  total: number;
  year_verified: number;
  unverified: number;
  by_year: Record<number, number>;
} {
  const file = loadFile();
  const stats = { total: file.records.length, year_verified: 0, unverified: 0, by_year: {} as Record<number, number> };
  for (const r of file.records) {
    if (r.year_verified_from === "unverified") stats.unverified++;
    else stats.year_verified++;
    stats.by_year[r.year] = (stats.by_year[r.year] ?? 0) + 1;
  }
  return stats;
}

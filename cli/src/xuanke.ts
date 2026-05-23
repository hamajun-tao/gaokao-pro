// xuanke — decode gaokao.cn selected-subject codes (70001 / 70002 / ...) into
// the 6 standard subjects + 不限. Codes show up in schoolspecialscore /
// schoolspecialplan `sp_xuanke` / `sg_xuanke` fields.
//
// Format inferred from observed payloads:
//   `_` joins codes inside ONE valid combination (AND)
//   `^` separates alternative combinations (OR)
//
// Example raw: "70001_70002_70004^70001_70003_70004"
//   → satisfy either (物理 AND 化学 AND 历史) or (物理 AND 生物 AND 历史)
//
// 70008 commonly appears as "不限" (no requirement).
export const XUANKE_CODES: Record<string, string> = {
  "70001": "物理",
  "70002": "化学",
  "70003": "生物",
  "70004": "历史",
  "70005": "政治",
  "70006": "地理",
  "70008": "不限"
};

export type DecodedXuanke = {
  raw: string;
  combinations: string[][];  // each inner array = one valid combination
  display: string;           // human-readable single line
  unrestricted: boolean;
};

export function decodeXuanke(raw: string | null | undefined): DecodedXuanke {
  const safeRaw = (raw ?? "").trim();
  if (!safeRaw) {
    return { raw: "", combinations: [], display: "(无数据)", unrestricted: false };
  }
  const groups = safeRaw.split("^").map((g) => g.trim()).filter(Boolean);
  const combinations = groups.map((g) =>
    g.split("_").map((c) => XUANKE_CODES[c.trim()] ?? `?${c.trim()}`)
  );
  // unrestricted if every combination is just ["不限"]
  const unrestricted = combinations.length > 0 && combinations.every((c) => c.length === 1 && c[0] === "不限");
  const display = unrestricted
    ? "不限"
    : combinations.map((c) => c.join("+")).join(" 或 ");
  return { raw: safeRaw, combinations, display, unrestricted };
}

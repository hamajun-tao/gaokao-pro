// roadmap — full 志愿 plan generator combining recommend + paths + slip-risk.
//
// Takes a candidate profile (score, province, subjects, optional rank +
// minority/rural/serve/sport flags) and returns:
//   1) 冲/稳/保 picks from `recommend` (top-N schools per bucket)
//   2) For each recommend pick that's in college-groups, attach groups + slip-risk
//   3) All 提前批/综评 paths from `paths` (alternatives outside the普通批)
//   4) Province 滑档 rules summary up front
//
// One call → "here's the picture" — replaces juggling recommend / slip-risk /
// paths / huadang manually. Parents see picks + their risk + alternative
// routes all in one place.
import { recommend, type RecommendCandidate } from "./recommend.js";
import { findUniversity, slipRisk, provinceTiaojiInfo, detectGroupTrap, type SlipRiskResult, type ProvinceTiaojiInfo } from "./groups.js";
import { paths as pathsFn, type ProfileLite, type PathsResult } from "./paths.js";
import { resolveProvince, type ProvinceId, type Subject } from "./codes.js";
import { listTiqianProgramsBySchool, findSchoolAdapter } from "./datasets.js";

export type RoadmapInput = {
  province: string;
  score: number;
  rank?: number | null;
  subjects: Subject[];
  per_bucket?: number;            // how many picks per 冲/稳/保 bucket (default 5)
  minority?: boolean;
  rural?: boolean;
  serve?: boolean;
  sport_tier?: string | null;
  sport_name?: string | null;
  language?: string | null;
};

export type SchoolPickWithRisk = {
  name: string;
  delta: number;
  baselineMinScore: number;
  baselineYear: number;
  city: string;
  is985: boolean;
  is211: boolean;
  dualClass: string;
  in_groups_dataset: boolean;
  // If in groups dataset, surface per-province group count + first-group slip-risk.
  groups_in_province: number | null;
  representative_slip_risk: {
    group_code: string;
    verdict: SlipRiskResult["verdict"];
    score_gap: number | null;
    reasons_count: number;
    precedent_count: number;
    trap_majors: string[];           // 同组冷门"调剂雷"专业
    hot_majors_sample: string[];     // 同组热门 (前 3 个)
    trap_hint: string | null;        // 雷区文字提示 (e.g. "计算机+护理同组")
  } | null;
  // 三层标签 — 推荐为什么是这一档？分:
  //   📊 data_facts:    可验证的招生事实 (gap / 985 标签 / 投档线 etc.)
  //   📋 policy_basis:  政策依据 (公费师范 / 强基 / 综评 / 专项 etc.)
  //   💭 my_judgment:   主观判断 (可能错)，目前留空 — 不在 roadmap 里推断,
  //                     家长想要主观判断要去 `outlook` verb 查具体专业
  reasoning: {
    data_facts: string[];
    policy_basis: string[];
    my_judgment: string | null;
  };
};

export type RoadmapResult = {
  query: {
    province: string;
    score: number;
    rank: number | null;
    subjects: Subject[];
  };
  province_rules: ProvinceTiaojiInfo;
  buckets: {
    "冲": SchoolPickWithRisk[];
    "稳": SchoolPickWithRisk[];
    "保": SchoolPickWithRisk[];
  };
  paths_summary: {
    total_eligible: number;
    by_category: Record<string, number>;
    top_eligible: PathsResult["pathways"];   // up to 10 eligible items
  };
  caveats: string[];
};

function pickRepresentativeRisk(
  uniName: string,
  provinceName: string,
  candidateScore: number,
  candidateRank: number | null
): SchoolPickWithRisk["representative_slip_risk"] {
  const u = findUniversity(uniName);
  if (!u) return null;
  const province = u.provinces.find((p) => p.province === provinceName);
  if (!province) return null;
  // Pick the group with the lowest min_score the candidate is closest to.
  // Falls back to the first group if no min_scores.
  const groupsWithScore = province.groups.filter((g) => typeof g.group_min_score === "number");
  const target = groupsWithScore.length > 0
    ? groupsWithScore.reduce<typeof groupsWithScore[number]>((acc, g) => {
        const gap = candidateScore - (g.group_min_score as number);
        const accGap = candidateScore - (acc.group_min_score as number);
        // prefer smallest non-negative gap (closest to fence); else use largest
        if (gap >= 0 && (accGap < 0 || gap < accGap)) return g;
        return acc;
      }, groupsWithScore[0])
    : province.groups[0];
  if (!target || !target.group_code) return null;
  try {
    const risk = slipRisk({
      uniName,
      provinceName,
      groupCode: target.group_code,
      candidateScore,
      candidateRank,
    });
    const trap = detectGroupTrap(target);
    return {
      group_code: target.group_code,
      verdict: risk.verdict,
      score_gap: risk.score_gap,
      reasons_count: risk.reasons.length,
      precedent_count: risk.precedents.length,
      trap_majors: trap.trap_majors,
      hot_majors_sample: trap.hot_majors.slice(0, 3),
      trap_hint: trap.spread_hint,
    };
  } catch {
    return null;
  }
}

function buildReasoning(c: RecommendCandidate, bucket: "冲" | "稳" | "保", inDataset: boolean, groupsCount: number | null): SchoolPickWithRisk["reasoning"] {
  const data_facts: string[] = [];
  const policy_basis: string[] = [];

  // 📊 数据事实 — 不可争辩
  const tag = c.is985 ? "985" : c.is211 ? "211" : c.dualClass === "双一流" ? "双一流" : "普通本科";
  data_facts.push(`${tag} · ${c.city} · ${c.baselineYear} 投档线 ${c.baselineMinScore}`);
  const cmp = c.delta >= 0 ? `+${c.delta} (高于基线)` : `${c.delta} (低于基线)`;
  data_facts.push(`分差 ${cmp} → 分到 [${bucket}] 档`);
  if (inDataset && groupsCount !== null) {
    data_facts.push(`同省专业组数据：${groupsCount} 组`);
  } else if (!inDataset) {
    data_facts.push("⚠️ 不在我们 college-groups 数据集 (无法看具体专业组)");
  }

  // 📋 政策依据 — 学校跑的特殊计划
  try {
    const programs = listTiqianProgramsBySchool(c.name);
    const types = new Set(programs.map((p) => p.program_type));
    if (types.has("强基计划")) policy_basis.push("强基计划 (教育部 2020) — 锁基础学科 + 本研衔接");
    if (types.has("公费师范生")) policy_basis.push("公费师范生 (教育部 2007 / 5 部委 2018) — 学费全免 + 6 年服务 + 编制");
    if (types.has("优师计划")) policy_basis.push("优师计划 (教育部 2021) — 定向中西部欠发达县");
    if (types.has("综评提前批") || types.has("三位一体")) policy_basis.push("综合评价招生 (各省试点) — 高考+校测+学考综合");
    if (types.has("中外合作综评")) policy_basis.push("中外合作综评 — ⚠️ 高昂学费 (一般 ¥10-20万/年)");
    if (types.has("国家专项")) policy_basis.push("国家专项 (国发 2012-26) — 限农村户籍 + 学籍 3+3");
    if (types.has("高校专项")) policy_basis.push("高校专项 (自强/筑梦/腾飞等) — 限 832 县农村");
    if (types.has("公安院校")) policy_basis.push("公安院校 (公安部直属) — 入警率 80%+，含政审");
    if (types.has("军校")) policy_basis.push("军校 — 学费/食宿/津贴全免 + 服役 8 年");
    if (types.has("农村订单医学")) policy_basis.push("农村订单医学 (国务院医改) — 6 年定向到县级医院");
    if (types.has("民族班") || types.has("预科班")) policy_basis.push("民族班/预科班 — 限少数民族 / 民族区生源");
  } catch { /* dataset may be missing */ }

  // 校 adapter — additional verifiable facts (zsw URL / 联系方式)
  try {
    const ad = findSchoolAdapter(c.name);
    if (ad?.programs?.qiangji?.offers === true && !policy_basis.some(p => p.includes("强基计划"))) {
      policy_basis.push("强基计划 (adapter 显示开设)");
    }
    if (ad?.programs?.zonghepingjia?.offers === true && !policy_basis.some(p => p.includes("综合评价"))) {
      policy_basis.push("综合评价 (adapter 显示开设)");
    }
    if (ad?.programs?.gao_shui_yundong === true) {
      policy_basis.push("高水平运动队 (后端有体育特长生通道)");
    }
  } catch { /* ignore */ }

  return {
    data_facts,
    policy_basis,
    my_judgment: null,  // roadmap 不做主观判断，留给 outlook verb
  };
}

function enrich(c: RecommendCandidate, bucket: "冲" | "稳" | "保", provinceName: string, candidateScore: number, candidateRank: number | null): SchoolPickWithRisk {
  const u = findUniversity(c.name);
  const inDataset = !!u;
  const provinceObj = u?.provinces.find((p) => p.province === provinceName);
  return {
    name: c.name,
    delta: c.delta,
    baselineMinScore: c.baselineMinScore,
    baselineYear: c.baselineYear,
    city: c.city,
    is985: c.is985,
    is211: c.is211,
    dualClass: c.dualClass,
    in_groups_dataset: inDataset,
    groups_in_province: provinceObj?.groups_count ?? null,
    representative_slip_risk: pickRepresentativeRisk(c.name, provinceName, candidateScore, candidateRank),
    reasoning: buildReasoning(c, bucket, inDataset, provinceObj?.groups_count ?? null),
  };
}

export function roadmap(input: RoadmapInput): RoadmapResult {
  const provinceId = resolveProvince(input.province);
  if (!provinceId) throw new Error(`unknown province: ${input.province}`);
  // The `recommend` verb expects ProvinceId. Resolve and re-stringify the canonical name for downstream.
  const rules = provinceTiaojiInfo(input.province);
  const perBucket = input.per_bucket ?? 5;

  // 1) Recommend (offline; uses school-index dataset)
  const rec = recommend({
    score: input.score,
    provinceId: provinceId as ProvinceId,
    subjects: input.subjects,
    rank: input.rank ?? undefined,
    limit: perBucket * 4,
  });

  // Pick top-N per bucket and enrich with groups + slip-risk.
  const enrichedChong = rec.buckets["冲"].slice(0, perBucket).map((c) => enrich(c, "冲", input.province, input.score, input.rank ?? null));
  const enrichedWen  = rec.buckets["稳"].slice(0, perBucket).map((c) => enrich(c, "稳", input.province, input.score, input.rank ?? null));
  const enrichedBao  = rec.buckets["保"].slice(0, perBucket).map((c) => enrich(c, "保", input.province, input.score, input.rank ?? null));

  // 2) paths summary (提前批/综评/运动队 alternatives)
  const profile: ProfileLite = {
    province: input.province,
    score: input.score,
    rank: input.rank ?? null,
    is_minority: input.minority === true,
    is_rural_county: input.rural === true,
    agree_to_serve: input.serve === true,
    sport_tier: input.sport_tier ?? null,
    sport_name: input.sport_name ?? null,
    small_language: input.language ?? null,
    school_filter: null,
  };
  const pathsResult = pathsFn(profile);
  const by_category: Record<string, number> = {};
  for (const [cat, s] of Object.entries(pathsResult.summary_by_category)) {
    by_category[cat] = s.eligible;
  }
  const top_eligible = pathsResult.pathways.filter((p) => p.eligible).slice(0, 10);

  // 3) Caveats summary line
  const caveats: string[] = [];
  if (rules.has_tiaoji === false) {
    caveats.push(`${input.province} 本科批 无服从调剂兜底 — 冲档 miss = 直接滑档，务必梯度精准 + 用足志愿位数`);
  }
  if (input.rank == null) {
    caveats.push("未提供 rank — 新高考省份强烈建议补齐 (gaokao-pro rank --province ... --score 可查)");
  }
  if (input.score && rules.reform?.includes("首届")) {
    caveats.push(`${input.province} 是新高考首届，历史数据参考价值低 — 建议放宽稳保比例`);
  }

  return {
    query: {
      province: input.province,
      score: input.score,
      rank: input.rank ?? null,
      subjects: input.subjects,
    },
    province_rules: rules,
    buckets: {
      "冲": enrichedChong,
      "稳": enrichedWen,
      "保": enrichedBao,
    },
    paths_summary: {
      total_eligible: pathsResult.total_eligible,
      by_category,
      top_eligible,
    },
    caveats,
  };
}

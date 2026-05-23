// find — search for a major keyword across schools in a province for a given year.
// Concurrent fetches against schoolspecialplan endpoint.
import { loadIndex, filterIndex, type IndexFilter, type SchoolRow } from "./index-loader.js";
import { getAdmissionPlan, type AdmissionPlanItem } from "./gaokao-cn.js";
import { PROVINCES, TRACK_NAMES, type ProvinceId } from "./codes.js";

export type FindInput = {
  keyword: string;
  provinceId: ProvinceId;
  year: number;
  filter?: IndexFilter;
  limit?: number;
  concurrency?: number;
};

export type FindHit = {
  schoolId: number;
  zsCode: string;
  schoolName: string;
  schoolCity: string;
  is985: boolean;
  is211: boolean;
  dualClass: string;
  spcode: string;
  spname: string;
  sp_name: string;
  num: number;
  tuition: string;
  length: string;
  batch: string;
  track: string;
  xuanke: { first: string | null; reselect: string | null; raw: string | null };
  category: string;
  info: string | null;
};

export type FindOutput = {
  query: {
    keyword: string;
    province: { id: ProvinceId; name: string };
    year: number;
    filter?: IndexFilter;
  };
  schoolsScanned: number;
  hits: FindHit[];
};

function matchItem(item: AdmissionPlanItem, keyword: string): boolean {
  const k = keyword.toLowerCase();
  return (
    item.sp_name?.toLowerCase().includes(k) ||
    item.spname?.toLowerCase().includes(k) ||
    item.level3_name?.toLowerCase().includes(k) ||
    item.spcode?.toLowerCase().includes(k) ||
    false
  );
}

function toHit(row: SchoolRow, item: AdmissionPlanItem): FindHit {
  return {
    schoolId: row.gaokao_cn_id,
    zsCode: row.zs_code,
    schoolName: row.name,
    schoolCity: row.city,
    is985: row.f985,
    is211: row.f211,
    dualClass: row.dual_class,
    spcode: item.spcode,
    spname: item.spname,
    sp_name: item.sp_name,
    num: item.num,
    tuition: item.tuition,
    length: item.length,
    batch: item.local_batch_name,
    track: TRACK_NAMES[item.type] ?? item.type,
    xuanke: {
      first: item.sp_fxk || item.sg_fxk || null,
      reselect: item.sp_sxk || item.sg_sxk || null,
      raw: item.sp_xuanke || item.sg_xuanke || null
    },
    category: `${item.level2_name} · ${item.level3_name}`,
    info: item.info || item.remark || null
  };
}

export async function find(input: FindInput): Promise<FindOutput> {
  const index = loadIndex();
  let rows = index.rows;
  if (input.filter) {
    rows = filterIndex({ generated_at: index.generated_at, rows }, input.filter);
  }
  // Only consider schools known to recruit in the target province (have pro_type_min entry).
  rows = rows.filter((r) => Array.isArray(r.pro_type_min?.[String(input.provinceId)]));

  const concurrency = input.concurrency ?? 12;
  const hits: FindHit[] = [];
  let cursor = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (cursor < rows.length) {
      const row = rows[cursor++];
      if (!row) break;
      try {
        const plan = await getAdmissionPlan(row.gaokao_cn_id, input.year, input.provinceId);
        for (const item of plan) {
          if (matchItem(item, input.keyword)) hits.push(toHit(row, item));
        }
      } catch {
        // skip on error
      }
    }
  });
  await Promise.all(workers);

  hits.sort((a, b) => {
    // Prefer 985 > 211 > 双一流 > rest, then by plan count desc.
    const ra = (a.is985 ? 3 : 0) + (a.is211 ? 2 : 0) + (a.dualClass === "双一流" ? 1 : 0);
    const rb = (b.is985 ? 3 : 0) + (b.is211 ? 2 : 0) + (b.dualClass === "双一流" ? 1 : 0);
    if (ra !== rb) return rb - ra;
    return b.num - a.num;
  });

  return {
    query: {
      keyword: input.keyword,
      province: { id: input.provinceId, name: PROVINCES[input.provinceId].name },
      year: input.year,
      filter: input.filter
    },
    schoolsScanned: rows.length,
    hits: input.limit ? hits.slice(0, input.limit) : hits
  };
}

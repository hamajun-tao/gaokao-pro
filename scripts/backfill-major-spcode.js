#!/usr/bin/env node
/**
 * Backfill `spcode` (6-digit 专业代码) into round-1 college-groups files where
 * the original ingestion missed the field. Targets 26 specific schools and
 * only re-touches the original 7 provinces (河南/江苏/广东/湖北/福建/山东/河北).
 *
 * Hard rules:
 *  - NEVER overwrite an existing spcode/code/sp_code/major_code value.
 *  - NEVER add an spcode unless upstream returns an unambiguous match by name
 *    (within the relevant group bucket when possible).
 *  - Leave non-matching majors untouched (honest about gaps).
 *  - Also inject `tuition` and `info_short` when upstream has them and the
 *    existing major object doesn't.
 *  - Preserve every other existing field (name, plan, min_score, group shape).
 *  - Touch only the 26 target school files.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'cli/data/college-groups');

// Resolved via cli/data/school-index.json.gz (gaokao_cn_id field).
// nudt deliberately null — 国防科技大学 isn't in the gaokao.cn school index.
const SCHOOL_IDS = {
  bit: 143, bjtu: 38, bjut: 30, bsu: 866, buaa: 47, bucm: 49, buct: 556,
  bupt: 48, chd: 36, cqu: 119, cuc: 558, cufe: 566, cupl: 569, ecnu: 131,
  fzu: 103, henu: 459, hrbeu: 124, nudt: null, pku: 31, shu: 76, swu: 934,
  tju: 60, tsinghua: 140, ustb: 144, ysu: 599, zju: 114,
};

// Round-1 original 7 provinces.
const TARGET_PROVINCE_NAMES = ['河南', '江苏', '广东', '湖北', '福建', '山东', '河北'];
const NAME_TO_PID = {
  '河南': 41, '江苏': 32, '广东': 44, '湖北': 42, '福建': 35, '山东': 37, '河北': 13,
};
const PID_TO_NAME = Object.fromEntries(Object.entries(NAME_TO_PID).map(([k, v]) => [v, k]));
const SLUG_TO_NAME = {
  henan: '河南', jiangsu: '江苏', guangdong: '广东', hubei: '湖北',
  fujian: '福建', shandong: '山东', hebei: '河北',
};

// Province field accessors must cope with three storage shapes:
//   1. array<{prov|province|province_name, prov_id, groups[]}>
//   2. object keyed by Chinese name (河南 → {groups})
//   3. object keyed by numeric pid ("41" → {groups})
//   4. object keyed by pinyin slug (henan → {groups})
//   5. object keyed by ARRAY INDEX (0..30) with the province field inside (cufe/ecnu/pku)
// In every shape we extract: container ref + canonical Chinese name + groups ref.

function provinceCnFromContainer(p, key) {
  if (!p || typeof p !== 'object') return null;
  for (const k of ['province_cn', 'province_name', 'province', 'prov', 'name']) {
    const v = p[k];
    if (typeof v === 'string' && /[一-鿿]/.test(v)) return v;
  }
  if (typeof key === 'string') {
    if (/[一-鿿]/.test(key)) return key;
    if (SLUG_TO_NAME[key.toLowerCase()]) return SLUG_TO_NAME[key.toLowerCase()];
    if (/^\d+$/.test(key) && PID_TO_NAME[Number(key)]) return PID_TO_NAME[Number(key)];
  }
  // some files store pid in a field
  for (const k of ['prov_id', 'province_id', 'provinceId']) {
    const v = p[k];
    if (v != null && PID_TO_NAME[Number(v)]) return PID_TO_NAME[Number(v)];
  }
  return null;
}

function getTargetProvinces(d) {
  const out = [];
  const raw = d.provinces;
  if (Array.isArray(raw)) {
    for (let i = 0; i < raw.length; i++) {
      const cn = provinceCnFromContainer(raw[i]);
      if (cn && TARGET_PROVINCE_NAMES.includes(cn)) {
        out.push({ cn, container: raw[i], key: i });
      }
    }
  } else if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw)) {
      const cn = provinceCnFromContainer(v, k);
      if (cn && TARGET_PROVINCE_NAMES.includes(cn)) {
        out.push({ cn, container: v, key: k });
      }
    }
  }
  return out;
}

function fetchJson(url) {
  try {
    const out = execFileSync('curl', [
      '-s', '--max-time', '25',
      '-H', 'Referer: https://www.gaokao.cn/',
      '-H', 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      url,
    ], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    if (!out || !out.trim()) return { error: 'empty' };
    if (out.startsWith('<')) return { error: 'html' };
    try { return JSON.parse(out); } catch (e) { return { error: 'parse', body: out.slice(0, 200) }; }
  } catch (e) {
    return { error: 'curl', msg: String(e.message).slice(0, 200) };
  }
}

function extractItems(resp) {
  if (!resp || !resp.data) return [];
  const items = [];
  if (Array.isArray(resp.data)) {
    for (const sub of resp.data) {
      if (sub && Array.isArray(sub.item)) items.push(...sub.item);
    }
  } else if (typeof resp.data === 'object') {
    for (const [, sub] of Object.entries(resp.data)) {
      if (sub && Array.isArray(sub.item)) items.push(...sub.item);
    }
  }
  return items;
}

function norm(s) {
  if (s == null) return '';
  return String(s).trim().replace(/\s+/g, '').replace(/[（）()]/g, '');
}

// Strip the trailing parenthetical detail (e.g. "（含...）") that gaokao.cn often
// concatenates onto sp_name in `spname`. The bare sp_name is the lookup key.
function bareName(s) {
  if (s == null) return '';
  let v = String(s).trim();
  v = v.replace(/[（(].*$/, '');
  return v.replace(/\s+/g, '').replace(/[（）()]/g, '');
}

// Returns map keyed by bare name → array of upstream items.
function buildNameLookup(items) {
  const m = new Map();
  for (const it of items) {
    const keys = new Set();
    if (it.sp_name) keys.add(norm(it.sp_name));
    if (it.spname) {
      keys.add(norm(it.spname));
      keys.add(bareName(it.spname));
    }
    for (const k of keys) {
      if (!k) continue;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(it);
    }
  }
  return m;
}

// Within a group bucket (matched by special_group / sg_name / group_code), narrow
// further. group_code may be e.g. "01" / "101" / "第101组" / "（101）".
function normalizeGroupKey(s) {
  if (s == null) return null;
  let v = String(s).trim();
  v = v.replace(/^第/, '').replace(/组$/, '');
  v = v.replace(/[（）()]/g, '');
  v = v.replace(/^0+/, '') || '0';
  return v;
}

function getGroupKeys(g) {
  const keys = new Set();
  for (const k of ['special_group_id', 'special_group', 'group_id', 'group_code', 'group', 'sg_name']) {
    const v = g?.[k];
    if (v != null && v !== '') {
      const nk = normalizeGroupKey(v);
      if (nk) keys.add(nk);
    }
  }
  return keys;
}

function getUpstreamGroupKeys(it) {
  const keys = new Set();
  for (const k of ['special_group', 'sg_name']) {
    const v = it?.[k];
    if (v != null && v !== '') {
      const nk = normalizeGroupKey(v);
      if (nk) keys.add(nk);
    }
  }
  return keys;
}

function getMajorList(g) {
  if (Array.isArray(g?.majors)) return { arr: g.majors, key: 'majors' };
  if (Array.isArray(g?.items)) return { arr: g.items, key: 'items' };
  return null;
}

// Detect existing spcode-equivalent on a major object.
const MAJOR_CODE_KEYS = ['spcode', 'code', 'sp_code', 'major_code', 'spname_code', 'zycode', 'zy_code', 'majorcode'];
function existingMajorCode(m) {
  if (!m || typeof m !== 'object') return null;
  for (const k of MAJOR_CODE_KEYS) {
    const v = m[k];
    if (typeof v === 'string' && v.length) return v;
    if (typeof v === 'number') return String(v);
  }
  return null;
}

function existingMajorName(m) {
  if (m == null) return null;
  if (typeof m === 'string') return m;
  if (typeof m !== 'object') return null;
  for (const k of ['name', 'sp_name', 'spname', 'full_name', 'spname_full', 'name_in_plan', 'short']) {
    const v = m[k];
    if (typeof v === 'string' && v.length) return v;
  }
  return null;
}

// Pick an upstream item from a candidate list, scoping by group keys when given.
function pickUpstream(candidates, groupKeys) {
  if (!candidates || !candidates.length) return null;
  if (groupKeys && groupKeys.size) {
    const scoped = candidates.filter(it => {
      const uk = getUpstreamGroupKeys(it);
      for (const k of uk) if (groupKeys.has(k)) return true;
      return false;
    });
    if (scoped.length === 1) return scoped[0];
    if (scoped.length > 1) {
      // multiple matches inside the group — only safe if spcode agrees
      const codes = new Set(scoped.map(it => it.spcode).filter(Boolean));
      if (codes.size === 1) return scoped[0];
      return null;
    }
  }
  // No group scope, or scoped narrowing failed → only safe when all candidates
  // share the same spcode.
  const codes = new Set(candidates.map(it => it.spcode).filter(Boolean));
  if (codes.size === 1) return candidates[0];
  return null;
}

function injectIntoMajor(major, upstream, isStringForm, fieldsAdded) {
  // upstream fields of interest
  const spcode = upstream.spcode;
  const tuition = upstream.tuition;
  const info_short = upstream.info ?? upstream.info_short;

  // string-form major: convert into an object using `name` as the canonical key,
  // since this file shape didn't have any extra per-major fields.
  if (isStringForm) {
    const obj = { name: major, spcode: spcode == null ? null : String(spcode) };
    if (tuition != null && tuition !== '' && tuition !== '-') obj.tuition = String(tuition);
    if (info_short != null && info_short !== '' && info_short !== '-') obj.info_short = String(info_short);
    if (spcode != null) fieldsAdded.spcode++;
    if (obj.tuition) fieldsAdded.tuition++;
    if (obj.info_short) fieldsAdded.info_short++;
    return obj;
  }

  // object-form: only add missing keys; never overwrite.
  if (spcode != null && existingMajorCode(major) == null) {
    major.spcode = String(spcode);
    fieldsAdded.spcode++;
  }
  if (tuition != null && tuition !== '' && tuition !== '-' && major.tuition == null) {
    major.tuition = String(tuition);
    fieldsAdded.tuition++;
  }
  if (info_short != null && info_short !== '' && info_short !== '-' && major.info_short == null) {
    major.info_short = String(info_short);
    fieldsAdded.info_short++;
  }
  return major;
}

async function processSchool(slug) {
  const fp = path.join(DATA_DIR, `${slug}-2025.json`);
  if (!fs.existsSync(fp)) return { slug, error: 'no_file' };

  const schoolId = SCHOOL_IDS[slug];
  if (!schoolId) return { slug, error: 'no_school_id' };

  const text = fs.readFileSync(fp, 'utf8');
  const data = JSON.parse(text);

  const targetProvs = getTargetProvinces(data);
  if (!targetProvs.length) return { slug, skipped: 'no_target_provs', filled: 0 };

  const fieldsAdded = { spcode: 0, tuition: 0, info_short: 0 };
  const provincesTouched = [];
  const unmatchedSamples = [];
  const fetchedProvs = [];

  for (const prov of targetProvs) {
    const groups = prov.container.groups;
    if (!Array.isArray(groups) || !groups.length) continue;

    // Count majors lacking code first; skip the whole province if zero.
    let lacking = 0, totalForProv = 0;
    for (const g of groups) {
      const ml = getMajorList(g);
      if (!ml) continue;
      for (const m of ml.arr) {
        totalForProv++;
        if (typeof m === 'string') lacking++;
        else if (existingMajorCode(m) == null) lacking++;
      }
    }
    if (lacking === 0) continue;

    const pid = NAME_TO_PID[prov.cn];
    const url = `https://static-data.gaokao.cn/www/2.0/schoolspecialplan/${schoolId}/2025/${pid}.json`;
    const resp = fetchJson(url);
    fetchedProvs.push(`${prov.cn}(${pid})`);
    if (resp.error || resp.code !== '0000') {
      provincesTouched.push(`${prov.cn}:FETCH_FAIL(${resp.error || resp.code})`);
      continue;
    }
    const items = extractItems(resp);
    if (!items.length) {
      provincesTouched.push(`${prov.cn}:EMPTY`);
      continue;
    }
    const nameMap = buildNameLookup(items);

    let provFilled = 0, provAttempted = 0;
    for (const g of groups) {
      const ml = getMajorList(g);
      if (!ml) continue;
      const groupKeys = getGroupKeys(g);
      for (let i = 0; i < ml.arr.length; i++) {
        const m = ml.arr[i];
        const isStr = typeof m === 'string';
        if (!isStr && existingMajorCode(m) != null) continue;
        const name = existingMajorName(m);
        if (!name) continue;
        provAttempted++;
        const k = norm(name);
        let candidates = nameMap.get(k);
        if (!candidates) candidates = nameMap.get(bareName(name));
        if (!candidates || !candidates.length) {
          if (unmatchedSamples.length < 5) unmatchedSamples.push(`${prov.cn}/${name}`);
          continue;
        }
        const picked = pickUpstream(candidates, groupKeys);
        if (!picked) {
          if (unmatchedSamples.length < 5) unmatchedSamples.push(`${prov.cn}/${name}[ambig]`);
          continue;
        }
        const before = fieldsAdded.spcode;
        const replaced = injectIntoMajor(m, picked, isStr, fieldsAdded);
        if (isStr) ml.arr[i] = replaced;
        if (fieldsAdded.spcode > before) provFilled++;
      }
    }
    provincesTouched.push(`${prov.cn}:${provFilled}/${provAttempted}`);
  }

  if (fieldsAdded.spcode === 0 && fieldsAdded.tuition === 0 && fieldsAdded.info_short === 0) {
    return { slug, schoolId, skipped: 'no_additions', filled: 0, provincesTouched, unmatchedSamples };
  }

  // Append _notes line — additive, do not clobber prior notes.
  const prov_cn_list = provincesTouched
    .filter(s => /^[一-鿿]+:\d+\/\d+$/.test(s) && !s.endsWith(':0/0'))
    .map(s => s.split(':')[0]);
  if (prov_cn_list.length) {
    const note = `round-15 backfilled spcode for ${slug}: ${prov_cn_list.join('/')}`;
    if (data._notes == null) data._notes = note;
    else if (typeof data._notes === 'string') data._notes = data._notes + ' | ' + note;
    else if (Array.isArray(data._notes)) data._notes.push(note);
  }

  // Preserve indentation style.
  const indentMatch = text.match(/\n( +)"/);
  const indent = indentMatch ? indentMatch[1].length : 2;
  const endsWithNewline = text.endsWith('\n');
  fs.writeFileSync(fp, JSON.stringify(data, null, indent) + (endsWithNewline ? '\n' : ''));

  return { slug, schoolId, filled: fieldsAdded.spcode, fieldsAdded, provincesTouched, unmatchedSamples };
}

(async () => {
  const slugs = Object.keys(SCHOOL_IDS);
  const args = process.argv.slice(2);
  let only = null;
  if (args[0] === '--only' && args[1]) only = args[1].split(',');

  const results = [];
  for (const slug of slugs) {
    if (only && !only.includes(slug)) continue;
    try {
      const r = await processSchool(slug);
      results.push(r);
      const parts = [
        `[${slug}]`,
        `schoolId=${r.schoolId || 'NONE'}`,
        r.error ? `ERROR=${r.error}` : '',
        r.skipped ? `SKIP=${r.skipped}` : '',
        r.filled != null ? `spcode+=${r.filled}` : '',
        r.fieldsAdded ? `tuition+=${r.fieldsAdded.tuition},info_short+=${r.fieldsAdded.info_short}` : '',
        r.provincesTouched && r.provincesTouched.length ? `prov=${r.provincesTouched.join(' ')}` : '',
        r.unmatchedSamples && r.unmatchedSamples.length ? `unmatched=${r.unmatchedSamples.join(';')}` : '',
      ].filter(Boolean);
      console.log(parts.join(' '));
    } catch (e) {
      console.error(`[${slug}] EXCEPTION ${e.stack || e.message}`);
    }
  }

  console.log('---');
  const totalSpcode = results.reduce((s, r) => s + (r.filled || 0), 0);
  const totalTuition = results.reduce((s, r) => s + (r.fieldsAdded?.tuition || 0), 0);
  const totalInfo = results.reduce((s, r) => s + (r.fieldsAdded?.info_short || 0), 0);
  console.log(`TOTAL spcode injected: ${totalSpcode}, tuition: ${totalTuition}, info_short: ${totalInfo}`);
})();

# gaokao-pro coverage report — 100-agent stress test

Generated 2026-05-25. 100 simulated candidates across all 31 provinces, score
bands 420–690, all major reform regimes (3+1+2 / 3+3 / 老高考 / 新高考首届),
all major fields (CS/AI / 医学 / 法学 / 师范 / 经管 / 工程 / 农林 / 艺术 /
军警 / 民族班). Each agent (1) roleplayed a realistic profile, (2) raised
3–5 questions a real parent/student would ask, (3) self-validated whether
gaokao-pro can answer those questions.

This is the **honest map of what we cover well, what we cover partially,
and what we don't cover at all**.

## Province coverage heatmap

| Province | 一分一段 | 招生计划 / 历年分 | tiqian / 专项 | 综评/强基 | Overall |
|---|---|---|---|---|---|
| 北京 | ✅ 23/24/25 综合 | ✅ | 🟡 partial | ✅ | 🟢 strongest |
| 河南 文科 | ✅ 2024 (258 rows OCR) | ✅ | 🟡 国家专项 listed | 🟡 强基39校 only | 🟡 partial |
| 河南 物理类 | ❌ PDF 锁死 | ✅ | 🟡 | 🟡 | 🔴 **critical gap** |
| 湖南 历史 | ✅ 2024 (53 rows) | ✅ | ✅ verified | 🟡 | 🟢 |
| 湖南 物理 | ❌ | ✅ | ✅ | 🟡 | 🟡 |
| 山东 | ❌ Excel-only | ✅ | 🟡 partial | ✅ 综评 list | 🟡 |
| 广东 | ❌ image | ✅ | 🟡 partial | ✅ 中山/华工 综评 | 🟡 |
| 江苏 | ❌ JPG image | ✅ | 🟡 国家专项 | ✅ 综评 list | 🟡 |
| 浙江 | ❌ PDF | ✅ | ✅ verified (三位一体) | ✅ list | 🟢 |
| 上海 | ❌ 高分段不公布 | ✅ | 🟡 | ✅ 综评 list | 🟡 |
| 天津 | ❌ timeout | ✅ | ✅ verified | 🟡 | 🟢 |
| 河北 / 湖北 / 福建 / 江西 / 安徽 (新高考省) | ❌ | ✅ | 🟡 | 🟡 | 🟡 |
| 四川 / 陕西 / 山西 / 云南 / 甘肃 (新高考首届) | ❌ | ✅ | 🟡 | 🟡 | 🟡 |
| 重庆 / 辽宁 / 吉林 / 黑龙江 | ❌ | ✅ | 🟡 | 🟡 | 🟡 |
| 广西 / 贵州 / 海南 | ❌ | ✅ | 🟡 | 🟡 | 🟡 |
| 内蒙古 / 新疆 / 青海 / 宁夏 / 西藏 (民族区) | ❌ | ✅ | 🟡 | 🟡 民族班 raw note only | 🔴 |

**Read**: 招生计划 (`plan` verb) + 历年最低分 (`scores` verb) work everywhere
via gaokao.cn upstream. Everything else degrades to partial-or-missing
outside Beijing/天津/浙江/湖南.

## Top recurring gaps (cited by 5+ agents)

Sorted by frequency. Each gap maps to a concrete dataset or verb we'd need
to add.

### Tier 1 — 阻塞核心功能

1. **省级一分一段表** (30+ agents). Without it, `recommend` ranks by raw
   score across years — accurate within a year, noisy across. Tooling
   ready (`cli/data/yifenyiduan/_ocr-pipeline/extract-pdf.py`); 28 provinces
   left to ingest (河南理科 priority — largest candidate pool).

2. **省份新高考首届赋分位次**. 四川/陕西/山西/云南/甘肃 all moved to 3+1+2
   in 2025; 2026 students have NO 历年位次 reference. Need explicit
   "new-reform province" handling in `recommend` (don't extrapolate old-track
   data forward).

3. **校内专业组录取分差 / 大类招生分流规则**. We surface (school, year,
   province) min via `actual` but no school-internal专业组 ranking +
   "工科试验班 → 计算机 vs 自动化" 分流 weights. Cited by every high-score
   candidate. Need: `division` verb returning per-major min in a 大类.

### Tier 2 — 显著影响决策

4. **强基/综评校测内容 + 历年校测线**. We have 39 强基校 list with URLs but
   not校测题型/历年通过率. Without it, "能不能冲清北强基" only get half answer.

5. **公费师范生协议条款** (服务期/履约地/违约金/可考研规则). Cited every
   师范-bound candidate (河南/山东/河北/重庆/陕西/贵州/广西/云南/江西/吉林).

6. **国家/高校/地方专项 资格认定细节**. We list 实施区/95校 but not the
   "户籍 3 年 + 学籍 3 年" verification flow + which counties require
   省考试院 face-to-face review. Cited by all 农村专项 candidates.

7. **民族班 / 预科班 转段规则**. Listed in 81-school adapters as boolean
   but no detail on "1 年预科后如何分流" / "民族班毕业证是否与普通班一致".
   Cited by every minority candidate (藏族/蒙古族/维吾尔族/彝族/壮族).

8. **海南 900-标准分换算公式**. We documented the formula in
   `cli/src/provinces/guangdong.ts` (wrong file but right formula). Need
   first-class haynan-score-conversion helper.

9. **保研率 / 就业率 / 平均起薪**. 100-agent dataset is half-empty; some
   schools have it (清华 76% 保研, 浙大 40%) but most are null. Cited as
   "really decides whether 985 is worth it" by 30+ agents.

### Tier 3 — 重要但非阻塞

10. **军校政审/体测合格线**. We have 军警校 list but no body-condition
    cutoffs (BMI / 1000m time / 视力).
11. **小语种 提前批口试 / 单科分要求**. Listed as supported subjects only.
12. **公安院校入警率 + 警种分布**.
13. **专业百科** (海洋科学 vs 海洋技术 vs 海洋资源与环境). No 专业-level
    description database.
14. **校友会/软科/QS/USNews 排名映射 + 学科评估第五轮**. Have raw fields
    in info.json + xueke-pinggu-disculun.json (16 校 disclosed) but no
    `rank-school` verb.
15. **中外合作办学 学位认可度** (能否考公/保研/留学). Have program list
    (30+ programs) but no policy-level disclaimer.
16. **本科生进实验室机会 / 转专业难度 / 大一分流**. Tier 1 校全部 mentioned.
17. **同档校横向比较 verb** (e.g. 复旦 vs 上交 经济 学院). `school` returns
    one school; no `compare` verb.
18. **内蒙古"动态排名"实时填报机制**. Documented in 50-agent scan but no
    runtime support.

## Verbs the agents implicitly wanted but we don't have

| Verb hypothesis | What it'd do | Why |
|---|---|---|
| `compare <schoolA> <schoolB>` | side-by-side at major / score / 学科评估 / 排名 / 保研 / 就业 | 18 agents drafted "vs" questions |
| `gongfei <province>` | 公费师范生 校 list + 协议条款 + 履约地 | 8 师范 candidates |
| `zhuanxiang-eligibility <profile>` | check if profile qualifies for 国家/高校/地方专项 | 6 农村 candidates |
| `policy <topic>` | 民族班 / 预科班 / 中外合作 / 大类分流 / 转专业 policy lookup | 12 candidates |
| `division <schoolId> <category>` | 大类内专业分流规则 + 历年绩点门槛 | 9 agents |
| `qianbang <schoolId>` | 强基校测题型 + 历年通过率 + 复活赛规则 | 4 agents |
| `tiyu <profile>` | 体检受限 + 单科分 + 政审 综合可报池 | 8 体检/政审 candidates |
| `paiming <schoolId>` | 软科+QS+USNews+校友会+学科评估 五项汇总 | 22 agents |

## What works really well

The agents converged on these as **reliably useful**:
- `recommend` + `top` for first-cut scoring (within a single year)
- `find` for major keyword search
- `school` for one-school metadata + 排名
- `plan` for "学校 X 在省 Y 年 Z 招什么"
- `actual` for "去年录取的位次"
- `adapter` for "学校 X 的招生网 URL + 强基/综评/中外/专项 是否提供"
- `program qiangji` / `program zhongwai_hezuo` for cross-school filtering
- `tiqian zhejiang` / `tiqian all` for province specialty + cross-province 专项 lookup

## Recommended next sprint

Priority-ranked, with effort estimate:

1. **OCR 河南/山东/广东/四川 物理类 一分一段** (1-2 days). Largest population
   leverage. Pipeline already built.
2. **`compare <a> <b>` verb** (4 hours). Pure local logic against existing
   index. High recurrence in 100-agent ask.
3. **`paiming <schoolId>` ranking aggregation verb** (3 hours). All data
   already in `school` output, just needs a focused presentation.
4. **`gongfei` + `zhuanxiang-eligibility` verbs** (1 day each). New JSON
   datasets to assemble + thin verb wrappers.
5. **校内大类分流 dataset 扩展** to 20 校 (1 day).
6. **新高考首届省份赋分位次警告 in `recommend`** (2 hours). Add a banner
   when target province × year falls in the 4 newly-reformed provinces.

These 6 items would bring the 31-province coverage from 4-green / 20-yellow
/ 7-red to roughly 15-green / 12-yellow / 4-red.

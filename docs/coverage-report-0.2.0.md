# gaokao-pro coverage report — 0.2.0

Generated 2026-05-29. Reflects state after 12 iterations of expansion
beyond the 2026-05-25 100-agent stress test baseline (`coverage-report-100agents.md`).

This report covers what 0.2.0 ships:
- 12 new verbs (slip-risk, paths, dossier, roadmap, province-overview,
  calendar, huadang, xiaoce, tiqian-pi, zongping, gaoshui-sport, capabilities)
- 7 new datasets (xiaoce, gaoshui-2025, zonghepingjia-2026, tiqian-pi,
  huadang, calendar, college-groups massive expansion)
- MCP tool count 25 → 37

## Province coverage (after 0.2.0)

| Province | 一分一段 | 招生计划 / 历年分 | 滑档rules | 时间日历 | 提前批 | 综评 | 历史案例 | college-groups | Overall |
|---|---|---|---|---|---|---|---|---|---|
| 北京 | ✅ 23/24/25 | ✅ | ✅ rules + footer | ✅ tentative | ✅ 89 项 | ✅ 12 校 | ✅ 3 案例 | ~80 校 | 🟢 strongest |
| 河南 文科 | ✅ 2024 OCR | ✅ | ✅ rules + footer | ✅ tentative | ✅ 98 项 | ✅ 7 校 | ✅ 6 案例 | ~250 校 | 🟢 strongest |
| 河南 物理类 | ❌ PDF 锁死 | ✅ | ✅ rules + footer | ✅ tentative | ✅ 98 项 | ✅ 7 校 | ✅ 6 案例 | ~250 校 | 🟡 一分一段缺 |
| 湖南 | ✅ 2024 verified | ✅ | ✅ rules + footer | ✅ tentative | ✅ 90+ 项 | ✅ 7 校 | ✅ 3 案例 | ~70 校 | 🟢 strongest |
| 山东 | ❌ Excel-only | ✅ | ✅ rules + footer | ✅ tentative | ✅ 95+ 项 | ✅ 11 校 | ✅ 6 案例 | ~250 校 | 🟢 |
| 广东 | ❌ image | ✅ | ✅ rules + footer | ✅ tentative | ✅ 95+ 项 | ✅ 13 校 | ✅ 5 案例 | ~250 校 | 🟢 |
| 江苏 | ❌ JPG image | ✅ | ✅ rules + footer | ✅ tentative | ✅ 90+ 项 | ✅ 9 校 | ✅ 4 案例 | ~250 校 | 🟢 |
| 浙江 | ❌ PDF | ✅ | ✅ rules + footer + 无调剂警告 | ✅ tentative | ✅ 90+ 项 | ✅ 浙大三位一体 + 综评 校 | ✅ 4 案例 | ~70 校 | 🟢 |
| 上海 | ❌ 高分段不公布 | ✅ | ✅ rules + footer | ✅ **confirmed 2026** | ✅ 80+ 项 | ✅ 12 校 (沪综评 集中) | ✅ 2 案例 | ~70 校 | 🟢 |
| 天津 | ❌ timeout | ✅ | ✅ rules + footer | ✅ tentative | ✅ 80+ 项 | ✅ | ✅ 2 案例 | ~70 校 | 🟢 |
| 河北 | ❌ | ✅ | ✅ rules + footer + 无调剂警告 | ✅ tentative | ✅ 85+ 项 | ✅ | ✅ 3 案例 | ~250 校 | 🟢 |
| 湖北 / 福建 / 江西 / 安徽 | ❌ | ✅ | ✅ rules + footer | ✅ tentative | ✅ 80+ 项 each | ✅ | ✅ 2-3 案例 each | ~250 校 | 🟢 |
| 四川 / 陕西 / 山西 / 云南 / 甘肃 (新高考首届) | ❌ | ✅ | ✅ rules + footer + 首届警告 | ✅ tentative | ✅ 80+ 项 each | ✅ | ✅ 2 案例 each | ~70 校 | 🟢 |
| 重庆 / 辽宁 / 吉林 / 黑龙江 | ❌ | ✅ | ✅ rules + footer | ✅ tentative | ✅ 80+ 项 each | ✅ | ✅ 2 案例 each | ~70 校 | 🟢 |
| 广西 / 贵州 / 海南 | ❌ | ✅ | ✅ rules + footer | ✅ **广西 + 贵州 confirmed 2026** | ✅ 80+ 项 each | ✅ | ✅ 2 案例 each | ~70 校 | 🟢 |
| 内蒙古 / 新疆 / 青海 / 宁夏 / 西藏 (民族区) | ❌ | ✅ | ✅ rules + footer | ✅ **青海 confirmed 2026**; rest tentative | ✅ 80+ 项 each | ✅ 民族班 显示 | ✅ 2 案例 each | ~60-100 校 | 🟢 |

**Read**: 招生计划 + 历年分 + 调剂rules + calendar + 提前批 + 综评 + huadang + groups
覆盖 **all 31 provinces**. The remaining gap is just 一分一段
(some provinces' raw rank tables haven't been OCR'd).

## Top recurring gaps from the 2026-05-25 report — addressed?

The old report had 18 ranked gaps. Status:

### Tier 1 — was blocking core functionality

1. **省级一分一段表** — partial. 28 → 12 provinces still missing. Stale.
2. **省份新高考首届赋分位次** — handled via `province-overview` + `roadmap`
   surfacing 首届 caveat.
3. **校内专业组录取分差** — **handled by `slip-risk`**.

### Tier 2 — was 显著影响决策

4. **强基/综评校测内容 + 历年校测线** — **handled by `xiaoce` (80 schools)**.
5. **公费师范生协议条款** — **handled by `tiqian-pi` 公费师范生 6 校 + 优师 19 校**.
6. **国家/高校/地方专项 资格认定细节** — **handled by `tiqian-pi` 国家专项 + 高校专项 5 校** (清华/北大/复旦/上交/南大 detailed).
7. **民族班 / 预科班 转段规则** — **handled by `tiqian-pi` 民族班 + 预科班 entries**.
8. **海南 900-标准分换算公式** — still in 广东 file; not separated.
9. **保研率 / 就业率 / 平均起薪** — partial (`employment-2024.json` has 15 985校; not expanded).

### Tier 3 — was 重要但非阻塞

10. **军校政审/体测合格线** — partial (`tiqian-pi` 军校 27 校 with eligibility text, but no precise tier cutoffs).
11. **小语种 提前批口试** — **handled by `tiqian-pi` 小语种 entry**.
12. **公安院校入警率** — partial (16 公安院校 in `tiqian-pi` with eligibility).
13. **专业百科** — NOT handled.
14. **校友会/软科/QS/USNews 排名映射** — partial (`paiming` verb).
15. **中外合作办学 学位认可度** — partial (`tiqian-pi` 中外合作综评 6 校 with commitment).
16. **本科生进实验室机会 / 转专业难度** — NOT handled.
17. **同档校横向比较 verb** — **handled by existing `compare` verb**.
18. **内蒙古"动态排名"实时填报机制** — **handled by `zhiyuan-rules-2026.json`** entry (`vs_2024: 动态投档已废止改平行志愿`) + huadang case `case-040` documenting parents who got burned by old experience.

## New capabilities not in the old report

- **Composite verbs** (`paths`, `dossier`, `roadmap`, `province-overview`)
  collapse 6-7 individual lookups into one call.
- **slip-risk** computes verdicts (high/moderate/low/comfortable) with
  per-case 历史 precedents auto-attached.
- **calendar** answers "when does each batch close" for parents managing
  deadlines.
- **gaoshui-sport** indexes 11 swim schools + 24 basketball + 29 track +
  smaller-sport schools, with post-2024 reform's A (本科线+校测) / B
  (健将+单考) paths.
- **capabilities** enables Claude (or any MCP client) to discover what's
  loadable before calling specific verbs.

## What 0.2.0 still lacks

- 一分一段 for 12+ provinces (data-source bottleneck)
- Per-major min_score backfill (currently 0%; gaokao.cn doesn't expose it
  consistently)
- 保研/出国/薪资 expansion past first 15 985 schools
- 强基 校测真题 / 通过率 (publicly unavailable for most schools)
- 港校 detailed入学要求 (HK-specific data)

These are publishing-side gaps, not tooling gaps.

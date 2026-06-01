# gaokao-pro 分省真实性校验报告

**日期**: 2026-05-31 · **方法**: 31 省 × 3 subagent（流程·赋分 / 特殊招生 / 数据源核对），共 93 个 agent，对抗式联网核查 + 数据源一致性核对。

## 汇总

| 类别 | 数量 |
|---|---|
| 🔴 error（有权威来源佐证的确定错误） | 66 |
| 🟡 suspect（存疑，待人工核对） | 116 |
| 🔵 info（提示/可改进） | 37 |
| ✅ 已机械确定校验干净 | 一分一段表 108 文件全部通过；school-index↔live API 抽查全部一致 |

> 机械层（一分一段表内部一致性：分数递减 / 累计单调 / 累计=前累计+本段 / 总数对齐）由确定性脚本核验，**108 文件 0 问题**。下列均为手写政策/特殊招生数据的事实核查结果。

图例：sev=严重度，conf=置信度，🔧=被标为可自动修复（high-conf）。

## 北京  （🔴3 🟡2 🔵2）

### 🔴 赋分制等级命名  `conf=high`
- **文件**: `data/datasets/score-system-2025.json → provinces[北京].scaling_formula`
- **定位**: `provinces[北京].scaling_formula`
- **现值**: 5 等 21 级: 1-3% A+, 3-15% A, 15-37% B+, 37-63% B, 63-85% C+, 85-97% C, 97-100% D. 赋分区间 [100,97,94,...,43,40] 每 3 分一级.
- **应为**: 北京实际使用 A1-A5、B1-B5、C1-C5、D1-D5、E 共 5 等 21 级命名体系，最低等级为 E（赋分 40 分），而非 D。数据中 'A+/B+/C+' 符号及 'D 为最低档' 均与官方命名不符。正确结构：A(1-15%)=A1-A5，B≈34%，C≈15%，D=14%，E=剩余最低档（赋分 40）。
- **依据**: https://www.6617.com/p_71291224.html 明确列出北京 5 等子级为 A1-A5/B1-B5/C1-C5/D1-D5/E；https://www.dxsbb.com/news/128161.html 说明 '分为5等21级'，E 为最低等；bjeea.cn 2025 招生规定未使用 A+/B+ 符号。

### 🔴 艺术综合分公式 🔧  `conf=high`
- **文件**: `data/datasets/special-admissions/art-formula-2025.json — region_id=11 全部11条记录 (书法/戏剧影视导演/戏剧影视表演/播音与主持/服装表演/美术与设计/舞蹈/音乐教育-器乐/音乐教育-声乐/音乐表演-器乐/音乐表演-声乐)`
- **定位**: `records[region_id==11].formula.pro_factor`
- **现值**: 2.2
- **应为**: 2.5
- **依据**: bjeea.cn 官方文件《北京市2025年普通高等学校艺术类专业招生工作实施办法》明文：本科综合分＝艺术类统考成绩/300×750×50%＋高考文化课成绩×50%。换算到 schema 定义的公式 综合分 = culture_pct×文化 + pro_pct×pro_factor×统考，pro_factor = 750/300 = 2.5。当前存储 2.2 来自上海（上海高考满分660，660/300=2.2），被错误套用到北京（满分750）。来源：https://www.bjeea.cn/html/gkgz/tzgg/2025/0428/86916.html

### 🔴 民族加分  `conf=high`
- **文件**: `data/datasets/special-admissions/minzu-policy-2025.json — region_id=11`
- **定位**: `records[region_id==11].bonus_tiers`
- **现值**: [] (空数组，notes称"北京本地无地方少数民族加分(京籍少民无加分)")
- **应为**: 应包含一条 bonus_tier：{scope: "从边疆/山区/牧区/少数民族聚居地在高中阶段转学来京的少数民族考生", bonus: 5, scope_universities: "北京市属高等学校"}
- **依据**: bjeea.cn《北京市2025年普通高等学校招生工作规定》及 eol.cn 2025-05-26 报道：从边疆、山区、牧区、少数民族聚居地区在高级中等教育阶段转学到本市就读的少数民族考生，在文化统考成绩总分基础上增加5分，仅适用于北京市属高等学校。data notes 仅说明"京籍少民无加分"，混淆了"本地户籍少民"与"转学来京少民"，导致 bonus_tiers 完全空置。来源：https://www.bjeea.cn/html/gkgz/tzgg/2025/0425/86915.html https://gaokao.eol.cn/bei_jing/dongtai/202505/t20250526_2670881.shtml

### 🟡 赋分制各等级精确比例  `conf=low`
- **文件**: `data/datasets/score-system-2025.json → provinces[北京].scaling_formula`
- **定位**: `provinces[北京].scaling_formula (百分比区间部分)`
- **现值**: 1-3% A+, 3-15% A, 15-37% B+, 37-63% B, 63-85% C+, 85-97% C, 97-100% D（共 7 区段）
- **应为**: 待人工核对。6617.com 列出 A1=1%/A2=2%/A3=3%/A4=4%/A5=5%（A 合计 15%），D 合计 14%；但各二级等级精确累积百分比官方原文未被本次检索完整捕获，须对照北京市教育考试院官方赋分表核实。
- **依据**: https://www.6617.com/p_71291224.html 提供部分子级比例；gaokzx.com 页面因图片无法读取完整表格。未找到完整官方原文列表。

### 🟡 艺术文化控制线  `conf=low`
- **文件**: `data/datasets/special-admissions/art-formula-2025.json — region_id=11, category=戏剧影视表演 and 戏剧影视导演`
- **定位**: `records[region_id==11 && category in ["戏剧影视表演","戏剧影视导演"]].culture_control_line.unified`
- **现值**: 215
- **应为**: 待人工核对（官方公告仅明示"舞蹈类、戏曲类"适用215，表(导)演类分类归属不明）
- **依据**: beijing.gov.cn 2025年分数线发布页明确：艺术类（不含舞蹈类、戏曲类）本科控制线323，舞蹈类/戏曲类215。戏剧影视表演/导演属"表(导)演类"，非传统戏曲，按官方分类应落在323档。2024年同类数据值为217（同属低档），历史一致但未找到直接URL确认215适用于表(导)演类。来源：https://www.beijing.gov.cn/fuwu/bmfw/sy/jrts/202506/t20250626_4126036.html

### 🔵 日历·考试日期  `conf=high`
- **文件**: `data/datasets/zhiyuan-calendar-2026.json → provinces[北京].exam_dates`
- **定位**: `provinces[北京].exam_dates`
- **现值**: 6/7-6/10
- **应为**: 与 2025 年实际一致：统一高考 6/7-6/8，学考等级考 6/9-6/10，共 4 天，标注 tentative=true 合理。
- **依据**: https://www.beijing.gov.cn/fuwu/bmfw/sy/jrts/202504/t20250429_4077345.html 标题明确：'6月7日至10日高考 包括统一高考和学考等级考'

### 🔵 日历·成绩公布日  `conf=high`
- **文件**: `data/datasets/zhiyuan-calendar-2026.json → provinces[北京].score_release`
- **定位**: `provinces[北京].score_release`
- **现值**: 2026/6/25
- **应为**: 与 2025 年实际（6月25日公布）一致，作为 2026 年预估合理，tentative=true 已标注。
- **依据**: https://finance.sina.com.cn/tech/roll/2025-06-14/doc-infaaaui1743980.shtml 及 bjnews.com.cn 均确认 2025 年北京成绩 6 月 25 日发布

## 天津  （🔴2 🟡3 🔵2）

### 🔴 民族加分  `conf=high`
- **文件**: `data/datasets/special-admissions/minzu-policy-2025.json — records[region_id=12]`
- **定位**: `records[0].notes + records[0].bonus_tiers`
- **现值**: notes: '天津本地不享受少数民族加分(2023 起取消);保留烈士子女、退役军人等政策性加分。'; bonus_tiers: []
- **应为**: 保留一个 5 分加分档：对在高中阶段从'四区'（边疆、山区、牧区、少数民族聚居地区）少数民族自治地区转学到天津就读的少数民族考生，在面向本市所属高校投档时加 5 分。notes 中应将'(2023 起取消)'改为'2023 起调整：普通少数民族加分取消，但保留四区转入少数民族考生+5分（仅限本市高校）'；bonus_tiers 应有一条 {points:5, scope:'本市高校', condition:'四区转入少数民族'} 记录。
- **依据**: 天津市教育委员会 2025 年普通高校招生工作规定（via tj.bendibao.com/edu/202542/155353.shtm）第八部分第10条明确：'从四区少数民族自治地区转学到本市就读的少数民族考生，面向本市所属高校投档时在高考成绩总分的基础上增加5分'。另见 jy.tj.gov.cn/ZWGK_52172/zcjd_1/202405/t20240520_6629281.html 的政策解读。

### 🔴 艺术综合分公式-文化控制线 🔧  `conf=high`
- **文件**: `data/datasets/special-admissions/art-formula-2025.json — records[region_id=12, category='戏剧影视表演']`
- **定位**: `records[category='戏剧影视表演'].culture_control_line.unified`
- **现值**: 313
- **应为**: 357。313 分控制线仅适用于舞蹈类、戏曲类；戏剧影视表演属于表（导）演类，适用非舞蹈/戏曲艺术类本科批 357 分控制线。
- **依据**: 天津日报数字报 epaper.tianjinwe.com/tjrb/html/2025-06/24/content_143084_2324791.htm 和 dxsbb.com/news/59490.html 均明确：'艺术类（不含舞蹈类、戏曲类）本科批次357分；艺术类中舞蹈类、戏曲类本科批次313分'。戏剧影视表演不属于舞蹈类或戏曲类。

### 🟡 数据结构缺失字段  `conf=medium`
- **文件**: `zhiyuan-rules-2026.json → provinces[天津].本科批`
- **定位**: `provinces[?(@.province=='天津')].本科批`
- **现值**: 无 unit 字段（其他省如北京、上海、宁夏均有 unit:'院校专业组'）
- **应为**: 待人工核对（官方来源确认天津本科批以院校专业组为单位，日历文件注释亦写'50 院校专业组 × 6 专业'，但 rules 文件本身缺少 unit 字段）
- **依据**: https://www.lezhenedu.com/newsinfo.aspx?id=12450 确认'志愿填报以院校专业组为单位'；https://m.tj.bendibao.com/edu/157465.shtm 同样确认院校专业组+专业模式；其他省份 rules 文件均有 unit 字段

### 🟡 综合评价-招生院校列表  `conf=low`
- **文件**: `data/datasets/special-admissions/zongping-2025.json — records[region_id=12]`
- **定位**: `records[0].composite_formula.extras`
- **现值**: 北外 (50%+30%+20%) / 上科大 / 上纽 / 昆杜 / 深北莫 (南科大不投津)；confidence: low
- **应为**: 待人工核对。在津综评院校名单及南科大不投津的说法未能从权威来源证实，字段 confidence 已标 low，但建议核实 2025 年各校招生简章是否覆盖天津。
- **依据**: 搜索未找到直接列出 2025 年天津综评院校名单的权威页面；南科大 2025 强基/综评在天津的招生状态无法通过搜索证实，仅搜索到南科大在其他 24 省有综评。

### 🟡 强基计划-招生省份覆盖  `conf=low`
- **文件**: `data/datasets/special-admissions/qiangji-quota-2025.json — records[region_id=12]`
- **定位**: `records[0].notes`
- **现值**: notes: '39 校面向天津招生(在津 ~28 所)'；confidence: low；stub 无分校名额/入围线
- **应为**: 待人工核对。39 所总数正确（全国唯一 39 校强基名单已确认），但'在津~28 所'（指在津有校区）的具体数字及各校天津招生计划未能从权威来源核实。该条目本身标注 confidence: low，stub 性质，不构成错误，但需补充实际数据。
- **依据**: 2025 年全国强基计划 39 校名单通过 gankaosheng.com/school/199he0099.html 等多处确认；但在津校区数量约 28 所的说法无独立来源验证。

### 🔵 赋分公式简化  `conf=high`
- **文件**: `score-system-2025.json → provinces[天津].scaling_formula`
- **定位**: `provinces[?(@.province=='天津')].scaling_formula`
- **现值**: 同北京, 5 等 21 级（未列各等级百分比边界）
- **应为**: 5等21级，各级比例：A5(2%)A4(3%)A3(4%)A2(5%)A(6%)/B5-B(各7%)/C5-C(各6%)/D5-D(5%-1%)/E(1%)；起点40分，分差3分，满分100分——与北京完全相同，数据正确但详细度低于北京条目
- **依据**: https://www.gk100.com/read_3540519.htm 和搜索结果均确认天津赋分规则与北京完全一致，5等21级，起点40分，相邻两级分差3分，满分100分

### 🔵 滑档案例-志愿规则自洽性  `conf=high`
- **文件**: `data/datasets/huadang-cases-2022-2025.json — cases[composite-038, case-073]`
- **定位**: `cases[province='天津'].lesson`
- **现值**: 天津 50 + 25（A+B 段）是宽容度高的结构；A 含主流 985/211, B 多是二本
- **应为**: 与真实制度一致，无需修改。
- **依据**: 天津本地宝 tj.bendibao.com/edu/157465.shtm 及 lezhenedu.com/newsinfo.aspx?id=13972 均确认：天津 2025 本科 A 段 50 个平行院校（专业组）志愿、B 段 25 个平行院校（专业组）志愿，与案例描述完全吻合。

## 河北  （🔴4 🟡5 🔵0）

### 🔴 志愿单位 🔧  `conf=high`
- **文件**: `data/datasets/zhiyuan-rules-2026.json → provinces[省=河北].本科批.unit`
- **定位**: `provinces[province=河北].本科批.unit`
- **现值**: 院校专业组
- **应为**: 专业(类)+学校
- **依据**: 2025年河北省普通高考志愿填报须知（腾讯新闻/官方转载）明确：'1个专业（类）+学校为1个志愿'，采用专业（类）+学校平行志愿模式。2026年指南（gk100.com/read_25558459）同样确认延续该模式。'院校专业组'是广东、湖南等省使用的另一种模式，河北从未采用。来源：https://news.qq.com/rain/a/20250617A08XVR00 ; https://www.gk100.com/read_25558459.htm

### 🔴 专业调剂 🔧  `conf=high`
- **文件**: `data/datasets/zhiyuan-rules-2026.json → provinces[省=河北].本科批.调剂`
- **定位**: `provinces[province=河北].本科批.调剂`
- **现值**: true
- **应为**: false
- **依据**: 2025年河北省高考志愿填报须知明确：'专业（类）+学校平行志愿模式不再设专业服从调剂选项'。2026年指南同样确认'无专业调剂选项'。来源：https://news.qq.com/rain/a/20250617A08XVR00 ; https://www.gk100.com/read_25558459.htm

### 🔴 数据内部矛盾  `conf=high`
- **文件**: `data/datasets/zhiyuan-rules-2026.json → 顶层2026特别提示 vs provinces[省=河北].本科批.unit`
- **定位**: `2026特别提示.专业平行模式扩展 ↔ provinces[province=河北].本科批.unit`
- **现值**: 顶层'2026特别提示.专业平行模式扩展'列出河北，但省级记录unit仍为'院校专业组'
- **应为**: 两处一致：省级记录unit应改为'专业(类)+学校'
- **依据**: 同一文件内部矛盾：顶层节点已将河北标注为'专业平行模式'，但省级记录未同步更新。内部检查：zhiyuan-rules-2026.json

### 🔴 数据内部矛盾  `conf=high`
- **文件**: `data/datasets/zhiyuan-calendar-2026.json → provinces[省=河北].batches[本科批].notes vs zhiyuan-rules-2026.json 省级记录`
- **定位**: `batches[name=本科批].notes ↔ zhiyuan-rules-2026.json provinces[省=河北].本科批`
- **现值**: 日历文件notes写'96专业平行志愿, 无调剂'（正确），但rules文件同省记录为unit=院校专业组+调剂=true（错误）
- **应为**: 两文件一致，rules文件应改为unit=专业(类)+学校, 调剂=false
- **依据**: zhiyuan-calendar-2026.json与zhiyuan-rules-2026.json关于同一省份的志愿模式和调剂规则互相矛盾。日历文件与官方来源一致，rules文件有误。

### 🟡 赋分等级描述 🔧  `conf=high`
- **文件**: `data/datasets/score-system-2025.json → provinces[省=河北].scaled_subjects[0].type`
- **定位**: `provinces[province=河北].scaled_subjects[0].type`
- **现值**: 等级赋分 (5 等 21 级, 30-100)
- **应为**: 等级赋分 (5 等, 30-100)；河北官方方案仅有5个等级(A/B/C/D/E)，无21级细分
- **依据**: 河北省2019年高考综合改革方案（hebei.eol.cn）及多方2025年来源均确认河北使用5个等级，无21级。'21级'是部分其他省份（如山东）的模式。等级比例15/35/35/13/2%及赋分区间100-86/85-71/70-56/55-41/40-30与官方一致。来源：https://hebei.eol.cn/hebeinews/201904/t20190424_1655971.shtml

### 🟡 赋分公式描述  `conf=medium`
- **文件**: `data/datasets/score-system-2025.json → provinces[省=河北].scaling_formula`
- **定位**: `provinces[province=河北].scaling_formula`
- **现值**: 5 等比例 15%/35%/35%/13%/2%; 赋分区间 100-86, 85-71, 70-56, 55-41, 40-30 等距 21 级换算.
- **应为**: 5等比例15%/35%/35%/13%/2%; 赋分区间100-86,85-71,70-56,55-41,40-30；等比例（非等距）线性换算，无21级细分
- **依据**: 河北官方方案使用等比例转换（非等距），且只有5等无21级。'等距21级换算'的描述混入了其他省份的模式。来源：https://hebei.eol.cn/hebeinews/201904/t20190424_1655971.shtml

### 🟡 日历时间准确性  `conf=low`
- **文件**: `data/datasets/zhiyuan-calendar-2026.json → provinces[省=河北]`
- **定位**: `provinces[province=河北].exam_dates / score_release / batches`
- **现值**: exam_dates=6/7-6/9, score_release=2026/6/24, based_on_year=2025, tentative=true
- **应为**: 待人工核对
- **依据**: 文件自注tentative=true，基于2025年推算。未找到2026年河北省考试院官方公布日程，无法证伪或证实。搜索未返回2026年官方日期公告。

### 🟡 民族加分退坡  `conf=low`
- **文件**: `data/datasets/special-admissions/minzu-policy-2025.json → records[0].bonus_tiers[0].rollback_schedule.2026`
- **定位**: `records[region_id=13].bonus_tiers[0].rollback_schedule`
- **现值**: {"2026": 5}（2026年退坡至5分）
- **应为**: 待人工核对
- **依据**: 多次网络搜索（hebeea.edu.cn、gaokao.chsi.com.cn、jyt.hebei.gov.cn）均未检索到河北省2026年将少数民族加分从10分退坡至5分的官方公告。web搜索结果（https://www.gk100.com/read_12841934.htm 等）仅提及「暂无明确官方公告取消」，未证实退坡幅度。

### 🟡 综合评价-数据来源  `conf=low`
- **文件**: `data/datasets/special-admissions/zongping-2025.json → records[0].data_source`
- **定位**: `records[region_id=13, school=南方科技大学].data_source`
- **现值**: ["docs/special-admissions-3year/hebei.md"]（内部md文件，无外部URL）
- **应为**: 待人工核对（建议补充 sustech.edu.cn 招生简章链接）
- **依据**: 该条confidence=medium，data_source仅为内部文档路径，无可溯外部URL。南方科技大学2025年综合评价简章可于 https://gaokao.eol.cn/zonghepingjia/zpjz/202504/t20250429_2666480.shtml 查阅，核实后公式631和物化必选均与数据一致，但data_source字段质量偏低。

## 山西  （🔴2 🟡5 🔵1）

### 🔴 赋分制描述错误 🔧  `conf=high`
- **文件**: `data/datasets/score-system-2025.json → provinces[山西\|内蒙古\|...].scaled_subjects[0].type`
- **定位**: `provinces[province='山西\|内蒙古\|河南\|四川\|陕西\|云南\|青海\|宁夏'].scaled_subjects[0].type`
- **现值**: 等级赋分 (5 等 21 级, 30-100)
- **应为**: 等级赋分 (5 等, A/B/C/D/E, 赋分区间 30-100)
- **依据**: 山西省考试院官方文件（经 https://www.gaokzx.com/c/202402/91674.html 和 https://news.qq.com/rain/a/20250228A06HSQ00 确认）：山西再选科目按比例（15%/35%/35%/13%/2%）划分为 A、B、C、D、E 共 5 个等级，赋分起点 30 分、满分 100 分。'21 级' 细分是 3+3 省份（如北京/天津）的做法，3+1+2 省份（含山西）不设 21 子级，只有 5 个大等级。

### 🔴 艺术综合分公式 🔧  `conf=high`
- **文件**: `art-formula-2025.json → records[region_id=14, category=播音与主持]`
- **定位**: `records[region_id=14, category="播音与主持"].formula.culture_pct / pro_pct`
- **现值**: culture_pct=0.7, pro_pct=0.3（文化课70%，专业课30%）
- **应为**: culture_pct=0.5, pro_pct=0.5（文化课50%，专业课50%）
- **依据**: 山西省招生考试管理中心《关于做好我省2025年普通高校招生艺术类专业考试工作的通知》（大同市政府转发页 https://www.dt.gov.cn/dtszf/jyjbmdt/202411/90f8335c44124894a81e67143da67986.shtml）原文：「综合分＝文化课成绩×50％＋专业统考成绩×2．5×50％，适用于音乐类、舞蹈类、表（导）演类、美术与设计类、播音与主持类、书法类专业」，明确列出播音与主持使用与其他五类相同的50/50公式。中国教育在线（https://gaokao.eol.cn/shan_xi/dongtai/202502/t20250208_2654004.shtml）同样引述统一公式。

### 🟡 日历-本科批志愿填报起止时间  `conf=low`
- **文件**: `data/datasets/zhiyuan-calendar-2026.json → provinces[山西].batches[name='本科批']`
- **定位**: `provinces[province='山西'].batches[name='本科批'].fill_start / fill_end`
- **现值**: fill_start: 2026/6/26 08:00, fill_end: 2026/7/2 18:00
- **应为**: 依据 2026 非官方汇总源：fill_start: 2026/7/2 08:00, fill_end: 2026/7/7 18:00（待省考试院正式公告确认）
- **依据**: https://m.gk100.com/read_53172530.htm 汇总：山西普通本科批填报 7/2 08:00—7/7 18:00；本科提前批 6/27 08:00—6/28 18:00。数据文件中本科批 fill_start 为 6/26，与该来源不符。注：文件标注 tentative:true / based_on_year:2025，属于上一年度估算，需以省考试院 2026 正式公告为准。

### 🟡 日历-本科提前批志愿填报起始时间  `conf=low`
- **文件**: `data/datasets/zhiyuan-calendar-2026.json → provinces[山西].batches[name='本科提前批']`
- **定位**: `provinces[province='山西'].batches[name='本科提前批'].fill_start`
- **现值**: 2026/6/26 08:00
- **应为**: 待人工核对（非官方来源显示 6/27 08:00，但文件为上一年度估算）
- **依据**: https://m.gk100.com/read_53172530.htm 显示本科提前批（A/B/C 段）填报为 6/27 08:00—6/28 18:00，与数据中 6/26 不符；但 fill_end 数据为 7/2 而非 6/28，差距更大。文件本身标注 tentative:true。

### 🟡 日历-成绩发布时间  `conf=low`
- **文件**: `data/datasets/zhiyuan-calendar-2026.json → provinces[山西].score_release`
- **定位**: `provinces[province='山西'].score_release`
- **现值**: 2026/6/24
- **应为**: 待人工核对（文件标注 tentative:true，官方 2026 成绩发布日期未从权威来源获得确认）
- **依据**: 多次网络搜索未找到山西省 2026 年成绩发布具体日期的省考试院公告；文件本身标注 based_on_year:2025、tentative:true。

### 🟡 综合评价 — 折算公式缺失  `conf=low`
- **文件**: `zongping-2025.json → records[region_id=14]`
- **定位**: `records[region_id=14].composite_formula`
- **现值**: {"extras": "南科大 / 北外 / 上纽 / 深北莫 (2025 新进入)"} — 仅备注4校名称，无任何折算比例字段
- **应为**: 待人工核对：各校折算比例（高考成绩占比、校测占比）需补入各校2025年招生简章
- **依据**: 腾讯新闻/qq.com（https://news.qq.com/rain/a/20250328A01RCL00）确认4校在山西招生，但未给出每校折算比例。南科大简章（https://gaokao.eol.cn/zonghepingjia/zpjz/202504/t20250429_2666480.shtml）存在但无法比对具体字段。confidence=low已标注在数据中，反映不确定性，但折算比例字段完全缺失而非仅有低置信度。

### 🟡 强基计划 — 入围院校覆盖度  `conf=low`
- **文件**: `qiangji-quota-2025.json → records[region_id=14]`
- **定位**: `records[region_id=14] (共3条: 北大/清华/华中科技)`
- **现值**: 仅收录3所学校（北大10名、清华21名、华中科技无quota字段）
- **应为**: 待人工核对：2025强基计划在全国招生高校共39所，山西作为高考大省，实际入围院校应不止3所
- **依据**: 阳光高考页面 https://gaokao.chsi.com.cn/gkxx/zc/ss/202501/20250123/2293353850.html 和晋城教育局 https://jyj.jcgov.gov.cn/jyfw/zsks/202504/t20250421_2132094.shtml 均确认强基计划在山西实施，但网络可访问资源未列出完整39所院校在晋quota明细，无法判断是否有错误项。

### 🔵 港澳台联招/华侨生渠道 — 无省级记录  `conf=high`
- **文件**: `qatw-channel-2025.json`
- **定位**: `records（无region_id=14条目）`
- **现值**: 无山西省条目
- **应为**: 港澳台联招为全国统一渠道（region_id=81/82/71），不需要省级单独记录，缺席合理
- **依据**: qatw-channel-2025.json共11条，均为region_id=71/81/82（台/港/澳）全国渠道记录，与省级文件结构设计一致。山西省2025年招生工作规定（https://gaokao.eol.cn/shan_xi/dongtai/202506/t20250604_2672641.shtml）第36条列出港澳高校录取规则，均走全国统一渠道。

## 内蒙古  （🔴1 🟡5 🔵0）

### 🔴 艺术综合分公式 🔧  `conf=high`
- **文件**: `data/datasets/special-admissions/art-formula-2025.json · records[region_id=15, category='播音与主持']`
- **定位**: `formula.culture_pct / formula.pro_pct`
- **现值**: culture_pct: 0.6, pro_pct: 0.4
- **应为**: culture_pct: 0.7, pro_pct: 0.3（文化占70%，专业占30%）
- **依据**: 内蒙古2025年高校考试招生和录取工作实施方案（本地宝转载 https://m.hu.bendibao.com/edu/63533.shtm）明确：'播音与主持类专业的高考文化课成绩占比为70%，即：投档分=〔(高考文化分÷文化满分)×70%+(专业分÷专业满分)×30%〕×750'。数据文件记录为60%/40%，与官方规定不符。

### 🟡 日程·成绩发布日  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[province=="内蒙古"].score_release`
- **定位**: `provinces[内蒙古].score_release`
- **现值**: 2026/6/23
- **应为**: 待人工核对（2025年实际为6月24日；2026尚无官方公告）
- **依据**: eol.cn 报道 2025 年内蒙古高考成绩于 6 月 24 日公布（https://gaokao.eol.cn/nei_meng/dongtai/202506/t20250624_2676786.shtml）；数据标注 tentative=true, based_on_year=2025，但估算值比 2025 实际早了 1 天

### 🟡 日程·_notes 一致性  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → _notes[4]`
- **定位**: `_notes[4]`
- **现值**: exam_dates 全国统考 2026 年 6 月 7-8 日；江苏/海南 6/7-6/9 (含选考科目)
- **应为**: 应补充内蒙古也是 6/7-6/9（再选科目在 6 月 9 日考完）
- **依据**: 2025 年内蒙古高考日程：6/7 语文/数学，6/8 物理/历史/外语，6/9 化学/地理/政治/生物（来源：https://gaokao.eol.cn/nei_meng/dongtai/202505/t20250528_2671363.shtml）。_notes 只列了江苏/海南为例外，内蒙古省条目本身写 6/7-6/9 是正确的，但顶层注解遗漏了内蒙古

### 🟡 综合评价折算比例  `conf=low`
- **文件**: `data/datasets/special-admissions/zongping-2025.json · records[region_id=15, school='南方科技大学']`
- **定位**: `composite_formula.extras`
- **现值**: 631 (本科提前批 A 段)
- **应为**: 待人工核对
- **依据**: 搜索确认南方科技大学2025年在内蒙古开展综合评价（https://www.gaokzx.com/gk/zizhao/140744.html），且历年提前批录取分参考629分。但搜索结果未找到具体确认'6:3:1'折算比例的官方权威来源URL，内蒙古提前批A段说法亦未获独立来源验证。数据来源标注为本地md文档（confidence: medium）。

### 🟡 在蒙综评其余院校名单  `conf=low`
- **文件**: `data/datasets/special-admissions/zongping-2025.json · records[region_id=15, school='在蒙外省综评其余4校']`
- **定位**: `composite_formula.extras`
- **现值**: 北外 / 上纽 / 昆杜 / 深北莫
- **应为**: 待人工核对
- **依据**: 数据自身标注 confidence: low，来源仅为本地md。未找到官方来源确认2025年这4所学校在内蒙古开展综合评价，亦未找到反驳来源。

### 🟡 强基计划招生名额  `conf=low`
- **文件**: `data/datasets/special-admissions/qiangji-quota-2025.json · records[region_id=15]`
- **定位**: `quota（北大=7，清华=17）`
- **现值**: 北大 quota: 7，清华 quota: 17
- **应为**: 待人工核对
- **依据**: 搜索结果（https://www.gk100.com/read_47481177.htm）确认2025年内蒙古强基计划入围线北大678分、清华683分与数据吻合，但具体省份招生名额数字未从公开搜索结果中获得独立来源验证。数据来源标注为nm.zsks.cn + 校招官网（confidence: high），名额数字需人工核查官方招生简章。

## 辽宁  （🔴2 🟡3 🔵1）

### 🔴 赋分制度 🔧  `conf=high`
- **文件**: `data/datasets/score-system-2025.json → provinces[辽宁].scaled_subjects[0].type`
- **定位**: `provinces[province=辽宁].scaled_subjects[0].type`
- **现值**: 等级赋分 (5 等 21 级, 30-100)
- **应为**: 等级赋分 (5 等, 30-100)
- **依据**: 多个来源确认辽宁采用A/B/C/D/E五个大等级加连续线性映射，区间30-100；"21级"是北京/天津/浙江特有制度（40-100每3分一档=21个离散值）。辽宁区间30-100不能被3整除，不存在21个等距子级。来源: https://www.gk100.com/read_43940688.htm 及 https://www.zizzs.com/gk/gaokao/216528.html

### 🔴 赋分制度 🔧  `conf=high`
- **文件**: `data/datasets/score-system-2025.json → provinces[辽宁].scaling_formula`
- **定位**: `provinces[province=辽宁].scaling_formula`
- **现值**: 同河北, 5 等 21 级
- **应为**: 同河北, 5 等 (A-E), 等比例线性转换; 区间 100-86/85-71/70-56/55-41/40-30
- **依据**: 辽宁与河北赋分逻辑相同：5等连续线性转换，无离散21子级。"21级"标签错误引自北京/天津体系。来源: https://www.gk100.com/read_2312429.htm

### 🟡 志愿流程  `conf=medium`
- **文件**: `data/datasets/zhiyuan-rules-2026.json → provinces[辽宁].滑档风险`
- **定位**: `provinces[province=辽宁].滑档风险`
- **现值**: 112志愿不勾服从直接退档
- **应为**: 待人工核对
- **依据**: 辽宁本科批"专业+学校"模式每个志愿直接对应具体专业，不存在需要勾选的"服从专业调剂"选项，因此"不勾服从"的表述易引起误解。提前批A段确有服从调剂选项，但本科批无此机制。描述应改为"112志愿用尽仍无匹配则退档"。来源: https://www.lnzsks.com/newsinfo/IMS_20250618_44974_hpEdISCHLr.htm (访问超时，无法完全核实)

### 🟡 强基计划·入围分数线  `conf=low`
- **文件**: `data/datasets/special-admissions/qiangji-quota-2025.json · records[region_id=21, school=南开大学]`
- **定位**: `records[8].ruwei_line.physical = 734.5`
- **现值**: ruwei_line: {"physical": 734.5}
- **应为**: 待人工核对
- **依据**: EOL公布的南开2025强基辽宁物理学专业综合成绩最低录取分为807.60（含85%高考+15%校测加权），对应原始高考入围分无法从公开来源直接核算。gk100参考数据(2024)物理类全国入围范围627.5–769分，734.5在合理区间内，但无具体2025辽宁入围原始分来源。https://gaokao.eol.cn/qjjh/202507/t20250708_2679559.shtml

### 🟡 民族加分·户籍学籍要求表述  `conf=low`
- **文件**: `data/datasets/special-admissions/minzu-policy-2025.json · records[region_id=21]`
- **定位**: `records[0].bonus_tiers[0].requirements`
- **现值**: "民族同父/母、连续 3 年户籍 + 3 年学籍并实际就读"
- **应为**: 待人工核对
- **依据**: eol.cn和官方政策公告确认加分4分及县域名单，但未明确找到"连续3年户籍+3年学籍"的具体文本，官方公告仅要求考生在户籍所在自治县报名应试。jyt.ln.gov.cn页面抓取未返回完整条款。https://gaokao.eol.cn/liao_ning/dongtai/202505/t20250520_2669482.shtml

### 🔵 艺术综合评价·文化控制线缺失  `conf=high`
- **文件**: `data/datasets/special-admissions/art-formula-2025.json · records[region_id=21]`
- **定位**: `records 11条辽宁记录均无 culture_control_line 字段`
- **现值**: 无 culture_control_line 字段（仅有 qualifying_score: {benke: 180}）
- **应为**: 应补充 culture_control_line（按类别分：美术/书法/导演类本科历史类327/物理类275；舞蹈/表演/音乐类本科历史类250/物理类250；戏曲本科历史类218/物理类183）
- **依据**: 辽宁省2025年普通高等学校招生文化课录取控制分数线（官方）显示艺术类本科文化控制线历史类327分、物理类275分（普通艺术），250/250（表演类），与北京记录相比辽宁records缺少culture_control_line字段。来源：https://gaokao.eol.cn/liao_ning/dongtai/202506/t20250624_2676748.shtml

## 吉林  （🔴2 🟡3 🔵1）

### 🔴 日历·成绩发布 🔧  `conf=high`
- **文件**: `zhiyuan-calendar-2026.json → provinces[province=吉林].score_release`
- **定位**: `provinces[?province=='吉林'].score_release`
- **现值**: 2026/6/22
- **应为**: 2026/6/25（参考2024/2025实际均为6月25日）
- **依据**: 搜索结果确认：2024年吉林省高考成绩'拟于6月25日12时公布'，2025年实际也是'6月25日12:00左右发布'（来源：https://m.gmw.cn/2025-06/24/content_1304066806.htm 及 http://cc.bendibao.com/edu/2025617/66628.shtm）。同文件内部注释亦写明'score_release 多数省 6/23-6/25 之间'，且同批可比省份（河北/辽宁/黑龙江/安徽）均为6/24。吉林写成6/22偏早3天，历史两年均为6/25。

### 🔴 日历·本科批填报开始 🔧  `conf=high`
- **文件**: `zhiyuan-calendar-2026.json → provinces[province=吉林].batches[name=本科批].fill_start`
- **定位**: `provinces[?province=='吉林'].batches[?name=='本科批'].fill_start`
- **现值**: 2026/6/26 09:00
- **应为**: 2026/6/28 09:00（参考2025年实际本科批填报6月28日开始）
- **依据**: 2025年吉林省高考实际安排：提前批填报6月26日-27日（8:00-20:00），本科批填报6月28日-7月2日（8:00-20:00）（来源：https://news.qq.com/rain/a/20250625A03V4U00 及 https://m.cc.bendibao.com/edu/66575.shtm）。当前数据将提前批start日期（6/26）误填为本科批start，导致两批次fill_start相同（均6/26），与实际时序矛盾。同文件河北本科批fill_start=6/28亦佐证。

### 🟡 日历·本科批填报结束时间  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[province=吉林].batches[name=本科批].fill_end`
- **定位**: `provinces[?province=='吉林'].batches[?name=='本科批'].fill_end`
- **现值**: 2026/7/2 17:00
- **应为**: 待人工核对
- **依据**: 2025年实际本科批填报截止为7月2日（https://m.cc.bendibao.com/edu/66575.shtm 显示'6月28日至7月2日'），与数据一致，但未找到明确截止时刻（17:00 vs 20:00）的官方来源；腾讯新闻来源（https://news.qq.com/rain/a/20250625A03V4U00）显示2025为8:00-20:00而非17:00截止。时刻有出入，待以省考试院正式公告为准。

### 🟡 强基计划-招生名额  `conf=low`
- **文件**: `data/datasets/special-admissions/qiangji-quota-2025.json → records[35] (吉林大学)`
- **定位**: `.records[35].quota`
- **现值**: 35
- **应为**: 待人工核对
- **依据**: 吉林大学官方招生简章（zsb.jlu.edu.cn/info/3098.html）仅说明'分省分专业招生计划以报名系统公布为准'，未在简章正文列出分省名额；数据来源标注 confidence=medium，quota=35 无可验证的公开 URL。入围比例6倍已核实，但名额数值本身未见权威来源。

### 🟡 综合评价-招生院校  `conf=low`
- **文件**: `data/datasets/special-admissions/zongping-2025.json → records[98] (北京外国语大学), records[99] (中国科学院大学)`
- **定位**: `.records[98].composite_formula, .records[99]`
- **现值**: BFSU: {gaokao_pct:70, xiaoce_pct:30}; UCAS: 无公式
- **应为**: 待人工核对
- **依据**: 两条记录的 data_source 均为 'docs/special-admissions-3year/jilin.md'（内部文档），confidence='low'。未能在官方网站或阳光高考找到2025年这两所学校面向吉林省的综合评价简章或正式公告。

### 🔵 民族加分-退坡计划  `conf=low`
- **文件**: `data/datasets/special-admissions/minzu-policy-2025.json → records[6] (吉林)`
- **定位**: `.records[6].bonus_tiers[0].rollback_schedule`
- **现值**: 无 rollback_schedule 字段
- **应为**: 待人工核对
- **依据**: 搜索 jleea.com.cn 确认2025和2026年仍为 +5 分（见 jleea.com.cn/site1/xiangqingye/202049/ 及 202053/），未发现已公布的退坡时间表。辽宁同文件有 rollback_schedule:{2026:0}，吉林无该字段，目前无证据表明有退坡计划，但也无官方明确说明'长期保留'。

## 黑龙江  （🔴2 🟡5 🔵2）

### 🔴 艺术综合分公式 🔧  `conf=high`
- **文件**: `data/datasets/special-admissions/art-formula-2025.json → records[region_id=23, category="播音与主持"].formula.pro_factor`
- **定位**: `records[region_id=23, category='播音与主持'].formula.pro_factor`
- **现值**: 2.5
- **应为**: 1.0（专业课满300分直接使用，不折算到750分制）
- **依据**: hlj.gov.cn 2025年招生工作规定 (https://www.hlj.gov.cn/hljapp/c116059/202504/c00_31834455.shtml) 明确：'综合分=专业课成绩×20%+文化课成绩（含照顾政策分）×80%'，专业满分300分，不折算。pro_factor=2.5 意味着 (专业/300×750)×20%，对同一考生综合分将虚高约60-75分（专业250/文化580时：正确514 vs 数据589）。

### 🔴 score-out-of-range  `conf=high`
- **文件**: `dist/school-index.gz (probe-generated)`
- **定位**: `昆山杜克大学 (id=3341) pro_type_min[23][2025][2073]`
- **现值**: 78
- **应为**: >200 (合理本科物理类最低分)
- **依据**: 本地索引 & 活数据源 info.json 均显示 pro_type_min[23][2025][2073]=78（物理类 78 分）。但 schoolspecialscore 端点 404（无专业明细）。curl https://static-data.gaokao.cn/www/2.0/school/3341/info.json 实时返回同样的 78，说明 gaokao.cn 数据源本身存在该异常值；local index 系 probe 照搬，非 index-drift。78 分对 中外合作办学 本科/物理类 严重越界，疑为体育/艺术联招分数串行污染。node dist/index.js actual 昆山杜克大学 --province heilongjiang --year 2025/2024 均返回 gaokao.cn 404。

### 🟡 日历·志愿填报时间  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json`
- **定位**: `provinces[黑龙江].batches[本科批].fill_start / fill_end`
- **现值**: fill_start=2026/6/25 09:00, fill_end=2026/7/1 12:00
- **应为**: 待人工核对（第三方来源显示本科批填报为7/1-7/5，提前批为6/27-6/29；数据中6/25起止与此不符）
- **依据**: https://www.gk100.com/read_2942860.htm 显示：第一阶段（提前批）6/27-6/29，第二阶段（本科批）7/1-7/5。数据中fill_start=6/25、fill_end=7/1与本科批实际窗口不符。该条目已标注 tentative=true / based_on_year=2025，属预估值。

### 🟡 日历·提前批填报时间  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json`
- **定位**: `provinces[黑龙江].batches[本科提前批].fill_start / fill_end`
- **现值**: fill_start=2026/6/25 09:00, fill_end=2026/7/1 12:00
- **应为**: 待人工核对（第三方来源显示提前批填报为6/27-6/29；数据中起始6/25与此不符）
- **依据**: https://www.gk100.com/read_2942860.htm 显示提前批第一阶段为6/27-6/29；数据fill_start=6/25早2天。该条目已标注 tentative=true，属预估值。

### 🟡 艺术综合分公式  `conf=low`
- **文件**: `data/datasets/special-admissions/art-formula-2025.json → records[region_id=23, category="戏曲"]`
- **定位**: `records[region_id=23, category='戏曲'].formula.pro_factor`
- **现值**: pro_factor=2.5（同其他类），confidence="medium"
- **应为**: 待人工核对：戏曲专业课是否同样折算到750分制。内部文档 heilongjiang.md 对戏曲未单独注明'不折算'，与其他类一致处理为2.5，但未见权威官方文件单独确认。
- **依据**: 内部文档 docs/special-admissions-3year/heilongjiang.md 第9-16行对戏曲列为'同50/50'但未明确折算规则；hlj.gov.cn 2025招生规定中未检索到戏曲单独公式条款。文件已标 confidence=medium。

### 🟡 强基计划覆盖完整性  `conf=medium`
- **文件**: `data/datasets/special-admissions/qiangji-quota-2025.json → region_id=23 整体`
- **定位**: `records[region_id=23]（共3条）`
- **现值**: 仅收录北京大学、清华大学、哈尔滨工业大学共3所；无吉林大学记录
- **应为**: 待人工核对：内部文档 heilongjiang.md 明确称'吉林大学(临省主投)'为在黑强基大户，但文件内 JLU（zs_code=10183）对 region_id=23 无任何记录，JLU 全库仅有1条（region_id=22 辽宁）。
- **依据**: docs/special-admissions-3year/heilongjiang.md 第46行：'本省: 哈尔滨工业大学(大户)、吉林大学(临省主投)'；qiangji-quota-2025.json 内 JLU region_id=23 记录缺失（grep 10183 全文仅有辽宁条目）。

### 🟡 score-out-of-range  `conf=medium`
- **文件**: `dist/school-index.gz (probe-generated)`
- **定位**: `辽宁理工职业大学 (id=1702) pro_type_min[23][2025][2074]`
- **现值**: 188
- **应为**: >200 (本科历史类合理区间)
- **依据**: 本地索引 pro_type_min[23][2025][2074]=188（历史类）。2025 年活数据源 schoolspecialscore 404（无明细可验证）。2024 年实际数据显示该校在黑龙江仅有专科批录取（物理类 min=307、历史类 min=341），无本科批历史类条目；其 本科批 仅有 物理类(360-396)。2025 历史类 188 来源不明，极可能为专科批/艺术批分数被误标为本科历史类写入 info.json，随后被 probe 照搬。node dist/index.js actual 辽宁理工职业大学 --province heilongjiang --year 2025 返回 404。

### 🔵 民族加分历史退坡记录缺失  `conf=high`
- **文件**: `data/datasets/special-admissions/minzu-policy-2025.json → records[region_id=23]`
- **定位**: `records[region_id=23].bonus_tiers[0].requirements 及 notes 字段`
- **现值**: requirements: '户籍/学籍/实际就读三统一;其他少数民族(含朝鲜族)无单独加分'；无 notes 字段，无退坡历史说明
- **应为**: 建议补充 notes 字段说明：鄂伦春/赫哲/鄂温克/柯尔克孜/达斡尔/蒙古/锡伯/俄罗斯族原享有+10分（省属院校），黑龙江2020年出台方案宣布该项目自2023年高考起取消。现行数据逻辑本身正确，但缺乏上下文。
- **依据**: gaokao.eol.cn 2025加分政策页 (https://gaokao.eol.cn/hei_long_jiang/dongtai/202505/t20250526_2670958.shtml)；gaokao.eol.cn 2015年政策页 (https://gaokao.eol.cn/hei_long_jiang/dongtai/201506/t20150629_1282004.shtml) 确认+10历史存在；多方来源确认2023年起已取消。

### 🔵 level-mismatch  `conf=high`
- **文件**: `dist/school-index.gz (probe-generated)`
- **定位**: `泰山科技学院 (id=2513) pro_type_min[23][2023] + 辽宁理工职业大学 (id=1702) batch`
- **现值**: level=本科，但黑龙江实际录取批次=专科批
- **应为**: 按省内招生批次显示（专科批分数 <200 属正常）
- **依据**: 泰山科技学院 2023 实际数据仅有专科批（理工 min=179，文史 min=171），school level 标注 本科；辽宁理工职业大学 2024 在黑龙江同时有本科批(360-396) 和专科批(307-341)。本科级别院校在黑龙江以专科批录取的情况导致 pro_type_min 记录了专科批低分，触发越界预警，但属跨省批次差异，并非 index-drift 或数据错误。

## 上海  （🔴2 🟡1 🔵0）

### 🔴 赋分等级名称 🔧  `conf=high`
- **文件**: `data/datasets/score-system-2025.json → provinces[province=上海].scaling_formula`
- **定位**: `scaling_formula 第3个等级`
- **现值**: A-(11%)
- **应为**: B+(10%)
- **依据**: 上海市官方赋分制度11个等级为 A+/A/B+/B/B-/C+/C/C-/D+/D/E，不存在 A- 等级。来源: https://www.shjzzjf.net/shjfrx/12410.html 及 https://m.sh.bendibao.com/edu/298021.html，与 shmeea.edu.cn 官方文件一致（2026招生工作办法 https://www.shmeea.edu.cn/page/08000/20260402/20157.html）

### 🔴 赋分等级比例 🔧  `conf=high`
- **文件**: `data/datasets/score-system-2025.json → provinces[province=上海].scaling_formula`
- **定位**: `scaling_formula 各等级百分比`
- **现值**: A+(5%)/A(10%)/A-(11%)/B+(13%)/B(14%)/B-(13%)/C+(11%)/C(10%)/C-(7%)/D+(4%)/D(2%)
- **应为**: A+(5%)/A(10%)/B+(10%)/B(10%)/B-(10%)/C+(10%)/C(10%)/C-(10%)/D+(10%)/D(10%)/E(5%)
- **依据**: 官方及多个来源均显示中间9个等级(A到D+)各约10%，D+E合计约15%，且E约5%。数据文件中尾部D=2%，以及各中间等级的11%/13%/14%等非均匀分布与官方不符。来源: https://m.sh.bendibao.com/edu/298021.html 及 https://www.shjzzjf.net/shjfrx/12410.html

### 🟡 日历·成绩发布日期  `conf=low`
- **文件**: `data/datasets/zhiyuan-calendar-2026.json → provinces[province=上海].score_release`
- **定位**: `score_release`
- **现值**: 2026/6/23
- **应为**: 待人工核对
- **依据**: 未能在 shmeea.edu.cn 官网或其他权威来源找到明确的2026年上海成绩发布日期确认。官网404或未返回具体日期。数据标注 tentative=false（声称已发布正式日历），但无法通过本次搜索独立核实该具体日期。

## 江苏  （🔴3 🟡2 🔵8）

### 🔴 赋分制度 🔧  `conf=high`
- **文件**: `score-system-2025.json → provinces[江苏].scaled_subjects[0].type`
- **定位**: `provinces[?province=='江苏'].scaled_subjects[0].type`
- **现值**: 等级赋分 (5 等 21 级, 30-100)
- **应为**: 等级赋分 (5 等 5 级, 30-100)
- **依据**: 多源证实：https://www.6617.com/p_623570586.html 及 https://gaokao.eol.cn/jiang_su/dongtai/202001/t20200117_1705948.shtml 均明确江苏再选科目为 A/B/C/D/E 5个等级（各占15%/35%/35%/13%/2%），等级内线性插值，赋分区间100-86/85-71/70-56/55-41/40-30。5等21级是北京/天津的做法，江苏不适用。

### 🔴 赋分制度-scaling_formula标注 🔧  `conf=high`
- **文件**: `score-system-2025.json → provinces[江苏].scaling_formula`
- **定位**: `provinces[?province=='江苏'].scaling_formula`
- **现值**: 同河北/辽宁, 5 等 21 级
- **应为**: 同河北/辽宁, 5 等 5 级（A-E五等，等级内线性转换）
- **依据**: https://zhuanlan.zhihu.com/p/391696751 及搜索摘要均明确：河北、辽宁也是5等5级线性赋分，5等21级属于北京/天津；'同河北/辽宁'的对应关系正确，但后缀'5等21级'是错的，应为'5等5级'。

### 🔴 体育类专业满分填写错误 🔧  `conf=high`
- **文件**: `special-admissions/sports-formula-2025.json → .records[9] (region_id=32)`
- **定位**: `formula.extras / formula.pro_factor`
- **现值**: extras: '江苏 投档 = [文化/750×0.7 + 专业/300×0.3] × 750;专业满分 300'; pro_factor: 2.5
- **应为**: 专业满分应为 150（身体素质100分+专项50分），pro_factor 应为 5.0（=750÷150）；正确 extras: '江苏 投档 = [文化/750×0.7 + 专业/150×0.3] × 750;专业满分 150'
- **依据**: 江苏省教育厅2025年普通高校体育类专业招生办法（jyt.jiangsu.gov.cn/art/2025/4/7/art_58320_11535063.html）明确：'专业考试总成绩满分为150分，其中身体素质考试占100分、专项考试占50分'; 南通市政府转发同一文件也确认满分150。相比之下，艺术统考满分确为300，此处混淆了两类满分。

### 🟡 志愿填报日程-fill_start  `conf=medium`
- **文件**: `zhiyuan-calendar-2026.json → provinces[江苏].batches[本科批/本科提前批].fill_start`
- **定位**: `provinces[?province=='江苏'].batches[*].fill_start`
- **现值**: 2026/6/27 09:00（本科批与本科提前批均为6/27）
- **应为**: 待人工核对（2025年实际为6/28开始填报，2026年未经官方确认）
- **依据**: https://news.qq.com/rain/a/20250625A07V3N00 及 https://m.cz.bendibao.com/edu/73810.shtm 均显示2025年江苏本科批志愿填报第一阶段实际起始为6月28日。数据文件标注 tentative:true / based_on_year:2025，但推算值写的是6/27而非6/28，存在1天偏差。2026年官方日程未正式公布。

### 🟡 体育类 culture_control_line.benke 字段语义混乱（110不是文化分）  `conf=medium`
- **文件**: `special-admissions/sports-formula-2025.json → .records[9] (region_id=32)`
- **定位**: `culture_control_line.benke`
- **现值**: 110（放置于 culture_control_line 对象内）
- **应为**: 110 是省体育类本科专业成绩控制线（110/150），不是文化成绩。culture_control_line.historical=400、physical=387 才是文化线。110 应移至 professional_qualifying 或独立字段 professional_benke_line，以免与文化分混淆。待人工核对字段设计意图。
- **依据**: jseea.cn 2025年7月15日通告（jseea.cn/webfile/index/index_zkxx/2025-07-15/7350813266597122048.html）：'体育类 历史科目类 文化400分/专业110分；物理科目类 文化387分/专业110分' — 此处110是专业成绩线，而非文化成绩线；文化线分别是400/387已在其他字段正确记录。

### 🔵 minzu-policy 江苏无少数民族加分 — 与官方一致  `conf=high`
- **文件**: `special-admissions/minzu-policy-2025.json → .records[9] (region_id=32)`
- **定位**: `notes / bonus_tiers`
- **现值**: bonus_tiers: []; notes: '江苏非民族自治省,无少数民族加分'
- **应为**: 与官方一致，无需修改。江苏2021年起取消少数民族加分（保留烈士子女+20、归侨华侨子女+5等国家规定项目，但这些不属于民族加分范畴）。
- **依据**: 江苏省2025年招生工作意见PDF（jseea.cn/webfile/upload/2025/03-28/21-01-380982-1996828970.pdf）及 gk100.com/read_1689335.htm 确认：江苏2025年无少数民族高考加分项。

### 🔵 强基计划综合成绩公式（南京大学/东南大学85%+15%）— 与官方一致  `conf=high`
- **文件**: `special-admissions/qiangji-quota-2025.json → .records[46]/.records[47] (region_id=32)`
- **定位**: `composite_formula.gaokao_pct / xiaoce_pct`
- **现值**: gaokao_pct: 85, xiaoce_pct: 15（南大、东南大学均如此）
- **应为**: 与官方一致，无需修改。
- **依据**: 南京大学2025年强基计划录取办法（zizzs.com/gk/qiangjijihua/198530.html）：'综合成绩=高考成绩÷高考满分×850＋南大考核成绩（满分150分）'，即高考85%+校测15%，总分1000分。

### 🔵 综合评价（zongping）江苏A类公式（南大/东南85%+15%）— 与官方一致  `conf=high`
- **文件**: `special-admissions/zongping-2025.json → .records[7]/.records[8] (region_id=32)`
- **定位**: `composite_formula.gaokao_pct / xiaoce_pct`
- **现值**: gaokao_pct: 85, xiaoce_pct: 15，extras: '100 制 (A 类)'
- **应为**: 与官方一致，无需修改。
- **依据**: 同上南京大学强基/综评计划官方文件确认85/15比例。

### 🔵 艺术类综合分公式 — 与官方一致  `conf=high`
- **文件**: `special-admissions/art-formula-2025.json → .records[81-88] (region_id=32)`
- **定位**: `formula.culture_pct / pro_pct / pro_factor（各类别）`
- **现值**: 书法60/40, 表(导)演50/50, 播音70/30, 美术60/40, 舞蹈50/50, 音乐50/50, pro_factor均为2.5（对应专业满分300）
- **应为**: 与官方一致，无需修改。江苏艺术统考各类别满分均为300分，pro_factor=2.5=750/300 正确。
- **依据**: yishusheng.com.cn 2025年江苏艺术类录取综合分计算公式及 dxsbb.com/news/125919.html（2025江苏艺术统考总分300分）确认各公式权重与满分均正确。

### 🔵 体育类文化控制线（历史400/物理387）— 与官方一致  `conf=high`
- **文件**: `special-admissions/sports-formula-2025.json → .records[9] (region_id=32)`
- **定位**: `culture_control_line.historical / culture_control_line.physical`
- **现值**: historical: 400, physical: 387
- **应为**: 与官方一致，无需修改。
- **依据**: jseea.cn 2025年7月15日通告确认：体育类历史科目类文化线400分、物理科目类387分。

### 🔵 体育类专业合格线90分 — 与官方一致  `conf=high`
- **文件**: `special-admissions/sports-formula-2025.json → .records[9] (region_id=32)`
- **定位**: `professional_qualifying.benke`
- **现值**: 90
- **应为**: 与官方一致，无需修改。90/150 为体育统考通过线（省统考合格）。
- **依据**: jyt.jiangsu.gov.cn/art/2025/4/7/art_58320_11535063.html：'专业考试总成绩满分为150分，90分合格'。

### 🔵 本科批40志愿组/每组6专业 — 与官方一致  `conf=high`
- **文件**: `data/datasets/zhiyuan-rules-2026.json → .provinces[13] (province='江苏')`
- **定位**: `本科批.count / 本科批.majors`
- **现值**: count: 40, majors: 6
- **应为**: 与官方一致，无需修改。
- **依据**: dxsbb.com/news/134964.html 确认：江苏2025本科批设40个院校专业组志愿，每组6个专业志愿。

### 🔵 滑档案例 — 院校专业组机制描述自洽  `conf=medium`
- **文件**: `data/datasets/huadang-cases-2022-2025.json → case-003 / composite-020 / composite-024 / case-063 / composite-066 / composite-068`
- **定位**: `cases[2,19,23,62,65,67].province=='江苏'`
- **现值**: 6条江苏案例，均使用院校专业组（不勾服从/选科不符/小年大年误判），志愿机制描述均为'院校专业组'，未出现错误的批次数/志愿数。
- **应为**: 与江苏3+1+2院校专业组制度自洽，无需修改。案例中未出现河北式96/112志愿数等外省规则混用。
- **依据**: 案例内容交叉验证：所有江苏案例均引用'院校专业组''不勾服从'等江苏特有机制，与 zhiyuan-rules-2026.json 的江苏规则（40组、院校专业组单位）一致。

## 浙江  （🔴5 🟡2 🔵1）

### 🔴 综合评价-三位一体折算公式 🔧  `conf=high`
- **文件**: `data/datasets/special-admissions/zongping-2025.json → records[region_id=33, school.zs_code=10335, is_local=true]`
- **定位**: `composite_formula.gaokao_pct / xiaoce_pct / xueke_pct`
- **现值**: gaokao_pct=50, xiaoce_pct=30, xueke_pct=20（50%+30%+20%）
- **应为**: gaokao_pct=85, xiaoce_pct=10, xueke_pct=5（综合成绩=高考投档÷750×100×85%+面试×10%+学考×5%）
- **依据**: 官方简章 https://zdzsc.zju.edu.cn/2025/0507/c87247a3046634/page.htm 明确：'综合成绩由高考成绩（占85%）、面试成绩（占10%）和高中学业水平考试折算成绩（占5%）组成'；经WebFetch直接确认

### 🔴 综合评价-三位一体折算公式 🔧  `conf=high`
- **文件**: `data/datasets/special-admissions/zongping-2025.json → records[region_id=33, school.name_zh=西湖大学]`
- **定位**: `composite_formula.gaokao_pct / xiaoce_pct / xueke_pct`
- **现值**: gaokao_pct=50, xiaoce_pct=30, xueke_pct=20（50%+30%+20%）
- **应为**: gaokao_pct=60, xiaoce_pct=30, xueke_pct=10（综合总分=高考÷750×100×60%+校测×30%+学考×10%）
- **依据**: 官方简章经 zizzs.com/gk/zhejiangxingaokao/199498.html 转载确认：'综合总分=（高考总分÷750×100）×60%+学校综合测试成绩×30%+高中学业水平考试成绩×10%'；enrollment quota 15人与数据一致

### 🔴 综合评价-三位一体折算公式 🔧  `conf=high`
- **文件**: `data/datasets/special-admissions/zongping-2025.json → records[region_id=33, school.zs_code=10246, name_zh=复旦大学]`
- **定位**: `composite_formula.gaokao_pct / xiaoce_pct / xueke_pct`
- **现值**: gaokao_pct=60, xiaoce_pct=30, xueke_pct=10，extras='631 (浙江三位一体高水平校)'
- **应为**: gaokao_pct=85, xiaoce_pct=10, xueke_pct=5（综合成绩=高考÷750×850+面试+学考折算；85%+10%+5%）
- **依据**: 官方简章 https://ao.fudan.edu.cn/24/19/c36330a730137/page.htm 经WebFetch确认：'综合成绩由高考成绩（占85%）、面试成绩（占10%）和高中学业水平考试折算成绩（占5%）组成'；data_source标注confidence=medium但公式错误

### 🔴 综合评价-三位一体折算公式 🔧  `conf=high`
- **文件**: `data/datasets/special-admissions/zongping-2025.json → records[region_id=33, school.zs_code=10248, name_zh=上海交通大学]`
- **定位**: `composite_formula.gaokao_pct / xiaoce_pct / xueke_pct`
- **现值**: gaokao_pct=60, xiaoce_pct=30, xueke_pct=10，extras='631'
- **应为**: gaokao_pct=85, xiaoce_pct=12, xueke_pct=3（满分1000=高考折算850+面试120+学考30，即85%+12%+3%）
- **依据**: 官方简章 https://www.hzgrys.net/regulation/3/2025/33/675.html 经WebFetch确认：'综合成绩（满分1000分）=高考投档成绩折算成绩（满分850分）+高中学业水平折算成绩（满分30分）+面试折算成绩（满分120分）'

### 🔴 综合评价-三位一体入围分数线  `conf=high`
- **文件**: `data/datasets/special-admissions/zongping-2025.json → records[region_id=33, school.zs_code=10335, is_local=true].ruwei_lines[0]`
- **定位**: `ruwei_lines[0].program_group / ruwei_lines[0].score`
- **现值**: program_group='本部', score=391
- **应为**: score=396（本部最低首考入围分为396分，391为海宁国际校区土木工程中外合作专业）；或program_group应改为'全校最低（含海宁）'
- **依据**: 搜索结果：'浙江大学2025年三位一体初审中，最低入围分为海宁国际校区土木工程(中外合作办学)专业的391分，本部理科类专业首考入围最低分为396分'（来源：搜索综合 https://www.zizzs.com/gk/zhejiangxingaokao/220056.html 等）

### 🟡 2026特别提示 扩展列表  `conf=medium`
- **文件**: `zhiyuan-rules-2026.json → ["2026特别提示"]["专业平行模式扩展"] 含 "浙江"`
- **定位**: `$.['2026特别提示']['专业平行模式扩展'][5]`
- **现值**: 浙江 被列为 2026 年「专业平行模式扩展」省份之一
- **应为**: 浙江自 2017 年起已全面实行「专业+院校」平行志愿，并非 2026 年新扩展；该字段如描述「2026年新实施或调整省份」则应移除浙江，或改为注明浙江为「沿用」
- **依据**: 浙江省教育考试院官网 2025 年志愿填报热点问答（https://www.zjzs.net/art/2025/7/25/art_155_11473.html）确认专业平行志愿系既有制度，非 2026 新变化；eol.cn 2018 年已记录该制度（https://gaokao.eol.cn/zhe_jiang/dongtai/201812/t20181220_1637984.shtml）

### 🟡 强基计划-清华大学入围分  `conf=low`
- **文件**: `data/datasets/special-admissions/qiangji-quota-2025.json → records[region_id=33, school.zs_code=10003]`
- **定位**: `ruwei_line.unified`
- **现值**: ruwei_line.unified=684
- **应为**: 待人工核对（多源搜索：清华浙江强基入围线理科约682分、文科684分；数据存储unified=684，若为合并值则或偏文科口径）
- **依据**: 搜索摘要：'清华大学在浙江的理科入围分数线为682分，文科为684分'；数据未区分文理，confidence=high，来源zjzs.net/join-tsinghua.edu.cn，但搜索来源为第三方汇总站非考试院官方PDF

### 🔵 日历 成绩查询日期  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[province=="浙江"].score_release`
- **定位**: `$.provinces[?(@.province=='浙江')].score_release`
- **现值**: "2026/6/24"，标注 tentative: true
- **应为**: 待人工核对（2026 年官方日期未在省考试院或权威媒体中找到明确公告）
- **依据**: 搜索浙江省 2026 年高考成绩公布时间未获官方确认结果（搜索时间 2026-05-31，仅能确认考试日期 6/7-6/10）。文件已标 tentative=true，属已知不确定项。

## 安徽  （🔴1 🟡6 🔵1）

### 🔴 艺术类专业统考合格线 🔧  `conf=high`
- **文件**: `art-formula-2025.json / records[region_id=34, category=播音与主持].qualifying_score.zhuanke`
- **定位**: `art-formula-2025.json → records[category=播音与主持, region_id=34] → qualifying_score.zhuanke`
- **现值**: 160
- **应为**: 125（或删除 zhuanke 字段，与 2023/2024 保持一致）
- **依据**: 官方来源 https://www.bblzh.gov.cn/xwzx/ztzl/msfwly/jyly/ggts/5067872.html 及 https://www.dxsbb.com/news/125327.html 均确认 2025 年播音与主持专业统考只有一条合格线 125 分，不区分本科/专科。在全库 292 条 art-formula-2025 记录中，此为唯一 zhuanke > benke 的记录（zhuanke=160 > benke=125）；且 2023 年（128）和 2024 年（141）均无 zhuanke 字段。zhuanke 高于 benke 在逻辑上异常，推断为录入时误填其他类目默认值 160。

### 🟡 日历·填报窗口  `conf=medium`
- **文件**: `zhiyuan-calendar-2026.json → provinces[province=安徽].batches[name=本科批]`
- **定位**: `batches[1].fill_start / fill_end`
- **现值**: fill_start: 2026/6/28 09:00, fill_end: 2026/7/1 17:00
- **应为**: 2025年实际: 本科批填报为 7/4 08:00–7/7 17:00; 2026年待官方公布, 与本科提前批窗口不应相同
- **依据**: 2025年安徽实际: 本科提前批 6/29–7/1, 本科批 7/4–7/7 (来源: https://hf.bendibao.com/edu/2025616/102230.shtm); 数据中两批次填报窗口完全相同, 疑为复制错误

### 🟡 赋分·等级描述  `conf=medium`
- **文件**: `score-system-2025.json → provinces[province含安徽].scaled_subjects[0].type`
- **定位**: `scaled_subjects[0].type`
- **现值**: 等级赋分 (5 等 21 级, 30-100)
- **应为**: 待人工核对 — 安徽官方描述为「5等级等比例换算」, 无「21级」表述; 各等级区间 A(100-86)/B(85-71)/C(70-56)/D(55-41)/E(40-30) 确认正确
- **依据**: 安徽广德市政府官方解读: https://www.guangde.gov.cn/OpennessContent/show/3279083.html 原文「依照等比例转换方法分别对应转换到五个分数区间」, 未提及21级; 自主选拔在线解析: https://www.zizzs.com/gk/anhuixingaokao/174781.html 亦描述为5等级, 搜索结果明确指出「5等21级是北京等地采用的赋分方式, 与安徽不同」

### 🟡 元数据·字段命名  `conf=medium`
- **文件**: `zhiyuan-rules-2026.json → provinces[province=安徽]`
- **定位**: `vs_2024`
- **现值**: vs_2024: 合并本一本二
- **应为**: 待人工核对 — 同批次其他省(甘肃/广西/贵州/吉林/黑龙江)均使用 vs_2025 字段; 安徽和江西仍保留 vs_2024, 疑未随 2026 数据版本更新至 vs_2025
- **依据**: 同文件内其他批4省份字段对比: 吉林 vs_2025=结构稳定, 广西 vs_2025=细则发布, 贵州 vs_2025=细则发布, 甘肃 vs_2025=细则待发; 仅安徽/江西保留 vs_2024

### 🟡 体育类综合分公式权重  `conf=low`
- **文件**: `sports-formula-2025.json / records[region_id=34].formula`
- **定位**: `sports-formula-2025.json → records[region_id=34] → formula {culture_pct:0.5, pro_factor:2.5, pro_pct:0.5}`
- **现值**: culture_pct=0.5, pro_factor=2.5, pro_pct=0.5（综合分=文化×50%+专业×2.5×50%）
- **应为**: 待人工核对
- **依据**: 文化控制线（历史=310、物理=300、专科=200）及「普本×65%」「120%/150%划线」均经多个官方来源核实（https://www.huangshan.gov.cn/zxzx/zwyw/8413613.html）。但体育类综合分公式权重（50%+2.5×50%）在安徽省考试院官方2025文件中未找到明确引用；目前公开的省级文件仅说明「综合分优先、遵循志愿」和「按计划120%划线」，未列出文化课/专业课折算比例。此公式与艺术类通用公式相同，存在被套用的可能。

### 🟡 滑档案例 – 高水平运动队志愿规则  `conf=low`
- **文件**: `huadang-cases-2022-2025.json / cases[case_id=case-040].what_happened`
- **定位**: `huadang-cases-2022-2025.json → cases[case_id=case-040] → what_happened / lesson`
- **现值**: 高水平运动队志愿必须填第 1 位；错填位置导致整批投档失败
- **应为**: 待人工核对
- **依据**: 该规则来源标注为「安徽考试院 2024 改革公告; 安徽家长帮 2024」，但未给出可验证的 URL。通过多次搜索未找到具体条文确认「高水平运动队必须填第 1 志愿组」的安徽特有规定。其他信息（合并本一本二为本科批 45 组）已通过 https://gaokao.eol.cn/an_hui/dongtai/202401/t20240129_2557041_3.shtml 核实为真。高水平运动队位置规则部分标注置信度保持 suspect。

### 🟡 score-below-rank-table  `conf=medium`
- **文件**: `school-index (gaokao_cn_id=3739, 三亚护理职业学院)`
- **定位**: `pro_type_min[34][2025]: {2073:180, 2074:183}`
- **现值**: min score 180/183 for Anhui 2025 (专科高职, 海南省民办)
- **应为**: rank table coverage starts at 200; scores 180/183 fall below table minimum — plausible for 专科批 but unverifiable against 一分一段
- **依据**: node dist/index.js rank --score 180 --province anhui --track physics --year 2025 → {rank:null, summary:'分数 180 低于该表覆盖范围'}; score 200 → rank 320779 (table starts at 200). Affected entries: id=3739 (三亚护理职业学院, 180/183), id=3677 (遂宁工程职业学院, 191), id=1390 (海南软件职业技术学院, 198, 2023), id=2959 (济南幼儿师范高等专科学校, 198, 2023). All are 专科(高职) vocational schools from other provinces recruiting in Anhui.

### 🔵 日历·成绩发布  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[province=安徽]`
- **定位**: `score_release`
- **现值**: 2026/6/24 (tentative: true, based_on_year: 2025)
- **应为**: 2025年实际成绩公布为 6/25; 文件标注 tentative=true 已说明为估算
- **依据**: 2025年安徽高考成绩6月25日公布 (来源: https://hf.bendibao.com/edu/2025610/102152.shtm); 文件 based_on_year=2025 但标注时间比2025实际早一天, 已有 tentative=true 标注

## 福建  （🔴2 🟡4 🔵1）

### 🔴 赋分制度描述 🔧  `conf=high`
- **文件**: `score-system-2025.json → provinces[福建].scaled_subjects[0].type`
- **定位**: `provinces[?province=='福建'].scaled_subjects[0].type`
- **现值**: 等级赋分 (5 等 21 级, 30-100)
- **应为**: 等级赋分 (5 等, 30-100)，即 A/B/C/D/E 五档线性插值，无21级细分
- **依据**: 多个来源（https://www.6617.com/p_4052625801.html, https://www.gk100.com/read_53860996.htm）明确指出福建使用5等级（A/B/C/D/E，比例15%/35%/35%/13%/2%）连续线性插值赋分，区间100-86/85-71/70-56/55-41/40-30，无21个固定子级。'5等21级'是北京/天津的描述方式，搜索结果明确区分了两者差异。

### 🔴 赋分公式来源标注 🔧  `conf=high`
- **文件**: `score-system-2025.json → provinces[福建].scaling_formula`
- **定位**: `provinces[?province=='福建'].scaling_formula`
- **现值**: 同河北, 5 等 21 级
- **应为**: 5等（A/B/C/D/E）线性插值，比例15%/35%/35%/13%/2%，区间100-86/85-71/70-56/55-41/40-30；与河北5等结构相同但河北明确使用等距21级子级换算，福建为连续线性插值，不应标注'同河北 5等21级'
- **依据**: https://www.gk100.com/read_53860996.htm 明确福建使用连续线性插值公式 (Y2−Y)/(Y−Y1)=(T2−X)/(X−T1)，非离散21级。河北的 scaling_formula 描述为'等距21级换算'，与福建不同。搜索摘要明确:'5等21级赋分制是北京和天津采用的方案，而福建采用的是更简化的5等级赋分制（不是21级）'

### 🟡 志愿填报日程 — 成绩公布日期  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[福建].score_release`
- **定位**: `provinces[?province=='福建'].score_release`
- **现值**: 2026/6/24
- **应为**: 待人工核对
- **依据**: 2025年福建成绩确于6月24日公布（https://gaokao.eol.cn/fu_jian/dongtai/202506/t20250613_2674456.shtml）。2026年具体成绩公布日期官方尚未公布（fz.bendibao.com/edu/2026513/80313.shtm 明确'成绩公布时间暂未公布'）。数据标注 tentative:true，以2025为基准合理，但仍需等官方确认。

### 🟡 志愿填报日程 — 本科批填报时间  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[福建].batches[本科批].fill_start/fill_end`
- **定位**: `provinces[?province=='福建'].batches[?name=='本科批']`
- **现值**: fill_start: 2026/6/30 08:00, fill_end: 2026/7/2 18:00
- **应为**: 待人工核对
- **依据**: 2026年福建本科批志愿填报具体时间官方尚未公布（fz.bendibao.com/edu/2026513/80313.shtm）。数据标注 tentative:true，以2025为参考基准，但2025年实际填报时间未能在本次搜索中确认，无法核对是否与2025年完全一致。

### 🟡 强基计划-名额  `conf=low`
- **文件**: `special-admissions/qiangji-quota-2025.json → records[region_id=35, school=厦门大学]`
- **定位**: `records[3].quota`
- **现值**: 43
- **应为**: 待人工核对（多处来源标注'约43'，非官方精确值）
- **依据**: zizzs.com(https://www.zizzs.com/gk/qiangjijihua/205601.html) 标注'招生约43人'，明确为非官方汇总。厦门大学官方招生简章未在本次搜索中找到精确数字。其余5校（PKU=19,THU=19,BIT=11,BUAA=7,TJU=12）与外部来源一致。

### 🟡 强基计划-名额  `conf=low`
- **文件**: `special-admissions/qiangji-quota-2025.json → records[region_id=35, school=天津大学]`
- **定位**: `records[4].quota`
- **现值**: 12
- **应为**: 待人工核对（来源标注'约12人'，非官方精确值）
- **依据**: zizzs.com(https://www.zizzs.com/gk/qiangjijihua/205601.html) 标注'招生约12人'，该站点明确说明数据来自非官方汇总，需以天津大学官方招生简章为准。

### 🔵 综合评价-覆盖度  `conf=low`
- **文件**: `special-admissions/zongping-2025.json → records[region_id=35]`
- **定位**: `records[0]`
- **现值**: 仅1条记录，school.name_zh='在闽外省综评 7 校'，composite_formula仅含extras字符串，confidence='low'
- **应为**: 福建省本地不开展三位一体/综合评价招生（该制度主要见于浙江、上海等省市），在闽外校综评数据稀少且置信度低属预期现象；但7所学校名单（南科大/上科大/港中深/北外/上纽/昆杜/深北莫）未附录取人数或折算比例，实用价值有限。
- **依据**: 福建省教育考试院官网(https://www.eeafj.cn/)未发布本省综合评价招生政策；数据来源标注为本地markdown文档，confidence已标low。

## 江西  （🔴2 🟡4 🔵0）

### 🔴 民族加分-取消年份描述 🔧  `conf=high`
- **文件**: `special-admissions/minzu-policy-2025.json → records[region_id=36].bonus_tiers[0].scope`
- **定位**: `records[region_id=36].bonus_tiers[0].scope`
- **现值**: 少数民族(2025 起完全取消)
- **应为**: 少数民族(2023 起完全取消)
- **依据**: 澎湃新闻报道（引自江西考试院政策）明确: 江西「自2023年开始不再加分」，2020-2022年为过渡期可享5分。https://www.thepaper.cn/newsDetail_forward_23115326

### 🔴 综合评价-在赣院校名单含错误院校 🔧  `conf=high`
- **文件**: `special-admissions/zongping-2025.json → records[region_id=36, school.name_zh='在赣外省综评 7 校'].composite_formula.extras`
- **定位**: `records[region_id=36].composite_formula.extras`
- **现值**: 南科大 / 上科大 / 北外 / 上纽 / 深北莫 / 昆杜 / 国科大 (共7校)
- **应为**: 国科大应从列表移除；国科大2025年综合评价仅在北京/山东/江苏/浙江/陕西/湖南/四川7省开展，不含江西。校数应更正为6校
- **依据**: 中国科学院大学2025年本科综合评价招生简章（中国教育在线）明确招生省份为北京、山东、江苏、浙江、陕西、湖南、四川共7个省市，江西不在列。https://gaokao.eol.cn/zonghepingjia/zpjz/202505/t20250506_2667030.shtml

### 🟡 日程·成绩发布  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[江西].score_release`
- **定位**: `provinces[?province=='江西'].score_release`
- **现值**: 2026/6/23
- **应为**: 待人工核对（参考2025年实际为6/25，2026投影早2天）
- **依据**: 2025年江西高考成绩实际公布时间为6月25日（来源：https://gaokao.chsi.com.cn/gkxx/zc/ss/202506/20250622/2293392485.html 及 https://gaokao.eol.cn/jiang_xi/dongtai/202506/t20250623_2676274.shtml）。数据投影2026/6/23，比2025早2天。该条目已标注 tentative:true / based_on_year:2025，属合理估算，但2026官方日程尚未发布，无法确认。

### 🟡 日程·志愿填报（本科提前批）  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[江西].batches[本科提前批].fill_start`
- **定位**: `provinces[?province=='江西'].batches[?name=='本科提前批'].fill_start`
- **现值**: 2026/6/25 09:00
- **应为**: 待人工核对（2025年实际为6/26开始）
- **依据**: 2025年江西本科提前批（军警类）志愿填报实际为6月26日9:00开始（来源：https://lezhenedu.com/newsinfo.aspx?id=14156）。数据投影2026/6/25，早1天。条目已标 tentative:true，2026官方日程未发布。

### 🟡 日程·志愿填报（本科批）  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[江西].batches[本科批].fill_start / fill_end`
- **定位**: `provinces[?province=='江西'].batches[?name=='本科批'].fill_start`
- **现值**: fill_start=2026/6/29 09:00, fill_end=2026/7/2 17:00
- **应为**: 待人工核对（2025年实际为6/30 09:00 ~ 7/4 17:00，窗口4天而非3天）
- **依据**: 2025年江西本科批志愿填报实际时间为6月30日9:00至7月4日17:00（来源：https://lezhenedu.com/newsinfo.aspx?id=14156 及 https://gaokao.eol.cn/jiang_xi/dongtai/202506/t20250619_2675806.shtml）。数据投影起止均早1-2天，且窗口为3天而非实际4天。已标 tentative:true。

### 🟡 强基计划-清华入围线  `conf=low`
- **文件**: `special-admissions/qiangji-quota-2025.json → records[region_id=36, school.name_zh='清华大学'].ruwei_line.physical`
- **定位**: `records[region_id=36].ruwei_line.physical`
- **现值**: 611（仅physical类，无historical类数据）
- **应为**: 待人工核对
- **依据**: 数据标注来源 jxeea.cn + join-tsinghua.edu.cn，confidence=high，但多家第三方汇总（gk100.com 等）未收录江西清华强基入围线具体值；清华官网不公开分省分类入围分数线，无可引用URL直接证伪或证实611分

## 山东  （🔴1 🟡4 🔵1）

### 🔴 2026特别提示 数据错误 🔧  `conf=high`
- **文件**: `zhiyuan-rules-2026.json → ["2026特别提示"]["专业平行模式扩展"]`
- **定位**: `data.2026特别提示.专业平行模式扩展 (array index: 山东)`
- **现值**: 山东 被列入 "专业平行模式扩展" 省份列表
- **应为**: 山东自2020年新高考启动起已实行 "专业（专业类）+学校" 平行志愿，2026年官方实施办法延续该规则，无变化。山东不应出现在 "2026 新扩展" 列表中
- **依据**: 山东省2026年夏季高考工作实施办法（shandong.eol.cn/sdwj/202605/t20260518_2735434.shtml）确认沿用原规则；sdzk.cn 2025年录取意见（NewsID=6928）亦为同一框架，无 "2026 扩展" 变化记录

### 🟡 日历 - 成绩发布日期  `conf=medium`
- **文件**: `zhiyuan-calendar-2026.json → provinces[山东].score_release`
- **定位**: `data.provinces[?province=="山东"].score_release`
- **现值**: 2026/6/25
- **应为**: 待人工核对（官方措辞为 "6月26日前公布"，具体日期未在官方文件中给出；6/25 在窗口内但系推测值）
- **依据**: 山东省2026年夏季高考工作实施办法（shandong.eol.cn/sdwj/202605/t20260518_2735434.shtml）写明 "于6月26日前公布"；2025年实际发布时间亦为 "6月26日前"（6617.com/p_2046305374.html）

### 🟡 日历 - 常规批第2/3次填报时间与2025实际不符  `conf=medium`
- **文件**: `zhiyuan-calendar-2026.json → provinces[山东].batches[常规批 第 2 次 / 第 3 次]`
- **定位**: `data.provinces[?province=="山东"].batches[2..3].fill_start/fill_end`
- **现值**: 常规批第2次: 7/27-7/29；第3次: 8/10-8/11
- **应为**: 待人工核对（2025实际为：第2次 7/24-7/26，第3次 7/31；与数据偏差3天以上，且第3次日期完全不同。因标注 tentative=true，需等山东省考试院正式公告确认）
- **依据**: 2025年山东高考志愿填报时间（6617.com/p_2046305374.html）：常规批第2次 7月24-26日，第3次 7月31日。数据声称 based_on_year=2025 但与2025实际日期不符

### 🟡 数据质量 - 重复省份条目 🔧  `conf=high`
- **文件**: `zhiyuan-rules-2026.json → provinces 数组`
- **定位**: `data.provinces（两个 province=="山东" 的对象）`
- **现值**: provinces 数组中存在两条 province=="山东" 的记录：一条完整，一条为 {"-": "见上"} 的存根
- **应为**: 仅保留一条完整的山东记录，删除 {"-": "见上"} 存根，避免下游解析逻辑取到空条目
- **依据**: python3 直接读取 data/datasets/zhiyuan-rules-2026.json，len([p for p in data["provinces"] if p["province"]=="山东"]) == 2

### 🟡 huadang-lesson 省份志愿数隐含对应关系  `conf=medium`
- **文件**: `huadang-cases-2022-2025.json → cases[case_id=case-005].lesson`
- **定位**: `cases[0].lesson (case-005, year=2023, province=山东)`
- **现值**: lesson文本列举'山东、浙江、重庆、河北、辽宁...必须把96/80/112等志愿额度用足'
- **应为**: 河北本科批实际为96个志愿（与山东相同），112属于辽宁。文本中将'96/80/112'排列在5省之后，读者易将112误读为河北或重庆的志愿数。建议改为'96（山东/河北）/80（浙江）/112（辽宁）'以消歧义。
- **依据**: 中国教育在线: https://gaokao.eol.cn/news/202306/t20230619_2444819.shtml 确认河北2023年本科批最多96个志愿；辽宁省教育厅2025公告确认辽宁设112个志愿。

### 🔵 qiangji-quota 山东省覆盖不完整  `conf=low`
- **文件**: `qiangji-quota-2025.json → records where region_id=37`
- **定位**: `records[region_id=37] (共2条: 山东大学 quota=110, 清华大学 ruwei_line=679)`
- **现值**: 山东仅收录2所强基院校记录（山东大学+清华大学），39所全国强基校均接受山东考生
- **应为**: 待人工核对（其余37所强基校的山东入围线/名额未收录；现有2条数值本身未发现矛盾）
- **依据**: gk100.com汇总: https://www.gk100.com/read_31735781.htm 显示2025年39所强基校均在山东投放名额；daweilai211.com提到清华山东入围线约679分，与数据吻合。现有记录数值无误，属覆盖缺口。

## 河南  （🔴3 🟡4 🔵2）

### 🔴 体育综合分公式 — 术科单项分值 🔧  `conf=high`
- **文件**: `data/datasets/special-admissions/sports-formula-2025.json — records[region_id=41].formula.extras`
- **定位**: `formula.extras: '术科 3 项(每项 100): 100m+原地推铅球+立定跳远'`
- **现值**: 每项 100 分，3 项总计 300 分
- **应为**: 每项 50 分，3 项总计 150 分
- **依据**: 河南省教育考试院/教育厅 2025-01-24 公告原文：'三个考试项目……每项满分 50 分，总分 150 分'。来源：https://gaokao.eol.cn/he_nan/dongtai/202502/t20250208_2653995.shtml（转载 jyt.henan.gov.cn/2025/01-24/3117469.html）

### 🔴 体育综合分公式 — 公式档数（4 选 1 vs 5 选 1）  `conf=high`
- **文件**: `data/datasets/special-admissions/sports-formula-2025.json — records[region_id=41].formula.extras + notes`
- **定位**: `formula.extras 及 notes 均写 '4 选 1(院校自选)'`
- **现值**: 4 选 1，列出 4 套公式，缺失第 ⑤ 套（100% 专业）
- **应为**: 5 选 1：① 文×1；② 文×0.3+专×3.5；③ 文×0.5+专×2.5；④ 文×0.7+专×1.5；⑤ 专×5。院校未选择时默认 ③
- **依据**: 河南省招生投档录取规则（eol.cn 转载）：'体育本科批……每个专业均须由高校在以下 5 种综合成绩计算办法中选定 1 种'。来源：https://gaokao.eol.cn/he_nan/dongtai/202506/t20250611_2674005.shtml

### 🔴 体育综合分公式 — extras 内 ② ④ 编号对调  `conf=high`
- **文件**: `data/datasets/special-admissions/sports-formula-2025.json — records[region_id=41].formula.extras`
- **定位**: `extras 内：'② 文 70%+专 30%；④ 文 30%+专 70%'`
- **现值**: ② = 文 70%+专 30%（pro 系数 1.5），④ = 文 30%+专 70%（pro 系数 3.5）
- **应为**: 官方编号：② = 文 30%+专 70%（pro×3.5），④ = 文 70%+专 30%（pro×1.5）
- **依据**: 同上 eol.cn 5 套公式列表，② 为 文×0.3+专×3.5，④ 为 文×0.7+专×1.5。来源：https://gaokao.eol.cn/he_nan/dongtai/202506/t20250611_2674005.shtml

### 🟡 赋分制度描述  `conf=medium`
- **文件**: `data/datasets/score-system-2025.json → provinces["山西\|内蒙古\|河南\|四川\|陕西\|云南\|青海\|宁夏"].scaled_subjects[0].type`
- **定位**: `provinces[province='山西\|内蒙古\|河南\|...'].scaled_subjects[0].type`
- **现值**: 等级赋分 (5 等 21 级, 30-100)
- **应为**: 等级赋分 (5 等, 30-100) — "21级" 是北京专有等级细分方案，河南/河北实际采用 5 等比例等距换算，无 21 子级
- **依据**: 搜索结果明确指出：「'5等21级'和'等距21级'实际上是北京高考的赋分方案，而不是河北的方案」(gk100.com 搜索结果摘要)；河南官方政策解读(m.jyt.henan.gov.cn/2024/02-28/2954916.html)确认仅 5 等 A/B/C/D/E；但 score-system-2025.json 河北条目的 scaling_formula 也使用了 '等距 21 级换算' 表述，可能是作者自定义术语而非标准命名，故标 suspect 而非 error

### 🟡 志愿填报日历 — 本科批截止日  `conf=medium`
- **文件**: `data/datasets/zhiyuan-calendar-2026.json → provinces[河南].batches[name='本科批'].fill_end`
- **定位**: `provinces[province='河南'].batches[1].fill_end`
- **现值**: 2026/7/4 18:00
- **应为**: 2026/7/3 18:00（按 based_on_year=2025 推算；2025 年实际截止为 7 月 3 日 18:00）
- **依据**: 中国教育在线河南2025高考志愿填报时间页面(https://gaokao.eol.cn/he_nan/202505/t20250527_2671093.shtml) 明确载明：'6月30日8:00—7月3日18:00：填报普通本科批（含特殊类型志愿）和艺术本科批志愿'；数据文件 based_on_year=2025, tentative=true，但投影日期比 2025 实际多了 1 天

### 🟡 体育综合分公式 — 文化控制线  `conf=low`
- **文件**: `data/datasets/special-admissions/sports-formula-2025.json — records[region_id=41].culture_control_line`
- **定位**: `culture_control_line: {historical: 370, physical: 368}`
- **现值**: 历史类 370，物理类 368
- **应为**: 待人工核对
- **依据**: 官方文件（haeea.cn PDF）为二进制无法直接提取；eol.cn 转载说明控制线待考试后按比例划定，具体数值未见权威来源确认。数据来源标注为 docs/special-admissions-3year/henan.md（内部文档），无外部 URL。

### 🟡 综合评价 — 在豫 6 校名单  `conf=low`
- **文件**: `data/datasets/special-admissions/zongping-2025.json — records[region_id=41]`
- **定位**: `composite_formula.extras: '南科大 / 上科大 / 北外 / 上纽 / 昆杜 / 深北莫'`
- **现值**: confidence=low；数据来源仅 docs/henan.md（内部文档）
- **应为**: 待人工核对：各校 2025 年是否确实在河南招收综合评价生、且名单完整
- **依据**: 网络搜索未找到明确列出上述 6 校 2025 年在河南综评招生的权威页面（教育厅/各校官网）。河南本身不开展省内综评，外省校在豫招募综评生属小规模项目，信息分散。

### 🔵 艺术综合分公式 — 5 套公式编号及默认值标注  `conf=high`
- **文件**: `data/datasets/special-admissions/art-formula-2025.json — records[region_id=41, all 9 categories].formula.extras`
- **定位**: `formula.extras: '5-formula choice; default ⑤ 0.5/1.25'；formula.pro_factor=2.5`
- **现值**: extras 正确标注默认公式 ⑤：高考文化×0.5 + 专业×1.25；pro_factor 字段值为 2.5（内部归一化表示）
- **应为**: extras 与官方一致：公式 ⑤ = 文化×0.5 + 专业×1.25（默认）。pro_factor=2.5 系内部字段，语义与原始系数（1.25）不同，但 extras 文本已正确记录。无需修改，建议在 schema 文档中说明 pro_factor 的归一化含义。
- **依据**: 河南省教育厅 2025 年艺术类专业招生问答（jyt.henan.gov.cn/2025/04-30/3153944.html 及 bendibao 转载）：公式 ⑤ 为 '高考文化总成绩×0.5+专业省级统考成绩×1.25'，如高校未选则默认 ⑤。来源：https://m.zz.bendibao.com/edu/141558.shtm

### 🔵 港澳台联招 — 河南无考区记录（预期缺失）  `conf=high`
- **文件**: `data/datasets/special-admissions/qatw-channel-2025.json — records`
- **定位**: `Henan region_id=41 records count = 0`
- **现值**: 无河南专项记录
- **应为**: 预期为空：全国港澳台华侨联招考区仅设北京、上海、浙江、福建、广东、香港、澳门七地，河南考生须赴外省报考，本地无独立渠道，不应有记录。
- **依据**: 2025 年全国联招简章（gatzs.com.cn）列出七考区，无河南。来源：https://www.gatzs.com.cn/gatzs/pz/hongkong/202502/20250225/2293354654.html

## 湖北  （🔴4 🟡3 🔵0）

### 🔴 赋分等级结构 🔧  `conf=high`
- **文件**: `score-system-2025.json → provinces[province=湖北].scaled_subjects[0].type`
- **定位**: `provinces[?province=='湖北'].scaled_subjects[0].type`
- **现值**: 等级赋分 (5 等 21 级, 30-100)
- **应为**: 等级赋分 (5 等, 30-100)；湖北无21级细分，每等内连续比例换算
- **依据**: https://www.6617.com/p_318093259.html 及 https://www.gk100.com/read_2423315.htm 均明确湖北仅划分 A/B/C/D/E 5个等级，各等级内采用线性比例换算，不存在21个子级；'5等21级'为北京/天津制度

### 🔴 志愿填报截止日期 🔧  `conf=high`
- **文件**: `zhiyuan-calendar-2026.json → provinces[province=湖北].batches[name=本科提前批].fill_end`
- **定位**: `provinces[?province=='湖北'].batches[?name=='本科提前批'].fill_end`
- **现值**: 2026/7/2 17:00
- **应为**: 2026/6/30 17:00
- **依据**: https://www.gk100.com/read_53073019.htm 明确：'本科提前批 6月29日8:00至6月30日17:00'；https://www.ctdsb.net/c1673_202605/2749898.html 同样记载提前批截止6月30日，普通批截止7月2日

### 🔴 体育综合分控制线字段错位 🔧  `conf=high`
- **文件**: `sports-formula-2025.json → records[region_id=42].culture_control_line.zhuanke`
- **定位**: `records[region_id=42].culture_control_line.zhuanke`
- **现值**: 350
- **应为**: 120（体育高职高专文化控制线）；350 是本科专业素质测试合格线，应写入 professional_qualifying.benke
- **依据**: 湖北省教育厅2025年录取控制分数线通知 https://jyt.hubei.gov.cn/bmdt/ztzl/gxzs/xxgk/ywgg/202506/t20250625_5706233.shtml 明确：体育本科 文化390+专业350；体育高职高专 文化120+专业300。其他省份 zhuanke 文化线均在 140-200 之间，350 为明显异常值。

### 🔴 体育专业合格线缺失 🔧  `conf=high`
- **文件**: `sports-formula-2025.json → records[region_id=42].professional_qualifying`
- **定位**: `records[region_id=42].professional_qualifying`
- **现值**: {}（空对象）
- **应为**: {"benke": 350, "zhuanke": 300}
- **依据**: 湖北省教育厅2025年录取控制分数线通知 https://jyt.hubei.gov.cn/bmdt/ztzl/gxzs/xxgk/ywgg/202506/t20250625_5706233.shtml：体育本科专业素质测试合格线350分，高职高专300分。

### 🟡 赋分公式引用  `conf=low`
- **文件**: `score-system-2025.json → provinces[province=湖北].scaling_formula`
- **定位**: `provinces[?province=='湖北'].scaling_formula`
- **现值**: 同河北
- **应为**: 待人工核对
- **依据**: 河北赋分公式字段明确为'5等比例15%/35%/35%/13%/2%'，湖北各等级比例与河北一致，但湖北官方文件未见'同河北'表述；两省独立建制，引用方式可能引发误解。未找到权威来源直接否定，但建议展开为独立公式描述。

### 🟡 艺术类综合分公式缺失（书法/播音与主持/戏剧影视导演）  `conf=high`
- **文件**: `art-formula-2025.json → records[region_id=42, category in {书法, 播音与主持, 戏剧影视导演}].formula`
- **定位**: `records[region_id=42].formula where category in [书法, 播音与主持, 戏剧影视导演]`
- **现值**: null（3条记录）
- **应为**: 加法型公式：综合分 = (文化成绩+政策性加分) + 省级统考专业成绩（无乘数，无百分比加权）
- **依据**: 中国教育在线2025年湖北艺术类体育类录取解读 https://gaokao.eol.cn/hu_bei/dongtai/202506/t20250619_2675683.shtml 明确：播音与主持类、书法类、戏剧影视导演投档综合分 = 文化成绩+政策性加分+省统考专业成绩（非×2加权公式）。formula=null 会导致系统无法正确计算这3类考生的投档综合分。

### 🟡 民族预科通道未收录  `conf=low`
- **文件**: `minzu-policy-2025.json → records[region_id=42]`
- **定位**: `records[region_id=42]`
- **现值**: 仅含 bonus_tiers（加分），无少数民族预科班/民族班录取通道数据
- **应为**: 待人工核对：湖北是否有省内少数民族预科班或民族班招生政策（恩施州相关院校）
- **依据**: 数据集 _notes 提及预科通道（如 composite-009 等案例），但 minzu-policy 仅建模了加分场景，未包含预科批次控制线或降分录取幅度。未找到明确官方 URL 证伪，需查湖北省民委/教育厅预科招生公告。

## 湖南  （🔴3 🟡4 🔵0）

### 🔴 赋分等级描述 🔧  `conf=high`
- **文件**: `data/datasets/score-system-2025.json → provinces[湖南].scaled_subjects[0].type`
- **定位**: `provinces[?province=='湖南'].scaled_subjects[0].type`
- **现值**: 等级赋分 (5 等 21 级, 30-100)
- **应为**: 等级赋分 (5 等, 30-100)  ——  A/B/C/D/E 五档，无21级细分
- **依据**: 湖南省人民政府官网 http://www.hunan.gov.cn/xxgk/hygq/202105/t20210531_19396128.html 明确描述五档（A/B/C/D/E）；gk100.com 综合对照表 https://www.gk100.com/read_23187258.htm 确认：5等21级仅北京/天津（3+3模式），湖南3+1+2模式为5等，无21级子等级。

### 🔴 强基计划·入围比例 🔧  `conf=high`
- **文件**: `special-admissions/qiangji-quota-2025.json · records[region_id=43, school=湖南大学(10532)].ruwei_ratio`
- **定位**: `line 1720`
- **现值**: 5
- **应为**: 4（第一类考生按招生计划数4倍入围；破格入围6倍以内）
- **依据**: 湖南大学2025年强基计划招生简章（官方）：'按照强基计划分省分专业招生计划数4倍确定入围考核名单'，破格考生为6倍。来源: https://admi.hnu.edu.cn/info/1186/7117.htm（经 dxsbb.com/news/134681.html 等多处交叉核对）

### 🔴 体育统招·专业合格线 🔧  `conf=high`
- **文件**: `special-admissions/sports-formula-2025.json · records[region_id=43].professional_qualifying.benke`
- **定位**: `professional_qualifying.benke`
- **现值**: 155
- **应为**: 261（2025年湖南体育类本科专业统考控制分数线，历史/物理均为261）
- **依据**: 2025年湖南高考各批次录取控制分数线新闻发布会（6月25日）：'体育类历史类别文化349分、专业261分；体育类物理类别文化325分、专业261分'。155为高职专科层次专业合格线，不适用于本科。来源: https://www.icswb.com/h/100104/20250625/933331.html

### 🟡 志愿填报日程 — 本科批填报结束时间  `conf=medium`
- **文件**: `data/datasets/zhiyuan-calendar-2026.json → provinces[湖南].batches[本科批].fill_end`
- **定位**: `provinces[?province=='湖南'].batches[?name=='本科批'].fill_end`
- **现值**: 2026/7/1 17:00
- **应为**: 待人工核对（2025实际为7/2 17:00，数据偏早1天）
- **依据**: 2025年湖南本科批普通志愿填报实际截止 7月2日17:00（来源：https://gaokao.eol.cn/hu_nan/dongtai/202506/t20250623_2676491.shtml；https://www.163.com/dy/article/K2RAIS3M0534P59R.html）。数据标注 based_on_year=2025/tentative=true，但基准年数据本身已与官方记录差1天，建议以2026年湖南教育考试院正式公告为准。

### 🟡 志愿填报日程 — 本科批填报开始时间  `conf=medium`
- **文件**: `data/datasets/zhiyuan-calendar-2026.json → provinces[湖南].batches[本科批].fill_start`
- **定位**: `provinces[?province=='湖南'].batches[?name=='本科批'].fill_start`
- **现值**: 2026/6/26 08:00
- **应为**: 待人工核对（2025年本科批普通志愿开始填报为6/29；6/26是提前批及特殊类型志愿的开始时间）
- **依据**: 2025年湖南志愿填报分两阶段：第一阶段6/26-6/27为本科提前批+特殊类型；第二阶段6/29-7/2才是本科批普通志愿（来源：https://gaokao.eol.cn/hu_nan/dongtai/202506/t20250623_2676491.shtml）。数据中fill_start写为6/26，与本科批普通志愿实际开始时间不符，可能混淆了提前批与本科批。

### 🟡 志愿填报日程 — 分数公布时间  `conf=low`
- **文件**: `data/datasets/zhiyuan-calendar-2026.json → provinces[湖南].score_release`
- **定位**: `provinces[?province=='湖南'].score_release`
- **现值**: 2026/6/25
- **应为**: 待人工核对（2025年实际为6/24，数据晚1天）
- **依据**: 2025年湖南高考成绩公布时间为6月24日（来源：https://www.163.com/dy/article/K2RAIS3M0534P59R.html；https://finance.sina.com.cn/roll/2025-06-25/doc-infcfhrw8592458.shtml）。2026日程标注tentative=true，可接受，但基准年参照已差1天。

### 🟡 体育统招·文化控制线缺失  `conf=high`
- **文件**: `special-admissions/sports-formula-2025.json · records[region_id=43].culture_control_line`
- **定位**: `culture_control_line`
- **现值**: {} (空对象)
- **应为**: 待人工核对（官方已公布：物理类325分、历史类349分，应填入 physical:325, historical:349）
- **依据**: 2025年湖南高考录取控制分数线（长沙晚报网 https://www.icswb.com/h/100104/20250625/933331.html）明确列出体育类文化控制线，但数据字段为空对象，属数据缺失

## 广东  （🔴3 🟡3 🔵1）

### 🔴 艺术类统考合格线 🔧  `conf=high`
- **文件**: `data/datasets/special-admissions/art-formula-2025.json → records[region_id=44, category="舞蹈"].qualifying_score.benke`
- **定位**: `records[region_id=44, category=舞蹈].qualifying_score.benke`
- **现值**: 198
- **应为**: 150（广东省教育考试院官方：舞蹈类本专科统一合格线150分）
- **依据**: https://eea.gd.gov.cn/tzgg/content/post_4660258.html — 《关于公布广东省2025年普通高校招生音乐类、舞蹈类、表（导）演类...省统考合格线的通知》：舞蹈类本专科统一150分

### 🔴 艺术类统考合格线 🔧  `conf=high`
- **文件**: `data/datasets/special-admissions/art-formula-2025.json → records[region_id=44, category="音乐表演-器乐"].qualifying_score.benke`
- **定位**: `records[region_id=44, category=音乐表演-器乐].qualifying_score.benke`
- **现值**: 185
- **应为**: 170（广东省教育考试院官方：音乐表演（器乐）本科合格线170分）
- **依据**: https://eea.gd.gov.cn/tzgg/content/post_4660258.html — 同一通知：音乐表演（器乐）本科合格线170分，专科150分

### 🔴 综合评价院校数量 🔧  `conf=high`
- **文件**: `data/datasets/special-admissions/zongping-2025.json → records[region_id=44, school.name_zh="广东综评汇总 11 校"].school.name_zh`
- **定位**: `records[region_id=44, school.name_zh含"汇总"].school.name_zh + composite_formula.extras`
- **现值**: "广东综评汇总 11 校" / extras: "11 校,+115 vs 2024"
- **应为**: 12校（2025年西湖大学首次加入广东综评，实际12所高校共录取2964人）
- **依据**: https://www.zizzs.com/gk/guangdongxingaokao/207728.html — 《2022-2025广东省综合评价各高校录取人数统计》：2025年共12所高校；另见 https://m.sohu.com/a/896284266_121956424/ — 《2025广东综合评价招生新规全解析：12所高校》；官方录取名单含西湖大学10人

### 🟡 赋分公式标注  `conf=medium`
- **文件**: `score-system-2025.json → provinces[province=="广东"].scaling_formula`
- **定位**: `scaling_formula`
- **现值**: （空，继承自 '同河北'）河北公式：5等比例 15%/35%/35%/13%/2%; 赋分区间 100-86, 85-71, 70-56, 55-41, 40-30
- **应为**: 广东实际：等级比例 17%/35%/35%/13%/2%；赋分区间 A:100-83, B:82-71, C:70-59, D:58-41, E:40-30（起点30分，5等21级）
- **依据**: 多个民间来源（https://www.6617.com/p_2849941436.html；https://www.zizzs.com/gk/guangdongxingaokao/171916.html）均指出广东A等级比例为17%、赋分区间起点83，而河北A等级为15%、起点86。两省在A等比例和赋分上限切分上不同。未找到教育考试院官网一手文件，故标 suspect 而非 error。

### 🟡 日程·提前批填报窗口  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[province=="广东"].batches[name=="本科提前批"].fill_start`
- **定位**: `batches[0].fill_start`
- **现值**: 2026/6/29 19:00
- **应为**: 待人工核对（2025年广东部分提前批类别——军检院校/空军海军招飞——有单独早窗口 6/28 09:00-6/29 16:00，其余提前批才是 6/29 19:00；2026日程暂定）
- **依据**: 广州市政府门户 https://www.gz.gov.cn/zwfw/zxfw/jyfw7/content/post_10327311.html 记载2025年提前批分两段：第一段6/28 09:00-6/29 16:00（军检/招飞专项），第二段6/29 19:00起（普通类）。数据文件将所有提前批合并为单一填报窗口可能简化了结构。日历本身标注 tentative=true/based_on_year=2025。

### 🟡 民族加分结构化字段与注释不一致  `conf=medium`
- **文件**: `data/datasets/special-admissions/minzu-policy-2025.json → records[region_id=44]`
- **定位**: `records[region_id=44].bonus_tiers + notes`
- **现值**: bonus_tiers=[]（空数组），notes="广东无规模性瑶/壮少民加分专项;按国家民委公布的少民聚居区规定加分,通常 5 分"
- **应为**: 待人工核对：1）+5分实际仅适用于报考专科层次普通高校，不适用于本科（广东省官方政策），notes未体现此范围限制；2）若确实有+5条款，bonus_tiers应结构化记录而非仅存于notes文本；3）bonus_tiers=[]与notes中"通常5分"存在内部矛盾
- **依据**: 多个第三方信源均引用《粤民宗规〔2020〕1号》：广东少数民族聚居区考生报考"其他专科高校"可加5分，本科层次无此加分。搜索结果 https://www.6617.com/p_455705625.html 及 https://www.woquxue.com/7123.html 等均明确专科范围限定。未能找到广东2025年废止该+5政策的官方文件。

### 🔵 赋分最低分确认  `conf=high`
- **文件**: `score-system-2025.json → provinces[province=="广东"].scaled_subjects[0].type`
- **定位**: `scaled_subjects[0].type`
- **现值**: 等级赋分 (5 等 21 级, 30-100)
- **应为**: 正确（30分起点、100分上限）
- **依据**: https://www.6617.com/p_2849941436.html 明确：E等级赋分区间 40-30，最低赋分30分，与数据一致。

## 广西  （🔴1 🟡5 🔵0）

### 🔴 艺术类qualifying_score.benke 字段值错误（系统性） 🔧  `conf=high`
- **文件**: `data/datasets/special-admissions/art-formula-2025.json · records[169-180] (region_id=45)`
- **定位**: `records[169].qualifying_score.benke ~ records[180].qualifying_score.benke (全部12条广西艺术记录)`
- **现值**: 书法=225, 戏剧影视导演=200, 戏剧影视表演=185, 播音与主持=215, 服装表演=195, 美术与设计=200, 舞蹈=190, 音乐教育器乐/声乐=170, 音乐表演器乐/声乐=180
- **应为**: 本科录取控制分数线应为：书法=252, 戏剧影视导演=230, 戏剧影视表演=195, 播音与主持=226, 服装表演=197, 美术与设计=205, 舞蹈=195, 音乐教育=180, 音乐表演=190；且应补充 zhuanke 字段（对应现有benke值：书法=225, 导演=200, 表演=185, 播音=215, 服装=195, 美术=200, 舞蹈=190, 音乐教育=170, 音乐表演=180）
- **依据**: 官方来源：广西2025年高考分数线公布（桂林生活网，转自gxeea.cn）https://m.guilinlife.com/article/5ddtad77fe72033c9b44.html — 本科文艺统考分数线：书法252/播音226/导演230/表演195/舞蹈195/服装197/美设205/音乐表演190/音乐教育180；高职高专线：书法225/播音215/导演200/表演185/舞蹈190/服装195/美设200/音乐表演180/音乐教育170。数据中 benke 字段值与高职高专线完全一一对应，非本科线。

### 🟡 日历·志愿填报时间  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[province=广西].batches[name=本科批].fill_end`
- **定位**: `batches[1].fill_end`
- **现值**: 2026/7/2 17:00
- **应为**: 待人工核对（2025年广西本科普通批截止时间为7月3日10:00，2026年截止时间未在可访问的官方来源中明确确认）
- **依据**: 2025年广西招生考试院通知（gaokao.eol.cn/guang_xi/dongtai/202506/t20250617_2675146.shtml）载明本科普通批志愿填报截止为2025/7/3 10:00；2026年实施细则（2026-05-15发布）的全文未能成功抓取，具体截止时间和时刻未获官方来源确认。字段 tentative=false 但来源无法核实。

### 🟡 日历·成绩发布  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[province=广西].score_release`
- **定位**: `score_release`
- **现值**: 2026/6/24
- **应为**: 待人工核对（2025年广西成绩于6月24日前后发布，2026年具体日期未在可访问来源中明确）
- **依据**: 2025年广西本科提前批志愿填报于6月25日15:00开始，推测成绩于6月24日发布，与数据吻合；但2026年6/24具体日期仅依赖内推，未找到2026官方明确公告。tentative=false 标记存疑。

### 🟡 minzu-policy host_schools 列表完整性  `conf=low`
- **文件**: `data/datasets/special-admissions/minzu-policy-2025.json · records[19] (region_id=45)`
- **定位**: `records[19].host_schools`
- **现值**: [广西大学, 广西民族大学, 广西师范大学, 广西财经学院, 玉林师范学院, 广西中医药大学]
- **应为**: 待人工核对——广西大学、广西民族大学、广西师范大学、广西财经学院、玉林师范学院、广西中医药大学均有预科招生证据，但完整官方承办名单（含广西科技大学等）未能从单一官方文件核实；列表可能不全或含误。
- **依据**: 广西中医药大学预科招生章程确认承办（https://www.gxtcmu.edu.cn/zs/zszc/content_80450）；玉林师范学院预科招生确认（https://m.sohu.com/a/906803731_121956425/）；但搜索同时发现广西科技大学（gxust.edu.cn）也承办预科班，未在列表中。完整官方名单需查询gxeea.cn当年招生计划册。

### 🟡 minzu-policy bonus_tiers 边境县非三统一加分规则缺漏  `conf=medium`
- **文件**: `data/datasets/special-admissions/minzu-policy-2025.json · records[19] (region_id=45)`
- **定位**: `records[19].bonus_tiers (缺少边境县非三统一专项条目)`
- **现值**: 仅有通用非三统一条目：'不满足三统一但中学户籍+高中学籍+就读地均在桂(封顶)' bonus=7
- **应为**: 应额外包含：防城区/东兴/靖西/那坡/凭祥/大新/宁明/龙州 8个边境县考生，不符合三统一条件但上述边境县内户籍+学籍+就读的，加分为 5分（而非通用封顶7分）
- **依据**: https://www.gk100.com/read_148884232.htm 原文：'符合三统一条件的加15分，不符合条件的加5分'（针对边境县）；与通用非三统一最高7分规则不同，是独立条款。

### 🟡 zongping-2025 广西综评记录描述过于简略/置信度低  `conf=low`
- **文件**: `data/datasets/special-admissions/zongping-2025.json · records[115] (region_id=45)`
- **定位**: `records[115].composite_formula.extras`
- **现值**: '主要不在桂铺开'，confidence='low'，无具体参与院校或折算比例
- **应为**: 待人工核对——搜索确认南科大、华南理工、上科大等综评院校部分面向广西招生（2025年）；现记录未列举在桂实施综评的院校名单及各校折算比例
- **依据**: https://www.zizzs.com/gk/baokao/175388.html 提及2025广西综合评价院校包括南科大、华工等；eol.cn实施细则（gaokao.chsi.com.cn）确认广西2025年综评批次存在。数据记录置信度已标low，与实际情况吻合，但信息缺失程度需人工补充。

## 海南  （🔴2 🟡4 🔵1）

### 🔴 民族加分 🔧  `conf=high`
- **文件**: `data/datasets/special-admissions/minzu-policy-2025.json → records[region_id=46].bonus_tiers`
- **定位**: `records[region_id=46].bonus_tiers`
- **现值**: [] (空数组); notes: '2025 文件未单列硬加分'
- **应为**: 应含一条 {scope: '少数民族聚居地户籍少民(黎/苗等)', bonus: 10, requirements: '本人及监护人户籍+高中学籍+报考地三连在聚居地/所在市县', scope_universities: 'all'}, rollback_schedule 可留空或注明2027部分地区降5分
- **依据**: gaokao.eol.cn: https://gaokao.eol.cn/hai_nan/dongtai/202506/t20250604_2672562.shtml — '少数民族考生，加10分'; ea.hainan.gov.cn: https://ea.hainan.gov.cn/ywdt/ptgkyjszsb/202410/t20241011_3745791.html — 2025年加分申报表; haikou.bendibao.com: http://haikou.bendibao.com/news/2024526/65644.shtm 确认+10分，适用9市县+11乡镇少民聚居地

### 🔴 empty-data  `conf=high`
- **文件**: `dist/index.js (live fetch: static-data.gaokao.cn)`
- **定位**: `schoolspecialscore/31/2024/46.json, schoolspecialscore/140/2024/46.json, schoolspecialscore/114/2024/46.json`
- **现值**: HTTP 404 / NoSuchKey for all out-of-province 985 schools in Hainan for year=2024
- **应为**: Specialty-level score data (like 2023 which returns 200 OK with data)
- **依据**: curl -s --max-time 25 -o /dev/null -w '%{http_code}' https://static-data.gaokao.cn/www/2.0/schoolspecialscore/31/2024/46.json → 404; same for id=140 (清华大学) and id=114 (浙江大学). Year 2023 returns 200 for same schools. node dist/index.js actual '北京大学' --province hainan --year 2024 → {"ok":false,"error":"gaokao.cn 404 Not Found"}. This is a systematic upstream gap for 2024 specialty scores in Hainan, affecting all non-local top 985 schools. Local index pro_type_min['46'] does contain 2024 min scores (e.g. 北京大学 type3=844) so local index is NOT empty — only the live specialty-detail fetch fails.

### 🟡 赋分·单科分值范围描述  `conf=medium`
- **文件**: `data/datasets/score-system-2025.json → provinces[海南].scaling_formula`
- **定位**: `scaling_formula 字段`
- **现值**: 海南独有标准分制: 单科原始分 → 等级位次 → 标准分 (基于 全省 cohort z-score, 100-900 范围). 单科满分 300, 总分 900.
- **应为**: 单科标准分范围应为 60-300（公式 Ti=180+30×Zi，换算表区间[60,300]）；总合成分（综合分）范围才是 100-900（公式 Ti=500+100×Zi）。当前文本将两个区间混写在一句话里，可能误导读者以为单科也是100-900范围。
- **依据**: 搜索结果摘要：'依照转换公式Ti=180+30×Zi，建立《标准分与百分等级对照表(单科)-分数区间[60,300]》' 以及 '依照转换公式Ti=500+100×Zi，建立《标准分与百分等级对照表(综合分)-分数区间[100,900]》' — 来源：https://www.gk100.com/read_55359900.htm 等搜索结果摘要（未能直接取到原始页面，仅为搜索结果摘要）

### 🟡 日历·考试日期（内部notes与entry不一致）  `conf=medium`
- **文件**: `data/datasets/zhiyuan-calendar-2026.json → _notes[4] vs provinces[海南].exam_dates`
- **定位**: `_notes 数组第5条 vs 海南 exam_dates 字段`
- **现值**: _notes 写 '江苏/海南 6/7-6/9 (含选考科目)'，但海南 entry 写 exam_dates='6/7-6/10'
- **应为**: 海南高考实际为4天（6月7日至10日），海南entry的 '6/7-6/10' 有2025年实际数据支持，_notes中的 '6/7-6/9' 是内部不一致，应更正notes为 '6/7-6/10'。
- **依据**: 搜索结果多处来源确认：'2025年海南高考时间为6月7日至10日，共4天' — 来源摘要自 https://www.dxsbb.com/news/99191.html 及 https://haikou.bendibao.com/edu/2025526/74336.shtm 等。省考试局官网 http://ea.hainan.gov.cn/ 为最终权威来源。

### 🟡 民族加分退坡  `conf=low`
- **文件**: `data/datasets/special-admissions/minzu-policy-2025.json → records[region_id=46]`
- **定位**: `records[region_id=46].bonus_tiers[0].rollback_schedule`
- **现值**: 字段不存在（bonus_tiers为空）
- **应为**: 待人工核对 — 搜索结果提及2027年起东方市等部分市县降为+5分，但获取的官方文件(eol.cn/bendibao)未包含此退坡条款，需查阅海南省政府正式退坡公告
- **依据**: gk100.com提及2026取消/2027降5，但未获取省政府原文URL，证据链不完整

### 🟡 综合评价-入围分数线  `conf=low`
- **文件**: `data/datasets/special-admissions/zongping-2025.json → records[region_id=46, school=南方科技大学].ruwei_lines`
- **定位**: `records[region_id=46, school=南方科技大学].ruwei_lines`
- **现值**: [{program_group: '最高', score: 786}, {program_group: '平均', score: 758}]; extras: '最低位次 873'
- **应为**: 待人工核对 — 另一搜索结果提及'最低录取分数线728分'，与最高786/平均758形成区间内部自洽问题（728<758<786均属合理范围，但最低应低于平均）；缺最低分字段
- **依据**: gk100.com: '南方科技大学在海南省的最低录取分数线是728分'，但该来源不含原始招生公示URL，无法完全确认

### 🔵 志愿策略·冲稳保比例  `conf=low`
- **文件**: `data/datasets/zhiyuan-rules-2026.json → provinces[海南].策略`
- **定位**: `策略 字段`
- **现值**: 冲11/稳9/保10
- **应为**: 该字段为编辑性建议，不属于官方政策条文，无需强制一致；但通用滑档预警建议比例为 20/40/30/10（4段分法），与此3段分法(冲稳保=11/9/10=30)逻辑自洽，分母均为30志愿。无错误。
- **依据**: zhiyuan-rules-2026.json 通用滑档预警.滑档雷区：'冲稳保比例失衡（建议20/40/30/10）'——为通用4段建议；海南entry单独写了3段分法，两者分类维度不同，不构成矛盾。

## 重庆  （🔴0 🟡2 🔵2）

### 🟡 日程·成绩公布  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[0].score_release`
- **定位**: `provinces[province=重庆].score_release`
- **现值**: 2026/6/25
- **应为**: 待人工核对（多个预测来源指向2026/6/24）
- **依据**: gk100.com/read_6220338.htm 及 cq.bendibao.com 等多处预测成绩公布为6月24日；数据文件已标记 tentative:true，但具体日期与主流预测差1天。重庆2025年实际出分为6月25日，2026年正式通知未见。

### 🟡 民族加分 — 适用范围描述不完整  `conf=medium`
- **文件**: `special-admissions/minzu-policy-2025.json → records[region_id=50].bonus_tiers[0].scope`
- **定位**: `records[region_id=50].bonus_tiers[0].scope`
- **现值**: 渝东南民族聚居地(秀山/酉阳/彭水/石柱/黔江)土家族/苗族 等少民 — 普通类
- **应为**: 全市少数民族聚居地（含4个自治县：石柱/酉阳/秀山/彭水 + 14个民族乡：万州区恒合/地宝乡、武隆区石桥/文复/后坪/浩口乡、忠县磨子乡、云阳县清水乡、奉节县云雾/龙桥/长安/太和乡、巫山县红椿/邓家乡 + 黔江区）
- **依据**: jw.cq.gov.cn 官方附件《重庆市少数民族地区名单》(W020240308643948667308.doc) 列出4个自治县 + 14个民族乡 + 黔江区；gaokao.eol.cn 2025加分政策原文表述为「我市少数民族聚居地（含自治县、民族乡）」未限定渝东南；数据字段仅列5个主要地区，漏记14个民族乡

### 🔵 志愿填报·专业平行模式扩展描述  `conf=medium`
- **文件**: `zhiyuan-rules-2026.json → 2026特别提示.专业平行模式扩展`
- **定位**: `2026特别提示.专业平行模式扩展[重庆]`
- **现值**: 重庆 列于 专业平行模式扩展 省份列表
- **应为**: 应补充说明：扩展仅适用于本科提前批A段公安类（从院校顺序志愿改为60个专业平行志愿）；本科批96个专业+院校平行志愿早于2026年已实施，并非本次新扩展内容
- **依据**: cq.gov.cn 2026年征求意见通知（t20260413_15604992）：'本科提前批A段公安类设置60个专业平行志愿' 为2026年新变化；cq.gov.cn 2026年实施办法（t20260430_15710749）确认本科批96个专业平行志愿延续既有规则。列表本身无误，但无子注说明扩展范围，读者易误判为本科批整体改版。

### 🔵 强基计划 — 重庆大学选科表述  `conf=low`
- **文件**: `special-admissions/qiangji-quota-2025.json → records[region_id=50].notes`
- **定位**: `records[region_id=50].notes`
- **现值**: 物化必选
- **应为**: 物理必选（范围一），化学为范围二（也须选报，与物理同为申请条件）— 三专业组均要求物理+化学
- **依据**: zhaosheng.cqu.edu.cn/pub/desktopend/contentpage/1156 招生简章：数学/物理/储能三专业「科目范围一：物理，科目范围二：化学」，两者均须选报，表述「物化必选」实质准确但措辞可细化

## 四川  （🔴1 🟡4 🔵1）

### 🔴 赋分等级描述 🔧  `conf=high`
- **文件**: `score-system-2025.json → provinces[province='山西\|内蒙古\|河南\|四川\|...'].scaled_subjects[0].type`
- **定位**: `provinces[].scaled_subjects[0].type (四川所在条目)`
- **现值**: 等级赋分 (5 等 21 级, 30-100)
- **应为**: 等级赋分 (5 等级 A/B/C/D/E, 30-100)
- **依据**: 四川省教育考试院官方政策文件明确：再选科目赋分仅设 A/B/C/D/E 共 5 个等级，无子级细分；'5等21级'是北京市特有的子级划分体系（A1-A5、B1-B5等），不适用于四川。来源：https://www.sceea.cn/Html/202402/Newsdetail_3529.html

### 🟡 字段命名一致性 🔧  `conf=high`
- **文件**: `zhiyuan-rules-2026.json → provinces[province='四川'].vs_2024`
- **定位**: `provinces[province='四川'].vs_2024`
- **现值**: vs_2024: '合并本一本二'
- **应为**: vs_2025: '合并本一本二'（字段名应与其他31个省份统一使用 vs_2025）
- **依据**: 文件中所有其他省份（北京/天津/上海/浙江/山东等）均使用 vs_2025 字段；四川本一本二合并在2025年首届新高考中实施（《四川省2025年普通高校招生考试和录取工作实施方案》），对比基准应为2025年而非2024年。来源：https://sichuan.scol.com.cn/ggxw/202502/82894400.html

### 🟡 本科批A段含义标注  `conf=medium`
- **文件**: `zhiyuan-rules-2026.json → provinces[province='四川'].本科批.A段`
- **定位**: `provinces[province='四川'].本科批.A段`
- **现值**: A段：count=20，含='国家/地方专项'（无 majors 字段，无 调剂 字段）
- **应为**: A段也应标注 majors=6 和 调剂=true，官方规定 A段同样每组6个专业志愿并设调剂选项，与 B段一致
- **依据**: 四川省教育考试院官网明确：本科批A段（国家/地方专项）同样设置每院校专业组6个专业志愿及是否服从调剂选项。来源：https://www.sceea.cn/Html/202501/Newsdetail_4130.html

### 🟡 体育类综合分折算公式  `conf=medium`
- **文件**: `special-admissions/sports-formula-2025.json · records[region_id=51]`
- **定位**: `records[0].formula.kind = "weighted" / culture_pct=0.3 / pro_pct=0.7`
- **现值**: kind=weighted, culture_pct=0.3, pro_pct=0.7；extras说明综合=（文化/6）×30%+专业×70%
- **应为**: 四川2025体育类投档规则为：先按省级专业统考成绩排序，专业同分才比文化；数据中的weighted formula与官方"按专业分投档"表述之间的关系未在schema中明确区分——该formula是否仅用于展示、还是实际投档依据，需人工核对
- **依据**: 四川省人民政府网站(sc.gov.cn) 2025年1月23日文件：「根据考生省级专业统考成绩排序确定位次，考生省级专业统考成绩相同时比较高考文化成绩」；data notes字段已写「投档先专业分」，与官方一致，但schema kind=weighted可能误导下游逻辑

### 🟡 综合评价—中国科学院大学报名省份  `conf=low`
- **文件**: `special-admissions/zongping-2025.json · records[region_id=51, zs_code=14430]`
- **定位**: `composite_formula.extras = "7 省含川 (京/苏/浙/鲁/陕/湘/川)"`
- **现值**: 7省含川，enrolled=158
- **应为**: 待人工核对
- **依据**: 国科大2025综评数据来源标注为docs/special-admissions-3year/sichuan.md（内部文档），未找到权威外部URL明确列出四川在招省份范围；不能证伪，标suspect待查

### 🔵 民族加分—缺失艺体类分级  `conf=high`
- **文件**: `special-admissions/minzu-policy-2025.json · records[region_id=51].bonus_tiers`
- **定位**: `bonus_tiers (length=6)`
- **现值**: 6个tier，覆盖：少民/汉族×部委属外省\|省属原一本\|省属其他批次；无艺体类专项tier
- **应为**: 应补充2个tier：少民→省属高校艺体类专业加35分；汉族→省属高校艺体类专业加20分（两者均在2025年保持不变，2026年才统一退坡至20/10分）
- **依据**: cacsc.com.cn 2025年四川少数民族地区考生加分政策页面：「少数民族考生：原艺术体育类专业35分保持不变；汉族考生：原艺术体育类专业20分保持不变（省属高校）」；gaokao.eol.cn同口径确认

## 贵州  （🔴1 🟡4 🔵3）

### 🔴 艺术类综合分公式 🔧  `conf=high`
- **文件**: `data/datasets/special-admissions/art-formula-2025.json → records[region_id=52, category='播音与主持'].formula`
- **定位**: `records[region_id=52, category='播音与主持'].formula.culture_pct / pro_pct / pro_factor`
- **现值**: culture_pct=0.5, pro_pct=0.5, pro_factor=2.5
- **应为**: culture_pct=0.6, pro_pct=0.4, pro_factor=2.0（即 文化×60% + (专业/满分)×750×40%）
- **依据**: 官方文件 https://www.eduzs.org.cn/html/lmbkzc//2025/0109/8431.html 及 https://www.hzgrys.net/message/339.html 均明确：播音与主持类综合成绩=高考文化总成绩×60%+(省级统考成绩÷省级统考成绩满分)×750×40%。其他美术/音乐/舞蹈/表演/书法类才是50/50。数据源字段也标注 eduzs.org.cn，与官方文件矛盾。

### 🟡 志愿填报时间  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[贵州].batches[提前批A/B].fill_start / batches[本科批].fill_start`
- **定位**: `fill_start: '2026/6/27 00:00'`
- **现值**: 2026/6/27 00:00
- **应为**: 待人工核对（一个第三方来源引2025参考值为6月28日，官方2026细则仅说'成绩发布后进行'未给出具体日期）
- **依据**: https://www.gk100.com/read_3677549.htm 标注'参考2025年官方信息'，显示志愿填报为6月28日00:00；官方2026细则 https://gaokao.eol.cn/gui_zhou/dongtai/202604/t20260414_2728133.shtml 未给出具体填报起止日期

### 🟡 2026特别提示分类  `conf=low`
- **文件**: `zhiyuan-rules-2026.json → 顶层.2026特别提示.专业平行模式扩展[]`
- **定位**: `专业平行模式扩展: ['贵州', '青海', '重庆', ...]`
- **现值**: 贵州列入'专业平行模式扩展'名单
- **应为**: 待人工核对；贵州2024年（首届3+1+2）已采用专业(类)平行志愿，并非2026新增扩展。若该字段表示'2025→2026发生变化'则贵州可能不应在此列
- **依据**: 官方2026细则 https://gaokao.eol.cn/gui_zhou/dongtai/202604/t20260414_2728133.shtml 确认贵州本科批采用96个专业(类)平行志愿，但未说明这是2026年新变化；贵州2024年首届即为专业平行模式

### 🟡 强基计划 中国农业大学贵州入围比例  `conf=low`
- **文件**: `data/datasets/special-admissions/qiangji-quota-2025.json → records[region_id=52, school='中国农业大学'].ruwei_ratio`
- **定位**: `records[region_id=52, school.zs_code='10019'].ruwei_ratio`
- **现值**: ruwei_ratio=4
- **应为**: 待人工核对
- **依据**: https://jwzs.cau.edu.cn/art/2025/4/16/art_4528_1064487.html 确认中国农业大学2025年强基计划新增贵州招生（status=added 吻合），但未能在公开页面找到明确的贵州省入围比例=4的原文。比例数值需通过官方简章或入围结果公告核实。

### 🟡 综合评价 贵州覆盖度  `conf=low`
- **文件**: `data/datasets/special-admissions/zongping-2025.json → records[region_id=52]`
- **定位**: `records[region_id=52].composite_formula.extras`
- **现值**: '贵州非综评常规省份 (36 校未在黔大规模投放)'，confidence=low，source=本地markdown
- **应为**: 待人工核对具体院校数（36校）是否有权威来源支撑
- **依据**: 数据来源为 docs/special-admissions-3year/guizhou.md（本地文档），无外部URL可核查。贵州确实非综评主流省份这一判断符合常识，但'36校'的具体数字未找到公开来源印证。

### 🔵 志愿单位字段表述  `conf=medium`
- **文件**: `zhiyuan-rules-2026.json → provinces[贵州].本科批.unit`
- **定位**: `unit: '专业+院校'`
- **现值**: 专业+院校
- **应为**: 专业(类)+院校（官方表述含'类'字）
- **依据**: 官方2026细则 https://gaokao.eol.cn/gui_zhou/dongtai/202604/t20260414_2728133.shtml 明确表述为'以1个专业(类)+1个院校为1个志愿'；功能含义相同，仅措辞不含'(类)'

### 🔵 民族加分退坡  `conf=high`
- **文件**: `data/datasets/special-admissions/minzu-policy-2025.json → records[region_id=52].bonus_tiers[scope='二类区少民(末年)']`
- **定位**: `records[region_id=52].bonus_tiers[1].scope`
- **现值**: scope='二类区少民(末年)', bonus=5, rollback_schedule={'2026':0}
- **应为**: 数据值与政策一致，无需修改；'末年'标注准确（2025是二类区最后一年加分）
- **依据**: https://www.gk100.com/read_3476301.htm 及搜索结果确认：2024-2025年一类区0分、二类区5分、三类区10分；2026年起一二类均取消，三类区保留5分。与 rollback_schedule 完全吻合。

### 🔵 强基计划 北京大学贵州入围线  `conf=medium`
- **文件**: `data/datasets/special-admissions/qiangji-quota-2025.json → records[region_id=52, school='北京大学'].ruwei_line`
- **定位**: `records[region_id=52, school.zs_code='10001'].ruwei_line.physical`
- **现值**: physical=595
- **应为**: 与多个第三方信息源引用的595吻合，未发现矛盾；官方精确数据无法从公开页面直接获取（需登录查询系统）
- **依据**: https://www.gk100.com/read_70636.htm 及 https://www.gaokzx.com/gk/zizhao/142787.html 均引用贵州物理类595分，但这些是第三方汇总源，未能直接从北大官网获取原始文件核实。

## 云南  （🔴3 🟡3 🔵0）

### 🔴 志愿规则字段 🔧  `conf=high`
- **文件**: `data/datasets/zhiyuan-rules-2026.json → provinces[province=="云南"].vs_2024`
- **定位**: `provinces[province=="云南"].vs_2024`
- **现值**: key名为 vs_2024，值 "专业由6→10"
- **应为**: key名应为 vs_2025（与其余所有省份一致），且内容说明应反映 2025首届 → 2026第2年 的变化，而非 2024→2025；因为云南 2024 年仍为旧高考，不存在院校专业组制度
- **依据**: repo 内其余省份（北京、天津、上海等28省）均使用 vs_2025 字段；云南2025年为3+1+2首届，2024年实行旧高考无院校专业组。见 grep 输出：其余批5首届省份（山西、河南、四川、陕西、青海、宁夏）同样使用 vs_2025 或 vs_2024（河南/四川因合并本一本二而用vs_2024）。云南无合并本科批情况，字段名用错。

### 🔴 日历批次注释 🔧  `conf=high`
- **文件**: `data/datasets/zhiyuan-calendar-2026.json → provinces[province=="云南"].batches[name=="本科批 B"].notes`
- **定位**: `provinces[province=="云南"].batches[name=="本科批 B"].notes`
- **现值**: "40 院校专业组 × 10 专业, 调剂 (3+1+2 第 2 年; 2024 起专业 6→10)"
- **应为**: "2024起" 应改为 "2025起" 或 "首届起"。云南旧高考（2024及以前）不存在院校专业组制度，10专业/组是2025年3+1+2首届改革新设，并非2024年起
- **依据**: 知乎文章《2025年云南省首届新高考，最多可填10个专业志愿！》https://zhuanlan.zhihu.com/p/20467687022 及中国教育在线 https://gaokao.eol.cn/news/202501/t20250127_2653757.shtml 均明确指出10专业/组为2025首届新规，非对2024制度的修改

### 🔴 民族加分适用范围 🔧  `conf=high`
- **文件**: `data/datasets/special-admissions/minzu-policy-2025.json — records[0].bonus_tiers[0..2].scope_universities`
- **定位**: `region_id=53, bonus_tiers[0] (边疆县+10) / [1] (内地19民族+5) / [2] (彝族壮族+5)`
- **现值**: "scope_universities": "provincial_only" (三个加分档均如此)
- **应为**: "scope_universities": "national"（三档均属全国性加分，可投全国高校；仅独生子女+10为地方性）
- **依据**: https://m.km.bendibao.com/edu/90526.shtm 明确将边疆县少数民族/汉族+10、内地指定少数民族+5、彝族壮族+5列为「全国性加分项目」；只有「农业人口独生子女+10」列为「地方性加分项目（仅限省内普通高校）」

### 🟡 日历志愿填报时间  `conf=low`
- **文件**: `data/datasets/zhiyuan-calendar-2026.json → provinces[province=="云南"].batches 各批次 fill_start/fill_end`
- **定位**: `provinces[province=="云南"].batches[*].fill_start / fill_end`
- **现值**: fill_start: 2026/6/27 09:00，fill_end: 2026/7/1 18:00（三批次相同）
- **应为**: 待人工核对。2025年实际填报时间为 6/28 09:00 至 7/2 18:00（周六→周三），与数据中 6/27（周六）→7/1（周三）相差1天整。两者星期对应相同，但 tentative=true 已标注；2026年云南官方日程未公布前无法确认
- **依据**: https://www.gaokzx.com/gk/zhiyuan/142662.html 记录2025年云南正式填报时间为6/28-7/2；https://news.qq.com/rain/a/20250627A0844G00 腾讯新闻证实7月2日截止。数据文件本身标注 tentative:true

### 🟡 日历分数公布时间  `conf=low`
- **文件**: `data/datasets/zhiyuan-calendar-2026.json → provinces[province=="云南"].score_release`
- **定位**: `provinces[province=="云南"].score_release`
- **现值**: "2026/6/23"
- **应为**: 待人工核对。2025年云南实际分数线公布为6/25，2026预测提前2天为6/23（周二），属推算值。标注 tentative=true。需以云南招考频道2026正式公告为准
- **依据**: https://news.qq.com/rain/a/20250625A03ZTU00 腾讯新闻标题《刚刚！2025云南高考分数线公布！》日期为2025-06-25，证实2025实际日期为6/25；数据中6/23属推算

### 🟡 体育综合分省控线字段混淆  `conf=medium`
- **文件**: `data/datasets/special-admissions/sports-formula-2025.json — records[0].culture_control_line.benke`
- **定位**: `region_id=53, culture_control_line.benke=180`
- **现值**: culture_control_line: {physical: 370, historical: 385, zhuanke: 180, benke: 180}
- **应为**: 待人工核对。源文档「专业本科省控线180」是专业成绩本科控制线，而非文化成绩控制线。文化控制线本科仅含物理=370/历史=385。benke=180应归属专业成绩控制线字段，而非culture_control_line。对比其他省份，culture_control_line.benke通常为300-420分段，180明显偏低，与物理=370/历史=385并列语义冲突。
- **依据**: docs/special-admissions-3year/yunnan.md 原文：「文化省控线: 物理类本 370 / 历史类本 385;专科 180;专业本科省控线 180」——「专业本科省控线」是专业分控制线，被误放入culture_control_line.benke字段

## 西藏  （🔴1 🟡4 🔵1）

### 🔴 民族加分 🔧  `conf=high`
- **文件**: `special-admissions/minzu-policy-2025.json`
- **定位**: `records[region_id=54].bonus_tiers[5].requirements`
- **现值**: +1/年,≤30;双方在藏取较长一方;民大及驻内地办事处除外
- **应为**: +1/年,≤30;双方在藏取较长一方;民大及驻内地办事处（格尔木办事处除外）除外
- **依据**: 官方2024招生规定第50条原文：「在西藏民族大学、驻内地办事处（格尔木办事处除外）工作时间不计入加分」，来源：https://gaokao.eol.cn/xi_zang/dongtai/202405/t20240506_2602950.shtml 及 https://www.gk100.com/read_149597595.htm 均确认格尔木办事处为例外之例外（其工龄可计入加分）。数据写成「驻内地办事处除外」，将格尔木一并排除，导致格尔木在藏办事处工作人员子女被错误地认定为不享受工龄加分。

### 🟡 加分政策描述  `conf=low`
- **文件**: `zhiyuan-rules-2026.json → provinces[西藏].vs_2025`
- **定位**: `provinces[province=="西藏"].vs_2025`
- **现值**: 加分微调进藏干部子女+30/汉族+10
- **应为**: 待人工核对：2024年政策已是进藏干部子女最高+30、汉族少数民族+10，'微调'描述含义不明——2025年实际变化为执行新监管框架（藏招委〔2022〕4号），但数值本身未见变化
- **依据**: https://gaokao.eol.cn/xi_zang/dongtai/202405/t20240506_2602950.shtml 2024年已记录：进藏干部子女在藏每满一年+1分最高不超过30分；汉族少数民族+10分。https://gaokao.eol.cn/xi_zang/dongtai/202506/t20250604_2672593.shtml 2025年执行新实施意见但未公布分值变化。

### 🟡 2026日历：本科批志愿填报开始时间  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[西藏].batches[本科批 平行段].fill_start`
- **定位**: `provinces[province=="西藏"].batches[name=="本科批 平行段"].fill_start`
- **现值**: 2026/6/26 09:00
- **应为**: 待人工核对：2025年实际正式填报起始为6月29日10:00（来源：西藏政府公告），2026数据早3天且字段标为tentative=true
- **依据**: https://www.xizang.gov.cn/zmhd/hygq/202506/t20250627_486548.html 确认2025年正式填报6月29日10:00至7月4日22:00；数据文件将2026年预估提前至6/26，且tentative=true已标注不确定性

### 🟡 2026日历：本科提前批志愿填报窗口与2025实际不符  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[西藏].batches[本科提前批].fill_start / fill_end`
- **定位**: `provinces[province=="西藏"].batches[name=="本科提前批"]`
- **现值**: fill_start=2026/6/26 09:00, fill_end=2026/7/1 18:00
- **应为**: 待人工核对：2025年西藏实行所有批次一次性填报（6/29-7/4），与数据里单独设置提前批不同窗口不一致；tentative=true已标注
- **依据**: https://gaokao.eol.cn/xi_zang/dongtai/202506/t20250627_2677549.shtml 确认2025年所有批次统一一次性填报，正式填报6月29日至7月4日

### 🟡 empty-data  `conf=high`
- **文件**: `cli/dist/index.js (actual command, province=xizang)`
- **定位**: `schoolspecialscore/364/2024/54.json, schoolspecialscore/470/2024/54.json, schoolspecialscore/1093/2024/54.json`
- **现值**: {"ok":false,"error":"gaokao.cn 404 Not Found for https://static-data.gaokao.cn/www/2.0/schoolspecialscore/364/2024/54.json"} (同样 470/54, 1093/54)
- **应为**: 返回 Xizang 省内招生数据（西藏大学、西藏民族大学、西藏藏医药大学 在本省的实际录取分）
- **依据**: node dist/index.js actual "西藏大学" --province xizang --year 2024 → HTTP 404; node dist/index.js actual "西藏民族大学" --province xizang --year 2024 → HTTP 404; node dist/index.js actual "西藏藏医药大学" --province xizang --year 2024 → HTTP 404。对比确认：同一学校换省份（/364/2024/53.json, /470/2024/61.json）均返回 HTTP 200。结论：gaokao.cn static-data 不发布省 54（西藏）在省内院校的 schoolspecialscore 数据；本地索引 pro_type_min['54'] 对这三所校均无条目，属上游数据缺口，非本地 index-drift。

### 🔵 rank-table-missing  `conf=high`
- **文件**: `cli/data/yifenyiduan/`
- **定位**: `xizang-*-science.json / xizang-*-history.json（任意年份均无）`
- **现值**: ls cli/data/yifenyiduan/ \| grep xizang → 无输出；node dist/index.js rank --score 550 --province xizang --track science --year 2025 → {"ok":false,"error":"no 一分一段 table for 西藏 2025 science"}
- **应为**: 存在 xizang-20xx-science.json（及 wenke/history）一分一段表文件
- **依据**: node dist/index.js rank-tables 2>&1 \| grep xizang → 无结果；node dist/index.js rank --score 550 --province xizang --track science --year 2025 返回明确报错。西藏使用 old（非新高考）制度，默认 track=science。rank 功能对此省完全不可用。

## 陕西  （🔴0 🟡5 🔵2）

### 🟡 日程·出分时间  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[province=陕西].score_release`
- **定位**: `provinces[province=陕西].score_release`
- **现值**: 2026/6/24
- **应为**: 待人工核对（参考2025实际为6月25日）
- **依据**: 陕西省人民政府官网 https://www.shaanxi.gov.cn/xw/sxyw/202506/t20250625_3535769.html 明确：2025年陕西高考成绩于6月25日12时公布。数据文件本身标注 based_on_year=2025、tentative=true，但推算结果偏早1天。2026官方日程尚未发布，无法确认。

### 🟡 日程·志愿填报时间  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[province=陕西].batches[name=本科批]`
- **定位**: `batches[name=本科批].fill_start / fill_end`
- **现值**: fill_start=2026/6/27 08:00, fill_end=2026/7/1 18:00
- **应为**: 待人工核对（2025实际为6月25日12:00至6月30日12:00）
- **依据**: 多个来源（xa.bendibao.com/edu/202563/141578.shtm、cj.sina.com.cn articles）证实2025年本科批志愿填报为6月25日12:00—6月30日12:00，与数据中6/27—7/1不符。但2026年官方填报日程尚未发布，不能断定数据错误。

### 🟡 日程·本科提前批填报时间  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[province=陕西].batches[name=本科提前批]`
- **定位**: `batches[name=本科提前批].fill_start / fill_end`
- **现值**: fill_start=2026/6/27 08:00, fill_end=2026/7/1 18:00
- **应为**: 待人工核对（2025实际本科提前批为6月25日—6月27日12:00）
- **依据**: 2025年陕西高考提前批填报截止为6月27日12:00（gaokzx.com/gk/zhiyuan/141823.html），与数据中同为6/27起填有矛盾（提前批通常先于主批结束）。2026官方未发布。

### 🟡 强基计划-入围比例  `conf=medium`
- **文件**: `special-admissions/qiangji-quota-2025.json → records[region_id=61, school=西北工业大学]`
- **定位**: `records[1].ruwei_ratio`
- **现值**: 字段缺失 (MISSING)
- **应为**: 4（第一类考生按4倍入围，数学145+可5倍内破格）
- **依据**: 西北工业大学2025强基简章：第一类考生按分省计划4倍确定入围名单；数学145分及以上且进入5倍内可破格。来源：https://www.zizzs.com/gk/qiangjijihua/198375.html 及 https://www.zizzs.com/gk/qiangjijihua/195781.html 。西北农林5倍、西交大5倍均已填写，唯独西工大缺失。

### 🟡 民族加分-聚居区分值  `conf=low`
- **文件**: `special-admissions/minzu-policy-2025.json → records[region_id=61]`
- **定位**: `records[0].bonus_tiers`
- **现值**: bonus_tiers: [] （空数组，notes仅称'少民聚居区少民仍享国家规定加分'，无具体分值）
- **应为**: 待人工核对（官方信息显示聚居区加分2023年从20分降至15分，2025年是否继续退坡需查陕西省招工实施办法原文图片版）
- **依据**: 搜索结果显示散居区加分2025年已取消，聚居区2023年从20分降至15分，但2025年具体分值未在可读文本中出现。官方政策文件（sneea.cn/info/1027/16347.htm）以图片形式存储，无法自动抓取文字。来源：https://www.gk100.com/read_13668525.htm

### 🔵 综合评价-记录完整性  `conf=high`
- **文件**: `special-admissions/zongping-2025.json → records[region_id=61]`
- **定位**: `records[0].school.is_local=false, composite_formula.extras`
- **现值**: school.name_zh='在陕外省综评', is_local=false, extras='陕西本省综评极少 (含西交大综评主要面向外省)', confidence='low'
- **应为**: 数据如实反映现状：陕西无省级综评试点，西安交通大学综合评价主要面向外省考生，数据表述准确。
- **依据**: 陕西省2025年高考改革方案（sneea.cn）未提及综合评价招生试点；西安交通大学综合评价招生简章显示主要面向外省（非陕西）考生。数据字段confidence=low且标注为外省综评，属实。

### 🔵 滑档案例-专项批次规则一致性  `conf=high`
- **文件**: `huadang-cases-2022-2025.json → cases[case_id=composite-027]`
- **定位**: `cases[1].what_happened`
- **现值**: 陕西2025把国家/地方/高校专项统一归入本科批（之前在提前批）
- **应为**: 表述部分准确，但需细化：国家专项+地方专项归入本科批（正确）；高校专项并非归入本科批内，而是独立设置于'本科批前高校专项类'单独栏目投档，与普通本科批并列。
- **依据**: 陕西省政府官网2025年专项计划通知：'国家专项计划和地方专项计划安排在普通类招生本科批次录取，高校专项计划…在本科批次前的专门栏目（高校专项类）填报志愿（设1个院校志愿，6个专业志愿），单独投档录取'。来源：https://www.shaanxi.gov.cn/xw/sxyw/202504/t20250404_3480776_wap.html

## 甘肃  （🔴1 🟡4 🔵1）

### 🔴 强基计划-院校在省招生状态 🔧  `conf=high`
- **文件**: `data/datasets/special-admissions/qiangji-quota-2025.json → records[region_id=62, school.zs_code=90002]`
- **定位**: `records[school.name_zh=国防科技大学, region_id=62].status`
- **现值**: status=unchanged, ruwei_line={physical: 595}
- **应为**: 该校2025年在甘肃无强基计划招生，应标记 status=removed 或删除该条目
- **依据**: 自主选拔在线(zizzs.com/gk/qiangjijihua/199286.html)明确列出：'华科大、北师大、吉大、电子科大、中央民大、西北工大、东北大学、国防科大、华东师范、人大10校在甘肃地区没有招生计划'；同源(zizzs.com/gk/qiangjijihua/210674.html)再次确认'国防科大在甘肃2025年强基计划中无招生计划'；gk100.com搜索结果摘要亦列国防科大为甘肃无招校。

### 🟡 志愿日历·C段填报起始时间  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[甘肃].batches[本科C段].fill_start`
- **定位**: `provinces[province=甘肃].batches[name=本科C段].fill_start`
- **现值**: 2026/6/29 20:00
- **应为**: 待人工核对（2025年实际为6/26 20:00，距成绩发布仅1天；2026数据距估计成绩发布6/24长达5天，时间跨度与2025规律不符）
- **依据**: eol.cn 2025甘肃志愿填报报道：'第一次填报时间为6月26日20时至7月1日10时'（C段主填）；成绩发布2025实际为6/25；两者相差1天，而2026数据预测差5天。来源：https://gaokao.eol.cn/gan_su/dongtai/202506/t20250620_2675901.shtml

### 🟡 志愿规则·本科B段缺失  `conf=medium`
- **文件**: `zhiyuan-rules-2026.json → provinces[甘肃]（无本科B段字段）；zhiyuan-calendar-2026.json → provinces[甘肃].batches（无本科B段条目）`
- **定位**: `provinces[province=甘肃]（缺少本科B段键）`
- **现值**: 无本科B段数据
- **应为**: 待人工核对补充：本科B段（1个院校专业组志愿 × 6专业 + 调剂选项，顺序志愿，不征集），2025年填报时间约6/26–6/28
- **依据**: eol.cn 2025甘肃批次表：'本科批B段：设置1个院校专业组志愿，设置6个专业选项和1个服从专业调剂选项。不征集志愿。'；来源：https://gaokao.eol.cn/gan_su/dongtai/202506/t20250619_2675747.shtml

### 🟡 综合评价-本科批次覆盖  `conf=low`
- **文件**: `data/datasets/special-admissions/zongping-2025.json → records[region_id=62]`
- **定位**: `records[region_id=62].composite_formula.extras`
- **现值**: extras='甘肃普通本科综评通常无'，confidence=low
- **应为**: 待人工核对：需确认2025年甘肃是否有省内本科高校开展综合评价录取（搜索结果均指向高职层次综评，本科层次无官方公开证据）
- **依据**: ganseea.cn 2025年招生工作规定未提及本科层次综评；多条搜索结果显示甘肃2025综评均为高职(专科)层次分类考试招生（ganseea.cn/gaokaogaozhao/1355.html）；但数据本身已标注 confidence=low，与现有证据一致。

### 🟡 强基计划-入围比例  `conf=low`
- **文件**: `data/datasets/special-admissions/qiangji-quota-2025.json → records[region_id=62]`
- **定位**: `records[region_id=62, school.zs_code=10730].composite_formula（兰州大学代表样本）`
- **现值**: 所有甘肃强基条目均未记录入围倍数字段
- **应为**: 待人工核对：兰州大学2025强基章程明示按计划6倍划定初试合格线（zsb.lzu.edu.cn/2025/0417/296094.html）；gk100.com摘要称大部分高校入围比例调整为4倍（与2024年5倍不同）——两者口径不同，可能兰州大学单独采用6倍，其余高校4倍。数据集未收录该字段，不构成错误，但缺失信息值得补充。
- **依据**: zsb.lzu.edu.cn招生简章：'按照分省分专业计划的6倍划定初试合格线'；gk100.com搜索摘要：'大部分高校入围比例调整为4倍(2024年是5倍)'

### 🔵 志愿日历·成绩发布日期  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[甘肃].score_release`
- **定位**: `provinces[province=甘肃].score_release`
- **现值**: 2026/6/24（tentative=true）
- **应为**: 待人工核对（2025年实际为6/25；数据集自注说明多数省6/23-6/25之间，6/24在范围内但比2025提前1天）
- **依据**: 2025年甘肃成绩实际发布6/25 12时；来源：https://www.163.com/dy/article/K2QBIHDI05149T3G.html；数据文件_notes[5]已说明'具体时点以省考试院最终公告为准'，tentative=true已标注

## 青海  （🔴1 🟡5 🔵2）

### 🔴 体育统考合格线字段不一致  `conf=high`
- **文件**: `cli/data/datasets/special-admissions/sports-formula-2025.json — records[region_id=63].professional_qualifying.benke`
- **定位**: `records[region_id=63].professional_qualifying.benke`
- **现值**: 56
- **应为**: 不适合用单一值表达：历史组合格线=55，物理组合格线=58（两科分别不同）。建议改为 {"historical": 55, "physical": 58}
- **依据**: 搜索结果及搜狐报道确认：青海省2025年体育类专业统考合格线 历史类55.00分、物理类58.00分 (https://m.sohu.com/a/896653527_121956424)。同一记录的 notes 字段已正确记载 '统考合格线 史 55/物 58'，与顶层 benke=56 自相矛盾。

### 🟡 赋分制描述  `conf=medium`
- **文件**: `data/datasets/score-system-2025.json → provinces["山西\|内蒙古\|河南\|四川\|陕西\|云南\|青海\|宁夏"].scaled_subjects[0].type`
- **定位**: `provinces[province=~青海].scaled_subjects[0].type`
- **现值**: 等级赋分 (5 等 21 级, 30-100)
- **应为**: 等级赋分 (5 等, 30-100)；青海官方文件未提及「21级」，仅描述5等+等比例转换公式
- **依据**: 青海省政府官网政策解读（https://www.gaokzx.com/c/202402/91670.html 转载自青海考试院）明确：「将考生原始分数从高到低依次划分为A、B、C、D、E共5个等级」，使用等比例转换公式，文件通篇无「21级」表述。「21级」标签来自河北官方描述，被数据文件以「同河北」方式套用于青海，但青海本省文件中无此表述。

### 🟡 赋分制描述  `conf=low`
- **文件**: `data/datasets/score-system-2025.json → provinces["山西\|内蒙古\|河南\|四川\|陕西\|云南\|青海\|宁夏"].scaling_formula`
- **定位**: `provinces[province=~青海].scaling_formula`
- **现值**: 同河北
- **应为**: 待人工核对：青海官方赋分办法与河北等比例换算逻辑相似，但青海官方文件未使用「同河北」或「21级换算」等说法，应以青海省考试院原文为准
- **依据**: 青海省考试院赋分办法（来源：https://www.gaokzx.com/c/202402/91670.html）：5等比例15%/35%/35%/13%/2%，赋分区间100-86/85-71/70-56/55-41/40-30，使用等比例转换公式，与河北结构一致但无官方「同河北」授权表述。

### 🟡 日程·分数公布  `conf=low`
- **文件**: `data/datasets/zhiyuan-calendar-2026.json → provinces[province=青海].score_release + tentative`
- **定位**: `provinces[province=青海].score_release / .tentative`
- **现值**: score_release: 2026/6/25, tentative: false
- **应为**: 待人工核对：本次搜索未找到可独立验证的外部URL明确记载青海2026年成绩公布日期为6/25，tentative=false的依据仅为文件内部注释
- **依据**: 文件内部注释（第41行）称「截至2026-05-28，部分省(上海/广西/青海)已发布2026正式日历」，但未标注具体官方URL；WebSearch及WebFetch未检索到可确认6月25日成绩公布的青海省考试院原始公告链接。

### 🟡 民族加分 bonus_tiers 疑似遗漏地方艰苦地区加分  `conf=medium`
- **文件**: `cli/data/datasets/special-admissions/minzu-policy-2025.json — records[region_id=63].bonus_tiers`
- **定位**: `records[region_id=63].bonus_tiers`
- **现值**: []（空数组）
- **应为**: 待人工核对。青海2025实际执行A区少数民族+20分/汉族+10分，B区少数民族+15分/汉族+5分（基于高中学籍与实际就读地双统一）。若此文件的 bonus_tiers 字段scope包含此类地方艰苦地区加分，则应补录；若scope仅覆盖少数民族身份加分（非地区加分），则空数组正确。
- **依据**: https://www.gk100.com/read_4050119.htm 确认A区少数民族+20，B区少数民族+15；WebFetch 页面内容也确认同样分值。文件schema中未见对 bonus_tiers scope 的说明文档。

### 🟡 score-below-control-line  `conf=medium`
- **文件**: `live data via node dist/index.js actual`
- **定位**: `青海民族大学 id=372 \| 2024 \| 中国少数民族语言文学（蒙文）\| batch=本科一段 zslx=普通类 track=理工`
- **现值**: min=301 (本科一段 普通类 理工)
- **应为**: min >= 325 (Qinghai 2024 二本 control line) for 本科一段 普通类 admission
- **依据**: cmd: node dist/index.js actual '青海民族大学' --province qinghai --year 2024 → item {sp_name:'中国少数民族语言文学', spname:'中国少数民族语言文学（蒙文）（年收费4500元）', min:301, batch:'本科一段', zslx:'普通类', track:'理工', min_section:23987}. 2024 rank table note (qinghai-2024-science.json) says '一本 343，二本 325'. Score 301 is 24 points below the 二本 control line yet labeled 本科一段. Other entries in same school with min_section in the 23000–24000 range suggest this is at the extreme tail of science admission.

### 🔵 config-comment-missing 🔧  `conf=high`
- **文件**: `/Users/duichon/ha7ch/gaokao-pro/cli/src/codes.ts`
- **定位**: `line 31: 63: { name: "青海", pinyin: "qinghai", reform: "3+1+2" }`
- **现值**: reform: "3+1+2" (no caveat comment)
- **应为**: reform: "3+1+2" with comment similar to 山西/内蒙古: // 批5: first new-gaokao exam 2025 (was 文/理 through 2024)
- **依据**: codes.ts line 31 marks 青海 as reform='3+1+2' without noting it was 文理 system through 2024. Rank table files confirm: qinghai-2024-science.json has track='science'/track_cn='理科' with note='青海 2024 老高考末年 理'; qinghai-2025-physics.json has track='physics'/track_cn='物理类' with note='青海 2025 3+1+2 首届 物理'. Comparable provinces 山西 (line 6) and 内蒙古 (line 7) both carry the comment '// 批5: first new-gaokao exam 2025 (was 文/理 through 2024)'. The missing comment can mislead a developer querying 2024 data under --track physics.

### 🔵 rank-table-missing  `conf=high`
- **文件**: `/Users/duichon/ha7ch/gaokao-pro/cli/data/yifenyiduan/`
- **定位**: `qinghai-2024-physics.json (absent)`
- **现值**: node dist/index.js rank --score 550 --province qinghai --track physics --year 2024 → exit 1: 'no 一分一段 table for 青海 2024 physics'
- **应为**: Either qinghai-2024-physics.json exists (as alias/redirect to qinghai-2024-science.json), or rank command auto-aliases 'physics'→'science' for pre-2025 文理 provinces
- **依据**: cmd: node dist/index.js rank --score 550 --province qinghai --track physics --year 2024 → {ok:false, error:'no 一分一段 table for 青海 2024 physics...'}. Available tables confirmed via rank-tables command: only qinghai-2024-liberal and qinghai-2024-science exist for 2024. Qinghai switched from 文理 to 3+1+2 in 2025 (confirmed by rank table notes). A user querying 2024 with default track=physics gets a hard error instead of being directed to the correct science table.

## 宁夏  （🔴5 🟡5 🔵0）

### 🔴 志愿数·本科批A段 🔧  `conf=high`
- **文件**: `zhiyuan-rules-2026.json → provinces[province=="宁夏"].本科批.A段.count`
- **定位**: `provinces[30].本科批.A段.count`
- **现值**: 45
- **应为**: 1
- **依据**: 宁夏教育厅官方政策解读 https://jyt.nx.gov.cn/zwgk/zcwj/zcjd/202501/t20250123_4802993.html 及 lezhenedu.com 均明确：本科批A段设1个院校专业组志愿（顺序志愿，用于高水平运动队/高校专项计划）；B段才是45个。

### 🔴 日历注释·本科批A段 🔧  `conf=high`
- **文件**: `zhiyuan-calendar-2026.json → provinces[province=="宁夏"].batches[name=="本科批 A 段"].notes`
- **定位**: `provinces[29].batches[1].notes`
- **现值**: 45 院校专业组 × 6 专业, 调剂 (≤105%)
- **应为**: 1 院校专业组 × 6 专业 (顺序志愿; 高水平运动队/高校专项计划)
- **依据**: 宁夏教育厅政策解读 https://jyt.nx.gov.cn/zwgk/zcwj/zcjd/202501/t20250123_4802993.html：本科批A段为1个院校专业组顺序志愿，用于填报高水平运动队和高校专项计划，非平行45志愿。

### 🔴 民族加分-适用院校范围 🔧  `conf=high`
- **文件**: `data/datasets/special-admissions/minzu-policy-2025.json · records[region_id=64].bonus_tiers[scope='川区少民...'].scope_universities`
- **定位**: `records[region_id=64].bonus_tiers[2].scope_universities`
- **现值**: "all"
- **应为**: "provincial_only"（川区少民加5分仅适用于报考区内普通高校）
- **依据**: 宁夏招生工作委员会 gaokao.chsi.com.cn/gkxx/zc/ss/202404/20240409/2293285892.html 原文：'具有川区户籍和高中学籍…的少数民族考生，报考区内普通高校时加5分'；搜索结果多次确认'报考区内'限制。山区少民+10条目已正确标注scope_universities='all'，但川区少民字段标注错误。

### 🔴 滑档案例-志愿结构描述  `conf=high`
- **文件**: `data/datasets/huadang-cases-2022-2025.json · cases[case_id='composite-044']`
- **定位**: `cases[case_id='composite-044'].candidate_profile_summary`
- **现值**: "本科批 A 段 45 + B 段 45；A 段提前 A 顺序志愿第一志愿失败"
- **应为**: 宁夏本科批A段实为1个顺序志愿（仅用于高水平运动队/高校专项），B段45个平行志愿；案例将A段志愿数写作45是错误的
- **依据**: jyt.nx.gov.cn/zwgk/zcwj/zcjd/202501/t20250123_4802993.html 及 gaokao.eol.cn/ning_xia/dongtai/202505/t20250527_2671284.shtml 均明确：本科批A段设1个院校专业组志愿（顺序），用于高水平运动队和高校专项；本科批B段设45个平行志愿用于普通本科。案例中'A段45+B段45'描述与制度不符。

### 🔴 滑档案例-志愿结构描述  `conf=high`
- **文件**: `data/datasets/huadang-cases-2022-2025.json · cases[case_id='composite-058']`
- **定位**: `cases[case_id='composite-058'].candidate_profile_summary`
- **现值**: "首选物理 / 再选化生；2025 首届 3+1+2；A 段 45 全冲"
- **应为**: 本科批A段为1个顺序志愿，不存在'A段45'的填法；正确表述应对应本科批B段45个志愿
- **依据**: 同 composite-044 证据来源：jyt.nx.gov.cn 官方方案明确本科批A段=1个志愿，B段=45个平行志愿。composite-058亦在what_happened和lesson中逻辑自洽地描述'A段+B段全部不投'，但候选人简介中的'A段45'与制度矛盾。

### 🟡 赋分·等级数  `conf=low`
- **文件**: `score-system-2025.json → provinces[province=~"宁夏"].scaled_subjects[0].type`
- **定位**: `provinces[index=山西\|内蒙古\|河南\|四川\|陕西\|云南\|青海\|宁夏].scaled_subjects[0].type`
- **现值**: 等级赋分 (5 等 21 级, 30-100)
- **应为**: 待人工核对：官方政策仅提及5等(A-E)和分数区间，未明确'21级'细分，需核对是否与河北等省规则完全一致
- **依据**: 宁夏教育厅政策文 https://jyt.nx.gov.cn/zwgk/zcwj/zcjd/202501/t20250123_4802993.html 及 6617.com 描述：5个等级(A-E)，赋分起点30分满分100分，等级占比15/35/35/13/2%。官方文件未明确提及'21级'细分，该描述来自'同河北'推断，无法从宁夏官方文件直接验证。

### 🟡 日程·成绩发布日期  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[province=="宁夏"].score_release`
- **定位**: `provinces[29].score_release`
- **现值**: 2026/6/23
- **应为**: 待人工核对：2025年实际为6月25日，2026年预测值需官方公告确认
- **依据**: 网易新闻/腾讯新闻报道：2025年宁夏高考成绩6月25日查询（https://news.qq.com/rain/a/20250623A02DIZ00）。数据文件标注 tentative:true，属预测值，可接受，但实际参考年晚2天。

### 🟡 艺术公式-戏曲文化控制线  `conf=low`
- **文件**: `data/datasets/special-admissions/art-formula-2025.json · records[region_id=64, category='戏曲']`
- **定位**: `records[region_id=64, category='戏曲'].culture_control_line`
- **现值**: {"historical": 202, "physical": 186}
- **应为**: 待人工核对
- **依据**: 数据自身confidence='medium'；搜索结果显示其他艺术类历史303/物理279，戏曲类203/186明显偏低。来自 dxsbb.com/news/60091.html 的查询提示戏曲文化线确实低于其他艺术类，但未找到nxjyks.cn权威原文明确印证202/186这一具体数值。需人工比对宁夏考试院2025年艺术类控制分数线通知。

### 🟡 强基计划-宁夏招生院校数量  `conf=low`
- **文件**: `data/datasets/special-admissions/qiangji-quota-2025.json · records[region_id=64]`
- **定位**: `records[region_id=64] (4条记录：北大、清华、北理工、北航)`
- **现值**: 仅4所院校（北大/清华/北航/北理工），均为gaokao_pct=85, xiaoce_pct=15
- **应为**: 待人工核对
- **依据**: 搜索结果提及'宁夏强基计划36所大学'（gk100.com/read_1431566035855.htm），数据中仅收录4所，可能存在大量院校缺失。未找到明确权威URL证明仅4所，但数量差距显著值得复核。各院校85/15公式本身与全国通行标准一致。

### 🟡 民族预科-北方民族大学计划规模  `conf=low`
- **文件**: `data/datasets/special-admissions/minzu-policy-2025.json · records[region_id=64].special_programs[0]`
- **定位**: `records[region_id=64].special_programs[0]`
- **现值**: "北方民族大学 2025 在宁含民族预科约 712 人量级"
- **应为**: 待人工核对
- **依据**: 未找到可直接引用的北方民族大学2025年在宁预科招生计划官方URL，712人为估算值（'约'）。建议从北方民族大学招生处官网（bmzu.edu.cn）核对2025年在宁预科计划。

## 新疆  （🔴3 🟡3 🔵0）

### 🔴 志愿数-本一  `conf=high`
- **文件**: `zhiyuan-rules-2026.json → provinces[province=="新疆"].本一`
- **定位**: `provinces[].本一`
- **现值**: 18
- **应为**: 9（2025实际）；2026是否扩至18尚无官方确认
- **依据**: https://gaokao.eol.cn/xin_jiang/dongtai/202505/t20250526_2670869.shtml 及 https://m.wlmq.bendibao.com/edu/64847.shtm 均引用新疆教育考试院文件：「本科一批次：设置一个志愿组9个平行志愿」。本科二批才是18个。数据将本二志愿数写入本一字段，且声称是2026新规，但无官方来源证实2026本一扩至18。

### 🔴 志愿数-本二  `conf=high`
- **文件**: `zhiyuan-rules-2026.json → provinces[province=="新疆"].本二`
- **定位**: `provinces[].本二`
- **现值**: 18
- **应为**: 18（本二2025实际正确）
- **依据**: https://gaokao.eol.cn/xin_jiang/dongtai/202505/t20250526_2670869.shtml 确认本科二批18个志愿，与data一致

### 🔴 志愿数量  `conf=high`
- **文件**: `data/datasets/huadang-cases-2022-2025.json · cases[34] (case-035)`
- **定位**: `cases[34].what_happened / cases[34].lesson`
- **现值**: 新疆 2025 本一扩到 18（what_happened: '2025 才扩到 18'；lesson: '新疆 2025 本一从 9 扩到 18 是历史性变化，必须按 18 的结构重新规划'）
- **应为**: 2025 年新疆本科一批次仍为 9 个平行志愿；扩至 18 的是本科二批次。what_happened/lesson 中所有'本一从 9 扩到 18'的表述均应改为'本二从 9 扩到 18'（或'本二增至 18'）。
- **依据**: 新疆教育考试院官方文件《新疆维吾尔自治区2025年普通高校招生工作规定》(https://www.xjzk.gov.cn/c/2025-05-16/494130.shtml) 明确：本科一批次 9 个平行志愿，本科二批次 18 个平行志愿。多家第三方来源（gaokao.eol.cn、gk100.com）亦一致确认本一=9、本二=18。

### 🟡 vs_2025描述-2026本一扩至18无官方确认  `conf=medium`
- **文件**: `zhiyuan-rules-2026.json → provinces[province=="新疆"].vs_2025 & 2026特别提示.新疆本一`
- **定位**: `provinces[].vs_2025 + 顶层["2026特别提示"]["新疆本一"]`
- **现值**: vs_2025="⚠️本一从9扩至18，冲稳保结构需重设"；2026特别提示.新疆本一="志愿翻倍9→18"
- **应为**: 待人工核对：需查新疆教育考试院2026年官方志愿填报规定，确认本一是否从9扩至18
- **依据**: 搜索未找到新疆教育考试院关于2026年本一志愿数变更的官方公告。2025实际为9个（来源：https://gaokao.eol.cn/xin_jiang/dongtai/202505/t20250526_2670869.shtml）。若2026本一确实维持9个，则这条「翻倍」描述会产生误导。

### 🟡 日历-出分日期  `conf=low`
- **文件**: `zhiyuan-calendar-2026.json → provinces[province=="新疆"].score_release`
- **定位**: `provinces[].score_release`
- **现值**: 2026/6/24
- **应为**: 待人工核对；2025实际出分为6月25日（非6月24日）
- **依据**: https://www.xjzk.gov.cn/c/2025-06-23/494371.shtml（新疆教育考试院官网）：「新疆2025年普通高考成绩拟于6月25日16时公布」。文件已标注 tentative:true，但基准年偏差1天。2026年日期未出，此为推算。

### 🟡 强基计划-西部门槛字段  `conf=low`
- **文件**: `data/datasets/special-admissions/qiangji-quota-2025.json · records[148–151]`
- **定位**: `records[148].west_75pct_threshold, records[149].west_75pct_threshold, records[150].west_75pct_threshold, records[151].west_75pct_threshold`
- **现值**: west_75pct_threshold: true（中国农业大学、北京大学、清华大学、西北农林科技大学 4 条记录均标注）
- **应为**: 待人工核对。中国农业大学2025年强基计划官方简章（jwzs.cau.edu.cn）未提及任何'西部地区75%门槛'或差异化区域入围比例要求；北大/清华/西农简章未在本次搜索中发现该字段对应条款。不能排除存在于某些学校内部细则，但无官方 URL 可证实。
- **依据**: 中国农业大学2025年强基计划简章 https://jwzs.cau.edu.cn/art/2025/4/16/art_4528_1064487.html 全文无'西部75%'表述；搜索未返回北大/清华/西农含该阈值的官方页面。



---

# 本次已应用的修复（high-confidence 机械/确定错误，已写入文件）

> 每条均经"断言现值→匹配才改"的脚本/逐行编辑落地，并通过全部单元+schema 校验。共 8 个文件，~35 处。

## 艺术综合分 `art-formula-2025.json`
- **北京**：11 条记录 `formula.pro_factor` 2.2 → **2.5**（满分 750/300=2.5；2.2 是上海 660/300 的值被误用）
- **天津·戏剧影视表演**：`culture_control_line.unified` 313 → **357**（313 仅舞蹈/戏曲类）
- **山西·播音与主持**：`culture_pct` 0.7→**0.5**，`pro_pct` 0.3→**0.5**
- **内蒙古·播音与主持**：`culture_pct` 0.6→**0.7**，`pro_pct` 0.4→**0.3**
- **黑龙江·播音与主持**：`pro_factor` 2.5→**1.0**（文80%+专20%，专业满分300不折算）
- **安徽·播音与主持**：`qualifying_score.zhuanke` 160→**125**（2025 单一合格线，与 benke 一致）
- **广东·舞蹈**：`qualifying_score.benke` 198→**150**
- **广东·音乐表演-器乐**：`qualifying_score.benke` 185→**170**
- **贵州·播音与主持**：`culture_pct` 0.5→**0.6**，`pro_pct` 0.5→**0.4**，`pro_factor` 2.5→**2.0**

## 体育综合分 `sports-formula-2025.json`
- **江苏**：`pro_factor` 2.5→**5.0** + extras 专业满分 300→**150**（身体素质100+专项50）
- **河南**：extras 术科每项 100→**50**（总 150）
- **湖北**：`culture_control_line.zhuanke` 350→**120**；`professional_qualifying` {} → **{benke:350, zhuanke:300}**
- **湖南**：`professional_qualifying.benke` 155→**261**（155 是高职专科线）

## 民族加分 `minzu-policy-2025.json`
- **江西**：取消年份 2025→**2023**
- **云南**：边疆/19世居民族/彝壮 三档 `scope_universities` provincial_only→**national**（均为全国性加分）
- **西藏**：工龄加分 requirements 补「（格尔木办事处除外）」例外之例外
- **宁夏**：川区少民档 `scope_universities` all→**provincial_only**（仅报区内高校加5分）

## 综合评价 `zongping-2025.json`
- **江西**：在赣外省综评名单移除 **国科大**（7校→6校；国科大不在赣招综评）
- **广东**：综评汇总 11校→**12校**（西湖大学 2025 加入）

## 强基 `qiangji-quota-2025.json`
- **湖南大学**：`ruwei_ratio` 5→**4**
- **甘肃·国防科技大学**：`status` unchanged→**removed**（2025 在甘肃无强基招生）

## 志愿规则 `zhiyuan-rules-2026.json`
- **河北·本科批**：`unit` 院校专业组→**专业+学校**，`调剂` true→**false**，去 `majors:6`（与辽宁/山东同型）。**自洽佐证**：本文件 `2026特别提示.专业平行模式扩展` 与 calendar 文件均已把河北当作专业平行/无调剂。narrative 字段（vs_2025/滑档风险）同步去除失效的"组/调剂"表述
- **山东**：从 `2026特别提示.专业平行模式扩展` 移除（2020 起已是专业平行，非 2026 新扩展）
- **宁夏·本科批 A段**：`count` 45→**1**（A段=1顺序志愿；B段=45平行）

## 日程 `zhiyuan-calendar-2026.json`
- **吉林**：`score_release` 6/22→**6/25**；本科批 `fill_start` 6/26→**6/28**
- **湖北·本科提前批**：`fill_end` 7/2→**6/30**
- **云南·本科批B**：notes "2024起专业6→10" → **"2025起"**（2024 仍文理，无院校专业组）
- **宁夏·本科批A段**：notes 45 平行 → **1 顺序志愿（高水平运动队/高校专项）**

## 代码 `cli/src/codes.ts`
- **青海(63)**：补注释 `// 批5: first new-gaokao exam 2025 (was 文/理 through 2024)`

---

# 暂缓·需人工裁决（已在报告中标记，**未改文件**）

这些虽被 agent 标为可自动修复，但属"事实/主观存疑"或会引入新的不一致，按你的"事实存疑只标记"原则保留：

1. **"5 等 21 级"赋分描述（约 11 省）** — `score-system-2025.json`。多个 agent 认为 3+1+2 省只有 5 等(A–E)线性插值、无"21级"细分（21级是京/津/浙 3+3 制度）。**但 agents 对"河北是否等距21级换算"互相矛盾**，且这是描述性文本、各 agent 建议措辞不一 → 需你定一个统一写法后我再批量改。
2. **浙江三位一体折算比例（浙大/复旦/上交/西湖大学）** — `zongping-2025.json`。agent 用官方简章 WebFetch 指应为 85/10/5（浙大）、85/12/3（上交）等，**但这会反转 commit 0.3.3 的人工修改（85:10:5→50:30:20）**。两版直接冲突，需你确认 2025 真实比例。
3. **上海 11 等级比例整段重写** — `score-system-2025.json`，涉及整个分布(A-/B+…)重写，判断量大。
4. **广西 12 条艺术统考线批量重写 + 新增 zhuanke 字段** — `art-formula-2025.json`，系统性大改 + 改 schema，建议人工核。
5. **海南 民族加分新增 +10 档** — `minzu-policy-2025.json`，结构性新增记录（非改值），建议人工核 schema 后加。
6. **山东/浙江 "见上" 占位重复条目** — `zhiyuan-rules-2026.json`，看似刻意的占位，且浙江同样模式未被标记，删数组项有风险。
7. **`vs_2024` / `vs_2025` 字段命名混用（约6省）** — `zhiyuan-rules-2026.json`，需整体规范而非只改 2 省。
8. **116 条 suspect + 37 条 info** — 各 agent 标 low/medium、无权威来源证实/证伪，全部已在上文正文按省列出。

---

# 机械层（确定性脚本，非 LLM）
- 一分一段表 **108 文件全部通过**内部一致性（分数严格递减 / 累计单调 / 累计=前累计+本段人数 / header.count 对齐 / source 存在）。
- school-index ↔ live `static-data.gaokao.cn` API：31 省各抽查 3–5 所代表校，**校名/院校代码/id 全部一致**，actual/scores/rank 返回均合理，未发现 index 漂移。


---

# Round 2 — 暂缓项的处理（独立核查后落地）

对 round 1 暂缓的项逐一**独立联网核查**（不只信单个 agent），结果：

## ✅ 已修

### 浙江三位一体折算比例 — `zongping-2025.json`（3 改 / 1 驳回）
独立核对官方简章后落地。**关键：agent 对上交的判断是错的，已驳回。**
| 校 | 原值 | agent 主张 | 核实结果(官方) | 处理 |
|---|---|---|---|---|
| 浙江大学 | 50/30/20 | 85/10/5 | **85/10/5** (zdzsc.zju.edu.cn 2025简章) | ✅ 改 |
| 复旦大学 | 60/30/10 | 85/10/5 | **85/10/5** (ao.fudan.edu.cn 占85%) | ✅ 改 |
| 上海交大 | 60/30/10 | 85/12/3 | **60/30/10** (官方 X×60%+Y×30%+Z×10%) | ❌ 驳回, 原值正确 |
| 西湖大学 | 50/30/20 | 60/30/10 | **60/30/10** (westlake.edu.cn 2025简章) | ✅ 改 |
- 这证实 commit `0.3.3` 的"浙大 85:10:5→50:30:20"是一次**回归(改对为错)**，现已纠回。

### "5 等 21 级"赋分描述 — `score-system-2025.json`（14 字段）
数学定锤：3+1+2 各省赋分区间是 **30-100**，而"21级 每3分一级"只在 3+3 的 40-100 成立（(100-40)/3+1=21）；30-100 无法等分 21 级。河北官方(hebtv/6617)确认 3+1+2 = 5 等(A-E) **等比例(线性)** 换算，无 21 级。
- 已把全部 3+1+2 记录的 `5 等 21 级`→`5 等 A-E`、`等距 21 级换算`→`等比例(线性)换算`；
- 3+3 的 **北京/天津/浙江(40-100)保留"21级"**（其本就是 21 级，正确）。

### 京/沪 赋分等级命名 — `score-system-2025.json`（2 字段）
- **上海**：scaling_formula 原含不存在的 `A-(11%)` 且漏 E → 改为正确 11 级 A+/A/B+/B/B-/C+/C/C-/D+/D/E（sh.bendibao/shjzzjf 确认）。
- **北京**：原用 `A+/B+/C+` 命名+错误比例+"D最低" → 改为 A/B/C/D/E 比例 15/40/30/14/1%、21 级 A1-A5…E、E=40 最低（beijing.gov.cn/gaokzx 确认）。

### 广西艺术类统考线 — `art-formula-2025.json`（11 记录）
官方 gxeea.cn 2025 本科线核实：原 `benke` 实为**高职高专线**。已将真实**本科线**写入 benke、原值移入 zhuanke：书法 225→**252**、播音 215→**226**、舞蹈 190→**195**、美设 200→**205**、音乐表演 180→**190**、音乐教育 170→**180** 等（戏曲无本科线数据，留原值）。

### 海南民族加分 — `minzu-policy-2025.json`（新增 1 档）
原 `bonus_tiers:[]` 与 notes"2025未单列加分"被官方推翻：海南省考试局 2025 实施办法确有**少民聚居市县 +10**（户籍+学籍+报考地三统一；三亚/东方/五指山/乐东/陵水/昌江/保亭/琼中/白沙 等）。已补该档并改写 notes。

## ⏸️ 仍保留标记（不改，已记录理由）
- **`vs_2024` / `vs_2025` 字段名混用（约6省）** — `zhiyuan-rules-2026.json`。语义上可能是**有意**的（2025-首届省份用 vs_2024 描述"相对2024旧高考的改革"），强行统一反而可能抹掉语义；低风险，留待维护者定夺。
- **山东/浙江 "见上" 占位重复条目** — `zhiyuan-rules-2026.json`。看似刻意占位，`.find(province)` 取首条不受影响，删数组项可能影响依赖下标的逻辑；保留标记。

---
*Round 2 核查方式：对每个暂缓项独立 WebSearch/WebFetch 官方来源交叉验证后才落地；上交一项即因独立核查与 agent 主张不符而驳回。*

---

# Round 3 — 高价值 suspect 抽查（独立核实后落地）

从 116 条 suspect 中挑可独立核实的事实项核查：

- **广东赋分比例** — `score-system-2025.json`。原 `scaling_formula:"同河北"`(15%) 错误：广东官方实为 **A 等 17%**（17%/35%/35%/13%/2%，赋分区间 100-83/82-71/70-59/58-41/40-30），与河北(15%, 100-86)不同。已改为广东专属公式。来源 gk100/6617 广东 2026 赋分表。
- **青海民族地区加分** — `minzu-policy-2025.json`。原 `bonus_tiers:[]` 漏掉青海四区加分：A区少民+20(汉+10)/B区+15(汉+5)/C区+5/D区(西宁城区)无。已补 3 档(地方性, 仅省内高校)。来源 青海 2025 招生录取实施细则 / gk100。

另：round 2 的「5等21级」批量修复已**顺带消解**了多条 suspect（安徽/河南/青海 等的同款 21 级描述存疑）。

**仍未处理**：余下 suspect 多为 2026 填报日期预测（基于 2025 实际、已标 tentative）或 agent 未能找到权威来源证实/证伪者，留作人工复核——逐条联网命中率低，不再强修。

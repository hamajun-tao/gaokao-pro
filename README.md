# gaokao-pro

Chinese 高考 college planner — from your terminal.

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/HA7CH/gaokao-pro/main/install.sh | bash
```

Then:

```bash
gaokao-pro recommend \
  --score 660 --province henan --subjects 物理,化学,生物 \
  --985 --limit 5 --explain
```

(npm release coming soon — `npx gaokao-pro@latest ...` will work once we
finish wiring 2FA-bypass tokens on the publish account.)

No signup, no token, no backend. Talks straight to
`static-data.gaokao.cn` (the 中国教育在线 / 掌上高考 static JSON tier — no
auth, no sign, no rate limit observed). Ships with a built-in 2,400-school
local index so `recommend` / `top` / `find` filters run offline.

## Verbs

| Verb        | What it does                                                              |
|-------------|---------------------------------------------------------------------------|
| `recommend` | 冲 / 稳 / 保 buckets for your score in a province (offline)                |
| `top`       | Top-N best schools your score can reach (offline)                         |
| `find`      | Search majors across schools — e.g. all 985 schools that recruit 计算机     |
| `school`    | School metadata: 985/211/双一流/学科评估/校友会排名                         |
| `plan`      | Forward-looking admission plan per (school, year, province)               |
| `actual`    | Backward-looking actual admissions: 最低分 / 平均分 / 最低位次              |
| `scores`    | Historical min-score time series for a (school, province) pair            |
| `provinces` | List supported provinces with 新高考 reform regime                          |

See [cli/README.md](./cli/README.md) for the full CLI doc.

## Repo

```
gaokao-pro/
├── cli/                     # npm package `gaokao-pro`
│   ├── src/
│   │   ├── gaokao-cn.ts     # static-data.gaokao.cn client + types
│   │   ├── recommend.ts     # 冲/稳/保 algorithm (offline, transparent)
│   │   ├── top.ts           # top-N within reach
│   │   ├── find.ts          # cross-school major search
│   │   ├── format.ts        # TTY table rendering
│   │   ├── index-loader.ts  # gunzip + cache the school index
│   │   ├── probe.ts         # rebuild the school index
│   │   └── codes.ts         # 31 province codes + 新高考 reform map
│   ├── data/
│   │   └── school-index.json.gz   # 2,422-school corpus (1 MB gzipped)
│   └── test/smoke.ts        # live API smoke test
└── docs/
    ├── data-sources.md      # 50-agent feasibility scan (31 省 + national + competitors)
    └── schema-gaokao-cn.md  # upstream JSON schema notes + gotchas
```

## Develop

```bash
pnpm install
pnpm -C cli dev recommend --score 660 --province henan --subjects 物理,化学,生物 --985
pnpm -C cli test                       # 8 smoke checks against live API
pnpm -C cli probe                      # rebuild data/school-index.json.gz
pnpm -C cli build                      # tsc → dist/
```

## Compliance

This is a thin client over public CDN-served JSON. The CLI doesn't store any
PII, doesn't make value judgments, doesn't replace a 志愿规划师. See
[docs/data-sources.md](./docs/data-sources.md) for the compliance posture
and provincial 教育考试院 fallback notes.

Part of [HA7CH](https://ha7ch.com) — sibling of `job-pro` and `cv-pro`.

## Why

Existing tools (夸克高考, 百度AI高考, 优志愿, 掌上高考 App) are App-only,
black-box, and either pay-walled or ad-supported. We want the same data in
the terminal so a parent + Claude Code can plan together — auditable,
scriptable, free.

See [docs/](./docs/) for the data-source research, schema notes, and
endpoint inventory.

## Develop

```bash
pnpm install
pnpm -C cli dev school 31              # run via tsx
pnpm -C cli test                       # smoke test against live API
pnpm -C cli probe -- --start 1 --end 50   # build school-id index
pnpm -C cli build                      # tsc → dist/
```

## License

MIT.

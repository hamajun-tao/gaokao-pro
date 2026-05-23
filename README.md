# gaokao-pro

China gaokao college planner — from your terminal.

```bash
# Bucket schools into 冲/稳/保 for your score (no school IDs needed):
npx gaokao-pro@latest recommend --score 660 --province henan \
  --subjects 物理,化学,生物 --985 --limit 10

# Find which 985 schools recruit "计算机" in 河南 for 2024:
npx gaokao-pro@latest find "计算机" --province henan --year 2024 --985 --limit 20

# Inspect one school:
npx gaokao-pro@latest school 31                            # 北大 metadata
npx gaokao-pro@latest plan 31 --year 2024 --province henan # admission plan
npx gaokao-pro@latest scores 31 --province henan           # historical min scores
```

No signup, no token, no backend. The CLI talks straight to
`static-data.gaokao.cn` (the 中国教育在线 / 掌上高考 static JSON tier — no
auth, no sign, no rate limit observed) and prints JSON. Pipe it into
`jq`, Claude Code, anything.

`recommend` is fully offline: it reads a 2,400-school local index
(`docs/school-index.json`, ~10 MB, built by `pnpm probe`) and scores
the user's input in milliseconds. Refresh annually after each year's
admission data drops.

## Status

🚧 v0.0.1. Working verbs: `recommend` · `find` · `school` · `plan` ·
`scores` · `provinces`. Coming: 31 省考试院 fallback adapters for
一分一段表 (rank ↔ score), MCP server, Claude Code plugin, hosted
landing at gaokao.ha7ch.com.

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

---
description: Rules activated when working on benchmark/ files.
---

When editing the benchmark CLI:
- Run `pnpm typecheck` and `pnpm lint` after changes (from benchmark/)
- Run `pnpm test` to verify tests pass
- All 14 safe tests must pass before considering changes complete
- Never use `docker compose --profile X down -v` — use `docker stop` + `docker rm` on the specific container

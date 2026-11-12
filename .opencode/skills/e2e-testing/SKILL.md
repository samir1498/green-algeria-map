---
name: e2e-testing
description: Use when working on Playwright e2e tests or the e2e CI pipeline. NestJS only in this repo; other backends have their own pipelines.
---

# E2E Testing — green-algeria-map

## Scope

- This repo: Playwright against NestJS at :8080 via `ci-e2e.yml` (`workflow_dispatch`).
- `gam-frontend`: all UI test code and per-backend configs (`test:e2e:spring`, `test:e2e:go`).
- Spring Boot / Go: own repos; their e2e switches point at :8081 / :8082.

## Infrastructure

`config/docker-compose.e2e.yml` — postgres (:5432) + rustfs (:9000).

| Backend | Port | Health | Prefix |
|---------|------|--------|--------|
| NestJS  | 8080 | `/api/live` | `""` |

## Run

```bash
git submodule update --init --recursive
cd frontend
pnpm test:e2e      # NestJS
```

The `playwright.config.ts` `webServer` starts the NestJS backend with
`scripts/e2e-start.sh` in `../backend-nestjs`.

# Changelog

## 2026-11-12 — Polyglot split

- Product repo is now NestJS + `frontend/` submodule only; deployed to Cloudflare Pages
- Frontend extracted to `gam-frontend` (single source, consumed as submodule everywhere)
- Spring Boot extracted to `gam-backend-springboot` (own CI/CD + GHCR image)
- Go extracted to `gam-backend-go` (own CI/CD)
- Benchmark harness + results extracted to `gam-benchmark` (k6; results immutable)
- `./dev.sh` is now the product-only dev entry point (was a Spring/Go backend switcher)

See per-project changelogs:

- Spring Boot — extracted to [gam-backend-springboot](https://github.com/samir1498/gam-backend-springboot) in 2026-11-12
- [NestJS](backend-nestjs/CHANGELOG.md)
- [Frontend](frontend/CHANGELOG.md)

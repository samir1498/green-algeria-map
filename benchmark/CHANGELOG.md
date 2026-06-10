# Changelog — Benchmark (CLI + pipeline)

## [benchmark-v1.0.0] - 2026-06-10

### Changed
- Breaking: MAJOR bump from v0.x to v1.0 (removed `single` subcommand)

### Removed
- `single` subcommand — use `bun run bench run -b <backend>` instead

## [benchmark-v0.3.0] - 2026-06-09

### Added
- StatusBar singleton with 4 display modes (phase, metrics, warning, done)
- RingBuffer (50-entry circular log with overwrite-oldest)
- Runtime seeders for Spring Boot (CommandLineRunner) and Go (startup)
- StatusBar test suite: cursor management, error dump, 4 render modes, stop suppression, state transitions, subtasks — 6 tests
- RingBuffer test suite: push/overflow, flush, empty, ordering — 7 tests

### Changed
- Replaced 42 consola calls with StatusBar across all 8 CLI files
- Metrics line format: `∅ avgDur ms` with proper spacing
- Pipeline runs sequentially per-backend with `docker compose down -v` cleanup
- Test naming: `.ui.test.ts` for UI, `.unit.test.ts` for data structures

### Fixed
- `IntegrationTest` missing `@ActiveProfiles("test")` — seeder ran during ITs
- `∅avgDurms` symbol overlap with ms in metrics display

### Removed
- `progress.ts` (dead code)
- `consola` dependency (knip-clean)

## [benchmark-v0.2.0] - 2026-06-08

### Added
- Results integrity validation in pipeline
- Hardening tests (failure-path scenarios, fail-fast errors)
- Spring Boot memory cgroup support with dynamic limits
- Docker stats lifecycle with proper await

### Changed
- Pipeline runs sequentially per-backend
- Shell scripts replaced with Bun/TS CLI (citty)
- applyLimits retries on failure (3x)
- Pipeline: sequential runs, session reuse, warmup, 3-repeat runs

## [benchmark-v0.1.0] - 2026-06-07

### Added
- Initial benchmark CLI with shell scripts
- k6 ramp-up scenarios for auth, zones, and mixed workloads
- NestJS vs Spring Boot comparison pipeline
- Benchmark result comparison with trophy system
- CPU/Memory tracking via docker stats
- GC logging for JVM backends
- Baseline optimization log
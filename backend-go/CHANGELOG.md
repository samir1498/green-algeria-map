# Changelog — Go Backend

## [backend-go-v0.1.0] - 2026-06-17

### Added
- In-memory caching with per-id eviction (TTL 5min, max 500 entries)
- Retry with exponential backoff for file uploads
- go-better-auth integration replacing custom auth
- Photo upload support with compression middleware
- Connection pool configuration
- Storage route under `/api` prefix
- iNaturalist/GBIF API mocking in E2E tests

### Fixed
- Constrained baseline (1 CPU / 512MiB) — all 3 backends at 0% failure
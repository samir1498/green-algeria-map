# Changelog — NestJS Backend

## [backend-v0.7.0] - 2026-06-17

### Added
- In-memory caching with per-id eviction (PR #163)
- S3 retry with exponential backoff (PR #164)
- Rate limiting interceptor for auth (PR #10.5 req/s)
- Fastify compression middleware

### Changed
- Migrated from Express to Fastify
- Global `/api` prefix on all routes
- Optimized NestJS read path performance

### Fixed
- Bind to 0.0.0.0 for Render deployment (PR #167)
- Updated create-bucket.mjs script

## [backend-v0.6.0] - 2026-06-04

### Added
- Photo upload to zone creation with E2E infrastructure
- S3-compatible bucket creation script for RustFS setup

### Changed
- NestJS CQRS folder structure flattened
- Integration test imports updated after folder restructure
- Prettier formatting applied to backend source

### Removed
- 15 coverage-padding unit test files
- Dead code: existsByName, toJSON

### Fixed
- CodeRabbit review: host header port handling, request timeout
- SameSite=Lax in dev for Chromium cookie acceptance

## [backend-v0.5.0] - 2026-05-26

### Added
- Render Blueprint for backend deployment
- SSL-enabled PostgreSQL connection for production

### Fixed
- SameSite cookie Lax → None for cross-origin auth
- Session refetch after auth state changes
- Toast dark mode theme mismatch (color-scheme)

## [backend-v0.4.0] - 2026-05-26

### Added
- Zone photo upload with RustFS (S3-compatible object storage via AWS SigV4 signing)
- Storage controller: POST /storage/zones/:id/photo
- CQRS AddPhotoToZone command and handler
- Volunteer count field on Zone entity with public increment endpoint
- Tree species field on Zone entity
- Public POST /zones for crowdsourced submissions
- Seed script in package.json

### Changed
- Validation deferred to upload time (graceful startup without R2)

## [backend-v0.3.0] - 2026-05-23

### Added
- Dependency cruiser architectural rules (domain-not-to-higher, infra-not-to-application)
- Response DTOs with typed CQRS base classes
- Category field in AllExceptionsFilter error responses

### Changed
- Module architecture cleaned up: dropped port/adapter pattern, concrete repos only
- Auth consolidated from 4 scattered locations into self-contained AuthModule
- lib/ stripped to only cross-cutting concerns
- Zones CQRS handlers nested in feature folders (commands/, queries/, events/)
- Testcontainers cleanup: pool error handler, DataSource destroy
- Handler tests colocated next to source files

### Removed
- Dead code: PoolService, stale coverage script, stale depcruise path
- Project-level AGENTS.md and .claude/skills (consolidated to workspace root)

### Fixed
- Test-it CI fixed (real modules instead of test shims)
- Handler test dead imports (knip clean)
- vitest*.ts excluded from tsconfig.build.json (nest build was choking on import.meta)

## [backend-v0.2.0] - 2026-05-20

### Added
- Damage reports module with full CQRS (CreateDamageReport, GetDamageReportsByZone, etc.)
- Zone handler and damage-reports unit tests
- Vitest coverage configuration
- Domain errors, global exception filter, framework removed from domain
- Auth port/adapter pattern, zone encapsulation

### Changed
- Backend rewired from Jest to Vitest (separate unit/it configs)
- Zone handler uses domain methods (isInProgress, complete, addPhoto)

### Fixed
- lat/lng validation, Logger instead of console.log
- Auth migration IT tests

## [backend-v0.1.0] - 2026-05-17

### Added
- BetterAuth email/password authentication
- @Public() decorator for public routes
- Global auth guard with zone GET routes exempted
- User roles: volunteer, reporter, organizer, admin
- Integration tests with Testcontainers + PostgreSQL

### Changed
- Backend split into unit and integration test configs

# Changelog — Spring Boot Backend

## [backend-springboot-v0.5.0] - 2026-06-17

### Added
- Caching, resilience, and ProblemDetail error responses
- Virtual threads support for improved concurrency

### Changed
- Added `/api` prefix to storage controller

### Fixed
- ZoneStatus serialization as `in-progress` to match frontend
- E2E infrastructure: wait for RustFS and create bucket on startup

## [backend-springboot-v0.4.0] - 2026-06-05

### Added
- Rate limiting interceptor (configurable requests per second)
- Request logging with MDC correlation IDs
- Bypass mode for 403 on invalid session format
- Secure environment variable handling via DotenvX

### Fixed
- RateLimitInterceptor optional in WebConfigurer (conditional on rate limiting properties)
- Spotless formatting violations
- Native image: replace inner record SessionResponse with HashMap (GraalVM compatibility)

## [backend-springboot-v0.3.0] - 2026-06-04

### Added
- Custom health indicators (memory, storage, disk)
- @CurrentUser annotation for injecting authenticated User
- CQRS bus with custom mediator (CommandBus/QueryBus)
- Swagger/OpenAPI documentation
- Domain event publishing
- JSON login for E2E auth tests (Phase 0)

### Changed
- Docker Compose integration with springboot profile
- Benchmark infrastructure (k6 scripts)

### Fixed
- Dead principal null check removed
- Audit fixes: @Transactional, state machine, 401 tests, V2 migration
- NaN/equals on Coordinates
- Domain unit tests (Coordinates, Zone, DamageReport)

## [backend-springboot-v0.1.0] - 2026-06-02

Initial Spring Boot scaffold with:
- Auth endpoints (sign-up, sign-in, sign-out, session)
- Zone CRUD
- Damage report endpoints
- Public map endpoint
- Photo upload with S3-compatible storage
- Flyway migrations
- ArchUnit architecture tests
- Unit + integration tests

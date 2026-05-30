# Changelog

## [frontend-v0.7.1] - 2026-05-30

### Fixed
- Cloudflare Pages deployment: `_redirects` infinite loop on SPA fallback (exclude `/index.html` and `/assets/*` from wildcard redirect)
- Auth env var consolidated to single `VITE_API_URL` (drop `VITE_AUTH_URL`)

### Changed
- E2E tests: routes auth via `storageState` project dependency (ObserveOne pattern)
- CI E2E workflow: RustFS credentials match local dev (`greenalgeria-access`/`greenalgeria-secret-change-me`)
- CI E2E workflow: bucket creation step before tests run

## [frontend-v0.7.0] - 2026-05-26

### Added
- Public map API endpoint (unauthenticated GET /public/map)
- Frontend usePublicMapData hook replacing demo data with real API
- Crowdsourced zone creation via public POST /zones
- CreateZoneForm with Leaflet map picker
- Volunteer count field on zones with public increment endpoint
- Volunteer CTA panel wired to backend API
- Production deployment: Cloudflare Pages (frontend), Render (backend + PostgreSQL)
- R2 storage bucket configuration for photo uploads

### Fixed
- SSL for Render PostgreSQL connection (data-source, app.module, better-auth)
- Session refetch after signin/signup (navbar was stale)
- Toast theme mismatch (dark mode Sonner was light)
- SameSite cookie Lax → None for cross-origin auth
- Storage service graceful startup without R2 config

### Changed
- Config files moved into config/ directories
- VITE_API_URL baked to production URLs

## [frontend-v0.6.0] - 2026-05-25

### Added
- Zone photo upload with RustFS (S3-compatible object storage)
- ZonePhotoUploader component with drag-and-drop, preview, 5MB limit
- Volunteer CTA per zone with sessionStorage dedup
- Playwright E2E tests with getByTestId convention (home, auth, tree species, create zone, navigation)
- E2E test type in test matrix

### Changed
- Mobile-responsive nav: hamburger menu for < md screens
- Map responsive height (50vh mobile, 60vh desktop)
- Legend repositioned higher on mobile (bottom-20, lg:bottom-6)
- Zone popups: smaller font on mobile (text-xs), larger on desktop (md:text-sm)
- Stat cards: tighter gap on mobile (gap-2, sm:gap-3)
- MapContainer switched from inline style to className

### Fixed
- Mobile map popup scrollable (max-h-[50vh] overflow-y-auto)

## [frontend-v0.5.0] - 2026-05-24

### Added
- Tree species info lookup with iNaturalist autocomplete + species detail + GBIF Algeria observations
- TreeSearchInput with debounced autocomplete component
- TreeInfoModal with scientific name, common name, photos, GBIF count, Wikipedia link
- Unified dev setup: docker-compose.dev.yml, scripts/dev/{setup,start}.sh

### Changed
- Backend health endpoint improved (liveness/readiness split, storage health check)

## [frontend-v0.4.0] - 2026-05-17

### Added
- Sign-in and sign-up pages with form validation
- Protected dashboard route with route guards
- Auth service layer: interfaces decoupled from BetterAuth (port/adapter pattern)
- Centralized error handling with typed error codes and user-friendly messages
- Sonner toast notifications (theme-aware)
- useAuth() hook combining auth + session services
- 30 unit tests (mapper, error handler, useAuth hook)
- Test utilities: renderWithRouter for TanStack Router, jest-dom setup
- TanStack Query setup with query hooks for zones

### Changed
- Extracted hooks and helpers from components (Wave 0 refactor)
- Renamed helpers/ → utils/
- Frontend source reorganized by domain: features/, shared/, app/

### Fixed
- Typecheck errors from route refactoring
- Login tests rewritten for new auth flow

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

## [frontend-v0.3.0] - 2026-05-16

### Added
- Axios instance with base URL pointing to backend
- API module for zones (getAll, getById, create, update, remove)
- Shared Zone type at `src/types/zone.ts`
- TanStack Router loaders: home page fetches from API, falls back to demo data

### Changed
- Map component now accepts `zones` as a prop (data-agnostic)
- Home route uses `useLoaderData` instead of hardcoded demo imports
- Zone type moved from `components/map/types.ts` to `types/zone.ts`

## [v0.2.0] - 2026-05-16

### Added
- Interactive Leaflet map on home page with demo reforestation zones across Algeria
- 10 demo markers (planting, trash, cleanup) with color-coded status (planned/in-progress/completed)
- Status legend overlay explaining marker colors
- Zone detail popups on click with name, type, progress, and description
- react-leaflet integration for declarative map rendering (no raw Leaflet)
- `useLeafletMap` hook (removed in favor of react-leaflet during cleanup)

### Changed
- Map uses react-leaflet `CircleMarker` + `Popup` instead of raw Leaflet
- Home page layout reorganized: title, map (50vh), stat cards
- Stat cards now show real counts from demo data

### Fixed
- Leaflet zoom controls now respect dark mode via CSS variable overrides
- Map no longer hijacks page scroll (50vh container, scrollWheelZoom on)
- Removed unused Leaflet CSS CDN link (imported directly now)

### Removed
- Dead `src/router.tsx` duplication — consolidated into single router
- Unused shadcn components: `sheet.tsx`, `skeleton.tsx`
- Unused dependency: `@radix-ui/react-dialog` (24 fewer transitive deps)
- Redundant CSS resets (`box-sizing`, `margin`, duplicated `min-height`)
- Knip config no longer hides dead code (`ignore` list cleaned)
- Unused `react-leaflet` from dependencies (was removed and re-added during refactor)

## [v0.1.2] - 2026-05-10

### Fixed
- Color contrast on all routes — replaced hardcoded text-gray-* with shadcn semantic tokens (text-foreground, text-muted-foreground)
- Nav link hover color — text-green-600 → theme-aware hover:text-foreground/80
- Logo SVG hardcoded fill — removed, now inherits currentColor from parent

### Changed
- Home page layout compacted — no scroll needed (map 500px → 18.75rem, spacing halved)
- StatCard values — text-green-600 → text-primary (theme-aware emphasis)

## [v0.1.1] - 2026-05-09

### Fixed
- Theme switcher not applying dark mode — added missing CSS variable tokens to styles.css per shadcn/ui v4 theming docs

### Added
- Version field to frontend/package.json
- CHANGELOG.md

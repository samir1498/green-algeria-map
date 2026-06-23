# Changelog — Frontend (React SPA)

## [frontend-v0.10.0] - 2026-06-17

### Changed

- Extract LoginPage and RegisterPage into separate components (PR #162)
- Fix API imports and align types with backend /api prefix (PR #153)

### Fixed

- E2E photo upload flakiness: stable input key + direct setInputFiles
- E2E wait for RustFS and create bucket in Spring Boot startup
- Bump photo upload retries 2→5 with serial mode

## [frontend-v0.9.0] - 2026-06-04

### Changed

- Frontend folder structure flattened
- Docker Compose integration (unified profiles)

### Fixed

- Remaining Frontend audit issues (H4 + H5)
- useAuth respects VITE_API_BACKEND env var
- formatDate locale handling in tests
- UI coverage exclusions for pure TS files

## [frontend-v0.8.0] - 2026-05-30

### Added

- Tree species autocomplete in create zone form (`TreeSearchInput` wired to iNaturalist API) (#74)
- GitHub Actions CD workflow for auto-deploy to Cloudflare Pages on push to main

### Fixed

- wrangler.jsonc `not_found_handling` value to kebab-case (`single-page-application`) for Workers + Assets

## [frontend-v0.7.1] - 2026-05-30

### Fixed

- Cloudflare Workers deployment: `_redirects` SPA fallback infinite loop — replaced with `wrangler.jsonc` `single_page_application` mode
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

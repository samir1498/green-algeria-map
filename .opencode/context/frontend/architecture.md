<!-- Context: main@a933f1c8 -->
# Frontend Architecture

Last updated: 2026-06-08

## Entry Point

`main.tsx` → `QueryClientProvider` → `InnerApp` (reads `useAuth()`) → `RouterProvider` (passes auth as context)

## Routes (TanStack Router)

| Path | Auth | File | Description |
|------|------|------|-------------|
| `/` | Public | `routes/index.tsx` | Leaflet map + stat cards |
| `/about` | Public | `routes/about.tsx` | Static page |
| `/auth/login` | Public | `routes/auth/login.tsx` | Login form |
| `/auth/register` | Public | `routes/auth/register.tsx` | Register form |
| `/zones/new` | Public | `routes/zones/new.tsx` | Create zone + Leaflet picker |
| `/dashboard` | Auth | `routes/_authenticated/dashboard.tsx` | Layout wrapper |
| `/dashboard/` | Auth | `routes/_authenticated/dashboard/index.tsx` | User info cards |

Auth guard: `beforeLoad` checks session → redirects to `/auth/login?redirect=` if missing.

## Features

### auth
- **API**: Dual-backend — better-auth SDK for NestJS, plain REST for Spring Boot. Selected via `VITE_API_BACKEND`.
- **Hooks**: `useAuth()` (composite: session + signIn/signUp/signOut + hasRole), `useLoginForm()`, `useRegisterForm()`
- **Service interface pattern**: `AuthService` + `SessionService` interfaces with separate impls per backend

### zones
- **API**: `GET/POST/PATCH/DELETE /zones`, `POST /zones/:id/volunteer`, `POST /storage/zones/:id/photo`
- **Hooks**: `useZones()` (query), `useCreateZone()` (mutation), `useVolunteer()` (mutation + sessionStorage dedup)
- **Components**: `CreateZoneForm`, `CreateZoneSuccess`, `LocationPicker`, `ZoneCtaPanel`, `ZonePhotoUploader`

### map
- **API**: `GET /public/map` → `{ zones, damageReports }`
- **Hooks**: `usePublicMapData()`
- **Components**: `Map` (MapContainer + CircleMarker), `ZoneMarker` (CircleMarker + Popup), `Legend`

### damage-reports
- **API**: `GET/POST/DELETE /damage-reports`, `GET /zones/:zoneId/damage-reports`, `PATCH /damage-reports/:id/status`
- **Hooks**: `useDamageReports()` (query), `useCreateDamageReport()` (mutation + toast)
- **Components**: `DamageReportForm` (TanStack Form)

### tree-info
- **API**: Direct iNaturalist + GBIF calls (no backend proxy)
- **Hooks**: `useTreeSearch()` (debounced), `useTreeInfo()` (detail + GBIF count), `useTreeLookup()` (one-shot)
- **Components**: `TreeSearchInput` (autocomplete), `TreeInfoModal` (photo, Wikipedia, GBIF count)

## UI Components (shadcn/ui)

| Component | Variants | Notes |
|-----------|----------|-------|
| `Button` | default/destructive/outline/secondary/ghost/link, sizes: default/sm/lg/icon | CVA + asChild via Radix Slot |
| `Card` | Header/Title/Description/Content/Footer | Div-based composition |
| `Badge` | default/secondary/destructive/outline | CVA |
| `Input` | — | Ring-offset styling |
| `Label` | — | peer-disabled styling |
| `Toaster` | — | sonner wrapper + lucide icons |

## Shared Hooks

| Hook | Purpose |
|------|---------|
| `useTheme()` | Light/dark with localStorage + system preference + MutationObserver |

## Types

| Type | File | Key Fields |
|------|------|------------|
| `Zone` | `shared/types/zone.ts` | id, name, type (planting/trash/cleanup), status, lat, lng, targetCount?, currentCount?, description, treeSpecies?, organizerContact?, volunteerCount |
| `DamageReport` | `shared/types/damage-report.ts` | id, zoneId, type (fire/disease/...), severity (low/medium/high/critical), status, lat, lng, description |
| `AppError` | `shared/types/error.ts` | message, code, category, status? |
| `AuthUser` | `features/auth/api/types.ts` | id, name, email, role, emailVerified, createdAt |
| `AuthSession` | `features/auth/api/types.ts` | { user: AuthUser } |
| `TreeSearchResult` | `features/tree-info/api/tree-info.ts` | id, name, commonName, rank |
| `TreeInfoResult` | `features/tree-info/api/tree-info.ts` | summary, photos, wikipediaUrl, commonName, gbifCount |

## Key Libraries

| Lib | Usage |
|-----|-------|
| TanStack React Query v5 | All data fetching, 5min staleTime, retry=1 |
| TanStack Router | File-based routing, auth context |
| TanStack React Form | DamageReportForm |
| Axios | Singleton with `withCredentials: true`, AppError interceptor |
| Leaflet + react-leaflet | Map, markers, Algeria-centered [28, 1.66] |
| sonner | Toast notifications |
| lucide-react | Icons (Moon, Sun, User, etc.) |
| clsx + tailwind-merge | `cn()` utility |
| class-variance-authority | shadcn component variants |

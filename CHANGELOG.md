# Changelog

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

# Changelog

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

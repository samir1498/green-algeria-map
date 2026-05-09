---
name: pc-version-bump
description: Bump version, update CHANGELOG, and tag a release for green-algeria-map
argument-hint: <patch|minor|major|X.Y.Z> <description of changes>
---

Bump the project version, update CHANGELOG.md, and create an annotated tag.

## Workflow

1. Read `frontend/package.json` to get current version.
2. Parse the bump argument:
   - `patch` → bump third segment (0.1.0 → 0.1.1)
   - `minor` → bump second segment, reset patch (0.1.0 → 0.2.0)
   - `major` → bump first segment, reset others (0.1.0 → 1.0.0)
   - `X.Y.Z` → use exact version
3. Update `version` field in `frontend/package.json`.
4. Prepend entry to `CHANGELOG.md` using the description provided.
5. Commit: `git add frontend/package.json CHANGELOG.md && git commit -m "release: v<VERSION>"`
6. Create annotated tag: `git tag -a v<VERSION> -m "release: v<VERSION>"`
7. Push commit + tag: `git push origin main && git push origin v<VERSION>`

## CHANGELOG Entry Format

When writing the CHANGELOG entry, classify changes from recent commits using these sections:

```
## [v<VERSION>] - <YYYY-MM-DD>

### Added
- New features

### Changed
- Changes to existing functionality

### Fixed
- Bug fixes

### Removed
- Removed features

### Deprecated
- Soon-to-be-removed features

### Security
- Security fixes
```

## Examples

```bash
# Patch bump: fixes a bug
pnpm skill pc-version-bump patch "fix stat card hydration error on initial load"

# Minor bump: new feature
pnpm skill pc-version-bump minor "add interactive map with planting zone markers and popups"

# Exact version
pnpm skill pc-version-bump 0.5.0 "add tree species wiki lookup from zone markers"

# Major release
pnpm skill pc-version-bump major "public MVP launch with map, wiki, and reporting"
```

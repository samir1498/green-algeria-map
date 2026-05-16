---
name: pc-version-bump
description: Bump version, update CHANGELOG, and tag a release for green-algeria-map
argument-hint: <frontend|backend> <patch|minor|major|X.Y.Z> <description of changes>
---

Bump one of the projects in the repo, update CHANGELOG.md, and create an annotated tag.

## Prefixes

| Project | package.json path | Tag prefix |
|---------|-------------------|------------|
| frontend | `frontend/package.json` | `frontend-v` |
| backend | `backend-nestjs/package.json` | `backend-v` |

## Workflow

1. Read version from the project's `package.json`.
2. Parse the bump argument:
   - `patch` → bump third segment (0.1.0 → 0.1.1)
   - `minor` → bump second segment, reset patch (0.1.0 → 0.2.0)
   - `major` → bump first segment, reset others (0.1.0 → 1.0.0)
   - `X.Y.Z` → use exact version
3. Update `version` field in the project's `package.json`.
4. Prepend entry to `CHANGELOG.md` using the description provided. Use the prefixed version format in the heading: `## [frontend-v0.3.0]`.
5. Commit: `git add <package.json> CHANGELOG.md && git commit -m "release: <prefix><VERSION>"`
6. Create annotated tag: `git tag -a <prefix><VERSION> -m "release: <prefix><VERSION>"`
7. Push commit + tag: `git push origin main && git push origin <prefix><VERSION>`

## CHANGELOG Entry Format

```
## [<prefix>v<VERSION>] - <YYYY-MM-DD>

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
# Patch bump on frontend
pnpm skill pc-version-bump frontend patch "fix stat card hydration error on initial load"

# Minor bump on frontend
pnpm skill pc-version-bump frontend minor "add interactive map with planting zone markers and popups"

# Exact version on backend
pnpm skill pc-version-bump backend 0.1.0 "initial NestJS API release"
```

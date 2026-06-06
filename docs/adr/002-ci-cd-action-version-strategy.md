# ADR 002: CI/CD Action Version Strategy

**Status:** Accepted
**Date:** 2026-06-06

## Context

GitHub Actions workflows use third-party actions whose versions must be
managed. Two approaches exist: pinning to a commit SHA (immutable, secure)
or pinning to a semver tag (convenient, auto-picks patch updates). The
project had a mix of both approaches, with some workflows using SHAs and
others using version tags.

Additionally, GitHub Actions runners will stop supporting the Node.js 20
runtime on **June 16, 2026**, requiring actions to target Node.js 24 or
later.

## Decision

1. **Use version tags, not commit SHAs, for all actions.** Semver tags
   (`@v4`, `@v5`, `@v6`) provide the right balance of stability and
   maintenance for this project's scope. Pinning to SHAs adds friction
   with no meaningful security benefit for an open-source side project
   without supply-chain attack risk.

2. **Pin to the major version only** (e.g., `@v6`, `@v4`), accepting
   automatic minor/patch updates within the major version.

3. **Prefer actions targeting Node.js 24** where available. Actions still
   on Node.js 20 (`actions/setup-node@v4`, `pnpm/action-setup@v4`,
   `cloudflare/wrangler-action@v3`, `actions/upload-artifact@v4`) will be
   re-evaluated when upstream releases Node.js 24-compatible versions.

4. **Annotated tags** (`git tag -a`) are required for Spring Boot CD
   because GitHub Actions tag-push triggers fire reliably on annotated
   tags but may miss lightweight tags.

## Consequences

- Positive: Consistent format across all workflow files
- Positive: Easier to bump actions by editing a single tag
- Positive: CD trigger is reliable with annotated tags
- Negative: Non-deterministic builds if a major version ships a breaking
  change as a minor/patch (unlikely per semver convention)
- Negative: Node.js 20 actions will emit deprecation warnings until
  upstream releases updates (June 16 deadline)

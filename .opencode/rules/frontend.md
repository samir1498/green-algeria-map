---
description: Rules activated when working on frontend/ files.
---

When editing the frontend:
- Run `pnpm check` (tsc) and `pnpm lint` after changes
- Verify e2e configs in `frontend/config/` when modifying Playwright setup
- Backend configs are in `frontend/config/playwright.{spring,go}.config.ts`
- E2e tests live in `frontend/e2e/`

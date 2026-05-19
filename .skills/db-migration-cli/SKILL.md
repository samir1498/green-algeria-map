# Database Migration Workflow — NEVER write migrations manually

## Golden Rule

**NEVER write migrations by hand.** Always use `pnpm migration:generate <path>`, then edit the generated file to keep only the relevant changes.

The CLI diffs your `data-source.ts` entities against the current database schema to produce a migration. If the DB has existing tables from prior work, the migration will include extra changes. Edit the generated file to retain only the intended changes (add/remove columns, add/remove tables, etc.).

## Workflow

### 1. Before generating a migration

- Ensure the target database is **fresh** (has only the baseline schema — zones, auth tables, etc.)
- If the DB has extra tables/columns from previous work, reset it first:

```bash
docker stop green-algeria-db && docker rm green-algeria-db
docker run -d --name green-algeria-db \
  -e POSTGRES_USER=greenalgeria \
  -e POSTGRES_PASSWORD=greenalgeria \
  -e POSTGRES_DB=greenalgeria \
  -p 5432:5432 \
  postgres:18-alpine

# Wait ~5s for DB to be ready
```

- Run existing migrations to bring DB to current state:

```bash
cd backend-nestjs && pnpm migration:run
```

### 2. Generate the migration

```bash
cd backend-nestjs
pnpm migration:generate src/migrations/<DescriptiveName>
```

Example: `pnpm migration:generate src/migrations/CreateDamageReport`

### 3. Edit the generated migration

Open the generated file in `src/migrations/`. It will contain ALL differences between the entity and the current DB schema — including changes to existing tables (auth, zones, etc.) that are NOT your intended change.

**Keep only the statements that match your actual intent.** Remove lines that:
- Drop/add columns on unrelated tables (user, session, account, verification)
- Drop/create indexes on unrelated tables
- Drop/add constraints on unrelated tables

For example, if you only added `DamageReportOrmEntity`, the `up()` method should only contain:
- `CREATE TABLE "damage_reports" ...`
- `CREATE INDEX "IDX_..." ON "damage_reports" ...`

And `down()` should contain the inverse.

### 4. Verify the migration is correct

```bash
pnpm migration:revert   # undo current migration
pnpm migration:run      # re-apply and check
pnpm migration:generate src/migrations/CheckMigration  # generate another to confirm no diff
```

If the check migration is empty (no SQL statements), the previous migration is correct.

### 5. Commit

```bash
git add src/migrations/<timestamp>-<Name>.ts
git commit -m "feat(backend): add migration for <description>"
```

## Why this matters

- Manual migrations can be wrong (typos, wrong types, missing constraints)
- The CLI produces correct SQL based on actual entity definitions
- Editing the generated migration is the correct workflow — not hand-writing
- This keeps migrations consistent, testable, and reviewable
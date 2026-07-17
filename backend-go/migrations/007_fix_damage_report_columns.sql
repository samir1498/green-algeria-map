-- +goose Up
-- Align the damage_reports table with the repository SQL and the API contract
-- (camelCase reportedBy / reportedAt used by the Go repo, the NestJS backend,
-- and the frontend). Migration 005 mistakenly created a snake_case reported_by
-- column and omitted reportedAt entirely, so every damage-report write 500'd.
ALTER TABLE damage_reports
    DROP COLUMN IF EXISTS reported_by,
    ADD COLUMN "reportedBy" TEXT,
    ADD COLUMN "reportedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- +goose Down
ALTER TABLE damage_reports
    DROP COLUMN IF EXISTS "reportedBy",
    DROP COLUMN IF EXISTS "reportedAt",
    ADD COLUMN reported_by TEXT;

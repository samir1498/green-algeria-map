-- +goose Up
ALTER TABLE damage_reports
    ADD COLUMN type TEXT NOT NULL DEFAULT 'other',
    ADD COLUMN status TEXT NOT NULL DEFAULT 'reported',
    ADD COLUMN reported_by TEXT;

-- +goose Down
ALTER TABLE damage_reports
    DROP COLUMN IF EXISTS type,
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS reported_by;
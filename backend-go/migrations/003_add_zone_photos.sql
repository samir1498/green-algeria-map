-- +goose Up
ALTER TABLE zones ADD COLUMN photos TEXT[] DEFAULT '{}';

-- +goose Down
ALTER TABLE zones DROP COLUMN IF EXISTS photos;

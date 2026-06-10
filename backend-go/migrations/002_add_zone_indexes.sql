-- +goose Up
CREATE INDEX IF NOT EXISTS idx_zones_name ON zones (name);
CREATE INDEX IF NOT EXISTS idx_zones_type ON zones (type);
CREATE INDEX IF NOT EXISTS idx_zones_status ON zones (status);

-- +goose Down
DROP INDEX IF EXISTS idx_zones_name;
DROP INDEX IF EXISTS idx_zones_type;
DROP INDEX IF EXISTS idx_zones_status;

-- +goose Up
ALTER TABLE zones
    ADD COLUMN IF NOT EXISTS target_count INTEGER,
    ADD COLUMN IF NOT EXISTS current_count INTEGER,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS tree_species TEXT,
    ADD COLUMN IF NOT EXISTS organizer_contact TEXT,
    ADD COLUMN IF NOT EXISTS volunteer_count INTEGER DEFAULT 0;

-- +goose Down
ALTER TABLE zones
    DROP COLUMN IF EXISTS target_count,
    DROP COLUMN IF EXISTS current_count,
    DROP COLUMN IF EXISTS description,
    DROP COLUMN IF EXISTS tree_species,
    DROP COLUMN IF EXISTS organizer_contact,
    DROP COLUMN IF EXISTS volunteer_count;
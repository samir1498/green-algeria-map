CREATE TABLE zone_photos (
    zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    photos TEXT NOT NULL
);

INSERT INTO zone_photos (zone_id, photos)
SELECT id, unnest(string_to_array(photos, ','))
FROM zones
WHERE photos IS NOT NULL AND photos != '';

ALTER TABLE zones DROP COLUMN photos;

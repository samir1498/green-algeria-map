CREATE TABLE IF NOT EXISTS zones (
    id               TEXT PRIMARY KEY,
    name             TEXT NOT NULL,
    type             TEXT NOT NULL,
    status           TEXT NOT NULL DEFAULT 'planned',
    lat              DOUBLE PRECISION NOT NULL,
    lng              DOUBLE PRECISION NOT NULL,
    target_count     INTEGER DEFAULT 0,
    current_count    INTEGER DEFAULT 0,
    description      TEXT,
    tree_species     TEXT,
    organizer_contact TEXT,
    volunteer_count  INTEGER DEFAULT 0,
    photos           TEXT[] DEFAULT '{}',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zones_name ON zones (name);
CREATE INDEX IF NOT EXISTS idx_zones_type ON zones (type);
CREATE INDEX IF NOT EXISTS idx_zones_status ON zones (status);

CREATE TABLE IF NOT EXISTS damage_reports (
    id          TEXT PRIMARY KEY,
    zone_id     TEXT REFERENCES zones(id) ON DELETE SET NULL,
    title       TEXT NOT NULL,
    description TEXT,
    severity    TEXT NOT NULL DEFAULT 'low',
    lat         DOUBLE PRECISION NOT NULL,
    lng         DOUBLE PRECISION NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "user" (
    id             TEXT PRIMARY KEY,
    name           TEXT NOT NULL DEFAULT '',
    email          TEXT NOT NULL UNIQUE,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    image          TEXT,
    role           TEXT NOT NULL DEFAULT 'volunteer',
    banned         BOOLEAN NOT NULL DEFAULT false,
    ban_reason     TEXT,
    ban_expires    TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "session" (
    id             TEXT PRIMARY KEY,
    expires_at     TIMESTAMPTZ NOT NULL,
    ip_address     TEXT,
    user_agent     TEXT,
    token          TEXT NOT NULL UNIQUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id        TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
    id                TEXT PRIMARY KEY,
    account_id        TEXT NOT NULL,
    provider_id       TEXT NOT NULL,
    password          TEXT,
    access_token      TEXT,
    refresh_token     TEXT,
    id_token          TEXT,
    scope             TEXT,
    token_type        TEXT,
    metadata          JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id           TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "verification" (
    id          TEXT PRIMARY KEY,
    identifier  TEXT NOT NULL,
    value       TEXT NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS account_user_id_idx ON "account" (user_id);
CREATE INDEX IF NOT EXISTS session_user_id_idx ON "session" (user_id);

-- Habertronic Orión — esquema inicial (proyecto Neon NUEVO)
-- Solo investigadores por ahora

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS researchers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS researcher_login_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  researcher_id UUID REFERENCES researchers(id) ON DELETE SET NULL,
  email       VARCHAR(255),
  success     BOOLEAN NOT NULL,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  logged_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_researchers_email
  ON researchers (email);

CREATE INDEX IF NOT EXISTS idx_researcher_login_events_logged_at
  ON researcher_login_events (logged_at);

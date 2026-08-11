-- Habertronic Orión — esquema completo

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS researchers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(200),
  age           INTEGER,
  sex           VARCHAR(10),
  phone         VARCHAR(40),
  nickname      VARCHAR(80),
  location_declined BOOLEAN NOT NULL DEFAULT FALSE,
  location_json JSONB,
  ophthalmology_profile VARCHAR(20),
  specialty_slug VARCHAR(40),
  specialty_other VARCHAR(120),
  role          VARCHAR(30) NOT NULL DEFAULT 'researcher',
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS researcher_login_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  researcher_id UUID REFERENCES researchers(id) ON DELETE SET NULL,
  email         VARCHAR(255),
  success       BOOLEAN NOT NULL,
  ip_address    VARCHAR(45),
  user_agent    TEXT,
  logged_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(80) NOT NULL UNIQUE,
  name_es     VARCHAR(120) NOT NULL,
  name_en     VARCHAR(120) NOT NULL,
  name_pt     VARCHAR(120) NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  researcher_id   UUID NOT NULL REFERENCES researchers(id) ON DELETE CASCADE,
  status          VARCHAR(20) NOT NULL DEFAULT 'approved'
                  CHECK (status IN ('approved', 'revoked', 'pending')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, researcher_id)
);

CREATE INDEX IF NOT EXISTS idx_researchers_email ON researchers (email);
CREATE INDEX IF NOT EXISTS idx_researcher_login_events_logged_at
  ON researcher_login_events (logged_at);
CREATE INDEX IF NOT EXISTS idx_project_members_researcher
  ON project_members (researcher_id);

INSERT INTO projects (slug, name_es, name_en, name_pt)
VALUES
  ('parpadeo', 'Protocolo Parpadeo', 'Blink Protocol', 'Protocolo Piscar'),
  (
    'interferometria',
    'Protocolo Interferometría',
    'Interferometry Protocol',
    'Protocolo Interferometria'
  )
ON CONFLICT (slug) DO NOTHING;

-- Representantes e invitaciones (migración 008)
CREATE TABLE IF NOT EXISTS representatives (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(200) NOT NULL,
  phone         VARCHAR(40),
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_representatives_email ON representatives (email);

CREATE TABLE IF NOT EXISTS invitations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id   UUID NOT NULL REFERENCES representatives(id) ON DELETE CASCADE,
  token               VARCHAR(64) NOT NULL UNIQUE,
  invitee_email       VARCHAR(255),
  researcher_id       UUID REFERENCES researchers(id) ON DELETE SET NULL,
  invite_type         VARCHAR(30) NOT NULL DEFAULT 'researcher'
                      CHECK (invite_type IN ('researcher', 'preceptorship')),
  status              VARCHAR(20) NOT NULL DEFAULT 'open'
                      CHECK (status IN ('open', 'accepted', 'registered', 'expired')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ NOT NULL,
  accepted_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invitations_rep ON invitations (representative_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations (token);
CREATE INDEX IF NOT EXISTS idx_invitations_invitee_email ON invitations (invitee_email);

ALTER TABLE researchers
  ADD COLUMN IF NOT EXISTS invited_by_rep_id UUID REFERENCES representatives(id) ON DELETE SET NULL;

ALTER TABLE researchers
  ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMPTZ;

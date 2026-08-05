-- Sesiones de interrogatorio Parpadeo + snapshot ambiental

CREATE TABLE IF NOT EXISTS parpadeo_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  researcher_id   UUID NOT NULL REFERENCES researchers(id) ON DELETE CASCADE,
  project_slug    VARCHAR(80) NOT NULL DEFAULT 'parpadeo',
  answers_json    JSONB NOT NULL DEFAULT '{}',
  location_json   JSONB,
  environment_json JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parpadeo_sessions_researcher
  ON parpadeo_sessions (researcher_id);

CREATE INDEX IF NOT EXISTS idx_parpadeo_sessions_created
  ON parpadeo_sessions (created_at DESC);

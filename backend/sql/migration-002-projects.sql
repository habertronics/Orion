-- Migración: nickname + proyectos + membresías
-- Seguro de re-ejecutar (IF NOT EXISTS / ON CONFLICT)

ALTER TABLE researchers
  ADD COLUMN IF NOT EXISTS nickname VARCHAR(80);

ALTER TABLE researchers
  ADD COLUMN IF NOT EXISTS role VARCHAR(30) NOT NULL DEFAULT 'researcher';

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

CREATE INDEX IF NOT EXISTS idx_project_members_researcher
  ON project_members (researcher_id);

INSERT INTO projects (slug, name_es, name_en, name_pt)
VALUES
  (
    'parpadeo',
    'Protocolo Parpadeo',
    'Blink Protocol',
    'Protocolo Piscar'
  ),
  (
    'interferometria',
    'Protocolo Interferometría',
    'Interferometry Protocol',
    'Protocolo Interferometria'
  )
ON CONFLICT (slug) DO NOTHING;

-- Altos existentes: aprobar en todos los proyectos activos
INSERT INTO project_members (project_id, researcher_id, status)
SELECT p.id, r.id, 'approved'
FROM projects p
CROSS JOIN researchers r
WHERE p.active = TRUE
ON CONFLICT (project_id, researcher_id) DO NOTHING;

-- Representantes médicos + invitaciones a investigadores

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

COMMENT ON COLUMN researchers.invited_by_rep_id IS 'Representante que invitó al médico';
COMMENT ON COLUMN researchers.invitation_accepted_at IS 'Momento en que el médico aceptó la invitación';

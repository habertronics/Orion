ALTER TABLE invitations
  ADD COLUMN IF NOT EXISTS invitee_name VARCHAR(200);

COMMENT ON COLUMN invitations.invitee_name IS 'Nombre del médico al aceptar la invitación';

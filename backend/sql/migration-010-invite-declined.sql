-- Permitir respuesta "No aceptó" en invitaciones de representantes.
ALTER TABLE invitations
  DROP CONSTRAINT IF EXISTS invitations_status_check;

ALTER TABLE invitations
  ADD CONSTRAINT invitations_status_check
  CHECK (status IN ('open', 'accepted', 'registered', 'expired', 'declined'));

COMMENT ON COLUMN invitations.status IS
  'open=QR pendiente; accepted/registered=Aceptó; declined=No aceptó; expired=caducó';

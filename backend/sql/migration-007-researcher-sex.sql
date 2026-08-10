ALTER TABLE researchers
  ADD COLUMN IF NOT EXISTS sex VARCHAR(10);

COMMENT ON COLUMN researchers.sex IS 'Sexo del médico: male | female';

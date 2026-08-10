ALTER TABLE researchers
  ADD COLUMN IF NOT EXISTS ophthalmology_profile VARCHAR(20),
  ADD COLUMN IF NOT EXISTS specialty_slug VARCHAR(40),
  ADD COLUMN IF NOT EXISTS specialty_other VARCHAR(120);

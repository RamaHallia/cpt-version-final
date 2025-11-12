/*
  # Add color to meeting_categories

  - Adds a mandatory color column to let users customize category chips
*/

ALTER TABLE meeting_categories
  ADD COLUMN IF NOT EXISTS color text DEFAULT '#F97316';

UPDATE meeting_categories
  SET color = '#F97316'
  WHERE color IS NULL;

ALTER TABLE meeting_categories
  ALTER COLUMN color SET NOT NULL;

COMMENT ON COLUMN meeting_categories.color IS 'Hex color code used to style the category chip';


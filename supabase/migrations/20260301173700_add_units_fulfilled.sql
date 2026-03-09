-- Add units_fulfilled column if it doesn't already exist
ALTER TABLE blood_requests ADD COLUMN IF NOT EXISTS units_fulfilled integer DEFAULT 0;

-- Add completed flag to trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS completed boolean NOT NULL DEFAULT false;

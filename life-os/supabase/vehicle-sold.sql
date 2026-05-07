-- Add purchased_date and sold_date to vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS purchased_date date;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS sold_date date;

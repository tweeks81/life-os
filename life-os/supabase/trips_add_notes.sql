-- Add notes column to all trip item tables
ALTER TABLE trip_flights ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE trip_parking ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE trip_taxis ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE trip_accommodations ADD COLUMN IF NOT EXISTS notes text;

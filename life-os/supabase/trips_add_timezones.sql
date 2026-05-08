-- Add timezone columns to trip_flights
ALTER TABLE trip_flights ADD COLUMN IF NOT EXISTS depart_timezone text;
ALTER TABLE trip_flights ADD COLUMN IF NOT EXISTS arrive_timezone text;

-- Add sort_order to all trip item tables for manual reordering
ALTER TABLE trip_flights ADD COLUMN IF NOT EXISTS sort_order integer;
ALTER TABLE trip_parking ADD COLUMN IF NOT EXISTS sort_order integer;
ALTER TABLE trip_taxis ADD COLUMN IF NOT EXISTS sort_order integer;
ALTER TABLE trip_accommodations ADD COLUMN IF NOT EXISTS sort_order integer;

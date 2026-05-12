-- Add start/end dates to trips for calendar display
ALTER TABLE trips ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS end_date date;

-- Link a project to a trip so trip tasks appear in the Tasks module
ALTER TABLE projects ADD COLUMN IF NOT EXISTS trip_id uuid REFERENCES trips(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS projects_trip_id_key ON projects(trip_id) WHERE trip_id IS NOT NULL;

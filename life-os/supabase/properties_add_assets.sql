CREATE TABLE IF NOT EXISTS property_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  asset_type text NOT NULL,
  make text,
  model text,
  purchase_date date,
  serial_number text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS property_asset_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES property_assets(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE property_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_asset_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner full access" ON property_assets
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "shared users can read" ON property_assets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM property_shares WHERE property_id = property_assets.property_id AND shared_with_id = auth.uid())
  );

CREATE POLICY "owner full access" ON property_asset_notes
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "shared users can read" ON property_asset_notes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM property_shares WHERE property_id = property_asset_notes.property_id AND shared_with_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS property_utilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  utility_type text NOT NULL,
  provider text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE property_utilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner full access" ON property_utilities
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "shared users can read" ON property_utilities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM property_shares
      WHERE property_id = property_utilities.property_id
        AND shared_with_id = auth.uid()
    )
  );

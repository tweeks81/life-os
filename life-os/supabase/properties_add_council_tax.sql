CREATE TABLE IF NOT EXISTS property_council_tax (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  council_name text NOT NULL,
  band char(1) NOT NULL,
  period_start date,
  period_end date,
  annual_charge numeric(10, 2),
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE property_council_tax ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner full access" ON property_council_tax
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "shared users can read" ON property_council_tax
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM property_shares
      WHERE property_id = property_council_tax.property_id
        AND shared_with_id = auth.uid()
    )
  );

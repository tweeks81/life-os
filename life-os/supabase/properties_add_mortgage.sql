-- Property mortgages table — stores all mortgage records (current + history) for a property
CREATE TABLE IF NOT EXISTS property_mortgages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lender text NOT NULL,
  product_type text,
  interest_rate numeric(5, 2),
  monthly_payment numeric(10, 2),
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE property_mortgages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner full access" ON property_mortgages
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "shared users can read" ON property_mortgages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM property_shares
      WHERE property_id = property_mortgages.property_id
        AND shared_with_id = auth.uid()
    )
  );

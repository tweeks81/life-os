-- Property policies (home insurance, contents, landlord, etc.)
CREATE TABLE IF NOT EXISTS property_policies (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id      uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  policy_type      text NOT NULL DEFAULT 'home_insurance',
  insurer          text NOT NULL,
  policy_number    text,
  premium_annual   numeric,
  start_date       date,
  end_date         date,
  notes            text,
  sort_order       integer,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE property_policies ENABLE ROW LEVEL SECURITY;

-- Owner has full access
CREATE POLICY "owner_all" ON property_policies
  FOR ALL USING (user_id = auth.uid());

-- Shared-property users can read (mirrors the pattern used by other property tables)
CREATE POLICY "shared_read" ON property_policies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM property_shares
      WHERE property_id = property_policies.property_id
        AND shared_with_id = auth.uid()
    )
  );

-- Reload PostgREST schema cache after running this
-- NOTIFY pgrst, 'reload schema';

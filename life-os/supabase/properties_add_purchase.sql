-- Purchase details for a property (one-to-one, optional)
CREATE TABLE IF NOT EXISTS property_purchase (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id         uuid UNIQUE NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_owned            boolean NOT NULL DEFAULT false,
  purchase_date       date,
  purchase_price      numeric(12, 2),
  -- Conveyancer / Solicitor
  conveyancer_firm    text,
  conveyancer_contact text,
  conveyancer_phone   text,
  conveyancer_email   text,
  -- Estate Agent
  estate_agent_firm   text,
  estate_agent_contact text,
  estate_agent_phone  text,
  estate_agent_email  text,
  created_at          timestamptz DEFAULT now() NOT NULL,
  updated_at          timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE property_purchase ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner full access" ON property_purchase
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "shared users can read" ON property_purchase
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM property_shares
      WHERE property_id = property_purchase.property_id
        AND shared_with_id = auth.uid()
    )
  );

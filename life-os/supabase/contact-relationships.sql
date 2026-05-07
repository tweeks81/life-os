-- Add is_self flag to contacts (marks the user's own self-contact entry)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_self boolean NOT NULL DEFAULT false;

-- Contact relationships: stores directional relationships between contacts
-- b_role = what contact_b IS to contact_a (e.g. 'child' means contact_b is contact_a's child)
CREATE TABLE IF NOT EXISTS contact_relationships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_a_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  contact_b_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  b_role text NOT NULL CHECK (b_role IN ('parent', 'child', 'sibling', 'spouse')),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT different_contacts CHECK (contact_a_id != contact_b_id),
  UNIQUE(user_id, contact_a_id, contact_b_id)
);

ALTER TABLE contact_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own relationships" ON contact_relationships
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

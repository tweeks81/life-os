-- Contact name overrides: allows users to set a private name for shared/linked contacts
CREATE TABLE IF NOT EXISTS contact_name_overrides (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- For shared contacts (regular contacts shared with this user)
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  -- For linked contacts (Life OS users linked in contacts)
  linked_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- Must reference exactly one of contact_id or linked_user_id
  CONSTRAINT one_target CHECK (
    (contact_id IS NOT NULL AND linked_user_id IS NULL) OR
    (contact_id IS NULL AND linked_user_id IS NOT NULL)
  ),
  UNIQUE (user_id, contact_id),
  UNIQUE (user_id, linked_user_id)
);

ALTER TABLE contact_name_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own name overrides" ON contact_name_overrides
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

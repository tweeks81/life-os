-- Allow linked contacts to be referenced in relationships
-- Drop FK constraints so contact_a_id / contact_b_id can hold either a
-- contacts.id UUID or a linked user's profile UUID
ALTER TABLE contact_relationships
  DROP CONSTRAINT IF EXISTS contact_relationships_contact_a_id_fkey,
  DROP CONSTRAINT IF EXISTS contact_relationships_contact_b_id_fkey;

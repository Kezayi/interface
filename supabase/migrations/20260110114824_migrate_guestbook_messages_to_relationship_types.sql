/*
  # Migrate Guestbook Messages to Use Relationship Types Reference

  ## Purpose
  Migrate the guestbook_messages table from storing relationship as text
  to using a foreign key reference to the relationship_types table.

  ## Changes
  1. Add new column relationship_type_code referencing relationship_types(code)
  2. Migrate existing data by mapping old text values to new codes
  3. Make relationship_type_code NOT NULL after migration
  4. Drop old relationship column
  5. Rename relationship_type_code to relationship for backward compatibility
  
  ## Data Migration Mapping
  Old text values → New relationship codes:
  - 'spouse' → 'spouse_male' or 'spouse_female' (default to neutral generic)
  - 'father' → 'father'
  - 'mother' → 'mother'
  - 'son' → 'son'
  - 'daughter' or 'Fille' → 'daughter'
  - 'brother' or 'Frère' → 'brother'
  - 'sister' → 'sister'
  - 'grandson' → 'grandson'
  - 'granddaughter' → 'granddaughter'
  - 'friend' → 'friend'
  - 'colleague' → 'colleague'
  - 'parent' → 'parent'
  - 'child' → 'child'
  - 'sibling' → 'sibling'
  - 'grandparent' → 'grandparent'
  - 'grandchild' → 'grandchild'
  - 'uncle_aunt' → 'uncle_aunt'
  - 'cousin' → 'cousin'
  - 'neighbor' → 'neighbor'
  - 'acquaintance' or 'other' → 'acquaintance'

  ## Indexes
  - Add foreign key index on relationship column for query performance

  ## Notes
  - Uses codes instead of IDs for the foreign key to maintain readability
  - Preserves all existing guestbook messages with proper relationship mapping
*/

-- Step 1: Add new column with foreign key to relationship_types(code)
ALTER TABLE guestbook_messages 
  ADD COLUMN IF NOT EXISTS relationship_type_code text;

-- Step 2: Migrate existing data
-- Map old text values to new relationship type codes
UPDATE guestbook_messages
SET relationship_type_code = CASE
  -- Direct mappings
  WHEN relationship = 'father' THEN 'father'
  WHEN relationship = 'mother' THEN 'mother'
  WHEN relationship = 'son' THEN 'son'
  WHEN relationship IN ('daughter', 'Fille') THEN 'daughter'
  WHEN relationship IN ('brother', 'Frère') THEN 'brother'
  WHEN relationship = 'sister' THEN 'sister'
  WHEN relationship = 'grandson' THEN 'grandson'
  WHEN relationship = 'granddaughter' THEN 'granddaughter'
  WHEN relationship = 'grandfather' THEN 'grandfather'
  WHEN relationship = 'grandmother' THEN 'grandmother'
  WHEN relationship = 'uncle' THEN 'uncle'
  WHEN relationship = 'aunt' THEN 'aunt'
  WHEN relationship = 'nephew' THEN 'nephew'
  WHEN relationship = 'niece' THEN 'niece'
  
  -- Generic family mappings
  WHEN relationship = 'parent' THEN 'parent'
  WHEN relationship = 'child' THEN 'child'
  WHEN relationship = 'sibling' THEN 'sibling'
  WHEN relationship = 'grandparent' THEN 'grandparent'
  WHEN relationship = 'grandchild' THEN 'grandchild'
  WHEN relationship = 'uncle_aunt' THEN 'uncle_aunt'
  WHEN relationship = 'cousin' THEN 'cousin'
  
  -- Spouse mappings (default to male form, could be refined)
  WHEN relationship = 'spouse' THEN 'spouse_male'
  
  -- Social mappings
  WHEN relationship = 'friend' THEN 'friend'
  WHEN relationship = 'neighbor' THEN 'neighbor'
  WHEN relationship = 'acquaintance' THEN 'acquaintance'
  
  -- Professional mappings
  WHEN relationship = 'colleague' THEN 'colleague'
  
  -- Default fallback
  ELSE 'acquaintance'
END
WHERE relationship_type_code IS NULL;

-- Step 3: Add foreign key constraint
ALTER TABLE guestbook_messages
  ADD CONSTRAINT fk_guestbook_messages_relationship_type
  FOREIGN KEY (relationship_type_code)
  REFERENCES relationship_types(code)
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

-- Step 4: Make the new column NOT NULL
ALTER TABLE guestbook_messages
  ALTER COLUMN relationship_type_code SET NOT NULL;

-- Step 5: Drop old relationship column
ALTER TABLE guestbook_messages
  DROP COLUMN IF EXISTS relationship;

-- Step 6: Rename new column to relationship for backward compatibility
ALTER TABLE guestbook_messages
  RENAME COLUMN relationship_type_code TO relationship;

-- Step 7: Add index on relationship for query performance
CREATE INDEX IF NOT EXISTS idx_guestbook_messages_relationship 
  ON guestbook_messages(relationship);

-- Step 8: Add helpful comment
COMMENT ON COLUMN guestbook_messages.relationship IS 
  'Foreign key to relationship_types.code - defines the relationship between message author and deceased';

/*
  # Add Strict Relation Types for Kinship Inference

  ## Changes

  ### 1. Add updated_at column to guestbook_messages
  - Add `updated_at` (timestamptz) for tracking message updates
  - Required by existing trigger

  ### 2. Add author name fields
  - Add `author_first_name` (text) - First name of the condolence author
  - Add `author_last_name` (text) - Last name of the condolence author  
  - Keep `author_name` for backward compatibility
  - Populate first/last names from existing author_name where possible

  ### 3. Update relation types
  - Add new strict relation types: 'spouse', 'son', 'daughter', 'father', 'mother', 'brother', 'sister', 'grandson', 'granddaughter', 'friend', 'colleague'
  - Keep legacy types for backward compatibility

  ## Important Notes
  - Strict relation types enable kinship inference engine
  - Author surname matching helps identify potential relatives
  - Legacy data is preserved during migration
*/

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guestbook_messages' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE guestbook_messages ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Add first_name and last_name columns to guestbook_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guestbook_messages' AND column_name = 'author_first_name'
  ) THEN
    ALTER TABLE guestbook_messages ADD COLUMN author_first_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guestbook_messages' AND column_name = 'author_last_name'
  ) THEN
    ALTER TABLE guestbook_messages ADD COLUMN author_last_name text;
  END IF;
END $$;

-- Populate first_name and last_name from author_name (split by space)
UPDATE guestbook_messages
SET 
  author_first_name = COALESCE(
    SPLIT_PART(author_name, ' ', 1),
    author_name
  ),
  author_last_name = CASE
    WHEN POSITION(' ' IN author_name) > 0 THEN
      SUBSTRING(author_name FROM POSITION(' ' IN author_name) + 1)
    ELSE
      ''
  END
WHERE author_first_name IS NULL;

-- Update the relationship constraint to support strict relation types
DO $$
BEGIN
  ALTER TABLE guestbook_messages DROP CONSTRAINT IF EXISTS guestbook_messages_relationship_check;

  ALTER TABLE guestbook_messages ADD CONSTRAINT guestbook_messages_relationship_check 
    CHECK (relationship IN (
      'spouse', 'son', 'daughter', 'father', 'mother', 'brother', 'sister',
      'grandson', 'granddaughter', 'friend', 'colleague',
      'parent', 'child', 'sibling', 'grandparent', 'grandchild',
      'uncle_aunt', 'cousin', 'neighbor', 'acquaintance', 'other'
    ));
END $$;

-- Create index on author surnames for faster kinship matching
CREATE INDEX IF NOT EXISTS idx_guestbook_author_last_name ON guestbook_messages(author_last_name);

-- Create index on relationship type for faster filtering
CREATE INDEX IF NOT EXISTS idx_guestbook_relationship ON guestbook_messages(relationship);

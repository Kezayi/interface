/*
  # Add search indexes for improved performance

  1. Purpose
    - Add trigram indexes for fast text search on names
    - Support case-insensitive partial matching with ILIKE
    - Enable efficient search across memorials and guestbook messages

  2. Indexes Added
    - Trigram index on memorials.deceased_full_name for deceased name search
    - Trigram indexes on guestbook_messages for author name search
    - These indexes dramatically improve ILIKE query performance

  3. Notes
    - pg_trgm extension is already installed in extensions schema
    - Trigram indexes support fuzzy matching and partial text search
    - Essential for the kinship search functionality
*/

CREATE INDEX IF NOT EXISTS idx_memorials_deceased_name_trgm 
  ON memorials USING gin (deceased_full_name extensions.gin_trgm_ops)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_guestbook_author_name_trgm 
  ON guestbook_messages USING gin (author_name extensions.gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_guestbook_author_first_name_trgm 
  ON guestbook_messages USING gin (author_first_name extensions.gin_trgm_ops)
  WHERE author_first_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_guestbook_author_last_name_trgm 
  ON guestbook_messages USING gin (author_last_name extensions.gin_trgm_ops)
  WHERE author_last_name IS NOT NULL;

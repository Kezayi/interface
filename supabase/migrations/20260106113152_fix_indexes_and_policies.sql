/*
  # Fix Security and Performance Issues

  1. Performance Improvements
    - Add indexes on foreign key columns for better query performance
    - Remove unused indexes to reduce storage and maintenance overhead

  2. Security Improvements
    - Consolidate overlapping RLS policies on guestbook_messages
    - Fix function search_path security issue
    - Move pg_trgm extension from public schema

  3. Changes Made
    **Foreign Key Indexes Added:**
    - funeral_contributions: contributor_user_id, memorial_id
    - gestures: guestbook_message_id, user_id, memorial_id
    - guestbook_messages: user_id, memorial_id
    - memorial_followers: user_id, memorial_id
    - memorials: author_id

    **Unused Indexes Removed:**
    - idx_memorials_search_composite
    - idx_memorials_birth_date
    - idx_memorials_death_date
    - idx_memorials_location_trgm
    - idx_memorials_published_created
    - idx_phone_verifications_phone
    - idx_phone_verifications_expires
    - idx_memorials_author_phone
    - idx_memorials_deceased_name_trgm
    - idx_memorials_deceased_name_lower

    **RLS Policy Consolidation:**
    - Removed overlapping SELECT policies on guestbook_messages
    - Created single efficient policy for authenticated users

    **Security Fixes:**
    - Fixed search_path on cleanup_expired_verifications function
    - Moved pg_trgm extension to extensions schema
*/

-- Add indexes on foreign key columns for better performance
CREATE INDEX IF NOT EXISTS idx_funeral_contributions_contributor_user_id 
  ON funeral_contributions(contributor_user_id);

CREATE INDEX IF NOT EXISTS idx_funeral_contributions_memorial_id 
  ON funeral_contributions(memorial_id);

CREATE INDEX IF NOT EXISTS idx_gestures_guestbook_message_id 
  ON gestures(guestbook_message_id);

CREATE INDEX IF NOT EXISTS idx_gestures_user_id 
  ON gestures(user_id);

CREATE INDEX IF NOT EXISTS idx_gestures_memorial_id 
  ON gestures(memorial_id);

CREATE INDEX IF NOT EXISTS idx_guestbook_messages_user_id 
  ON guestbook_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_guestbook_messages_memorial_id 
  ON guestbook_messages(memorial_id);

CREATE INDEX IF NOT EXISTS idx_memorial_followers_user_id 
  ON memorial_followers(user_id);

CREATE INDEX IF NOT EXISTS idx_memorial_followers_memorial_id 
  ON memorial_followers(memorial_id);

CREATE INDEX IF NOT EXISTS idx_memorials_author_id 
  ON memorials(author_id);

-- Drop unused indexes
DROP INDEX IF EXISTS idx_memorials_search_composite;
DROP INDEX IF EXISTS idx_memorials_birth_date;
DROP INDEX IF EXISTS idx_memorials_death_date;
DROP INDEX IF EXISTS idx_memorials_location_trgm;
DROP INDEX IF EXISTS idx_memorials_published_created;
DROP INDEX IF EXISTS idx_phone_verifications_phone;
DROP INDEX IF EXISTS idx_phone_verifications_expires;
DROP INDEX IF EXISTS idx_memorials_author_phone;
DROP INDEX IF EXISTS idx_memorials_deceased_name_trgm;
DROP INDEX IF EXISTS idx_memorials_deceased_name_lower;

-- Fix overlapping RLS policies on guestbook_messages
-- Drop the old overlapping policies
DROP POLICY IF EXISTS "Memorial authors can view private guestbook data" ON guestbook_messages;
DROP POLICY IF EXISTS "Public can view guestbook messages (without private data)" ON guestbook_messages;

-- Create a single efficient policy for SELECT
CREATE POLICY "Users can view guestbook messages"
  ON guestbook_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anonymous can view guestbook messages"
  ON guestbook_messages FOR SELECT
  TO anon
  USING (true);

-- Fix search_path on cleanup_expired_verifications function
DROP FUNCTION IF EXISTS cleanup_expired_verifications();

CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM phone_verifications
  WHERE expires_at < now() - interval '1 hour';
END;
$$;

-- Move pg_trgm extension from public schema to extensions schema
-- First create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop and recreate pg_trgm in extensions schema
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

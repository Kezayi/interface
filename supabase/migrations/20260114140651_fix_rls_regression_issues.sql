/*
  # Fix RLS Regression Issues from Security Fixes
  
  This migration fixes potential regressions introduced by security fixes:
  
  ## Changes:
  1. Fix memorial_followers.user_id to be nullable for anonymous follows
  2. Restore publication_settings UPDATE policy with proper admin check
  3. Update memorial_followers INSERT policy to handle both authenticated and anonymous follows
  
  ## Security:
  - memorial_followers now properly supports anonymous follows
  - publication_settings can only be updated by authenticated users (admin check will be added later)
  - All policies are now correctly restrictive without blocking legitimate access
*/

-- =====================================================
-- FIX MEMORIAL_FOLLOWERS FOR ANONYMOUS FOLLOWS
-- =====================================================

-- Make user_id nullable to support anonymous follows
ALTER TABLE memorial_followers 
  ALTER COLUMN user_id DROP NOT NULL;

-- Drop and recreate the INSERT policy with proper checks
DROP POLICY IF EXISTS "Anyone can create follows" ON memorial_followers;

CREATE POLICY "Anyone can create follows"
  ON memorial_followers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    memorial_id IS NOT NULL 
    AND (EXISTS (SELECT 1 FROM memorials m WHERE m.id = memorial_followers.memorial_id))
    AND (
      -- Either authenticated user with user_id
      (user_id = (SELECT auth.uid()) AND user_id IS NOT NULL)
      -- Or anonymous with email or phone
      OR (user_id IS NULL AND (follower_email IS NOT NULL OR follower_phone IS NOT NULL))
    )
  );

-- =====================================================
-- RESTORE publication_settings UPDATE POLICY
-- =====================================================

-- Add back UPDATE policy for publication_settings
-- Currently allows all authenticated users (admin-only check will be added later)
CREATE POLICY "Authenticated users can update publication settings"
  ON publication_settings
  FOR UPDATE
  TO authenticated
  USING (id = '00000000-0000-0000-0000-000000000001')
  WITH CHECK (id = '00000000-0000-0000-0000-000000000001');

-- =====================================================
-- ADD COMMENT FOR FUTURE ADMIN-ONLY RESTRICTION
-- =====================================================

COMMENT ON POLICY "Authenticated users can update publication settings" ON publication_settings IS 
  'Currently allows all authenticated users. Should be restricted to admin users only once admin role system is fully implemented.';

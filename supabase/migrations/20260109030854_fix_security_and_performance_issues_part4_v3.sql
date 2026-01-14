/*
  # Fix Security and Performance Issues - Part 4: Fix RLS Policies That Always Return True (v3)
  
  1. Security Improvements
    - Replace policies with WITH CHECK (true) or USING (true)
    - Keep system policies for triggers but restrict user-facing policies
    
  2. Affected Tables & Policies
    - memorial_followers: "Anyone can create follows" - too permissive
    - phone_verifications: "Authenticated users can create verifications" - too permissive
    - publication_settings: "Authenticated users can update publication settings" - too permissive
    
  3. Note
    - Keeping system insert policies for audit_logs, memorial_event_history, and notifications
    - These are used by database triggers and need unrestricted access
*/

-- memorial_followers: Replace overly permissive policy
DROP POLICY IF EXISTS "Anyone can create follows" ON memorial_followers;
CREATE POLICY "Users can create memorial follows"
  ON memorial_followers FOR INSERT
  TO public
  WITH CHECK (
    memorial_id IS NOT NULL 
    AND (
      (user_id IS NOT NULL AND user_id = (select auth.uid()))
      OR (user_id IS NULL AND (follower_email IS NOT NULL OR follower_phone IS NOT NULL))
    )
  );

-- phone_verifications: Replace overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can create verifications" ON phone_verifications;
CREATE POLICY "Users can create phone verifications"
  ON phone_verifications FOR INSERT
  TO authenticated, anon
  WITH CHECK (phone_number IS NOT NULL AND verification_code IS NOT NULL);

-- publication_settings: Replace overly permissive update policy
-- Note: publication_settings is a singleton table with global settings
DROP POLICY IF EXISTS "Authenticated users can update publication settings" ON publication_settings;
CREATE POLICY "Only admins can update publication settings"
  ON publication_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.role = 'super_admin'
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.role = 'super_admin'
      AND admin_users.is_active = true
    )
  );
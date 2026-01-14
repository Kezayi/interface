/*
  # Fix Admin Users RLS Policies
  
  This migration fixes the circular dependency issue where:
  - Users need to be recognized as admin to read admin_users
  - But they need to read admin_users to be recognized as admin
  
  Solution:
  - Add a policy allowing authenticated users to read their own admin_users entry
  
  1. Changes
    - Drop existing restrictive policy
    - Add new policy allowing users to read their own entry
    - Keep existing super admin policy for managing all users
*/

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Admins can read all admin users" ON admin_users;

-- Allow authenticated users to read their own admin entry
CREATE POLICY "Users can read own admin profile"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow active admins to read all admin users
CREATE POLICY "Active admins can read all admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users admin_users_1
      WHERE admin_users_1.id = auth.uid()
      AND admin_users_1.is_active = true
    )
  );

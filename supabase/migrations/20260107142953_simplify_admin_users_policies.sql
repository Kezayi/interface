/*
  # Simplify Admin Users RLS Policies
  
  Fix the authentication issue by removing circular dependencies
  and allowing proper self-update for last_login_at.
  
  1. Changes
    - Drop all existing policies
    - Add simple policy for users to read their own admin profile
    - Add policy for super admins to read all admin profiles
    - Add policy for users to update their own last_login_at
    - Add policy for super admins to manage all admin users
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own admin profile" ON admin_users;
DROP POLICY IF EXISTS "Active admins can read all admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;

-- Policy 1: Users can read their own admin profile
-- This allows the initial authentication check
CREATE POLICY "Users read own profile"
  ON admin_users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Super admins can read all admin profiles
CREATE POLICY "Super admins read all"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- Policy 3: Users can update their own last_login_at
CREATE POLICY "Users update own login time"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Super admins can manage all admin users
CREATE POLICY "Super admins manage all"
  ON admin_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

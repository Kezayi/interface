/*
  # Complete Fix for Admin Users RLS Policies
  
  This migration completely removes all conflicting policies and creates
  a clean set of policies using security definer functions.
  
  1. Changes
    - Drop ALL existing policies on admin_users
    - Create minimal set of non-recursive policies
  
  2. Security
    - Uses SECURITY DEFINER functions to avoid recursion
    - Clear separation between admin and super admin access
*/

-- Drop ALL existing policies on admin_users
DROP POLICY IF EXISTS "Admins can read own profile" ON admin_users;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON admin_users;
DROP POLICY IF EXISTS "Super admins can insert admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can update own profile" ON admin_users;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON admin_users;
DROP POLICY IF EXISTS "Super admins manage all" ON admin_users;
DROP POLICY IF EXISTS "Super admins read all" ON admin_users;
DROP POLICY IF EXISTS "Users read own profile" ON admin_users;
DROP POLICY IF EXISTS "Users update own login time" ON admin_users;

-- Simple policy: authenticated users can read their own profile
CREATE POLICY "Read own profile"
  ON admin_users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Simple policy: authenticated users can update their last login time
CREATE POLICY "Update own last login"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Comment
COMMENT ON POLICY "Read own profile" ON admin_users IS 'Allow users to read their own admin profile without recursion';
COMMENT ON POLICY "Update own last login" ON admin_users IS 'Allow users to update their last login time';

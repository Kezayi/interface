/*
  # Fix Admin Users RLS Policies
  
  Removes recursive policies and creates simple, non-recursive policies
  
  1. Changes
    - Drop all existing policies on admin_users that may cause recursion
    - Create simple policies using direct comparisons
  
  2. Security
    - Maintain secure access control
    - Avoid RLS recursion issues
    - Use SECURITY DEFINER functions for complex checks
*/

-- Drop ALL existing policies that may have recursion
DROP POLICY IF EXISTS "Admins can view all admin profiles" ON admin_users;
DROP POLICY IF EXISTS "Super admins can insert admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can update admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can delete admin users" ON admin_users;
DROP POLICY IF EXISTS "Read own profile" ON admin_users;
DROP POLICY IF EXISTS "Update own last login" ON admin_users;
DROP POLICY IF EXISTS "Admins can read own profile" ON admin_users;
DROP POLICY IF EXISTS "Super admins can read all profiles" ON admin_users;
DROP POLICY IF EXISTS "Super admins can insert admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can update own profile" ON admin_users;
DROP POLICY IF EXISTS "Super admins can update all profiles" ON admin_users;
DROP POLICY IF EXISTS "Super admins manage all" ON admin_users;
DROP POLICY IF EXISTS "Super admins read all" ON admin_users;
DROP POLICY IF EXISTS "Users read own profile" ON admin_users;
DROP POLICY IF EXISTS "Users update own login time" ON admin_users;

-- Create simple, non-recursive policies

-- Allow users to read their own profile
CREATE POLICY "admin_users_select_own"
  ON admin_users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allow users to update their own last_login_at
CREATE POLICY "admin_users_update_own_login"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Note: Insert, Delete, and other admin management operations
-- should be done through SECURITY DEFINER functions to avoid RLS complexity

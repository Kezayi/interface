/*
  # Fix Admin Users RLS Infinite Recursion
  
  This migration fixes the infinite recursion issue in admin_users RLS policies
  by using a security definer function to check admin status.
  
  1. Changes
    - Drop existing problematic policies
    - Create security definer function to check admin role
    - Create new policies using the function
  
  2. Security
    - Policies use SECURITY DEFINER function to avoid recursion
    - Super admins can manage all admin users
    - Admins can read their own profile
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can read all admin profiles" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can read own profile" ON admin_users;
DROP POLICY IF EXISTS "Super admins can update admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can insert admin users" ON admin_users;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = user_id
    AND is_active = true
  );
$$;

-- Create security definer function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = user_id
    AND role = 'super_admin'
    AND is_active = true
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin(uuid) TO authenticated;

-- Policy for admins to read their own profile
CREATE POLICY "Admins can read own profile"
  ON admin_users FOR SELECT
  TO authenticated
  USING (id = auth.uid() AND is_admin_user(auth.uid()));

-- Policy for super admins to read all profiles
CREATE POLICY "Super admins can read all profiles"
  ON admin_users FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()));

-- Policy for super admins to insert new admin users
CREATE POLICY "Super admins can insert admin users"
  ON admin_users FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin(auth.uid()));

-- Policy for admins to update their own profile
CREATE POLICY "Admins can update own profile"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (id = auth.uid() AND is_admin_user(auth.uid()))
  WITH CHECK (id = auth.uid() AND is_admin_user(auth.uid()));

-- Policy for super admins to update all profiles
CREATE POLICY "Super admins can update all profiles"
  ON admin_users FOR UPDATE
  TO authenticated
  USING (is_super_admin(auth.uid()));

-- Add comment
COMMENT ON FUNCTION is_admin_user(uuid) IS 'Check if user is an active admin without causing RLS recursion';
COMMENT ON FUNCTION is_super_admin(uuid) IS 'Check if user is an active super admin without causing RLS recursion';

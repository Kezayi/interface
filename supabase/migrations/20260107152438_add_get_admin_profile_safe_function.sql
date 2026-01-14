/*
  # Add Safe Admin Profile Retrieval Function
  
  This migration creates a function to safely retrieve admin profiles
  without triggering RLS recursion issues.
  
  1. New Functions
    - `get_current_admin_profile()`: Returns the current user's admin profile
    - `get_all_admin_profiles()`: Returns all admin profiles (super admins only)
  
  2. Security
    - Uses SECURITY DEFINER to bypass RLS
    - Validates permissions internally
*/

-- Function to get current admin's profile
CREATE OR REPLACE FUNCTION get_current_admin_profile()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role admin_role,
  is_active boolean,
  last_login_at timestamptz,
  created_at timestamptz,
  created_by uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.email,
    a.full_name,
    a.role,
    a.is_active,
    a.last_login_at,
    a.created_at,
    a.created_by
  FROM admin_users a
  WHERE a.id = auth.uid()
  AND a.is_active = true;
END;
$$;

-- Function to get all admin profiles (super admins only)
CREATE OR REPLACE FUNCTION get_all_admin_profiles()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role admin_role,
  is_active boolean,
  last_login_at timestamptz,
  created_at timestamptz,
  created_by uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is super admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid()
    AND role = 'super_admin'
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Only super admins can view all admin profiles';
  END IF;

  RETURN QUERY
  SELECT 
    a.id,
    a.email,
    a.full_name,
    a.role,
    a.is_active,
    a.last_login_at,
    a.created_at,
    a.created_by
  FROM admin_users a
  ORDER BY a.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_current_admin_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_admin_profiles() TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_current_admin_profile() IS 'Safely retrieves current admin profile without RLS recursion';
COMMENT ON FUNCTION get_all_admin_profiles() IS 'Safely retrieves all admin profiles for super admins';

/*
  # Fix get_all_admin_profiles Function Ambiguity
  
  This migration fixes the column reference ambiguity in get_all_admin_profiles.
  
  1. Changes
    - Qualify all column references with table names
    - Fix "id" ambiguity issue
  
  2. Security
    - Maintains SECURITY DEFINER for bypassing RLS
    - Only super admins can access all profiles
*/

-- Drop and recreate with proper column qualification
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
    SELECT 1 FROM admin_users au
    WHERE au.id = auth.uid()
    AND au.role = 'super_admin'
    AND au.is_active = true
  ) THEN
    RAISE EXCEPTION 'Only super admins can view all admin profiles';
  END IF;

  -- Return all admin profiles
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.full_name,
    au.role,
    au.is_active,
    au.last_login_at,
    au.created_at,
    au.created_by
  FROM admin_users au
  ORDER BY au.created_at DESC;
END;
$$;

-- Add comment
COMMENT ON FUNCTION get_all_admin_profiles() IS 'Returns all admin profiles (super admins only, no RLS recursion)';

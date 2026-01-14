/*
  # Fix Admin Users Missing Columns
  
  1. Changes
    - Add `last_login_at` column to admin_users
    - Add `created_by` column to admin_users
    - Update `get_current_admin_profile()` function to use text instead of admin_role type
    - Update `get_all_admin_profiles()` function to use text instead of admin_role type
  
  2. Security
    - Maintain existing RLS policies
    - Keep SECURITY DEFINER on functions for safe access
*/

-- Add missing columns to admin_users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_users' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN last_login_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_users' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Recreate get_current_admin_profile function with correct types
CREATE OR REPLACE FUNCTION get_current_admin_profile()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
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

-- Recreate get_all_admin_profiles function with correct types
CREATE OR REPLACE FUNCTION get_all_admin_profiles()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
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

-- Ensure permissions are granted
GRANT EXECUTE ON FUNCTION get_current_admin_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_admin_profiles() TO authenticated;

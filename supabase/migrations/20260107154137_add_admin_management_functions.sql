/*
  # Admin Management Functions
  
  This migration adds functions for super admins to manage other admins
  without triggering RLS recursion.
  
  1. New Functions
    - `create_admin_user()`: Creates a new admin user (super admins only)
    - `update_admin_user()`: Updates an admin user (super admins only)
    - `deactivate_admin_user()`: Deactivates an admin user (super admins only)
  
  2. Security
    - All functions use SECURITY DEFINER
    - Validates that caller is super admin
*/

-- Function to create a new admin user
CREATE OR REPLACE FUNCTION create_admin_user(
  p_email text,
  p_password text,
  p_full_name text,
  p_role admin_role
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_caller_id uuid;
BEGIN
  v_caller_id := auth.uid();
  
  -- Check if caller is super admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = v_caller_id
    AND role = 'super_admin'
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Only super admins can create admin users';
  END IF;

  -- Create auth user
  v_user_id := extensions.uuid_generate_v4();
  
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    raw_app_meta_data,
    raw_user_meta_data
  ) VALUES (
    v_user_id,
    p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    now(),
    now(),
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name)
  );

  -- Create admin user record
  INSERT INTO admin_users (
    id,
    email,
    full_name,
    role,
    is_active,
    created_by
  ) VALUES (
    v_user_id,
    p_email,
    p_full_name,
    p_role,
    true,
    v_caller_id
  );

  RETURN v_user_id;
END;
$$;

-- Function to update an admin user
CREATE OR REPLACE FUNCTION update_admin_user(
  p_admin_id uuid,
  p_full_name text,
  p_role admin_role,
  p_is_active boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id uuid;
BEGIN
  v_caller_id := auth.uid();
  
  -- Check if caller is super admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = v_caller_id
    AND role = 'super_admin'
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Only super admins can update admin users';
  END IF;

  -- Update admin user
  UPDATE admin_users
  SET
    full_name = p_full_name,
    role = p_role,
    is_active = p_is_active
  WHERE id = p_admin_id;

  RETURN true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_admin_user(text, text, text, admin_role) TO authenticated;
GRANT EXECUTE ON FUNCTION update_admin_user(uuid, text, admin_role, boolean) TO authenticated;

-- Add comments
COMMENT ON FUNCTION create_admin_user(text, text, text, admin_role) IS 'Creates a new admin user (super admins only)';
COMMENT ON FUNCTION update_admin_user(uuid, text, admin_role, boolean) IS 'Updates an admin user (super admins only)';

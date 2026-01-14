/*
  # Fix Admin User Creation with Proper Auth Integration
  
  This migration fixes the admin user creation function to properly
  integrate with Supabase Auth system.
  
  1. Changes
    - Update create_admin_user to use Supabase Auth properly
    - Use proper password hashing
  
  2. Security
    - Only super admins can create users
    - Passwords are properly hashed
*/

-- Drop and recreate the function with proper auth integration
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
  v_hashed_password text;
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

  -- Generate UUID for new user
  v_user_id := gen_random_uuid();
  
  -- Hash password using crypt
  v_hashed_password := crypt(p_password, gen_salt('bf'));

  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    p_email,
    v_hashed_password,
    now(),
    now(),
    '',
    now(),
    '',
    NULL,
    '',
    '',
    NULL,
    NULL,
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    jsonb_build_object('full_name', p_full_name),
    false,
    now(),
    now(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL
  );

  -- Insert into admin_users
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

-- Add comment
COMMENT ON FUNCTION create_admin_user(text, text, text, admin_role) IS 'Creates admin user with proper Supabase Auth integration';

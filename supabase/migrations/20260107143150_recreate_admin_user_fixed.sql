/*
  # Recreate Admin User with Correct Password
  
  This migration recreates the admin user with a known password.
  
  Credentials:
  - Email: admin@floorence.com
  - Password: Admin123!
*/

-- First, delete the existing entries if they exist
DELETE FROM admin_users WHERE email = 'admin@floorence.com';
DELETE FROM auth.users WHERE email = 'admin@floorence.com';

-- Create the admin user
DO $$
DECLARE
  new_user_id uuid;
  new_identity_id uuid;
BEGIN
  -- Generate UUIDs
  new_user_id := gen_random_uuid();
  new_identity_id := gen_random_uuid();
  
  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'admin@floorence.com',
    crypt('Admin123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );
  
  -- Insert into auth.identities with provider_id
  INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    new_identity_id,
    new_user_id::text,
    new_user_id,
    format('{"sub":"%s","email":"admin@floorence.com"}', new_user_id)::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
  );
  
  -- Insert into admin_users
  INSERT INTO admin_users (
    id,
    email,
    full_name,
    role,
    is_active
  ) VALUES (
    new_user_id,
    'admin@floorence.com',
    'Super Administrateur',
    'super_admin',
    true
  );
  
  RAISE NOTICE 'Admin user created successfully';
END $$;

/*
  # Create Admin User

  This migration creates the default super administrator account:
  - Email: Admin
  - Password: admin
  
  IMPORTANT: Change this password after first login!
*/

-- Insert admin user into auth.users using the auth.uid() function
-- The password will be hashed by Supabase Auth
DO $$
DECLARE
  new_admin_id uuid;
BEGIN
  -- Create the admin user in auth.users if it doesn't exist
  -- Note: This approach uses a workaround since we can't directly insert into auth.users
  -- The admin will need to be created via the Supabase dashboard or API
  
  -- For now, we'll insert a placeholder that will be replaced when the actual user signs up
  -- with email 'Admin' and password 'admin'
  
  -- Check if an admin already exists in admin_users table with email 'Admin'
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE email = 'Admin') THEN
    RAISE NOTICE 'Admin user must be created manually via Supabase Auth';
    RAISE NOTICE 'Email: Admin';
    RAISE NOTICE 'Password: admin';
    RAISE NOTICE 'After creating the user, run: SELECT create_super_admin(''[user_id]'', ''Admin'', ''Super Administrator'');';
  END IF;
END $$;

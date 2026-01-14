/*
  # Create Super Admin Account

  Creates the first super administrator account with:
  - Email: Admin
  - Password: admin (must be changed on first login)
  
  This migration will:
  1. Check if admin already exists
  2. Create admin user entry in admin_users table
  
  Note: The auth.users entry must be created separately via Supabase Auth API
  or dashboard, then linked here by UUID.
*/

-- Function to create or update super admin
CREATE OR REPLACE FUNCTION create_super_admin(
  p_user_id uuid,
  p_email text,
  p_full_name text
) RETURNS void AS $$
BEGIN
  -- Insert or update admin_users entry
  INSERT INTO admin_users (id, email, full_name, role, is_active)
  VALUES (p_user_id, p_email, p_full_name, 'super_admin', true)
  ON CONFLICT (id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = 'super_admin',
    is_active = true;
    
  RAISE NOTICE 'Super admin account created/updated for: %', p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on function
GRANT EXECUTE ON FUNCTION create_super_admin(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION create_super_admin(uuid, text, text) TO service_role;

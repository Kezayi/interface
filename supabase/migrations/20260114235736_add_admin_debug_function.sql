/*
  # Add Admin Debug Function
  
  Creates a debug function to help diagnose login issues
  
  1. New Functions
    - `debug_admin_login()`: Returns debug information about the current user and admin status
*/

-- Create debug function
CREATE OR REPLACE FUNCTION debug_admin_login()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  current_user_id uuid;
  admin_exists boolean;
  admin_active boolean;
BEGIN
  current_user_id := auth.uid();
  
  SELECT EXISTS(SELECT 1 FROM admin_users WHERE id = current_user_id) INTO admin_exists;
  
  SELECT is_active INTO admin_active
  FROM admin_users 
  WHERE id = current_user_id;
  
  SELECT json_build_object(
    'current_user_id', current_user_id,
    'admin_exists', admin_exists,
    'admin_active', admin_active,
    'admin_count', (SELECT COUNT(*) FROM admin_users),
    'admin_details', (
      SELECT json_agg(json_build_object(
        'id', id,
        'email', email,
        'role', role,
        'is_active', is_active
      ))
      FROM admin_users
      WHERE id = current_user_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION debug_admin_login() TO authenticated;
GRANT EXECUTE ON FUNCTION debug_admin_login() TO anon;

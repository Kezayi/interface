/*
  # Add RPC function to get admin profile
  
  This migration adds a secure RPC function to retrieve the admin profile
  for the currently authenticated user, bypassing potential RLS timing issues.
  
  1. New Functions
    - get_admin_profile(): Returns the admin profile for the current user
    
  2. Security
    - Function runs with SECURITY DEFINER to bypass RLS
    - Only returns data for the authenticated user
    - Checks is_active status
*/

-- Function to get admin profile for current user
CREATE OR REPLACE FUNCTION get_admin_profile()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_result json;
BEGIN
  -- Get the authenticated user's ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get the admin profile
  SELECT row_to_json(au.*)
  INTO v_result
  FROM admin_users au
  WHERE au.id = v_user_id
    AND au.is_active = true;
  
  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_admin_profile() TO authenticated;

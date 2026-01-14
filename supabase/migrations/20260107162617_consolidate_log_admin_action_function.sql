/*
  # Consolidate log_admin_action Function
  
  This migration removes duplicate log_admin_action functions and keeps
  only one version that accepts text for entity_id (more flexible).
  
  1. Changes
    - Drop all existing log_admin_action functions
    - Create single unified version with text entity_id
  
  2. Security
    - SECURITY DEFINER to bypass RLS
    - Proper validation of admin permissions
*/

-- Drop all existing versions
DROP FUNCTION IF EXISTS log_admin_action(uuid, text, text, text, jsonb, text, text);
DROP FUNCTION IF EXISTS log_admin_action(uuid, text, text, uuid, jsonb, text, text);
DROP FUNCTION IF EXISTS log_admin_action(text, text, text, jsonb, text);

-- Create unified version with text entity_id
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id uuid,
  p_action_type text,
  p_entity_type text,
  p_entity_id text,
  p_action_details jsonb,
  p_justification text,
  p_ip_address text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  -- Validate admin exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.id = p_admin_id
    AND au.is_active = true
  ) THEN
    RAISE EXCEPTION 'Invalid or inactive admin user';
  END IF;

  -- Insert audit log
  INSERT INTO admin_action_logs (
    admin_id,
    action_type,
    entity_type,
    entity_id,
    action_details,
    justification,
    ip_address
  ) VALUES (
    p_admin_id,
    p_action_type,
    p_entity_type,
    p_entity_id,
    p_action_details,
    p_justification,
    p_ip_address
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION log_admin_action(uuid, text, text, text, jsonb, text, text) TO authenticated;

-- Add comment
COMMENT ON FUNCTION log_admin_action(uuid, text, text, text, jsonb, text, text) IS 'Logs admin actions with audit trail (unified version)';

/*
  # Add Admin Audit and Logging System
  
  1. New Tables
    - `admin_action_logs` - Tracks all administrative actions
      - `id` (uuid, primary key)
      - `admin_id` (uuid, references admin_users)
      - `action_type` (text) - Type of action performed
      - `entity_type` (text) - Type of entity affected
      - `entity_id` (text) - ID of affected entity
      - `action_details` (jsonb) - Additional details
      - `justification` (text) - Reason for action
      - `ip_address` (text) - IP address of admin
      - `created_at` (timestamptz)
  
  2. Functions
    - `log_admin_action` - RPC function to log admin actions
  
  3. Security
    - Enable RLS on all tables
    - Add policies for admin access only
*/

-- Create admin_action_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  action_details jsonb DEFAULT '{}'::jsonb,
  justification text DEFAULT '',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;

-- Policies for admin_action_logs
CREATE POLICY "Admins can view all audit logs"
  ON admin_action_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can insert audit logs"
  ON admin_action_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_admin_id ON admin_action_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_created_at ON admin_action_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_action_type ON admin_action_logs(action_type);

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_id uuid,
  p_action_type text,
  p_entity_type text,
  p_entity_id text,
  p_action_details jsonb DEFAULT '{}'::jsonb,
  p_justification text DEFAULT '',
  p_ip_address text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  -- Insert the action log
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
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION log_admin_action(uuid, text, text, text, jsonb, text, text) TO authenticated;

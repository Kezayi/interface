/*
  # Create System Parameters Table

  1. New Tables
    - `system_parameters`
      - `id` (uuid, primary key)
      - `key` (text, unique) - Unique parameter identifier
      - `value` (text) - Parameter value (stored as text)
      - `description` (text) - Human-readable description
      - `data_type` (text) - Data type hint (number, string, boolean)
      - `is_sensitive` (boolean) - Whether the parameter is sensitive
      - `last_modified_at` (timestamptz) - Last modification timestamp
      - `last_modified_by` (uuid) - Admin who last modified
      - `change_justification` (text) - Reason for last change
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `system_parameters` table
    - Admins can read all parameters
    - Only super admins can modify through RPC function

  3. Initial Data
    - Publication price: 5000 FCFA
    - RIP gesture: 0 FCFA (always free)
    - Candle gesture: 1000 FCFA
    - Flower gesture: 2000 FCFA
*/

-- Create system_parameters table
CREATE TABLE IF NOT EXISTS system_parameters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text,
  data_type text NOT NULL DEFAULT 'string',
  is_sensitive boolean DEFAULT false,
  last_modified_at timestamptz,
  last_modified_by uuid REFERENCES auth.users(id),
  change_justification text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_parameters ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can read, but only super admins can modify (through RPC)
CREATE POLICY "Anyone can read system parameters"
  ON system_parameters
  FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Only super admins can modify through RPC"
  ON system_parameters
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
      AND au.role = 'super_admin'
      AND au.is_active = true
    )
  );

-- Insert initial system parameters
INSERT INTO system_parameters (key, value, description, data_type, is_sensitive)
VALUES
  ('price_publication', '5000', 'Prix de publication d''un mémorial en FCFA', 'number', true),
  ('price_rip', '0', 'Prix du geste RIP en FCFA (toujours gratuit)', 'number', false),
  ('price_candle', '1000', 'Prix du geste Cierge en FCFA', 'number', true),
  ('price_flower', '2000', 'Prix du geste Fleur en FCFA', 'number', true)
ON CONFLICT (key) DO NOTHING;

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_parameters_key ON system_parameters(key);

-- Add comment
COMMENT ON TABLE system_parameters IS 'System-wide configuration parameters (prices, limits, etc.)';

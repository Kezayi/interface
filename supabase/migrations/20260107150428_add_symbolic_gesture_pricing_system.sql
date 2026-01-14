/*
  # Add Symbolic Gesture Pricing System
  
  This migration adds a comprehensive pricing system for symbolic gestures.
  
  1. New Tables
    - `gesture_prices`: Stores the price for each gesture type (RIP, candle, flower)
      - `gesture_type` (text): Type of gesture (rip, candle, flower)
      - `price_fcfa` (numeric): Price in FCFA (0 for free gestures)
      - `is_active` (boolean): Whether this price is currently active
      - `updated_at` (timestamptz): Last update timestamp
      - `updated_by` (uuid): Admin who updated the price
  
  2. Security
    - Enable RLS on `gesture_prices` table
    - Add policy for public read access
    - Add policy for super admins to update prices
  
  3. Default Values
    - RIP: 0 FCFA (free)
    - Candle: 0 FCFA (configurable)
    - Flower: 0 FCFA (configurable)
*/

-- Create gesture_prices table
CREATE TABLE IF NOT EXISTS gesture_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gesture_type text NOT NULL CHECK (gesture_type IN ('rip', 'candle', 'flower')),
  price_fcfa numeric NOT NULL DEFAULT 0 CHECK (price_fcfa >= 0),
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES admin_users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(gesture_type)
);

-- Enable RLS
ALTER TABLE gesture_prices ENABLE ROW LEVEL SECURITY;

-- Policy for public read access
CREATE POLICY "Anyone can read active gesture prices"
  ON gesture_prices FOR SELECT
  USING (is_active = true);

-- Policy for super admins to manage prices
CREATE POLICY "Super admins can manage gesture prices"
  ON gesture_prices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- Insert default prices
INSERT INTO gesture_prices (gesture_type, price_fcfa, is_active) VALUES
  ('rip', 0, true),
  ('candle', 0, true),
  ('flower', 0, true)
ON CONFLICT (gesture_type) DO NOTHING;

-- Create function to get current price for a gesture type
CREATE OR REPLACE FUNCTION get_gesture_price(p_gesture_type text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_price numeric;
BEGIN
  SELECT price_fcfa INTO v_price
  FROM gesture_prices
  WHERE gesture_type = p_gesture_type
  AND is_active = true;
  
  RETURN COALESCE(v_price, 0);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_gesture_price(text) TO anon, authenticated;

-- Create function to update gesture price
CREATE OR REPLACE FUNCTION update_gesture_price(
  p_gesture_type text,
  p_price_fcfa numeric,
  p_admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if admin is super_admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = p_admin_id
    AND role = 'super_admin'
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Only super admins can update gesture prices';
  END IF;
  
  -- Update price
  UPDATE gesture_prices
  SET 
    price_fcfa = p_price_fcfa,
    updated_at = now(),
    updated_by = p_admin_id
  WHERE gesture_type = p_gesture_type;
  
  -- Log the action
  INSERT INTO admin_action_logs (
    admin_id,
    action_type,
    entity_type,
    entity_id,
    action_details,
    justification
  ) VALUES (
    p_admin_id,
    'GESTURE_PRICE_UPDATE',
    'gesture_prices',
    p_gesture_type,
    jsonb_build_object('new_price', p_price_fcfa),
    format('Price updated for %s to %s FCFA', p_gesture_type, p_price_fcfa)
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_gesture_price(text, numeric, uuid) TO authenticated;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_gesture_prices_type ON gesture_prices(gesture_type) WHERE is_active = true;

-- Add comment
COMMENT ON TABLE gesture_prices IS 'Stores pricing for symbolic gestures (RIP always free, candles and flowers configurable)';

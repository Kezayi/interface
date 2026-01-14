/*
  # Create Gesture Pricing System
  
  This migration creates the pricing system for symbolic gestures
  with historical price tracking.
  
  1. New Tables
    - `gesture_prices`: Stores current prices for each gesture type in FCFA
    - Adds `price_fcfa` column to `gestures` to store historical price
  
  2. Functions
    - `get_gesture_price()`: Gets current price for a gesture type
    - `update_gesture_price()`: Updates price (super admins only, logged)
  
  3. Security
    - RLS enabled on gesture_prices
    - Only super admins can modify prices
    - All price changes are audited
  
  4. Important
    - RIP is always 0 FCFA (free)
    - Historical prices preserved in gestures table
    - No retroactive price changes
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_gesture_price(text);
DROP FUNCTION IF EXISTS update_gesture_price(text, integer, uuid);

-- Create gesture_prices table
CREATE TABLE IF NOT EXISTS gesture_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gesture_type text NOT NULL UNIQUE CHECK (gesture_type IN ('rip', 'candle', 'flower')),
  price_fcfa integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES admin_users(id),
  CONSTRAINT price_non_negative CHECK (price_fcfa >= 0),
  CONSTRAINT rip_always_free CHECK (gesture_type != 'rip' OR price_fcfa = 0)
);

-- Add price column to gestures table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gestures' AND column_name = 'price_fcfa'
  ) THEN
    ALTER TABLE gestures ADD COLUMN price_fcfa integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Insert default prices
INSERT INTO gesture_prices (gesture_type, price_fcfa, is_active)
VALUES 
  ('rip', 0, true),
  ('candle', 0, true),
  ('flower', 0, true)
ON CONFLICT (gesture_type) DO NOTHING;

-- Enable RLS
ALTER TABLE gesture_prices ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read prices
CREATE POLICY "Anyone can read gesture prices"
  ON gesture_prices FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Function to get current price for a gesture type
CREATE OR REPLACE FUNCTION get_gesture_price(p_gesture_type text)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT price_fcfa FROM gesture_prices 
     WHERE gesture_type = p_gesture_type AND is_active = true),
    0
  );
$$;

-- Function to update gesture price (super admins only)
CREATE OR REPLACE FUNCTION update_gesture_price(
  p_gesture_type text,
  p_price_fcfa integer,
  p_admin_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_price integer;
BEGIN
  -- Validate gesture type
  IF p_gesture_type NOT IN ('rip', 'candle', 'flower') THEN
    RAISE EXCEPTION 'Invalid gesture type: %', p_gesture_type;
  END IF;

  -- Check if caller is super admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = p_admin_id
    AND role = 'super_admin'
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Only super admins can update gesture prices';
  END IF;

  -- RIP must always be free
  IF p_gesture_type = 'rip' AND p_price_fcfa != 0 THEN
    RAISE EXCEPTION 'RIP gesture must always be free (0 FCFA)';
  END IF;

  -- Price cannot be negative
  IF p_price_fcfa < 0 THEN
    RAISE EXCEPTION 'Price cannot be negative';
  END IF;

  -- Get old price
  SELECT price_fcfa INTO v_old_price
  FROM gesture_prices
  WHERE gesture_type = p_gesture_type;

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
    'UPDATE_PRICE',
    'gesture_price',
    p_gesture_type,
    jsonb_build_object(
      'old_price', v_old_price,
      'new_price', p_price_fcfa,
      'currency', 'FCFA'
    ),
    format('Prix du geste %s modifié: %s FCFA -> %s FCFA', 
           p_gesture_type, v_old_price, p_price_fcfa)
  );

  RETURN true;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_gesture_price(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_gesture_price(text, integer, uuid) TO authenticated;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_gesture_prices_type ON gesture_prices(gesture_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_gestures_price ON gestures(price_fcfa);
CREATE INDEX IF NOT EXISTS idx_gestures_type_date ON gestures(gesture_type, created_at);

-- Add comments
COMMENT ON TABLE gesture_prices IS 'Current prices for symbolic gestures in FCFA';
COMMENT ON COLUMN gestures.price_fcfa IS 'Historical price at the time the gesture was made';
COMMENT ON FUNCTION get_gesture_price(text) IS 'Returns current price for a gesture type';
COMMENT ON FUNCTION update_gesture_price(text, integer, uuid) IS 'Updates gesture price (super admins only, audited)';

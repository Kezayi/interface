/*
  # Add Trigger to Set Gesture Price on Insert
  
  This migration creates a trigger that automatically sets the price_fcfa
  column when a new gesture is inserted, using the current price at that moment.
  
  1. New Functions
    - `set_gesture_price()`: Trigger function that sets price_fcfa
  
  2. Triggers
    - Sets price_fcfa before insert based on current price
  
  3. Important
    - Ensures historical price accuracy
    - No retroactive price changes
*/

-- Function to set gesture price on insert
CREATE OR REPLACE FUNCTION set_gesture_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set price_fcfa to current price for this gesture type
  NEW.price_fcfa := COALESCE(
    (SELECT price_fcfa FROM gesture_prices 
     WHERE gesture_type = NEW.gesture_type AND is_active = true),
    0
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to set price before insert
DROP TRIGGER IF EXISTS trigger_set_gesture_price ON gestures;
CREATE TRIGGER trigger_set_gesture_price
  BEFORE INSERT ON gestures
  FOR EACH ROW
  EXECUTE FUNCTION set_gesture_price();

-- Comment
COMMENT ON FUNCTION set_gesture_price() IS 'Automatically sets gesture price_fcfa to current price on insert';
COMMENT ON TRIGGER trigger_set_gesture_price ON gestures IS 'Sets price_fcfa before insert to preserve historical pricing';

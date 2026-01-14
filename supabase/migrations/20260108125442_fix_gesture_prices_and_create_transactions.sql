/*
  # Fix Gesture Prices and Create Transactions

  1. Problem
    - All existing gestures have price_fcfa = 0 even though is_paid = true
    - No transactions exist because price_fcfa was 0
    - The set_gesture_price trigger didn't work correctly or prices were 0 at creation time

  2. Solution
    - Update all existing paid gestures with correct prices from gesture_prices table
    - Create financial transactions for all updated gestures
    - Ensure trigger works correctly for future gestures

  3. Process
    - Update candle gestures to 100 FCFA
    - Update flower gestures to 100 FCFA
    - RIP gestures stay at 0 FCFA (free)
    - Create transactions for all paid gestures with price > 0
*/

-- Update existing gestures with correct prices
UPDATE gestures
SET price_fcfa = (
  SELECT price_fcfa::integer
  FROM gesture_prices
  WHERE gesture_prices.gesture_type = gestures.gesture_type
)
WHERE is_paid = true;

-- Now create transactions for all paid gestures with price > 0
DO $$
DECLARE
  v_platform_fee_percentage integer;
  v_platform_fee integer;
  v_net_amount integer;
  v_transaction_type transaction_type;
  gesture_record RECORD;
  inserted_count integer := 0;
BEGIN
  SELECT value::integer INTO v_platform_fee_percentage
  FROM system_parameters
  WHERE key = 'platform_fee_percentage';
  
  v_platform_fee_percentage := COALESCE(v_platform_fee_percentage, 5);
  
  FOR gesture_record IN 
    SELECT id, memorial_id, user_id, gesture_type, price_fcfa, created_at, is_paid
    FROM gestures
    WHERE is_paid = true AND price_fcfa > 0
  LOOP
    -- Check if transaction already exists
    IF NOT EXISTS (
      SELECT 1 FROM financial_transactions WHERE gesture_id = gesture_record.id
    ) THEN
      v_platform_fee := ROUND((gesture_record.price_fcfa * v_platform_fee_percentage) / 100.0);
      v_net_amount := gesture_record.price_fcfa - v_platform_fee;
      
      CASE gesture_record.gesture_type
        WHEN 'candle' THEN v_transaction_type := 'gesture_candle'::transaction_type;
        WHEN 'flower' THEN v_transaction_type := 'gesture_flower'::transaction_type;
        WHEN 'rip' THEN v_transaction_type := 'gesture_rip'::transaction_type;
        ELSE v_transaction_type := 'gesture_rip'::transaction_type;
      END CASE;
      
      INSERT INTO financial_transactions (
        type,
        amount,
        platform_fee_fcfa,
        net_amount_fcfa,
        status,
        memorial_id,
        gesture_id,
        user_id,
        created_at,
        completed_at
      ) VALUES (
        v_transaction_type,
        gesture_record.price_fcfa,
        v_platform_fee,
        v_net_amount,
        'SUCCESS'::transaction_status,
        gesture_record.memorial_id,
        gesture_record.id,
        gesture_record.user_id,
        gesture_record.created_at,
        gesture_record.created_at
      );
      
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Updated gesture prices and created % financial transactions', inserted_count;
END $$;

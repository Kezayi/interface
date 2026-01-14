/*
  # Fix Financial Transactions to Use Correct Transaction Types

  1. Problem
    - The transaction_type enum already exists with specific values
    - We need to use gesture_candle, gesture_flower, gesture_rip instead of 'gesture'

  2. Solution
    - Update the create_gesture_transaction function to use correct enum values
    - Delete any existing transactions with wrong type
    - Backfill correctly
*/

-- Drop existing wrong transactions
DELETE FROM financial_transactions WHERE gesture_id IS NOT NULL;

-- Update function to use correct enum values
CREATE OR REPLACE FUNCTION create_gesture_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_platform_fee_percentage integer;
  v_platform_fee integer;
  v_net_amount integer;
  v_transaction_type transaction_type;
BEGIN
  IF NEW.is_paid = true AND NEW.price_fcfa > 0 THEN
    SELECT value::integer INTO v_platform_fee_percentage
    FROM system_parameters
    WHERE key = 'platform_fee_percentage';
    
    v_platform_fee_percentage := COALESCE(v_platform_fee_percentage, 5);
    v_platform_fee := ROUND((NEW.price_fcfa * v_platform_fee_percentage) / 100.0);
    v_net_amount := NEW.price_fcfa - v_platform_fee;
    
    CASE NEW.gesture_type
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
      completed_at,
      metadata
    ) VALUES (
      v_transaction_type,
      NEW.price_fcfa,
      v_platform_fee,
      v_net_amount,
      'completed'::transaction_status,
      NEW.memorial_id,
      NEW.id,
      NEW.user_id,
      now(),
      jsonb_build_object('gesture_type', NEW.gesture_type)
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating transaction for gesture: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Backfill existing gestures
DO $$
DECLARE
  v_platform_fee_percentage integer;
  v_platform_fee integer;
  v_net_amount integer;
  v_transaction_type transaction_type;
  gesture_record RECORD;
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
      completed_at,
      metadata
    ) VALUES (
      v_transaction_type,
      gesture_record.price_fcfa,
      v_platform_fee,
      v_net_amount,
      'completed'::transaction_status,
      gesture_record.memorial_id,
      gesture_record.id,
      gesture_record.user_id,
      gesture_record.created_at,
      gesture_record.created_at,
      jsonb_build_object('gesture_type', gesture_record.gesture_type, 'backfilled', true)
    );
  END LOOP;
  
  RAISE NOTICE 'Backfilled transactions for existing gestures';
END $$;

/*
  # Backfill Financial Transactions for Existing Gestures

  1. Purpose
    - Create financial transactions for all existing paid gestures
    - Calculate platform fees and net amounts
    - Mark all as completed since gestures already exist

  2. Process
    - Query all paid gestures
    - Calculate fees based on system parameters
    - Insert transaction records
*/

DO $$
DECLARE
  v_platform_fee_percentage integer;
  v_platform_fee integer;
  v_net_amount integer;
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
    IF NOT EXISTS (
      SELECT 1 FROM financial_transactions 
      WHERE gesture_id = gesture_record.id
    ) THEN
      v_platform_fee := ROUND((gesture_record.price_fcfa * v_platform_fee_percentage) / 100.0);
      v_net_amount := gesture_record.price_fcfa - v_platform_fee;
      
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
        'gesture'::transaction_type,
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
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Backfilled transactions for existing gestures';
END $$;

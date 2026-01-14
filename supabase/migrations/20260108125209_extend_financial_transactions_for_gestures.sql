/*
  # Extend Financial Transactions for Gestures

  1. Changes
    - Add gesture_id column to link transactions to gestures
    - Add platform_fee_fcfa column for fee tracking
    - Add net_amount_fcfa column for net amount after fees
    - Add completed_at timestamp
    - Add metadata jsonb for additional data

  2. Triggers
    - Auto-create transaction when paid gesture is created
    - Calculate platform fees automatically

  3. Indexes
    - Add index on gesture_id for gesture queries
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_transactions' AND column_name = 'gesture_id'
  ) THEN
    ALTER TABLE financial_transactions ADD COLUMN gesture_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_transactions' AND column_name = 'platform_fee_fcfa'
  ) THEN
    ALTER TABLE financial_transactions ADD COLUMN platform_fee_fcfa integer DEFAULT 0 CHECK (platform_fee_fcfa >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_transactions' AND column_name = 'net_amount_fcfa'
  ) THEN
    ALTER TABLE financial_transactions ADD COLUMN net_amount_fcfa integer DEFAULT 0 CHECK (net_amount_fcfa >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_transactions' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE financial_transactions ADD COLUMN completed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'financial_transactions' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE financial_transactions ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_financial_transactions_gesture_id ON financial_transactions(gesture_id);

CREATE OR REPLACE FUNCTION create_gesture_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_platform_fee_percentage integer;
  v_platform_fee integer;
  v_net_amount integer;
BEGIN
  IF NEW.is_paid = true AND NEW.price_fcfa > 0 THEN
    SELECT value::integer INTO v_platform_fee_percentage
    FROM system_parameters
    WHERE key = 'platform_fee_percentage';
    
    v_platform_fee_percentage := COALESCE(v_platform_fee_percentage, 5);
    v_platform_fee := ROUND((NEW.price_fcfa * v_platform_fee_percentage) / 100.0);
    v_net_amount := NEW.price_fcfa - v_platform_fee;
    
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
      'gesture'::transaction_type,
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

DROP TRIGGER IF EXISTS on_gesture_created_transaction ON gestures;

CREATE TRIGGER on_gesture_created_transaction
  AFTER INSERT ON gestures
  FOR EACH ROW
  EXECUTE FUNCTION create_gesture_transaction();

COMMENT ON FUNCTION create_gesture_transaction() IS 'Auto-creates financial transaction when paid gesture is created';

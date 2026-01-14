/*
  # Update System Parameters for FCFA Currency
  
  This migration updates system parameters to use FCFA instead of cents,
  and creates functions to manage parameters properly.
  
  1. Changes
    - Update descriptions to reflect FCFA currency
    - Create functions to get/update parameters
    - Sync gesture_prices with system_parameters
  
  2. Security
    - Only super admins can modify parameters
    - All changes are audited
    - RIP must always be free
*/

-- Update descriptions to use FCFA instead of cents
UPDATE system_parameters
SET description = 'Prix de publication d''un mémorial en FCFA'
WHERE key = 'price_publication';

UPDATE system_parameters
SET description = 'Prix du geste RIP en FCFA (toujours gratuit)'
WHERE key = 'price_rip';

UPDATE system_parameters
SET description = 'Prix du geste Cierge en FCFA'
WHERE key = 'price_candle';

UPDATE system_parameters
SET description = 'Prix du geste Fleur en FCFA'
WHERE key = 'price_flower';

-- Function to get a system parameter value
CREATE OR REPLACE FUNCTION get_system_param(p_key text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT value 
  FROM system_parameters 
  WHERE key = p_key;
$$;

-- Function to get parameter as integer (for prices)
CREATE OR REPLACE FUNCTION get_system_param_int(p_key text)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT value::integer 
     FROM system_parameters 
     WHERE key = p_key),
    0
  );
$$;

-- Function to update a system parameter (super admins only)
CREATE OR REPLACE FUNCTION update_system_param(
  p_key text,
  p_value text,
  p_admin_id uuid,
  p_justification text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_value text;
  v_description text;
BEGIN
  -- Check if caller is super admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_users au
    WHERE au.id = p_admin_id
    AND au.role = 'super_admin'
    AND au.is_active = true
  ) THEN
    RAISE EXCEPTION 'Only super admins can update system parameters';
  END IF;

  -- Validate price_rip must be 0
  IF p_key = 'price_rip' AND p_value != '0' THEN
    RAISE EXCEPTION 'RIP gesture must always be free (0 FCFA)';
  END IF;

  -- Validate numeric values for price parameters
  IF p_key LIKE 'price_%' THEN
    IF p_value::integer < 0 THEN
      RAISE EXCEPTION 'Price cannot be negative';
    END IF;
  END IF;

  -- Get old value and description
  SELECT value, description INTO v_old_value, v_description
  FROM system_parameters
  WHERE key = p_key;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Parameter % not found', p_key;
  END IF;

  -- Update parameter
  UPDATE system_parameters
  SET 
    value = p_value,
    last_modified_at = now(),
    last_modified_by = p_admin_id,
    change_justification = p_justification
  WHERE key = p_key;

  -- Update gesture_prices table if it's a gesture price
  IF p_key IN ('price_rip', 'price_candle', 'price_flower') THEN
    UPDATE gesture_prices
    SET 
      price_fcfa = p_value::integer,
      updated_at = now(),
      updated_by = p_admin_id
    WHERE gesture_type = REPLACE(p_key, 'price_', '');
  END IF;

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
    'UPDATE_PARAMETER',
    'system_parameter',
    p_key,
    jsonb_build_object(
      'old_value', v_old_value,
      'new_value', p_value,
      'description', v_description
    ),
    p_justification
  );

  RETURN true;
END;
$$;

-- Sync gesture_prices with system_parameters
UPDATE gesture_prices gp
SET price_fcfa = (
  SELECT sp.value::integer
  FROM system_parameters sp
  WHERE sp.key = 'price_' || gp.gesture_type
)
WHERE EXISTS (
  SELECT 1 FROM system_parameters sp
  WHERE sp.key = 'price_' || gp.gesture_type
);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_system_param(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_system_param_int(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_system_param(text, text, uuid, text) TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_system_param(text) IS 'Returns a system parameter value';
COMMENT ON FUNCTION get_system_param_int(text) IS 'Returns a system parameter as integer (for prices in FCFA)';
COMMENT ON FUNCTION update_system_param(text, text, uuid, text) IS 'Updates system parameter (super admins only, audited)';

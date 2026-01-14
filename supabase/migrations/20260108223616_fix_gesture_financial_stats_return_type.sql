/*
  # Fix gesture financial stats function return type

  1. Changes
    - Change total_revenue type from numeric to bigint
    - This matches the actual return type of SUM(integer)

  2. Note
    - This fixes the type mismatch error when calling the function
*/

-- Drop and recreate function with correct return type
DROP FUNCTION IF EXISTS get_gesture_financial_stats(timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION get_gesture_financial_stats(
  start_date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  gesture_type text,
  count bigint,
  total_revenue bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.gesture_type::text,
    COUNT(*) as count,
    COALESCE(SUM(g.price_fcfa), 0)::bigint as total_revenue
  FROM gestures g
  WHERE 
    (start_date IS NULL OR g.created_at >= start_date)
    AND (end_date IS NULL OR g.created_at <= end_date)
  GROUP BY g.gesture_type
  ORDER BY g.gesture_type;
END;
$$;

GRANT EXECUTE ON FUNCTION get_gesture_financial_stats(timestamptz, timestamptz) TO authenticated;

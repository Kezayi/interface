/*
  # Create optimized gesture financial statistics function

  1. New Functions
    - `get_gesture_financial_stats(start_date, end_date)` - Returns financial statistics for gestures
      - Gesture type (RIP, candle, flower)
      - Count of gestures
      - Total revenue per gesture type
      - Optionally filtered by date range

  2. Benefits
    - Single database query with server-side aggregation
    - Eliminates need to load all gestures client-side
    - Supports date range filtering
    - Significantly faster performance for large datasets

  3. Security
    - Function is restricted to authenticated users only
    - Intended for admin backoffice use
*/

-- Drop function if it exists
DROP FUNCTION IF EXISTS get_gesture_financial_stats(timestamptz, timestamptz);

-- Create optimized gesture financial stats function
CREATE OR REPLACE FUNCTION get_gesture_financial_stats(
  start_date timestamptz DEFAULT NULL,
  end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  gesture_type text,
  count bigint,
  total_revenue numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.gesture_type::text,
    COUNT(*) as count,
    COALESCE(SUM(g.price_fcfa), 0) as total_revenue
  FROM gestures g
  WHERE 
    (start_date IS NULL OR g.created_at >= start_date)
    AND (end_date IS NULL OR g.created_at <= end_date)
  GROUP BY g.gesture_type
  ORDER BY g.gesture_type;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_gesture_financial_stats(timestamptz, timestamptz) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_gesture_financial_stats(timestamptz, timestamptz) IS 'Returns financial statistics for gestures, optionally filtered by date range';

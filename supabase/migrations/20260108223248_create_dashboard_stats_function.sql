/*
  # Create optimized dashboard stats function

  1. New Functions
    - `get_dashboard_stats()` - Returns all dashboard statistics in a single optimized query
      - Total memorials count
      - Total gestures count
      - Gestures revenue (candle, flower, rip)
      - Contributions revenue (contribution, publication)
      - Total revenue
      - Pending transactions count
      - Open incidents count
      - Critical open incidents count

  2. Benefits
    - Single database round-trip instead of multiple queries
    - Server-side aggregation instead of client-side filtering
    - Significantly faster performance
    - Reduced network overhead

  3. Security
    - Function is restricted to authenticated users only
    - Intended for admin backoffice use
*/

-- Drop function if it exists
DROP FUNCTION IF EXISTS get_dashboard_stats();

-- Create optimized dashboard stats function
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_memorials', (SELECT COUNT(*) FROM memorials),
    'active_memorials', (SELECT COUNT(*) FROM memorials),
    'total_gestures', (SELECT COUNT(*) FROM gestures),
    'gestures_revenue', (
      SELECT COALESCE(SUM(amount), 0)
      FROM financial_transactions
      WHERE type IN ('gesture_candle', 'gesture_flower', 'gesture_rip')
        AND status IN ('SUCCESS', 'SUCCESS_MANUAL')
    ),
    'contributions_revenue', (
      SELECT COALESCE(SUM(amount), 0)
      FROM financial_transactions
      WHERE type IN ('contribution', 'publication')
        AND status IN ('SUCCESS', 'SUCCESS_MANUAL')
    ),
    'total_revenue', (
      SELECT COALESCE(SUM(amount), 0)
      FROM financial_transactions
      WHERE status IN ('SUCCESS', 'SUCCESS_MANUAL')
    ),
    'pending_transactions', (
      SELECT COUNT(*)
      FROM financial_transactions
      WHERE status = 'PENDING'
    ),
    'open_incidents', (
      SELECT COUNT(*)
      FROM incidents
      WHERE status IN ('open', 'investigating')
    ),
    'critical_incidents', (
      SELECT COUNT(*)
      FROM incidents
      WHERE priority = 'critical'
        AND status IN ('open', 'investigating')
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_dashboard_stats() IS 'Returns aggregated dashboard statistics for the admin backoffice in a single optimized query';

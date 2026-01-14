/*
  # Create optimized gesture statistics function

  1. New Functions
    - `get_gesture_stats_by_memorial()` - Returns gesture statistics aggregated by memorial
      - Memorial ID, name, and photo
      - Count of RIP gestures
      - Count of candle gestures
      - Count of flower gestures
      - Total gestures per memorial

  2. Benefits
    - Single database query with server-side aggregation
    - Eliminates need to load all gestures and memorials separately
    - Significantly faster performance for large datasets

  3. Security
    - Function is restricted to authenticated users only
    - Intended for admin backoffice use
*/

-- Drop function if it exists
DROP FUNCTION IF EXISTS get_gesture_stats_by_memorial();

-- Create optimized gesture stats function
CREATE OR REPLACE FUNCTION get_gesture_stats_by_memorial()
RETURNS TABLE (
  memorial_id uuid,
  memorial_name text,
  deceased_photo_url text,
  total_rip bigint,
  total_candles bigint,
  total_flowers bigint,
  total_gestures bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as memorial_id,
    m.deceased_full_name as memorial_name,
    m.deceased_photo_url,
    COUNT(*) FILTER (WHERE g.gesture_type = 'rip') as total_rip,
    COUNT(*) FILTER (WHERE g.gesture_type = 'candle') as total_candles,
    COUNT(*) FILTER (WHERE g.gesture_type = 'flower') as total_flowers,
    COUNT(*) as total_gestures
  FROM memorials m
  LEFT JOIN gestures g ON g.memorial_id = m.id
  GROUP BY m.id, m.deceased_full_name, m.deceased_photo_url
  ORDER BY total_gestures DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_gesture_stats_by_memorial() TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_gesture_stats_by_memorial() IS 'Returns gesture statistics aggregated by memorial for the admin backoffice';

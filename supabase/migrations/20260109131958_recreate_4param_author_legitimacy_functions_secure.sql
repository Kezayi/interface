/*
  # Recreate 4-Parameter Author Legitimacy Functions with Secure Search Path

  1. **Security Fix**
     - Recreate `get_author_legitimacy_for_memorial` with 4 parameters
     - Recreate `toggle_author_legitimacy` with 4 parameters
     - Both functions now have secure search_path set to 'public, pg_temp'
     - This prevents search_path injection attacks while maintaining frontend compatibility
  
  2. **Functions Recreated**
     - `get_author_legitimacy_for_memorial(uuid, uuid, uuid, text)` - retrieves legitimacy data
     - `toggle_author_legitimacy(uuid, uuid, uuid, text)` - toggles user's legitimacy click
*/

-- Recreate get_author_legitimacy_for_memorial with secure search_path
CREATE OR REPLACE FUNCTION get_author_legitimacy_for_memorial(
  p_memorial_id uuid,
  p_author_id uuid,
  p_user_id uuid,
  p_anonymous_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count integer;
  v_has_clicked boolean;
BEGIN
  -- Count total clicks for this memorial and author
  SELECT COUNT(*)::integer INTO v_count
  FROM author_legitimacy_clicks
  WHERE memorial_id = p_memorial_id
    AND author_id = p_author_id;

  -- Check if current user/anonymous has clicked
  IF p_user_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1
      FROM author_legitimacy_clicks
      WHERE memorial_id = p_memorial_id
        AND author_id = p_author_id
        AND user_id = p_user_id
    ) INTO v_has_clicked;
  ELSIF p_anonymous_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1
      FROM author_legitimacy_clicks
      WHERE memorial_id = p_memorial_id
        AND author_id = p_author_id
        AND anonymous_id = p_anonymous_id
    ) INTO v_has_clicked;
  ELSE
    v_has_clicked := false;
  END IF;

  RETURN json_build_object(
    'count', v_count,
    'has_clicked', v_has_clicked
  );
END;
$$;

-- Recreate toggle_author_legitimacy with secure search_path
CREATE OR REPLACE FUNCTION toggle_author_legitimacy(
  p_memorial_id uuid,
  p_author_id uuid,
  p_user_id uuid,
  p_anonymous_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_exists boolean;
  v_count integer;
BEGIN
  -- Check if user/anonymous has already clicked
  IF p_user_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1
      FROM author_legitimacy_clicks
      WHERE memorial_id = p_memorial_id
        AND author_id = p_author_id
        AND user_id = p_user_id
    ) INTO v_exists;

    IF v_exists THEN
      -- Remove the click
      DELETE FROM author_legitimacy_clicks
      WHERE memorial_id = p_memorial_id
        AND author_id = p_author_id
        AND user_id = p_user_id;
    ELSE
      -- Add the click
      INSERT INTO author_legitimacy_clicks (memorial_id, author_id, user_id, anonymous_id)
      VALUES (p_memorial_id, p_author_id, p_user_id, NULL);
    END IF;
  ELSIF p_anonymous_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1
      FROM author_legitimacy_clicks
      WHERE memorial_id = p_memorial_id
        AND author_id = p_author_id
        AND anonymous_id = p_anonymous_id
    ) INTO v_exists;

    IF v_exists THEN
      -- Remove the click
      DELETE FROM author_legitimacy_clicks
      WHERE memorial_id = p_memorial_id
        AND author_id = p_author_id
        AND anonymous_id = p_anonymous_id;
    ELSE
      -- Add the click
      INSERT INTO author_legitimacy_clicks (memorial_id, author_id, user_id, anonymous_id)
      VALUES (p_memorial_id, p_author_id, NULL, p_anonymous_id);
    END IF;
  ELSE
    RAISE EXCEPTION 'Either user_id or anonymous_id must be provided';
  END IF;

  -- Count total clicks for this memorial and author
  SELECT COUNT(*)::integer INTO v_count
  FROM author_legitimacy_clicks
  WHERE memorial_id = p_memorial_id
    AND author_id = p_author_id;

  RETURN json_build_object(
    'count', v_count,
    'has_clicked', NOT v_exists
  );
END;
$$;
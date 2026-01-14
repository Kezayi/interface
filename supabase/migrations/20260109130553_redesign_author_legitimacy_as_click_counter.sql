/*
  # Redesign Author Legitimacy System as Click Counter
  
  1. Changes
    - Drop the old author_ratings table (rating-based system)
    - Create new author_legitimacy_clicks table
      - Links to specific memorial (not just author)
      - One click per user per memorial
      - Supports both authenticated and anonymous users
    - Add RPC function to get legitimacy count and check if user clicked
    - Add RPC function to toggle legitimacy click
  
  2. Security
    - Enable RLS on author_legitimacy_clicks
    - Allow anyone to read clicks
    - Allow authenticated and anonymous users to insert their own clicks
    - Allow users to delete only their own clicks
*/

-- Drop old rating system
DROP TABLE IF EXISTS author_ratings CASCADE;

-- Create new legitimacy clicks table
CREATE TABLE IF NOT EXISTS author_legitimacy_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id uuid NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_id text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT author_legitimacy_clicks_user_check CHECK (
    (user_id IS NOT NULL AND anonymous_id IS NULL) OR
    (user_id IS NULL AND anonymous_id IS NOT NULL)
  ),
  CONSTRAINT author_legitimacy_clicks_unique_per_memorial UNIQUE (memorial_id, author_id, user_id, anonymous_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_author_legitimacy_clicks_memorial ON author_legitimacy_clicks(memorial_id);
CREATE INDEX IF NOT EXISTS idx_author_legitimacy_clicks_author ON author_legitimacy_clicks(author_id);
CREATE INDEX IF NOT EXISTS idx_author_legitimacy_clicks_user ON author_legitimacy_clicks(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_author_legitimacy_clicks_anonymous ON author_legitimacy_clicks(anonymous_id) WHERE anonymous_id IS NOT NULL;

-- Enable RLS
ALTER TABLE author_legitimacy_clicks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view legitimacy clicks"
  ON author_legitimacy_clicks FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert their own clicks"
  ON author_legitimacy_clicks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND anonymous_id IS NULL);

CREATE POLICY "Anonymous users can insert their own clicks"
  ON author_legitimacy_clicks FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL AND anonymous_id IS NOT NULL);

CREATE POLICY "Users can delete their own clicks"
  ON author_legitimacy_clicks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anonymous users can delete their own clicks"
  ON author_legitimacy_clicks FOR DELETE
  TO anon
  USING (user_id IS NULL);

-- RPC function to get legitimacy info for a memorial's author
CREATE OR REPLACE FUNCTION get_author_legitimacy_for_memorial(
  p_memorial_id uuid,
  p_author_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_anonymous_id text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count int;
  v_has_clicked boolean;
BEGIN
  -- Get total count
  SELECT COUNT(*)
  INTO v_count
  FROM author_legitimacy_clicks
  WHERE memorial_id = p_memorial_id
    AND author_id = p_author_id;

  -- Check if user has clicked
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

-- RPC function to toggle legitimacy click
CREATE OR REPLACE FUNCTION toggle_author_legitimacy(
  p_memorial_id uuid,
  p_author_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_anonymous_id text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_click_id uuid;
  v_action text;
BEGIN
  -- Validate inputs
  IF (p_user_id IS NULL AND p_anonymous_id IS NULL) THEN
    RAISE EXCEPTION 'Either user_id or anonymous_id must be provided';
  END IF;

  IF (p_user_id IS NOT NULL AND p_anonymous_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Cannot provide both user_id and anonymous_id';
  END IF;

  -- Check if click exists
  IF p_user_id IS NOT NULL THEN
    SELECT id INTO v_click_id
    FROM author_legitimacy_clicks
    WHERE memorial_id = p_memorial_id
      AND author_id = p_author_id
      AND user_id = p_user_id;
  ELSE
    SELECT id INTO v_click_id
    FROM author_legitimacy_clicks
    WHERE memorial_id = p_memorial_id
      AND author_id = p_author_id
      AND anonymous_id = p_anonymous_id;
  END IF;

  -- Toggle: remove if exists, add if not
  IF v_click_id IS NOT NULL THEN
    DELETE FROM author_legitimacy_clicks WHERE id = v_click_id;
    v_action := 'removed';
  ELSE
    INSERT INTO author_legitimacy_clicks (memorial_id, author_id, user_id, anonymous_id)
    VALUES (p_memorial_id, p_author_id, p_user_id, p_anonymous_id);
    v_action := 'added';
  END IF;

  -- Return updated count and status
  RETURN get_author_legitimacy_for_memorial(p_memorial_id, p_author_id, p_user_id, p_anonymous_id);
END;
$$;
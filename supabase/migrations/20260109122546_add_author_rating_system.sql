/*
  # Add Author Rating System

  1. New Tables
    - `author_ratings`
      - `id` (uuid, primary key)
      - `author_id` (uuid, references auth.users) - The author being rated
      - `rater_user_id` (uuid, references auth.users) - The user giving the rating
      - `rating` (integer, 1-5) - The rating value
      - `comment` (text, optional) - Optional comment about the rating
      - `created_at` (timestamptz) - When the rating was given
      - `updated_at` (timestamptz) - When the rating was last updated
    
  2. Constraints
    - Unique constraint on (author_id, rater_user_id) - One rating per user per author
    - Check constraint on rating value (1-5)
    - Users cannot rate themselves

  3. Indexes
    - Index on author_id for fast lookups
    - Index on rater_user_id for user's rating history
    - Index on created_at for recent ratings

  4. Functions
    - `get_author_credibility_score(author_uuid)` - Calculate average rating and count
    - `can_rate_author(author_uuid)` - Check if user can rate this author

  5. Security
    - Enable RLS on author_ratings table
    - Users can view all ratings
    - Users can create ratings for authors (except themselves)
    - Users can update/delete only their own ratings
*/

-- Create author_ratings table
CREATE TABLE IF NOT EXISTS author_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rater_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Unique constraint: one rating per user per author
  CONSTRAINT unique_author_rater UNIQUE (author_id, rater_user_id),
  
  -- Users cannot rate themselves
  CONSTRAINT no_self_rating CHECK (author_id != rater_user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_author_ratings_author_id ON author_ratings(author_id);
CREATE INDEX IF NOT EXISTS idx_author_ratings_rater_user_id ON author_ratings(rater_user_id);
CREATE INDEX IF NOT EXISTS idx_author_ratings_created_at ON author_ratings(created_at DESC);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_author_rating_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_author_rating_timestamp_trigger ON author_ratings;
CREATE TRIGGER update_author_rating_timestamp_trigger
  BEFORE UPDATE ON author_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_author_rating_timestamp();

-- Function to get author credibility score
CREATE OR REPLACE FUNCTION get_author_credibility_score(author_uuid uuid)
RETURNS TABLE (
  average_rating numeric,
  total_ratings bigint,
  credibility_level text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(rating)::numeric, 2) as average_rating,
    COUNT(*)::bigint as total_ratings,
    CASE 
      WHEN COUNT(*) = 0 THEN 'unrated'
      WHEN AVG(rating) >= 4.5 AND COUNT(*) >= 10 THEN 'excellent'
      WHEN AVG(rating) >= 4.0 AND COUNT(*) >= 5 THEN 'very_good'
      WHEN AVG(rating) >= 3.5 THEN 'good'
      WHEN AVG(rating) >= 3.0 THEN 'average'
      ELSE 'needs_improvement'
    END as credibility_level
  FROM author_ratings
  WHERE author_id = author_uuid;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if current user can rate an author
CREATE OR REPLACE FUNCTION can_rate_author(author_uuid uuid)
RETURNS boolean AS $$
DECLARE
  current_user_id uuid;
  has_interacted boolean;
BEGIN
  current_user_id := (SELECT auth.uid());
  
  -- Cannot rate if not authenticated
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Cannot rate yourself
  IF current_user_id = author_uuid THEN
    RETURN false;
  END IF;
  
  -- Check if user has interacted with author's content
  -- (viewed their memorials, left messages, etc.)
  SELECT EXISTS (
    SELECT 1 FROM memorials 
    WHERE author_id = author_uuid 
    AND (
      -- User has left a guestbook message on this author's memorial
      EXISTS (
        SELECT 1 FROM guestbook_messages 
        WHERE memorial_id = memorials.id 
        AND user_id = current_user_id
      )
      -- Or user is following this author's memorial
      OR EXISTS (
        SELECT 1 FROM memorial_followers 
        WHERE memorial_id = memorials.id 
        AND user_id = current_user_id
      )
    )
  ) INTO has_interacted;
  
  RETURN has_interacted;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE author_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for author_ratings

-- Everyone can view ratings
CREATE POLICY "Anyone can view author ratings"
  ON author_ratings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated users can create ratings for authors they've interacted with
CREATE POLICY "Users can rate authors they've interacted with"
  ON author_ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    rater_user_id = (SELECT auth.uid())
    AND author_id != (SELECT auth.uid())
    AND can_rate_author(author_id)
  );

-- Users can update their own ratings
CREATE POLICY "Users can update their own ratings"
  ON author_ratings FOR UPDATE
  TO authenticated
  USING (rater_user_id = (SELECT auth.uid()))
  WITH CHECK (rater_user_id = (SELECT auth.uid()));

-- Users can delete their own ratings
CREATE POLICY "Users can delete their own ratings"
  ON author_ratings FOR DELETE
  TO authenticated
  USING (rater_user_id = (SELECT auth.uid()));

-- Grant necessary permissions
GRANT SELECT ON author_ratings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON author_ratings TO authenticated;
GRANT EXECUTE ON FUNCTION get_author_credibility_score(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION can_rate_author(uuid) TO anon, authenticated;

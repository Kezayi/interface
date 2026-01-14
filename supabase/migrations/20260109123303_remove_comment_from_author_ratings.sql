/*
  # Remove comment field from author ratings

  1. Changes
    - Remove the `comment` column from `author_ratings` table
    - Users can only rate authors with stars (1-5), no text comments allowed
  
  2. Security
    - No changes to RLS policies needed
*/

-- Remove the comment column from author_ratings
ALTER TABLE author_ratings DROP COLUMN IF EXISTS comment;

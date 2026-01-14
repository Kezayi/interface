/*
  # Allow Anonymous Following
  
  ## Changes to `memorial_followers` table
    - Add `follower_email` (text, optional) - Email for non-authenticated followers
    - Add `follower_phone` (text, optional) - Phone for non-authenticated followers
    - Add `follower_name` (text, optional) - Name for non-authenticated followers
    - Update constraint to allow either user_id OR (email AND name)
  
  ## Security
    - Update RLS policies to support anonymous followers
    - Ensure followers can only delete their own follow records
  
  ## Notes
    - Authenticated users will continue to use user_id
    - Anonymous users must provide email and name to follow
    - Email/phone combination ensures uniqueness for anonymous followers
*/

-- Add follower contact fields to memorial_followers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'memorial_followers' AND column_name = 'follower_email'
  ) THEN
    ALTER TABLE public.memorial_followers ADD COLUMN follower_email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'memorial_followers' AND column_name = 'follower_phone'
  ) THEN
    ALTER TABLE public.memorial_followers ADD COLUMN follower_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'memorial_followers' AND column_name = 'follower_name'
  ) THEN
    ALTER TABLE public.memorial_followers ADD COLUMN follower_name text;
  END IF;
END $$;

-- Add check constraint to ensure either user_id or (email and name) is provided
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'memorial_followers_identifier_check'
  ) THEN
    ALTER TABLE public.memorial_followers 
    ADD CONSTRAINT memorial_followers_identifier_check 
    CHECK (
      user_id IS NOT NULL OR 
      (follower_email IS NOT NULL AND follower_name IS NOT NULL)
    );
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own follows" ON public.memorial_followers;
DROP POLICY IF EXISTS "Users can create follows" ON public.memorial_followers;
DROP POLICY IF EXISTS "Users can delete own follows" ON public.memorial_followers;
DROP POLICY IF EXISTS "Users can update own follows" ON public.memorial_followers;

-- Create new policies that support anonymous followers
CREATE POLICY "Anyone can view memorial followers"
  ON public.memorial_followers
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create follows"
  ON public.memorial_followers
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete own follows"
  ON public.memorial_followers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own follows"
  ON public.memorial_followers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create unique index to prevent duplicate follows
CREATE UNIQUE INDEX IF NOT EXISTS idx_memorial_followers_user_unique 
  ON public.memorial_followers(memorial_id, user_id) 
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_memorial_followers_email_unique 
  ON public.memorial_followers(memorial_id, follower_email) 
  WHERE follower_email IS NOT NULL;
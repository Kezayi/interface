/*
  # Restore memorial read access policy

  1. Security Changes
    - Restore public SELECT policy on memorials table
    - Allow both authenticated and anonymous users to view memorials
    
  This policy was accidentally removed in a previous security migration.
  Public access to memorials is necessary for the homepage to display obituaries.
*/

-- Drop existing policy if any
DROP POLICY IF EXISTS "Anyone can view memorials" ON public.memorials;

-- Recreate the policy to allow public read access
CREATE POLICY "Anyone can view memorials"
  ON public.memorials
  FOR SELECT
  TO authenticated, anon
  USING (true);

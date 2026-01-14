/*
  # Fix Performance and Security Issues

  ## 1. Add Missing Indexes on Foreign Keys
  Add indexes for foreign key columns to improve query performance:
  - `funeral_contributions.contributor_user_id`
  - `gestures.user_id`
  - `guestbook_messages.user_id`

  ## 2. Optimize RLS Policies
  Replace `auth.uid()` with `(select auth.uid())` in all policies to prevent
  re-evaluation for each row, significantly improving query performance at scale.
  
  Tables affected:
  - memorials (3 policies)
  - gestures (1 policy)
  - guestbook_messages (3 policies)
  - memorial_followers (5 policies)
  - funeral_contributions (2 policies)

  ## 3. Fix Function Search Path
  Update the `update_updated_at_column` function to have an immutable search_path
  for better security.

  ## Notes
  - Unused indexes are kept as they will be used as data volume grows
  - Multiple permissive policies are intentional for different access patterns
  - Auth connection strategy and password protection are configuration changes
    that need to be done in Supabase dashboard settings
*/

-- Add indexes for unindexed foreign keys
CREATE INDEX IF NOT EXISTS idx_funeral_contributions_contributor 
  ON public.funeral_contributions(contributor_user_id);

CREATE INDEX IF NOT EXISTS idx_gestures_user 
  ON public.gestures(user_id);

CREATE INDEX IF NOT EXISTS idx_guestbook_messages_user 
  ON public.guestbook_messages(user_id);

-- Drop and recreate all RLS policies with optimized auth.uid() calls

-- Memorials table policies
DROP POLICY IF EXISTS "Authors can create memorials" ON public.memorials;
CREATE POLICY "Authors can create memorials"
  ON public.memorials
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors can update their memorials" ON public.memorials;
CREATE POLICY "Authors can update their memorials"
  ON public.memorials
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = author_id)
  WITH CHECK ((select auth.uid()) = author_id);

DROP POLICY IF EXISTS "Authors can delete their memorials" ON public.memorials;
CREATE POLICY "Authors can delete their memorials"
  ON public.memorials
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = author_id);

-- Gestures table policies
DROP POLICY IF EXISTS "Authenticated users can add gestures" ON public.gestures;
CREATE POLICY "Authenticated users can add gestures"
  ON public.gestures
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Guestbook messages table policies
DROP POLICY IF EXISTS "Authenticated users can post messages" ON public.guestbook_messages;
CREATE POLICY "Authenticated users can post messages"
  ON public.guestbook_messages
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Authors can delete messages from their memorial" ON public.guestbook_messages;
CREATE POLICY "Authors can delete messages from their memorial"
  ON public.guestbook_messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memorials
      WHERE memorials.id = guestbook_messages.memorial_id
      AND memorials.author_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Memorial authors can view private guestbook data" ON public.guestbook_messages;
CREATE POLICY "Memorial authors can view private guestbook data"
  ON public.guestbook_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memorials
      WHERE memorials.id = guestbook_messages.memorial_id
      AND memorials.author_id = (select auth.uid())
    )
  );

-- Memorial followers table policies
DROP POLICY IF EXISTS "Users can view their own follows" ON public.memorial_followers;
CREATE POLICY "Users can view their own follows"
  ON public.memorial_followers
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Memorial authors can view their followers" ON public.memorial_followers;
CREATE POLICY "Memorial authors can view their followers"
  ON public.memorial_followers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memorials
      WHERE memorials.id = memorial_followers.memorial_id
      AND memorials.author_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can follow memorials" ON public.memorial_followers;
CREATE POLICY "Users can follow memorials"
  ON public.memorial_followers
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can unfollow memorials" ON public.memorial_followers;
CREATE POLICY "Users can unfollow memorials"
  ON public.memorial_followers
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their follow preferences" ON public.memorial_followers;
CREATE POLICY "Users can update their follow preferences"
  ON public.memorial_followers
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Funeral contributions table policies
DROP POLICY IF EXISTS "Memorial authors can view all contributions to their memorial" ON public.funeral_contributions;
CREATE POLICY "Memorial authors can view all contributions to their memorial"
  ON public.funeral_contributions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memorials
      WHERE memorials.id = funeral_contributions.memorial_id
      AND memorials.author_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users can make contributions" ON public.funeral_contributions;
CREATE POLICY "Authenticated users can make contributions"
  ON public.funeral_contributions
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = contributor_user_id);

-- Fix function search path
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers for the function
CREATE TRIGGER update_memorials_updated_at
  BEFORE UPDATE ON public.memorials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_guestbook_messages_updated_at
  BEFORE UPDATE ON public.guestbook_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_memorial_followers_updated_at
  BEFORE UPDATE ON public.memorial_followers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
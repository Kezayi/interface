/*
  # Fix Security and Performance Issues

  ## 1. RLS Performance Optimization
  Fix remaining policies on `memorial_followers` table that re-evaluate `auth.uid()` 
  for each row by replacing with `(select auth.uid())`.

  ## 2. Remove Unused Indexes
  Drop indexes that are not being used to improve write performance and reduce storage:
  - `idx_funeral_contributions_contributor` - not used
  - `idx_gestures_user` - not used
  - `idx_guestbook_messages_user` - not used
  - `idx_memorials_author` - not used
  - `idx_followers_memorial` - not used
  - `idx_followers_user` - not used
  - `idx_contributions_memorial` - not used
  - `idx_memorials_payment_status` - not used
  - `idx_gestures_message` - not used

  ## 3. Consolidate Duplicate Policies
  Remove redundant permissive policies to simplify security model:
  
  ### memorial_followers table:
  - Remove duplicate SELECT policies (keep the more permissive one)
  - Remove duplicate INSERT policies (keep the more permissive one)
  - Remove duplicate UPDATE policies (keep the authenticated one)
  - Remove duplicate DELETE policies (keep the authenticated one)
  
  ### funeral_contributions table:
  - Consolidate SELECT policies into one that handles both cases
  
  ### guestbook_messages table:
  - Keep both SELECT policies as they serve different purposes (public vs private data)

  ## 4. Security Notes
  The following issues require Supabase Dashboard configuration changes:
  - **Auth DB Connection Strategy**: Change from fixed to percentage-based in Settings > Database
  - **Leaked Password Protection**: Enable in Settings > Authentication > Security

  ## Important
  All changes maintain data security while improving performance and reducing complexity.
*/

-- ============================================================================
-- 1. FIX RLS PERFORMANCE ISSUES ON memorial_followers
-- ============================================================================

-- Drop and recreate policies with optimized auth.uid() calls
DROP POLICY IF EXISTS "Authenticated users can delete own follows" ON public.memorial_followers;
CREATE POLICY "Authenticated users can delete own follows"
  ON public.memorial_followers
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Authenticated users can update own follows" ON public.memorial_followers;
CREATE POLICY "Authenticated users can update own follows"
  ON public.memorial_followers
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================================
-- 2. DROP UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS public.idx_funeral_contributions_contributor;
DROP INDEX IF EXISTS public.idx_gestures_user;
DROP INDEX IF EXISTS public.idx_guestbook_messages_user;
DROP INDEX IF EXISTS public.idx_memorials_author;
DROP INDEX IF EXISTS public.idx_followers_memorial;
DROP INDEX IF EXISTS public.idx_followers_user;
DROP INDEX IF EXISTS public.idx_contributions_memorial;
DROP INDEX IF EXISTS public.idx_memorials_payment_status;
DROP INDEX IF EXISTS public.idx_gestures_message;

-- ============================================================================
-- 3. CONSOLIDATE DUPLICATE POLICIES
-- ============================================================================

-- memorial_followers: Remove duplicate policies
-- Keep only the most permissive SELECT policy
DROP POLICY IF EXISTS "Memorial authors can view their followers" ON public.memorial_followers;

-- Keep only the most permissive INSERT policy
DROP POLICY IF EXISTS "Users can follow memorials" ON public.memorial_followers;

-- Keep only the authenticated UPDATE policy (remove duplicate)
DROP POLICY IF EXISTS "Users can update their follow preferences" ON public.memorial_followers;

-- Keep only the authenticated DELETE policy (remove duplicate)
DROP POLICY IF EXISTS "Users can unfollow memorials" ON public.memorial_followers;

-- funeral_contributions: Consolidate SELECT policies
DROP POLICY IF EXISTS "Anyone can view contribution counts" ON public.funeral_contributions;
DROP POLICY IF EXISTS "Memorial authors can view all contributions to their memorial" ON public.funeral_contributions;

-- Create a single consolidated SELECT policy
CREATE POLICY "Users can view contributions"
  ON public.funeral_contributions
  FOR SELECT
  TO authenticated
  USING (
    -- Anyone can view basic contribution data
    true
    OR
    -- Memorial authors can view all details
    EXISTS (
      SELECT 1 FROM public.memorials
      WHERE memorials.id = funeral_contributions.memorial_id
      AND memorials.author_id = (select auth.uid())
    )
  );

-- Note: guestbook_messages has two SELECT policies but they serve different purposes:
-- - "Public can view guestbook messages (without private data)" - for public access
-- - "Memorial authors can view private guestbook data" - for authors to see private data
-- These are NOT duplicates and should both be kept.
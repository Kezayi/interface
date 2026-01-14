/*
  # Fix Anonymous Guestbook Messages

  ## Changes
  1. Update RLS policies to allow anonymous users to post guestbook messages
  2. Update RLS policies to allow anonymous users to add gestures
  
  ## Details
  
  ### guestbook_messages Table
  - Remove the restrictive "Authenticated users can post messages" policy
  - Add new policy for anonymous users to insert messages (with user_id = NULL)
  - Add new policy for authenticated users to insert messages (with user_id = auth.uid())
  
  ### gestures Table
  - Remove the restrictive "Authenticated users can add gestures" policy
  - Add new policy for anonymous users to add gestures (with user_id = NULL)
  - Add new policy for authenticated users to add gestures (with user_id = auth.uid())

  ## Security Notes
  - Anonymous users can only insert with NULL user_id
  - Authenticated users can only insert with their own user_id
  - This maintains security while allowing public participation
*/

-- ============================================================================
-- FIX GUESTBOOK_MESSAGES RLS POLICIES
-- ============================================================================

-- Drop the restrictive authenticated-only policy
DROP POLICY IF EXISTS "Authenticated users can post messages" ON public.guestbook_messages;

-- Allow anonymous users to post messages (with user_id = NULL)
CREATE POLICY "Anonymous users can post messages"
  ON public.guestbook_messages
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Allow authenticated users to post messages (with user_id = auth.uid())
CREATE POLICY "Authenticated users can post messages"
  ON public.guestbook_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- FIX GESTURES RLS POLICIES
-- ============================================================================

-- Drop the restrictive authenticated-only policy
DROP POLICY IF EXISTS "Authenticated users can add gestures" ON public.gestures;

-- Allow anonymous users to add gestures (with user_id = NULL)
CREATE POLICY "Anonymous users can add gestures"
  ON public.gestures
  FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Allow authenticated users to add gestures (with user_id = auth.uid())
CREATE POLICY "Authenticated users can add gestures"
  ON public.gestures
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));
/*
  # Fix Remaining Security Issues

  ## 1. Add Missing Indexes for Frequently-Queried Foreign Keys
  These indexes were previously removed but are essential for query performance:
  - digital_heirs.memorial_id
  - financial_transactions.memorial_id
  - funeral_contributions.memorial_id
  - guestbook_messages.user_id
  - memorial_event_history.memorial_id
  - memorial_followers.user_id
  - memorials.author_id
  - notifications.memorial_id

  ## 2. Fix RLS Policy Performance Issues
  Updates RLS policies to use `(select auth.uid())` pattern for better performance:
  - memorial_event_history: "Authenticated users can view memorial event history"
  - memorial_event_history: "Memorial authors can insert event history"
  - notifications: "Users can create notifications for recipients"

  ## Notes
  - Foreign key indexes are essential even if not immediately used
  - The optimized auth pattern prevents re-evaluation for each row
  - "Unused index" warnings for newly created indexes are false positives
*/

-- =====================================================
-- SECTION 1: Add Missing Indexes for Foreign Keys
-- =====================================================

-- These indexes are critical for JOIN performance and foreign key operations
-- even if they appear "unused" immediately after creation

-- digital_heirs.memorial_id
CREATE INDEX IF NOT EXISTS idx_digital_heirs_memorial_id
  ON digital_heirs(memorial_id);

-- financial_transactions.memorial_id
CREATE INDEX IF NOT EXISTS idx_financial_transactions_memorial_id
  ON financial_transactions(memorial_id);

-- funeral_contributions.memorial_id
CREATE INDEX IF NOT EXISTS idx_funeral_contributions_memorial_id
  ON funeral_contributions(memorial_id);

-- guestbook_messages.user_id
CREATE INDEX IF NOT EXISTS idx_guestbook_messages_user_id
  ON guestbook_messages(user_id);

-- memorial_event_history.memorial_id
CREATE INDEX IF NOT EXISTS idx_memorial_event_history_memorial_id
  ON memorial_event_history(memorial_id);

-- memorial_followers.user_id
CREATE INDEX IF NOT EXISTS idx_memorial_followers_user_id
  ON memorial_followers(user_id);

-- memorials.author_id
CREATE INDEX IF NOT EXISTS idx_memorials_author_id
  ON memorials(author_id);

-- notifications.memorial_id
CREATE INDEX IF NOT EXISTS idx_notifications_memorial_id
  ON notifications(memorial_id);

-- =====================================================
-- SECTION 2: Fix RLS Policy Performance Issues
-- =====================================================

-- Fix memorial_event_history SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view memorial event history" ON memorial_event_history;

CREATE POLICY "Authenticated users can view memorial event history"
  ON memorial_event_history
  FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM memorials
      WHERE memorials.id = memorial_event_history.memorial_id
      AND (
        memorials.author_id = (SELECT auth.uid())
        OR memorials.is_published = true
      )
    )
  );

-- Fix memorial_event_history INSERT policy
DROP POLICY IF EXISTS "Memorial authors can insert event history" ON memorial_event_history;

CREATE POLICY "Memorial authors can insert event history"
  ON memorial_event_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memorials
      WHERE memorials.id = memorial_event_history.memorial_id
      AND memorials.author_id = (SELECT auth.uid())
    )
  );

-- Fix notifications INSERT policy
DROP POLICY IF EXISTS "Users can create notifications for recipients" ON notifications;

CREATE POLICY "Users can create notifications for recipients"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    recipient_user_id = (SELECT auth.uid()) OR
    recipient_email IN (
      SELECT email FROM auth.users WHERE id = (SELECT auth.uid())
    )
  );
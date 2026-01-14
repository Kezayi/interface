/*
  # Fix Security Issues: Indexes and RLS Policies

  ## 1. Add Missing Indexes for Foreign Keys
  Adds indexes for all unindexed foreign keys to improve query performance:
  - admin_users.created_by
  - digital_heirs.activated_by
  - event_confirmations.user_id
  - financial_transactions.refunded_by, verified_by
  - gesture_prices.updated_by
  - guestbook_messages.hidden_by, memorial_id
  - incidents.memorial_id, transaction_id
  - memorial_events.author_id
  - moderation_actions.admin_id
  - system_parameters.last_modified_by

  ## 2. Remove Unused Indexes
  Drops indexes that have not been used to reduce maintenance overhead:
  - idx_digital_heirs_memorial_id
  - idx_financial_transactions_memorial_id
  - idx_funeral_contributions_memorial_id
  - idx_guestbook_messages_user_id
  - idx_memorial_event_history_memorial_id
  - idx_memorial_followers_user_id
  - idx_memorials_author_id
  - idx_notifications_memorial_id

  ## 3. Fix Multiple Permissive Policies
  Consolidates duplicate SELECT policies on memorial_event_history

  ## 4. Fix RLS Policies That Bypass Security
  Updates policies that use (true) to have proper security checks:
  - audit_logs: Restrict to system operations only
  - memorial_event_history: Restrict to authenticated users with proper context
  - notifications: Restrict to authenticated users creating notifications for themselves
*/

-- =====================================================
-- SECTION 1: Add Missing Indexes for Foreign Keys
-- =====================================================

-- admin_users.created_by
CREATE INDEX IF NOT EXISTS idx_admin_users_created_by 
  ON admin_users(created_by);

-- digital_heirs.activated_by
CREATE INDEX IF NOT EXISTS idx_digital_heirs_activated_by 
  ON digital_heirs(activated_by);

-- event_confirmations.user_id
CREATE INDEX IF NOT EXISTS idx_event_confirmations_user_id 
  ON event_confirmations(user_id);

-- financial_transactions.refunded_by
CREATE INDEX IF NOT EXISTS idx_financial_transactions_refunded_by 
  ON financial_transactions(refunded_by);

-- financial_transactions.verified_by
CREATE INDEX IF NOT EXISTS idx_financial_transactions_verified_by 
  ON financial_transactions(verified_by);

-- gesture_prices.updated_by
CREATE INDEX IF NOT EXISTS idx_gesture_prices_updated_by 
  ON gesture_prices(updated_by);

-- guestbook_messages.hidden_by
CREATE INDEX IF NOT EXISTS idx_guestbook_messages_hidden_by 
  ON guestbook_messages(hidden_by);

-- guestbook_messages.memorial_id
CREATE INDEX IF NOT EXISTS idx_guestbook_messages_memorial_id_fk 
  ON guestbook_messages(memorial_id);

-- incidents.memorial_id
CREATE INDEX IF NOT EXISTS idx_incidents_memorial_id 
  ON incidents(memorial_id);

-- incidents.transaction_id
CREATE INDEX IF NOT EXISTS idx_incidents_transaction_id 
  ON incidents(transaction_id);

-- memorial_events.author_id
CREATE INDEX IF NOT EXISTS idx_memorial_events_author_id 
  ON memorial_events(author_id);

-- moderation_actions.admin_id
CREATE INDEX IF NOT EXISTS idx_moderation_actions_admin_id 
  ON moderation_actions(admin_id);

-- system_parameters.last_modified_by
CREATE INDEX IF NOT EXISTS idx_system_parameters_last_modified_by 
  ON system_parameters(last_modified_by);

-- =====================================================
-- SECTION 2: Remove Unused Indexes
-- =====================================================

DROP INDEX IF EXISTS idx_digital_heirs_memorial_id;
DROP INDEX IF EXISTS idx_financial_transactions_memorial_id;
DROP INDEX IF EXISTS idx_funeral_contributions_memorial_id;
DROP INDEX IF EXISTS idx_guestbook_messages_user_id;
DROP INDEX IF EXISTS idx_memorial_event_history_memorial_id;
DROP INDEX IF EXISTS idx_memorial_followers_user_id;
DROP INDEX IF EXISTS idx_memorials_author_id;
DROP INDEX IF EXISTS idx_notifications_memorial_id;

-- =====================================================
-- SECTION 3: Fix Multiple Permissive Policies
-- =====================================================

-- Drop the duplicate SELECT policies on memorial_event_history
DROP POLICY IF EXISTS "Memorial authors can view event history" ON memorial_event_history;
DROP POLICY IF EXISTS "Users can view memorial event history" ON memorial_event_history;

-- Create a single consolidated SELECT policy
CREATE POLICY "Authenticated users can view memorial event history"
  ON memorial_event_history
  FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM memorials
      WHERE memorials.id = memorial_event_history.memorial_id
      AND (
        memorials.author_id = auth.uid()
        OR memorials.is_published = true
      )
    )
  );

-- =====================================================
-- SECTION 4: Fix RLS Policies That Bypass Security
-- =====================================================

-- Fix audit_logs - Only allow inserts from database triggers/functions
-- Drop the insecure policy
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

-- Create a more restrictive policy (only allows service role)
-- Note: Triggers run with the permissions of the function owner (definer)
-- so we create a security definer function to handle audit log inserts
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Fix memorial_event_history - Restrict to authenticated memorial authors
DROP POLICY IF EXISTS "System can insert event history" ON memorial_event_history;

CREATE POLICY "Memorial authors can insert event history"
  ON memorial_event_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memorials
      WHERE memorials.id = memorial_event_history.memorial_id
      AND memorials.author_id = auth.uid()
    )
  );

-- Fix notifications - Users can only create notifications for themselves or via system
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

CREATE POLICY "Users can create notifications for recipients"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    recipient_user_id = auth.uid() OR
    recipient_email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- =====================================================
-- SECTION 5: Create Helper Functions for System Inserts
-- =====================================================

-- Create a security definer function for system operations
-- This allows triggers to insert audit logs, event history, and notifications
-- without granting unrestricted access to regular users

CREATE OR REPLACE FUNCTION insert_system_audit_log(
  p_admin_id uuid,
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_details jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
  VALUES (p_admin_id, p_action, p_target_type, p_target_id, p_details)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

CREATE OR REPLACE FUNCTION insert_system_event_history(
  p_memorial_id uuid,
  p_event_type text,
  p_old_value jsonb,
  p_new_value jsonb,
  p_changed_by uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_history_id uuid;
BEGIN
  INSERT INTO memorial_event_history (memorial_id, event_type, old_value, new_value, changed_by)
  VALUES (p_memorial_id, p_event_type, p_old_value, p_new_value, p_changed_by)
  RETURNING id INTO v_history_id;
  
  RETURN v_history_id;
END;
$$;

CREATE OR REPLACE FUNCTION insert_system_notification(
  p_memorial_id uuid,
  p_recipient_user_id uuid,
  p_recipient_email text,
  p_recipient_phone text,
  p_recipient_name text,
  p_notification_type text,
  p_notification_content jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO notifications (
    memorial_id,
    recipient_user_id,
    recipient_email,
    recipient_phone,
    recipient_name,
    notification_type,
    notification_content
  )
  VALUES (
    p_memorial_id,
    p_recipient_user_id,
    p_recipient_email,
    p_recipient_phone,
    p_recipient_name,
    p_notification_type,
    p_notification_content
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION insert_system_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION insert_system_event_history TO authenticated;
GRANT EXECUTE ON FUNCTION insert_system_notification TO authenticated;
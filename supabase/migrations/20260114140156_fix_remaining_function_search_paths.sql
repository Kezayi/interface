/*
  # Fix Remaining Function Search Path Issues
  
  This migration fixes the remaining functions with mutable search_path:
  
  ## Changes:
  1. Fix create_super_admin(uuid, text, text) - add immutable search_path
  2. Fix mark_notification_read(uuid, text) - add immutable search_path
  
  ## Note:
  - event_confirmations_event_id_idx and memorial_events_memorial_id_idx are kept
    as they are used for foreign key constraint lookups and JOIN operations
*/

-- =====================================================
-- FIX REMAINING FUNCTION SEARCH PATHS
-- =====================================================

-- Fix create_super_admin with 3 parameters
DROP FUNCTION IF EXISTS create_super_admin(uuid, text, text);
CREATE FUNCTION create_super_admin(p_user_id uuid, p_email text, p_full_name text)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Insert or update admin_users entry
  INSERT INTO admin_users (id, email, full_name, role, is_active)
  VALUES (p_user_id, p_email, p_full_name, 'super_admin', true)
  ON CONFLICT (id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = 'super_admin',
    is_active = true;

  RAISE NOTICE 'Super admin account created/updated for: %', p_email;
END;
$$;

-- Fix duplicate mark_notification_read with phone parameter
DROP FUNCTION IF EXISTS mark_notification_read(uuid, text);
CREATE FUNCTION mark_notification_read(notification_id uuid, phone text)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE id = notification_id
    AND recipient_phone = phone
    AND is_read = false;
END;
$$;

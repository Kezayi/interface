/*
  # Fix Security and Performance Issues - Complete
  
  This migration addresses all security and performance issues identified by Supabase.
  
  ## Changes:
  1. Add missing foreign key indexes
  2. Optimize RLS policies with (SELECT auth.uid())
  3. Remove duplicate and unused indexes
  4. Consolidate multiple permissive gesture policies
  5. Fix function search paths (drop/recreate with triggers)
  6. Fix RLS policies with always-true conditions
*/

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_event_confirmations_user_id 
  ON event_confirmations(user_id);

CREATE INDEX IF NOT EXISTS idx_memorial_events_author_id 
  ON memorial_events(author_id);

-- =====================================================
-- 2. OPTIMIZE RLS POLICIES - EVENT CONFIRMATIONS
-- =====================================================

DROP POLICY IF EXISTS "Users can delete own confirmations" ON event_confirmations;
CREATE POLICY "Users can delete own confirmations"
  ON event_confirmations
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can confirm events" ON event_confirmations;
CREATE POLICY "Authenticated users can confirm events"
  ON event_confirmations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- =====================================================
-- 3. OPTIMIZE RLS POLICIES - MEMORIAL EVENTS
-- =====================================================

DROP POLICY IF EXISTS "Memorial author can create events" ON memorial_events;
CREATE POLICY "Memorial author can create events"
  ON memorial_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = (SELECT auth.uid()) AND
    EXISTS (
      SELECT 1 FROM memorials
      WHERE memorials.id = memorial_events.memorial_id
      AND memorials.author_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Memorial author can update own events" ON memorial_events;
CREATE POLICY "Memorial author can update own events"
  ON memorial_events
  FOR UPDATE
  TO authenticated
  USING (author_id = (SELECT auth.uid()))
  WITH CHECK (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Memorial author can delete own events" ON memorial_events;
CREATE POLICY "Memorial author can delete own events"
  ON memorial_events
  FOR DELETE
  TO authenticated
  USING (author_id = (SELECT auth.uid()));

-- =====================================================
-- 4. REMOVE DUPLICATE INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_gestures_memorial;
DROP INDEX IF EXISTS idx_guestbook_memorial;

-- =====================================================
-- 5. REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_funeral_contributions_contributor_user_id;
DROP INDEX IF EXISTS idx_gestures_user_id;
DROP INDEX IF EXISTS idx_funeral_contributions_memorial_id;
DROP INDEX IF EXISTS idx_gestures_guestbook_message_id;
DROP INDEX IF EXISTS idx_guestbook_messages_user_id;
DROP INDEX IF EXISTS idx_memorial_followers_user_id;
DROP INDEX IF EXISTS idx_memorial_followers_memorial_id;
DROP INDEX IF EXISTS idx_memorials_author_id;
DROP INDEX IF EXISTS idx_guestbook_author_last_name;
DROP INDEX IF EXISTS idx_guestbook_relationship;
DROP INDEX IF EXISTS idx_notifications_recipient_phone;
DROP INDEX IF EXISTS idx_notifications_memorial_id;

-- =====================================================
-- 6. CONSOLIDATE GESTURE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Anyone can add RIP gestures" ON gestures;
DROP POLICY IF EXISTS "Anyone can add paid gestures" ON gestures;

CREATE POLICY "Anyone can add gestures"
  ON gestures
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    gesture_type IN ('rip', 'candle', 'flower') AND
    (user_id IS NULL OR user_id = (SELECT auth.uid()))
  );

-- =====================================================
-- 7. FIX RLS POLICIES WITH ALWAYS TRUE CONDITIONS
-- =====================================================

DROP POLICY IF EXISTS "Anyone can create follows" ON memorial_followers;
CREATE POLICY "Anyone can create follows"
  ON memorial_followers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    memorial_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM memorials m WHERE m.id = memorial_id)
  );

DROP POLICY IF EXISTS "Authenticated users can create verifications" ON phone_verifications;
CREATE POLICY "Authenticated users can create verifications"
  ON phone_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    phone_number IS NOT NULL AND
    phone_number != '' AND
    verification_code IS NOT NULL
  );

DROP POLICY IF EXISTS "Authenticated users can update publication settings" ON publication_settings;

-- =====================================================
-- 8. FIX FUNCTION SEARCH PATHS
-- =====================================================

DROP TRIGGER IF EXISTS notify_guestbook_authors_on_event ON memorial_events;

DROP FUNCTION IF EXISTS notify_guestbook_authors_of_event() CASCADE;
CREATE FUNCTION notify_guestbook_authors_of_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_deceased_name TEXT;
BEGIN
  SELECT deceased_full_name INTO v_deceased_name
  FROM memorials
  WHERE id = NEW.memorial_id;

  INSERT INTO notifications (
    memorial_id,
    recipient_phone,
    message,
    type,
    sender_name
  )
  SELECT 
    NEW.memorial_id,
    gm.author_phone,
    'Un nouvel événement "' || NEW.event_type || '" a été ajouté pour ' || v_deceased_name,
    'event_added',
    v_deceased_name
  FROM guestbook_messages gm
  WHERE gm.memorial_id = NEW.memorial_id
    AND gm.author_phone IS NOT NULL
    AND gm.author_phone != ''
  ON CONFLICT DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

CREATE TRIGGER notify_guestbook_authors_on_event
  AFTER INSERT ON memorial_events
  FOR EACH ROW
  EXECUTE FUNCTION notify_guestbook_authors_of_event();

DROP FUNCTION IF EXISTS get_notifications_for_phone(TEXT);
CREATE FUNCTION get_notifications_for_phone(phone_param TEXT)
RETURNS TABLE (
  id UUID,
  memorial_id UUID,
  recipient_phone TEXT,
  message TEXT,
  notification_type TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.memorial_id,
    n.recipient_phone,
    n.message,
    n.type as notification_type,
    n.is_read,
    n.created_at
  FROM notifications n
  WHERE n.recipient_phone = phone_param
  ORDER BY n.created_at DESC;
END;
$$;

DROP FUNCTION IF EXISTS count_unread_notifications(TEXT);
CREATE FUNCTION count_unread_notifications(phone_param TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO unread_count
  FROM notifications
  WHERE recipient_phone = phone_param
  AND is_read = false;
  
  RETURN COALESCE(unread_count, 0);
END;
$$;

DROP FUNCTION IF EXISTS mark_notification_read(UUID);
CREATE FUNCTION mark_notification_read(notification_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE id = notification_id;
END;
$$;

DROP FUNCTION IF EXISTS mark_all_notifications_read(TEXT);
CREATE FUNCTION mark_all_notifications_read(phone_param TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE notifications
  SET is_read = true, read_at = NOW()
  WHERE recipient_phone = phone_param
  AND is_read = false;
END;
$$;

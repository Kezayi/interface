/*
  # Fix Security and Performance Issues

  1. **RLS Performance Optimization**
     - Fix `author_legitimacy_clicks` policies to use `(select auth.uid())` instead of `auth.uid()`
     - This prevents re-evaluation of auth functions for each row

  2. **Remove Unused Indexes**
     - Drop 26 unused indexes across multiple tables
     - Reduces storage overhead and improves write performance

  3. **Function Security**
     - Set secure search_path on 5 functions to prevent search_path manipulation attacks
     - Functions: update_author_rating_timestamp, get_author_credibility_score, can_rate_author, 
       get_author_legitimacy_for_memorial, toggle_author_legitimacy

  Note: Auth DB Connection Strategy and Leaked Password Protection must be configured in Supabase Dashboard
*/

-- =============================================
-- 1. FIX RLS POLICIES ON author_legitimacy_clicks
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can insert their own clicks" ON author_legitimacy_clicks;
DROP POLICY IF EXISTS "Users can delete their own clicks" ON author_legitimacy_clicks;

-- Recreate with optimized auth function calls
CREATE POLICY "Authenticated users can insert their own clicks"
  ON author_legitimacy_clicks
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own clicks"
  ON author_legitimacy_clicks
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- =============================================
-- 2. REMOVE UNUSED INDEXES
-- =============================================

-- Admin and system indexes
DROP INDEX IF EXISTS idx_admin_users_created_by;
DROP INDEX IF EXISTS idx_system_parameters_last_modified_by;
DROP INDEX IF EXISTS idx_gesture_prices_updated_by;

-- Digital heirs indexes
DROP INDEX IF EXISTS idx_digital_heirs_activated_by;
DROP INDEX IF EXISTS idx_digital_heirs_memorial_id;

-- Event indexes
DROP INDEX IF EXISTS idx_event_confirmations_user_id;
DROP INDEX IF EXISTS idx_memorial_events_author_id;
DROP INDEX IF EXISTS idx_memorial_event_history_memorial_id;

-- Financial indexes
DROP INDEX IF EXISTS idx_financial_transactions_refunded_by;
DROP INDEX IF EXISTS idx_financial_transactions_verified_by;
DROP INDEX IF EXISTS idx_financial_transactions_memorial_id;

-- Guestbook indexes
DROP INDEX IF EXISTS idx_guestbook_messages_hidden_by;
DROP INDEX IF EXISTS idx_guestbook_messages_memorial_id_fk;
DROP INDEX IF EXISTS idx_guestbook_messages_user_id;

-- Incident indexes
DROP INDEX IF EXISTS idx_incidents_memorial_id;
DROP INDEX IF EXISTS idx_incidents_transaction_id;

-- Moderation indexes
DROP INDEX IF EXISTS idx_moderation_actions_admin_id;

-- Funeral contributions index
DROP INDEX IF EXISTS idx_funeral_contributions_memorial_id;

-- Memorial and follower indexes
DROP INDEX IF EXISTS idx_memorial_followers_user_id;
DROP INDEX IF EXISTS idx_memorials_author_id;

-- Notification indexes
DROP INDEX IF EXISTS idx_notifications_memorial_id;

-- Author legitimacy indexes
DROP INDEX IF EXISTS idx_author_legitimacy_clicks_memorial;
DROP INDEX IF EXISTS idx_author_legitimacy_clicks_author;
DROP INDEX IF EXISTS idx_author_legitimacy_clicks_user;
DROP INDEX IF EXISTS idx_author_legitimacy_clicks_anonymous;

-- =============================================
-- 3. FIX FUNCTION SEARCH PATHS
-- =============================================

-- Drop existing functions first
DROP FUNCTION IF EXISTS update_author_rating_timestamp();
DROP FUNCTION IF EXISTS get_author_credibility_score(uuid);
DROP FUNCTION IF EXISTS can_rate_author(uuid);
DROP FUNCTION IF EXISTS get_author_legitimacy_for_memorial(uuid);
DROP FUNCTION IF EXISTS toggle_author_legitimacy(uuid);

-- Recreate with secure search_path

-- Function: update_author_rating_timestamp
CREATE FUNCTION update_author_rating_timestamp()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Function: get_author_credibility_score
CREATE FUNCTION get_author_credibility_score(p_memorial_id uuid)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_result jsonb;
  v_total_clicks bigint;
  v_authenticated_clicks bigint;
  v_score numeric;
BEGIN
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE user_id IS NOT NULL) as authenticated
  INTO v_total_clicks, v_authenticated_clicks
  FROM author_legitimacy_clicks
  WHERE memorial_id = p_memorial_id;

  IF v_total_clicks = 0 THEN
    v_score := 0;
  ELSE
    v_score := ROUND((v_authenticated_clicks::numeric / v_total_clicks::numeric) * 100, 1);
  END IF;

  v_result := jsonb_build_object(
    'total_clicks', v_total_clicks,
    'authenticated_clicks', v_authenticated_clicks,
    'score', v_score
  );

  RETURN v_result;
END;
$$;

-- Function: can_rate_author
CREATE FUNCTION can_rate_author(p_memorial_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  RETURN NOT EXISTS (
    SELECT 1 
    FROM author_legitimacy_clicks 
    WHERE memorial_id = p_memorial_id 
    AND user_id = v_user_id
  );
END;
$$;

-- Function: get_author_legitimacy_for_memorial
CREATE FUNCTION get_author_legitimacy_for_memorial(p_memorial_id uuid)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_result jsonb;
  v_total_clicks bigint;
  v_authenticated_clicks bigint;
  v_user_has_clicked boolean;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE user_id IS NOT NULL) as authenticated
  INTO v_total_clicks, v_authenticated_clicks
  FROM author_legitimacy_clicks
  WHERE memorial_id = p_memorial_id;

  IF v_user_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 
      FROM author_legitimacy_clicks 
      WHERE memorial_id = p_memorial_id 
      AND user_id = v_user_id
    ) INTO v_user_has_clicked;
  ELSE
    v_user_has_clicked := false;
  END IF;

  v_result := jsonb_build_object(
    'total_clicks', v_total_clicks,
    'authenticated_clicks', v_authenticated_clicks,
    'user_has_clicked', v_user_has_clicked
  );

  RETURN v_result;
END;
$$;

-- Function: toggle_author_legitimacy
CREATE FUNCTION toggle_author_legitimacy(p_memorial_id uuid)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_existing_click uuid;
  v_result jsonb;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated to toggle legitimacy';
  END IF;

  SELECT id INTO v_existing_click
  FROM author_legitimacy_clicks
  WHERE memorial_id = p_memorial_id
  AND user_id = v_user_id;

  IF v_existing_click IS NOT NULL THEN
    DELETE FROM author_legitimacy_clicks
    WHERE id = v_existing_click;
    
    v_result := jsonb_build_object('action', 'removed', 'success', true);
  ELSE
    INSERT INTO author_legitimacy_clicks (memorial_id, user_id)
    VALUES (p_memorial_id, v_user_id);
    
    v_result := jsonb_build_object('action', 'added', 'success', true);
  END IF;

  RETURN v_result;
END;
$$;
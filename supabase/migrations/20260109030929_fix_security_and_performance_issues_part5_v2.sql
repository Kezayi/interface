/*
  # Fix Security and Performance Issues - Part 5: Fix Function Search Path Mutability (v2)
  
  1. Security Improvements
    - Set immutable search_path for all functions
    - Prevents search_path injection attacks
    
  2. Affected Functions (with correct signatures)
    - get_unread_notification_count(text)
    - get_notifications_for_phone(text)
    - count_unread_notifications(text)
    - mark_notification_read(uuid, text)
    - mark_all_notifications_read(text)
    - get_dashboard_stats()
    - get_gesture_stats_by_memorial()
    - notify_guestbook_authors_of_event()
    - get_gesture_financial_stats(timestamp with time zone, timestamp with time zone)
    - create_super_admin(uuid, text, text)
*/

-- Fix search_path for notification functions
ALTER FUNCTION get_unread_notification_count(text) SET search_path = public, pg_temp;
ALTER FUNCTION get_notifications_for_phone(text) SET search_path = public, pg_temp;
ALTER FUNCTION count_unread_notifications(text) SET search_path = public, pg_temp;
ALTER FUNCTION mark_notification_read(uuid, text) SET search_path = public, pg_temp;
ALTER FUNCTION mark_all_notifications_read(text) SET search_path = public, pg_temp;

-- Fix search_path for stats functions
ALTER FUNCTION get_dashboard_stats() SET search_path = public, pg_temp;
ALTER FUNCTION get_gesture_stats_by_memorial() SET search_path = public, pg_temp;
ALTER FUNCTION get_gesture_financial_stats(timestamp with time zone, timestamp with time zone) SET search_path = public, pg_temp;

-- Fix search_path for other functions
ALTER FUNCTION notify_guestbook_authors_of_event() SET search_path = public, pg_temp;
ALTER FUNCTION create_super_admin(uuid, text, text) SET search_path = public, pg_temp;
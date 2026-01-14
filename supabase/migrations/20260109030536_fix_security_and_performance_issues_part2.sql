/*
  # Fix Security and Performance Issues - Part 2: Remove Duplicate and Unused Indexes
  
  1. Performance Improvements
    - Drop duplicate indexes (keep one of each pair)
    - Drop unused indexes
    
  2. Duplicate Indexes Removed
    - Drop idx_event_confirmations_event (keep event_confirmations_event_id_idx)
    - Drop idx_gestures_memorial (keep idx_gestures_memorial_id)
    - Drop idx_guestbook_memorial (keep idx_guestbook_messages_memorial_id)
    
  3. Unused Indexes Removed
    - Multiple unused indexes across various tables
*/

-- Drop duplicate indexes (keep the more descriptive names)
DROP INDEX IF EXISTS idx_event_confirmations_event;
DROP INDEX IF EXISTS idx_gestures_memorial;
DROP INDEX IF EXISTS idx_guestbook_memorial;

-- Drop unused indexes
DROP INDEX IF EXISTS idx_funeral_contributions_memorial_id;
DROP INDEX IF EXISTS idx_guestbook_messages_user_id;
DROP INDEX IF EXISTS idx_memorial_followers_user_id;
DROP INDEX IF EXISTS idx_memorial_followers_memorial_id;
DROP INDEX IF EXISTS idx_memorials_author_id;
DROP INDEX IF EXISTS idx_notifications_recipient_phone;
DROP INDEX IF EXISTS memorial_events_event_date_idx;
DROP INDEX IF EXISTS idx_guestbook_author_last_name;
DROP INDEX IF EXISTS idx_guestbook_relationship;
DROP INDEX IF EXISTS idx_notifications_is_sent;
DROP INDEX IF EXISTS idx_notifications_memorial_id;
DROP INDEX IF EXISTS idx_notifications_recipient_email;
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_memorial_event_history_memorial_id;
DROP INDEX IF EXISTS idx_memorial_event_history_created_at;
DROP INDEX IF EXISTS idx_admin_action_logs_created_at;
DROP INDEX IF EXISTS idx_audit_logs_entity;
DROP INDEX IF EXISTS idx_digital_heirs_memorial;
DROP INDEX IF EXISTS idx_digital_heirs_status;
DROP INDEX IF EXISTS idx_financial_transactions_memorial;
DROP INDEX IF EXISTS idx_admin_action_logs_action_type;
DROP INDEX IF EXISTS idx_gesture_prices_type;
DROP INDEX IF EXISTS idx_memorials_published_created;
DROP INDEX IF EXISTS idx_memorials_created_at;
DROP INDEX IF EXISTS idx_system_parameters_key;
DROP INDEX IF EXISTS idx_guestbook_messages_memorial_created;
DROP INDEX IF EXISTS idx_memorial_events_memorial_date;
DROP INDEX IF EXISTS idx_memorials_deceased_name_trgm;
DROP INDEX IF EXISTS idx_guestbook_author_name_trgm;
DROP INDEX IF EXISTS idx_guestbook_author_first_name_trgm;
DROP INDEX IF EXISTS idx_guestbook_author_last_name_trgm;
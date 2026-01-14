/*
  # Remove Unused Indexes from Previous Migrations
  
  1. Performance Improvements
    - Drop indexes that are not being used by queries
    - These indexes were created but have not been accessed
    
  2. Indexes Being Removed
    - idx_guestbook_messages_memorial_id (duplicate of existing index)
    - idx_event_confirmations_user_id
    - idx_financial_transactions_refunded_by
    - idx_financial_transactions_verified_by
    - idx_gesture_prices_updated_by
    - idx_guestbook_messages_hidden_by
    - idx_incidents_memorial_id
    - idx_incidents_transaction_id
    - idx_memorial_events_author_id
    - idx_admin_users_created_by
    - idx_digital_heirs_activated_by
    - idx_moderation_actions_admin_id
    - idx_system_parameters_last_modified_by
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_guestbook_messages_memorial_id;
DROP INDEX IF EXISTS idx_event_confirmations_user_id;
DROP INDEX IF EXISTS idx_financial_transactions_refunded_by;
DROP INDEX IF EXISTS idx_financial_transactions_verified_by;
DROP INDEX IF EXISTS idx_gesture_prices_updated_by;
DROP INDEX IF EXISTS idx_guestbook_messages_hidden_by;
DROP INDEX IF EXISTS idx_incidents_memorial_id;
DROP INDEX IF EXISTS idx_incidents_transaction_id;
DROP INDEX IF EXISTS idx_memorial_events_author_id;
DROP INDEX IF EXISTS idx_admin_users_created_by;
DROP INDEX IF EXISTS idx_digital_heirs_activated_by;
DROP INDEX IF EXISTS idx_moderation_actions_admin_id;
DROP INDEX IF EXISTS idx_system_parameters_last_modified_by;
/*
  # Fix Security and Performance Issues - Part 1: Foreign Key Indexes
  
  1. Performance Improvements
    - Add indexes for all unindexed foreign keys
    
  2. Affected Tables
    - admin_users: created_by
    - digital_heirs: activated_by
    - event_confirmations: user_id
    - financial_transactions: refunded_by, verified_by
    - gesture_prices: updated_by
    - guestbook_messages: hidden_by
    - incidents: memorial_id, transaction_id
    - memorial_events: author_id
    - moderation_actions: admin_id
    - system_parameters: last_modified_by
*/

-- Add index for admin_users.created_by
CREATE INDEX IF NOT EXISTS idx_admin_users_created_by ON admin_users(created_by);

-- Add index for digital_heirs.activated_by
CREATE INDEX IF NOT EXISTS idx_digital_heirs_activated_by ON digital_heirs(activated_by);

-- Add index for event_confirmations.user_id
CREATE INDEX IF NOT EXISTS idx_event_confirmations_user_id ON event_confirmations(user_id);

-- Add index for financial_transactions.refunded_by
CREATE INDEX IF NOT EXISTS idx_financial_transactions_refunded_by ON financial_transactions(refunded_by);

-- Add index for financial_transactions.verified_by
CREATE INDEX IF NOT EXISTS idx_financial_transactions_verified_by ON financial_transactions(verified_by);

-- Add index for gesture_prices.updated_by
CREATE INDEX IF NOT EXISTS idx_gesture_prices_updated_by ON gesture_prices(updated_by);

-- Add index for guestbook_messages.hidden_by
CREATE INDEX IF NOT EXISTS idx_guestbook_messages_hidden_by ON guestbook_messages(hidden_by);

-- Add index for incidents.memorial_id
CREATE INDEX IF NOT EXISTS idx_incidents_memorial_id ON incidents(memorial_id);

-- Add index for incidents.transaction_id
CREATE INDEX IF NOT EXISTS idx_incidents_transaction_id ON incidents(transaction_id);

-- Add index for memorial_events.author_id
CREATE INDEX IF NOT EXISTS idx_memorial_events_author_id ON memorial_events(author_id);

-- Add index for moderation_actions.admin_id
CREATE INDEX IF NOT EXISTS idx_moderation_actions_admin_id ON moderation_actions(admin_id);

-- Add index for system_parameters.last_modified_by
CREATE INDEX IF NOT EXISTS idx_system_parameters_last_modified_by ON system_parameters(last_modified_by);
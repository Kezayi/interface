/*
  # Fix Remaining Foreign Key Indexes
  
  1. Performance Improvements
    - Add indexes for all remaining unindexed foreign keys
    
  2. Affected Tables
    - digital_heirs: memorial_id
    - financial_transactions: memorial_id
    - funeral_contributions: memorial_id
    - guestbook_messages: user_id
    - memorial_event_history: memorial_id
    - memorial_followers: user_id
    - memorials: author_id
    - notifications: memorial_id
*/

-- Add index for digital_heirs.memorial_id
CREATE INDEX IF NOT EXISTS idx_digital_heirs_memorial_id ON digital_heirs(memorial_id);

-- Add index for financial_transactions.memorial_id
CREATE INDEX IF NOT EXISTS idx_financial_transactions_memorial_id ON financial_transactions(memorial_id);

-- Add index for funeral_contributions.memorial_id
CREATE INDEX IF NOT EXISTS idx_funeral_contributions_memorial_id ON funeral_contributions(memorial_id);

-- Add index for guestbook_messages.user_id
CREATE INDEX IF NOT EXISTS idx_guestbook_messages_user_id ON guestbook_messages(user_id);

-- Add index for memorial_event_history.memorial_id
CREATE INDEX IF NOT EXISTS idx_memorial_event_history_memorial_id ON memorial_event_history(memorial_id);

-- Add index for memorial_followers.user_id
CREATE INDEX IF NOT EXISTS idx_memorial_followers_user_id ON memorial_followers(user_id);

-- Add index for memorials.author_id
CREATE INDEX IF NOT EXISTS idx_memorials_author_id ON memorials(author_id);

-- Add index for notifications.memorial_id
CREATE INDEX IF NOT EXISTS idx_notifications_memorial_id ON notifications(memorial_id);
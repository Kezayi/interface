/*
  # Add performance indexes for frequently queried columns

  1. Performance Improvements
    - Add index on memorials(is_published, created_at) for home page queries
    - Add index on guestbook_messages(memorial_id, created_at) for memorial view
    - Add index on gestures(memorial_id, gesture_type) for gesture counts
    - Add index on event_confirmations(event_id) for event loading

  2. Impact
    - These indexes will dramatically improve query performance
    - Especially beneficial as data volume grows
    - Indexes support the most frequent queries in the application

  3. Notes
    - Indexes are created with IF NOT EXISTS to prevent errors
    - Composite indexes are ordered by selectivity
*/

CREATE INDEX IF NOT EXISTS idx_memorials_published_created
  ON memorials(is_published, created_at DESC)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_guestbook_messages_memorial_created
  ON guestbook_messages(memorial_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gestures_memorial_type
  ON gestures(memorial_id, gesture_type);

CREATE INDEX IF NOT EXISTS idx_event_confirmations_event
  ON event_confirmations(event_id);

CREATE INDEX IF NOT EXISTS idx_memorial_events_memorial_date
  ON memorial_events(memorial_id, event_date);

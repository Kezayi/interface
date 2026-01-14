/*
  # Add Notifications System

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `memorial_id` (uuid, references memorials)
      - `recipient_phone` (text) - Phone number of the person to notify
      - `type` (text) - Type of notification (gesture, message, etc.)
      - `message` (text) - Notification message
      - `gesture_type` (text) - Type of gesture (prayer, candle, flower)
      - `sender_name` (text) - Name of person who triggered the notification
      - `is_read` (boolean, default false)
      - `created_at` (timestamptz, default now())
      - `read_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on `notifications` table
    - Allow users to read notifications for their phone number
    - Allow users to mark their own notifications as read
    - Only system can insert notifications (via trigger)

  3. Triggers
    - Auto-create notification when a gesture is added
    - Notification sent to memorial creator (identified by author_name phone)

  4. Indexes
    - Index on recipient_phone for fast lookups
    - Index on memorial_id for memorial-specific queries
    - Index on is_read for filtering unread notifications
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id uuid NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  recipient_phone text NOT NULL,
  type text NOT NULL DEFAULT 'gesture',
  message text NOT NULL,
  gesture_type text,
  sender_name text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read notifications for their phone"
  ON notifications FOR SELECT
  USING (recipient_phone = current_setting('app.user_phone', true));

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (recipient_phone = current_setting('app.user_phone', true))
  WITH CHECK (recipient_phone = current_setting('app.user_phone', true));

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_phone 
  ON notifications(recipient_phone);

CREATE INDEX IF NOT EXISTS idx_notifications_memorial_id 
  ON notifications(memorial_id);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read 
  ON notifications(is_read, created_at DESC);

CREATE OR REPLACE FUNCTION notify_memorial_owner()
RETURNS TRIGGER AS $$
DECLARE
  memorial_owner_phone text;
  memorial_deceased_name text;
  notification_message text;
BEGIN
  SELECT author_name, deceased_full_name 
  INTO memorial_owner_phone, memorial_deceased_name
  FROM memorials 
  WHERE id = NEW.memorial_id;
  
  IF memorial_owner_phone IS NOT NULL AND memorial_owner_phone != NEW.user_phone THEN
    CASE NEW.gesture_type
      WHEN 'prayer' THEN
        notification_message := NEW.user_name || ' a déposé une prière pour ' || memorial_deceased_name;
      WHEN 'candle' THEN
        notification_message := NEW.user_name || ' a allumé une bougie pour ' || memorial_deceased_name;
      WHEN 'flower' THEN
        notification_message := NEW.user_name || ' a déposé une fleur pour ' || memorial_deceased_name;
      ELSE
        notification_message := NEW.user_name || ' a laissé un geste de recueillement pour ' || memorial_deceased_name;
    END CASE;
    
    INSERT INTO notifications (
      memorial_id,
      recipient_phone,
      type,
      message,
      gesture_type,
      sender_name
    ) VALUES (
      NEW.memorial_id,
      memorial_owner_phone,
      'gesture',
      notification_message,
      NEW.gesture_type,
      NEW.user_name
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_gesture_created
  AFTER INSERT ON gestures
  FOR EACH ROW
  EXECUTE FUNCTION notify_memorial_owner();
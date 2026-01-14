/*
  # Fix Gesture Notification Trigger

  1. Problem
    - The notify_memorial_owner function tries to access NEW.user_phone and NEW.user_name
    - These columns don't exist in the gestures table
    - This causes the error: "record 'new' has no field 'user_phone'"

  2. Solution
    - Update the function to retrieve user information from guestbook_messages table
    - Use the guestbook_message_id to get author_phone and author_name
    - Handle cases where there's no guestbook message (direct gesture)

  3. Changes
    - Rewrite notify_memorial_owner function to fetch user data correctly
    - Improve error handling
*/

CREATE OR REPLACE FUNCTION notify_memorial_owner()
RETURNS TRIGGER AS $$
DECLARE
  memorial_owner_phone text;
  memorial_deceased_name text;
  notification_message text;
  gesture_author_phone text;
  gesture_author_name text;
BEGIN
  SELECT author_phone, deceased_full_name 
  INTO memorial_owner_phone, memorial_deceased_name
  FROM memorials 
  WHERE id = NEW.memorial_id;
  
  IF NEW.guestbook_message_id IS NOT NULL THEN
    SELECT author_phone, 
           COALESCE(author_name, author_first_name || ' ' || author_last_name, 'Anonyme')
    INTO gesture_author_phone, gesture_author_name
    FROM guestbook_messages 
    WHERE id = NEW.guestbook_message_id;
  ELSE
    SELECT phone, full_name
    INTO gesture_author_phone, gesture_author_name
    FROM profiles
    WHERE user_id = NEW.user_id;
  END IF;
  
  IF memorial_owner_phone IS NOT NULL 
     AND gesture_author_phone IS NOT NULL 
     AND memorial_owner_phone != gesture_author_phone THEN
    
    CASE NEW.gesture_type
      WHEN 'rip' THEN
        notification_message := COALESCE(gesture_author_name, 'Quelqu''un') || ' a déposé un RIP pour ' || memorial_deceased_name;
      WHEN 'candle' THEN
        notification_message := COALESCE(gesture_author_name, 'Quelqu''un') || ' a allumé une bougie pour ' || memorial_deceased_name;
      WHEN 'flower' THEN
        notification_message := COALESCE(gesture_author_name, 'Quelqu''un') || ' a déposé une fleur pour ' || memorial_deceased_name;
      ELSE
        notification_message := COALESCE(gesture_author_name, 'Quelqu''un') || ' a laissé un geste de recueillement pour ' || memorial_deceased_name;
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
      COALESCE(gesture_author_name, 'Anonyme')
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in notify_memorial_owner: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

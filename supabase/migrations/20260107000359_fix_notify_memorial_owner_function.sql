/*
  # Fix notify_memorial_owner function
  
  1. Problem
    - The function was using author_name instead of author_phone
    - This caused notifications to not be sent to the correct recipient
  
  2. Changes
    - Update notify_memorial_owner function to use author_phone
    - Correctly retrieve the phone number of the memorial creator
  
  3. Impact
    - Notifications will now be sent to the correct phone number
    - Memorial owners will receive gesture notifications properly
*/

CREATE OR REPLACE FUNCTION notify_memorial_owner()
RETURNS TRIGGER AS $$
DECLARE
  memorial_owner_phone text;
  memorial_deceased_name text;
  notification_message text;
BEGIN
  SELECT author_phone, deceased_full_name 
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
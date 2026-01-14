/*
  # Fix Notification Trigger Function

  1. Changes
    - Update notify_guestbook_authors_of_event function to use correct notification table columns
    - Map old column names to actual notification table schema
  
  2. Details
    - Use recipient_user_id instead of user_id
    - Use notification_type instead of type
    - Use notification_content (jsonb) instead of separate title/message fields
    - Add memorial_id reference
*/

CREATE OR REPLACE FUNCTION notify_guestbook_authors_of_event()
RETURNS TRIGGER AS $$
DECLARE
  memorial_name text;
  event_title text;
  guestbook_author record;
BEGIN
  -- Get memorial name
  SELECT deceased_full_name INTO memorial_name
  FROM memorials
  WHERE id = NEW.memorial_id;

  -- Create event title
  event_title := NEW.event_type || ' - ' || memorial_name;

  -- Notify all guestbook authors (both authenticated and anonymous)
  FOR guestbook_author IN
    SELECT DISTINCT 
      author_id,
      author_email,
      author_name
    FROM guestbook_messages
    WHERE memorial_id = NEW.memorial_id
    AND author_id IS NOT NULL
  LOOP
    INSERT INTO notifications (
      memorial_id,
      recipient_user_id,
      recipient_email,
      recipient_name,
      notification_type,
      notification_content,
      is_read,
      is_sent
    ) VALUES (
      NEW.memorial_id,
      guestbook_author.author_id,
      guestbook_author.author_email,
      guestbook_author.author_name,
      'event_created',
      jsonb_build_object(
        'title', 'Nouvel événement: ' || event_title,
        'message', 'Un nouvel événement a été publié pour ' || memorial_name || ': ' || NEW.event_type || ' le ' || to_char(NEW.event_date, 'DD/MM/YYYY à HH24:MI'),
        'event_id', NEW.id,
        'event_type', NEW.event_type,
        'event_date', NEW.event_date
      ),
      false,
      false
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
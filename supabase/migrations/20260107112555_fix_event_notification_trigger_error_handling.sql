/*
  # Fix Event Notification Trigger with Better Error Handling

  1. Changes
    - Update notify_guestbook_authors_of_event function to handle errors gracefully
    - Add exception handling so notification failures don't prevent event creation
    - Add logging for debugging
  
  2. Details
    - Wrap notification insertion in exception block
    - If notification fails, log the error but continue processing
    - Re-enable the trigger after fixing the function
*/

CREATE OR REPLACE FUNCTION notify_guestbook_authors_of_event()
RETURNS TRIGGER AS $$
DECLARE
  memorial_name text;
  event_title text;
  guestbook_author record;
  notification_error text;
BEGIN
  BEGIN
    SELECT deceased_full_name INTO memorial_name
    FROM memorials
    WHERE id = NEW.memorial_id;

    event_title := NEW.event_type || ' - ' || memorial_name;

    FOR guestbook_author IN
      SELECT DISTINCT 
        user_id,
        author_email,
        author_name
      FROM guestbook_messages
      WHERE memorial_id = NEW.memorial_id
      AND (user_id IS NOT NULL OR author_email IS NOT NULL)
    LOOP
      BEGIN
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
          guestbook_author.user_id,
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
      EXCEPTION WHEN OTHERS THEN
        notification_error := SQLERRM;
        RAISE NOTICE 'Failed to create notification for user % (email: %): %', 
          guestbook_author.user_id, 
          guestbook_author.author_email,
          notification_error;
      END;
    END LOOP;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in notify_guestbook_authors_of_event: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_guestbook_authors_on_event ON memorial_events;

CREATE TRIGGER notify_guestbook_authors_on_event
  AFTER INSERT ON memorial_events
  FOR EACH ROW
  EXECUTE FUNCTION notify_guestbook_authors_of_event();
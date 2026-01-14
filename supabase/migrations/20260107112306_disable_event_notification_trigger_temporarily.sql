/*
  # Temporarily Disable Event Notification Trigger for Testing

  1. Changes
    - Drop the trigger that sends notifications when events are created
    - This is to identify if the trigger is causing the "Failed to fetch" error
  
  2. Notes
    - This is a diagnostic step - we'll re-enable it once we fix the issue
    - Users can still create events, but notifications won't be sent temporarily
*/

DROP TRIGGER IF EXISTS notify_guestbook_authors_on_event ON memorial_events;
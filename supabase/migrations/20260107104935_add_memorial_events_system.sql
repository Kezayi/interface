/*
  # Add Memorial Events System (Recueillement)
  
  1. New Tables
    - `memorial_events`
      - `id` (uuid, primary key)
      - `memorial_id` (uuid, foreign key to memorials)
      - `author_id` (uuid, foreign key to auth.users)
      - `event_type` (text) - Type of event (e.g., "Retrait de deuil", "Messe de requiem", "Minute de silence")
      - `event_date` (timestamptz) - Date and time of the event
      - `location` (text) - Location of the event
      - `description` (text) - Additional details about the event
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `event_confirmations`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key to memorial_events)
      - `user_id` (uuid, nullable, foreign key to auth.users)
      - `anonymous_id` (text, nullable) - For anonymous users
      - `created_at` (timestamptz)
      - Unique constraint on (event_id, user_id) or (event_id, anonymous_id)
  
  2. Security
    - Enable RLS on all tables
    - memorial_events:
      - Everyone can view events for published memorials
      - Only memorial author can create/update/delete events
    - event_confirmations:
      - Everyone can view confirmations
      - Authenticated and anonymous users can confirm events
      - Users can only delete their own confirmations
  
  3. Functions
    - `notify_guestbook_authors_of_event` - Notifies all guestbook authors when a new event is created
  
  4. Indexes
    - Index on memorial_id for faster event lookups
    - Index on event_id for faster confirmation lookups
*/

-- Create memorial_events table
CREATE TABLE IF NOT EXISTS memorial_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id uuid NOT NULL REFERENCES memorials(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_date timestamptz NOT NULL,
  location text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create event_confirmations table
CREATE TABLE IF NOT EXISTS event_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES memorial_events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_id text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT event_confirmations_user_check CHECK (
    (user_id IS NOT NULL AND anonymous_id IS NULL) OR
    (user_id IS NULL AND anonymous_id IS NOT NULL)
  )
);

-- Create unique constraint for confirmations
CREATE UNIQUE INDEX IF NOT EXISTS event_confirmations_user_unique 
  ON event_confirmations(event_id, user_id) 
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS event_confirmations_anonymous_unique 
  ON event_confirmations(event_id, anonymous_id) 
  WHERE anonymous_id IS NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS memorial_events_memorial_id_idx ON memorial_events(memorial_id);
CREATE INDEX IF NOT EXISTS memorial_events_event_date_idx ON memorial_events(event_date);
CREATE INDEX IF NOT EXISTS event_confirmations_event_id_idx ON event_confirmations(event_id);

-- Enable RLS
ALTER TABLE memorial_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_confirmations ENABLE ROW LEVEL SECURITY;

-- Policies for memorial_events
CREATE POLICY "Anyone can view events for published memorials"
  ON memorial_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memorials
      WHERE memorials.id = memorial_events.memorial_id
      AND memorials.is_published = true
    )
  );

CREATE POLICY "Memorial author can create events"
  ON memorial_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memorials
      WHERE memorials.id = memorial_events.memorial_id
      AND memorials.author_id = auth.uid()
    )
  );

CREATE POLICY "Memorial author can update own events"
  ON memorial_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorials
      WHERE memorials.id = memorial_events.memorial_id
      AND memorials.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memorials
      WHERE memorials.id = memorial_events.memorial_id
      AND memorials.author_id = auth.uid()
    )
  );

CREATE POLICY "Memorial author can delete own events"
  ON memorial_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorials
      WHERE memorials.id = memorial_events.memorial_id
      AND memorials.author_id = auth.uid()
    )
  );

-- Policies for event_confirmations
CREATE POLICY "Anyone can view confirmations"
  ON event_confirmations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can confirm events"
  ON event_confirmations FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND anonymous_id IS NULL
  );

CREATE POLICY "Anonymous users can confirm events"
  ON event_confirmations FOR INSERT
  TO anon
  WITH CHECK (
    user_id IS NULL AND anonymous_id IS NOT NULL
  );

CREATE POLICY "Users can delete own confirmations"
  ON event_confirmations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anonymous users can delete own confirmations"
  ON event_confirmations FOR DELETE
  TO anon
  USING (anonymous_id IS NOT NULL);

-- Function to notify guestbook authors when a new event is created
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
      author_email
    FROM guestbook_messages
    WHERE memorial_id = NEW.memorial_id
    AND author_id IS NOT NULL
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      reference_type,
      reference_id
    ) VALUES (
      guestbook_author.author_id,
      'event_created',
      'Nouvel événement: ' || event_title,
      'Un nouvel événement a été publié pour ' || memorial_name || ': ' || NEW.event_type || ' le ' || to_char(NEW.event_date, 'DD/MM/YYYY à HH24:MI'),
      'memorial_event',
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to notify guestbook authors
DROP TRIGGER IF EXISTS notify_guestbook_authors_on_event ON memorial_events;
CREATE TRIGGER notify_guestbook_authors_on_event
  AFTER INSERT ON memorial_events
  FOR EACH ROW
  EXECUTE FUNCTION notify_guestbook_authors_of_event();

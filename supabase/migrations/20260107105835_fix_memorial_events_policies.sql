/*
  # Fix Memorial Events RLS Policies

  1. Changes
    - Drop existing policies for memorial_events
    - Recreate with correct column references for INSERT operations
    - Fix WITH CHECK clause to properly reference the inserted row columns
  
  2. Security
    - Maintains same security model: only memorial authors can create/edit events
    - Everyone can view events for published memorials
*/

DROP POLICY IF EXISTS "Anyone can view events for published memorials" ON memorial_events;
DROP POLICY IF EXISTS "Memorial author can create events" ON memorial_events;
DROP POLICY IF EXISTS "Memorial author can update own events" ON memorial_events;
DROP POLICY IF EXISTS "Memorial author can delete own events" ON memorial_events;

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
      WHERE memorials.id = memorial_id
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
      WHERE memorials.id = memorial_id
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

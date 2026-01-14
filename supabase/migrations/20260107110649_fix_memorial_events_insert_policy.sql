/*
  # Fix Memorial Events Insert Policy

  1. Changes
    - Fix the INSERT policy to properly reference the new row's columns
    - Ensure author_id column can be populated during insert
  
  2. Security
    - Only memorial authors can create events for their memorials
*/

DROP POLICY IF EXISTS "Memorial author can create events" ON memorial_events;

CREATE POLICY "Memorial author can create events"
  ON memorial_events FOR INSERT
  TO authenticated
  WITH CHECK (
    memorial_id IN (
      SELECT id FROM memorials
      WHERE author_id = auth.uid()
    )
    AND author_id = auth.uid()
  );

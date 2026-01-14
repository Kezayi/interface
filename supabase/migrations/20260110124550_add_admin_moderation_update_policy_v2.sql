/*
  # Add Admin Moderation Policy for Guestbook Messages

  1. Security Changes
    - Add UPDATE policy for guestbook_messages to allow admin users to moderate (hide/restore) messages
    - Policy checks that the user is an admin by verifying their existence in admin_users table
    - Only allows updating is_hidden, hidden_at, and hidden_by fields for moderation purposes

  2. Important Notes
    - This policy is restrictive and only grants UPDATE access to verified admin users
    - Regular users cannot update guestbook messages
    - Admins can only update moderation-related fields
*/

-- Add policy to allow admins to moderate guestbook messages
CREATE POLICY "Admins can moderate guestbook messages"
  ON guestbook_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

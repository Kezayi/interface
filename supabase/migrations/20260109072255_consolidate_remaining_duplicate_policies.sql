/*
  # Consolidate Remaining Duplicate Policies
  
  1. Security & Performance Improvements
    - Remove duplicate policies to reduce evaluation overhead
    - Keep only the necessary policies with proper role assignments
    
  2. Changes
    - gesture_prices: Split ALL policy into separate INSERT, UPDATE, DELETE policies
    - notifications: Remove old duplicate policies, keep consolidated ones
*/

-- gesture_prices: Replace ALL policy with specific policies to avoid duplicate SELECT
DROP POLICY IF EXISTS "Super admins can manage gesture prices" ON gesture_prices;

CREATE POLICY "Super admins can insert gesture prices"
  ON gesture_prices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.role = 'super_admin'
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Super admins can update gesture prices"
  ON gesture_prices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.role = 'super_admin'
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.role = 'super_admin'
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Super admins can delete gesture prices"
  ON gesture_prices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.role = 'super_admin'
      AND admin_users.is_active = true
    )
  );

-- notifications: Remove old duplicate policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
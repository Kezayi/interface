/*
  # Fix Security and Performance Issues - Part 3: Optimize Auth RLS Policies (v2)
  
  1. Security & Performance Improvements
    - Replace auth.uid() with (select auth.uid()) in RLS policies
    - This prevents re-evaluation of the function for each row
    
  2. Affected Tables
    - notifications (using recipient_user_id)
    - memorial_event_history
    - event_confirmations
    - moderation_actions
    - memorial_events
    - digital_heirs (using admin_users.id)
    - audit_logs
    - financial_transactions
    - incidents
    - system_parameters
    - admin_action_logs
    - gesture_prices
    - admin_users (using id)
*/

-- notifications table
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = recipient_user_id OR (recipient_email IN (SELECT email FROM auth.users WHERE id = (select auth.uid()))));

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = recipient_user_id OR (recipient_email IN (SELECT email FROM auth.users WHERE id = (select auth.uid()))))
  WITH CHECK ((select auth.uid()) = recipient_user_id OR (recipient_email IN (SELECT email FROM auth.users WHERE id = (select auth.uid()))));

-- memorial_event_history table
DROP POLICY IF EXISTS "Memorial authors can view event history" ON memorial_event_history;
CREATE POLICY "Memorial authors can view event history"
  ON memorial_event_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorials
      WHERE memorials.id = memorial_event_history.memorial_id
      AND memorials.author_id = (select auth.uid())
    )
  );

-- event_confirmations table
DROP POLICY IF EXISTS "Users can delete own confirmations" ON event_confirmations;
CREATE POLICY "Users can delete own confirmations"
  ON event_confirmations FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Authenticated users can confirm events" ON event_confirmations;
CREATE POLICY "Authenticated users can confirm events"
  ON event_confirmations FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- memorial_events table
DROP POLICY IF EXISTS "Memorial author can create events" ON memorial_events;
CREATE POLICY "Memorial author can create events"
  ON memorial_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memorials
      WHERE memorials.id = memorial_events.memorial_id
      AND memorials.author_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Memorial author can update own events" ON memorial_events;
CREATE POLICY "Memorial author can update own events"
  ON memorial_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorials
      WHERE memorials.id = memorial_events.memorial_id
      AND memorials.author_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memorials
      WHERE memorials.id = memorial_events.memorial_id
      AND memorials.author_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Memorial author can delete own events" ON memorial_events;
CREATE POLICY "Memorial author can delete own events"
  ON memorial_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorials
      WHERE memorials.id = memorial_events.memorial_id
      AND memorials.author_id = (select auth.uid())
    )
  );

-- digital_heirs table (uses admin_users.id not user_id)
DROP POLICY IF EXISTS "Super admins can manage digital heirs" ON digital_heirs;
CREATE POLICY "Super admins can manage digital heirs"
  ON digital_heirs FOR ALL
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

DROP POLICY IF EXISTS "Admins can read digital heirs" ON digital_heirs;
CREATE POLICY "Admins can read digital heirs"
  ON digital_heirs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.is_active = true
    )
  );

-- moderation_actions table
DROP POLICY IF EXISTS "Admins can create moderation actions" ON moderation_actions;
CREATE POLICY "Admins can create moderation actions"
  ON moderation_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can read moderation actions" ON moderation_actions;
CREATE POLICY "Admins can read moderation actions"
  ON moderation_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.is_active = true
    )
  );

-- audit_logs table
DROP POLICY IF EXISTS "Admins can read audit logs" ON audit_logs;
CREATE POLICY "Admins can read audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.is_active = true
    )
  );

-- financial_transactions table
DROP POLICY IF EXISTS "Admins can read financial transactions" ON financial_transactions;
CREATE POLICY "Admins can read financial transactions"
  ON financial_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.is_active = true
    )
  );

DROP POLICY IF EXISTS "Super admins can manage financial transactions" ON financial_transactions;
CREATE POLICY "Super admins can manage financial transactions"
  ON financial_transactions FOR ALL
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

-- incidents table
DROP POLICY IF EXISTS "Admins can read incidents" ON incidents;
CREATE POLICY "Admins can read incidents"
  ON incidents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can manage incidents" ON incidents;
CREATE POLICY "Admins can manage incidents"
  ON incidents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.is_active = true
    )
  );

-- system_parameters table
DROP POLICY IF EXISTS "Admins can read system parameters" ON system_parameters;
CREATE POLICY "Admins can read system parameters"
  ON system_parameters FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.is_active = true
    )
  );

DROP POLICY IF EXISTS "Super admins can manage system parameters" ON system_parameters;
CREATE POLICY "Super admins can manage system parameters"
  ON system_parameters FOR ALL
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

DROP POLICY IF EXISTS "Only super admins can modify through RPC" ON system_parameters;
CREATE POLICY "Only super admins can modify through RPC"
  ON system_parameters FOR ALL
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

-- admin_action_logs table
DROP POLICY IF EXISTS "Admins can view all audit logs" ON admin_action_logs;
CREATE POLICY "Admins can view all audit logs"
  ON admin_action_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can insert audit logs" ON admin_action_logs;
CREATE POLICY "Admins can insert audit logs"
  ON admin_action_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.is_active = true
    )
  );

-- gesture_prices table
DROP POLICY IF EXISTS "Super admins can manage gesture prices" ON gesture_prices;
CREATE POLICY "Super admins can manage gesture prices"
  ON gesture_prices FOR ALL
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

-- admin_users table (uses id column)
DROP POLICY IF EXISTS "Read own profile" ON admin_users;
CREATE POLICY "Read own profile"
  ON admin_users FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Update own last login" ON admin_users;
CREATE POLICY "Update own last login"
  ON admin_users FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);
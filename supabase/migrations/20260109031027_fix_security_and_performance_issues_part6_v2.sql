/*
  # Fix Security and Performance Issues - Part 6: Consolidate Multiple Permissive Policies (v2)
  
  1. Security & Performance Improvements
    - Consolidate multiple permissive policies into single policies
    - Reduces policy evaluation overhead
    - Makes access control logic clearer
    
  2. Affected Tables
    - digital_heirs: Merge admin read policies
    - financial_transactions: Merge admin read policies
    - gesture_prices: Merge public read policies
    - incidents: Merge admin policies
    - notifications: Merge read and update policies
    - system_parameters: Consolidate admin policies
*/

-- digital_heirs: Consolidate admin SELECT policies
DROP POLICY IF EXISTS "Admins can read digital heirs" ON digital_heirs;
DROP POLICY IF EXISTS "Super admins can manage digital heirs" ON digital_heirs;
CREATE POLICY "Admins can view digital heirs"
  ON digital_heirs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.is_active = true
    )
  );
CREATE POLICY "Super admins can modify digital heirs"
  ON digital_heirs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.role = 'super_admin'
      AND admin_users.is_active = true
    )
  );
CREATE POLICY "Super admins can update digital heirs"
  ON digital_heirs FOR UPDATE
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
CREATE POLICY "Super admins can delete digital heirs"
  ON digital_heirs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.role = 'super_admin'
      AND admin_users.is_active = true
    )
  );

-- financial_transactions: Consolidate admin SELECT policies
DROP POLICY IF EXISTS "Admins can read financial transactions" ON financial_transactions;
DROP POLICY IF EXISTS "Super admins can manage financial transactions" ON financial_transactions;
CREATE POLICY "Admins can view financial transactions"
  ON financial_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.is_active = true
    )
  );
CREATE POLICY "Super admins can modify financial transactions"
  ON financial_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.role = 'super_admin'
      AND admin_users.is_active = true
    )
  );
CREATE POLICY "Super admins can update financial transactions"
  ON financial_transactions FOR UPDATE
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
CREATE POLICY "Super admins can delete financial transactions"
  ON financial_transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.role = 'super_admin'
      AND admin_users.is_active = true
    )
  );

-- gesture_prices: Consolidate public SELECT policies
DROP POLICY IF EXISTS "Anyone can read active gesture prices" ON gesture_prices;
DROP POLICY IF EXISTS "Anyone can read gesture prices" ON gesture_prices;
DROP POLICY IF EXISTS "Super admins can manage gesture prices" ON gesture_prices;
CREATE POLICY "Public can view gesture prices"
  ON gesture_prices FOR SELECT
  TO public
  USING (is_active = true);
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

-- incidents: Consolidate admin policies
DROP POLICY IF EXISTS "Admins can read incidents" ON incidents;
DROP POLICY IF EXISTS "Admins can manage incidents" ON incidents;
CREATE POLICY "Admins can manage all incidents"
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

-- notifications: Consolidate SELECT policies
DROP POLICY IF EXISTS "Anonymous users can view notifications by email" ON notifications;
DROP POLICY IF EXISTS "Enable read access via RPC only" ON notifications;
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  TO authenticated, anon
  USING (
    (recipient_user_id IS NOT NULL AND (select auth.uid()) = recipient_user_id) OR
    (recipient_email IS NOT NULL AND recipient_email IN (SELECT email FROM auth.users WHERE id = (select auth.uid())))
  );

-- notifications: Consolidate UPDATE policies
DROP POLICY IF EXISTS "Enable update access via RPC only" ON notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = recipient_user_id OR 
    (recipient_email IN (SELECT email FROM auth.users WHERE id = (select auth.uid())))
  )
  WITH CHECK (
    (select auth.uid()) = recipient_user_id OR 
    (recipient_email IN (SELECT email FROM auth.users WHERE id = (select auth.uid())))
  );

-- system_parameters: Consolidate all policies
DROP POLICY IF EXISTS "Anyone can read system parameters" ON system_parameters;
DROP POLICY IF EXISTS "Admins can read system parameters" ON system_parameters;
DROP POLICY IF EXISTS "Super admins can manage system parameters" ON system_parameters;
DROP POLICY IF EXISTS "Only super admins can modify through RPC" ON system_parameters;
CREATE POLICY "Public can view system parameters"
  ON system_parameters FOR SELECT
  TO public
  USING (true);
CREATE POLICY "Super admins can modify system parameters"
  ON system_parameters FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.role = 'super_admin'
      AND admin_users.is_active = true
    )
  );
CREATE POLICY "Super admins can update system parameters"
  ON system_parameters FOR UPDATE
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
CREATE POLICY "Super admins can delete system parameters"
  ON system_parameters FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = (select auth.uid())
      AND admin_users.role = 'super_admin'
      AND admin_users.is_active = true
    )
  );
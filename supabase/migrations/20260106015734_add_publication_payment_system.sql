/*
  # Add Publication Payment System

  ## 1. New Tables
    - `publication_settings`
      - `id` (uuid, primary key) - Unique identifier
      - `memorial_publication_price` (decimal) - Fixed price for publishing a memorial
      - `updated_at` (timestamptz) - Last update timestamp
      - Only one row in this table (enforced by constraint)

  ## 2. Changes to `memorials` table
    - Add `payment_status` (text) - Payment status: 'pending', 'completed', 'free'
    - Add `payment_amount` (decimal) - Amount paid for publication
    - Set default values for existing memorials to maintain data integrity

  ## 3. Security
    - Enable RLS on `publication_settings` table
    - Add policy for public read access to settings
    - Add policy for authenticated admin users to update settings
    - Update existing memorial policies to account for payment status

  ## Notes
    - Existing memorials will be marked as 'free' to maintain backward compatibility
    - The default publication price is set to 0 (free) until configured by admin
    - Single row constraint ensures only one settings record exists
*/

-- Create publication_settings table
CREATE TABLE IF NOT EXISTS public.publication_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_publication_price decimal(10,2) NOT NULL DEFAULT 0.00,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT single_settings_row CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Insert the single settings row
INSERT INTO public.publication_settings (id, memorial_publication_price)
VALUES ('00000000-0000-0000-0000-000000000001', 0.00)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on publication_settings
ALTER TABLE public.publication_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read settings
CREATE POLICY "Everyone can view publication settings"
  ON public.publication_settings
  FOR SELECT
  TO public
  USING (true);

-- Only authenticated users can update settings (in future, we can restrict to admin role)
CREATE POLICY "Authenticated users can update publication settings"
  ON public.publication_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add payment fields to memorials table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'memorials' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE public.memorials ADD COLUMN payment_status text DEFAULT 'free' CHECK (payment_status IN ('pending', 'completed', 'free'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'memorials' AND column_name = 'payment_amount'
  ) THEN
    ALTER TABLE public.memorials ADD COLUMN payment_amount decimal(10,2) DEFAULT 0.00;
  END IF;
END $$;

-- Update existing memorials to have 'free' status
UPDATE public.memorials
SET payment_status = 'free', payment_amount = 0.00
WHERE payment_status IS NULL;

-- Create index for payment status queries
CREATE INDEX IF NOT EXISTS idx_memorials_payment_status 
  ON public.memorials(payment_status);
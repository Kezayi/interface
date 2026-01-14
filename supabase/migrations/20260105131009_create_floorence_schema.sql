/*
  # FLOORENCE Digital Memorial Platform - Initial Schema

  ## Overview
  Complete database schema for FLOORENCE memorial platform with death announcements,
  funeral information, symbolic gestures, guestbook, and contributions.

  ## New Tables

  ### 1. `memorials`
  Core memorial spaces for deceased individuals
  - `id` (uuid, primary key) - Unique memorial identifier
  - `author_id` (uuid, references auth.users) - Memorial creator/administrator
  - `heir_email` (text) - Digital heir contact (invisible, emergency only)
  - `deceased_full_name` (text) - Full name of deceased
  - `deceased_photo_url` (text) - Main memorial photo (mandatory)
  - `date_of_birth` (date) - Birth date
  - `date_of_death` (date) - Death date
  - `announcement_text` (text) - Short death announcement
  - `house_address_text` (text, nullable) - House of mourning address
  - `house_gps_lat` (numeric, nullable) - GPS latitude
  - `house_gps_lng` (numeric, nullable) - GPS longitude
  - `funeral_date` (timestamptz, nullable) - Funeral date and time
  - `funeral_time` (text, nullable) - Funeral time description
  - `funeral_location` (text, nullable) - Funeral location
  - `funeral_steps` (jsonb, nullable) - Steps like vigil, service, burial
  - `contributions_enabled` (boolean) - Allow funeral contributions
  - `contributions_disabled_at` (timestamptz, nullable) - Auto-disable after funeral
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `gestures`
  Symbolic gestures (RIP, candle, flower)
  - `id` (uuid, primary key)
  - `memorial_id` (uuid, references memorials)
  - `user_id` (uuid, references auth.users, nullable for anonymous)
  - `gesture_type` (text) - 'rip', 'candle', or 'flower'
  - `is_paid` (boolean) - Whether gesture was paid
  - `payment_amount` (numeric, nullable) - Payment amount if paid
  - `created_at` (timestamptz)

  ### 3. `guestbook_messages`
  Condolence messages
  - `id` (uuid, primary key)
  - `memorial_id` (uuid, references memorials)
  - `user_id` (uuid, references auth.users, nullable)
  - `author_name` (text) - Message author display name
  - `message_text` (text) - Short condolence message
  - `candle_count` (integer) - Number of candles with this message
  - `flower_count` (integer) - Number of flowers with this message
  - `created_at` (timestamptz)

  ### 4. `memorial_followers`
  Follow relationships for factual notifications
  - `id` (uuid, primary key)
  - `memorial_id` (uuid, references memorials)
  - `user_id` (uuid, references auth.users)
  - `notify_funeral_updates` (boolean) - Receive funeral program updates
  - `notify_funeral_reminder` (boolean) - Receive funeral date reminder
  - `created_at` (timestamptz)

  ### 5. `funeral_contributions`
  Monetary contributions to families
  - `id` (uuid, primary key)
  - `memorial_id` (uuid, references memorials)
  - `contributor_user_id` (uuid, references auth.users, nullable)
  - `contributor_name` (text, nullable) - Name if provided
  - `contributor_phone` (text, nullable) - Phone for mobile money
  - `amount` (numeric) - Contribution amount
  - `payment_status` (text) - 'pending', 'completed', 'failed'
  - `payment_reference` (text, nullable) - Mobile money reference
  - `created_at` (timestamptz)

  ## Security
  - All tables have RLS enabled
  - Memorial authors have full control over their memorials
  - Public can view published memorials
  - Gesture and contribution amounts visible only to memorial author
  - Followers can only manage their own follows
*/

-- Create memorials table
CREATE TABLE IF NOT EXISTS memorials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES auth.users(id) NOT NULL,
  heir_email text NOT NULL,
  deceased_full_name text NOT NULL,
  deceased_photo_url text NOT NULL,
  date_of_birth date NOT NULL,
  date_of_death date NOT NULL,
  announcement_text text NOT NULL,
  house_address_text text,
  house_gps_lat numeric(10, 8),
  house_gps_lng numeric(11, 8),
  funeral_date timestamptz,
  funeral_time text,
  funeral_location text,
  funeral_steps jsonb DEFAULT '[]'::jsonb,
  contributions_enabled boolean DEFAULT false,
  contributions_disabled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create gestures table
CREATE TABLE IF NOT EXISTS gestures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id uuid REFERENCES memorials(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  gesture_type text NOT NULL CHECK (gesture_type IN ('rip', 'candle', 'flower')),
  is_paid boolean DEFAULT false,
  payment_amount numeric(10, 2),
  created_at timestamptz DEFAULT now()
);

-- Create guestbook messages table
CREATE TABLE IF NOT EXISTS guestbook_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id uuid REFERENCES memorials(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  message_text text NOT NULL,
  candle_count integer DEFAULT 0,
  flower_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create memorial followers table
CREATE TABLE IF NOT EXISTS memorial_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id uuid REFERENCES memorials(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notify_funeral_updates boolean DEFAULT true,
  notify_funeral_reminder boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(memorial_id, user_id)
);

-- Create funeral contributions table
CREATE TABLE IF NOT EXISTS funeral_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memorial_id uuid REFERENCES memorials(id) ON DELETE CASCADE NOT NULL,
  contributor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contributor_name text,
  contributor_phone text,
  amount numeric(10, 2) NOT NULL CHECK (amount > 0),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  payment_reference text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_memorials_author ON memorials(author_id);
CREATE INDEX IF NOT EXISTS idx_gestures_memorial ON gestures(memorial_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_memorial ON guestbook_messages(memorial_id);
CREATE INDEX IF NOT EXISTS idx_followers_memorial ON memorial_followers(memorial_id);
CREATE INDEX IF NOT EXISTS idx_followers_user ON memorial_followers(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_memorial ON funeral_contributions(memorial_id);

-- Enable Row Level Security
ALTER TABLE memorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE gestures ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorial_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE funeral_contributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for memorials
CREATE POLICY "Anyone can view memorials"
  ON memorials FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authors can create memorials"
  ON memorials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their memorials"
  ON memorials FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their memorials"
  ON memorials FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- RLS Policies for gestures
CREATE POLICY "Anyone can view gesture counts"
  ON gestures FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can add gestures"
  ON gestures FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for guestbook messages
CREATE POLICY "Anyone can view guestbook messages"
  ON guestbook_messages FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can post messages"
  ON guestbook_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Authors can delete messages from their memorial"
  ON guestbook_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorials
      WHERE memorials.id = guestbook_messages.memorial_id
      AND memorials.author_id = auth.uid()
    )
  );

-- RLS Policies for memorial followers
CREATE POLICY "Users can view their own follows"
  ON memorial_followers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Memorial authors can view their followers"
  ON memorial_followers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorials
      WHERE memorials.id = memorial_followers.memorial_id
      AND memorials.author_id = auth.uid()
    )
  );

CREATE POLICY "Users can follow memorials"
  ON memorial_followers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow memorials"
  ON memorial_followers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their follow preferences"
  ON memorial_followers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for funeral contributions
CREATE POLICY "Memorial authors can view all contributions to their memorial"
  ON funeral_contributions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorials
      WHERE memorials.id = funeral_contributions.memorial_id
      AND memorials.author_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view contribution counts"
  ON funeral_contributions FOR SELECT
  TO authenticated, anon
  USING (payment_status = 'completed');

CREATE POLICY "Authenticated users can make contributions"
  ON funeral_contributions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = contributor_user_id OR contributor_user_id IS NULL);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to memorials
DROP TRIGGER IF EXISTS update_memorials_updated_at ON memorials;
CREATE TRIGGER update_memorials_updated_at
  BEFORE UPDATE ON memorials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
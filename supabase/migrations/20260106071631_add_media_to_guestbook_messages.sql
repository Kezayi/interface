/*
  # Add Media Support to Guestbook Messages
  
  ## Changes to `guestbook_messages` table
    - Add `media_url` (text, optional) - URL to uploaded photo or video
    - Add `media_type` (text, optional) - Type of media: 'photo' or 'video'
  
  ## Storage
    - Create `guestbook-media` storage bucket for photos and videos
    - Configure bucket policies for public read access
    - Allow authenticated and anonymous users to upload
  
  ## Security
    - Public read access for all media
    - Upload restricted to reasonable file sizes
    - File types limited to images and videos
*/

-- Add media fields to guestbook_messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guestbook_messages' AND column_name = 'media_url'
  ) THEN
    ALTER TABLE public.guestbook_messages ADD COLUMN media_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guestbook_messages' AND column_name = 'media_type'
  ) THEN
    ALTER TABLE public.guestbook_messages ADD COLUMN media_type text CHECK (media_type IN ('photo', 'video'));
  END IF;
END $$;

-- Create storage bucket for guestbook media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'guestbook-media',
  'guestbook-media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to guestbook media
DROP POLICY IF EXISTS "Public can view guestbook media" ON storage.objects;
CREATE POLICY "Public can view guestbook media"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'guestbook-media');

-- Allow anyone to upload guestbook media
DROP POLICY IF EXISTS "Anyone can upload guestbook media" ON storage.objects;
CREATE POLICY "Anyone can upload guestbook media"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'guestbook-media');

-- Allow users to delete their own uploads
DROP POLICY IF EXISTS "Authenticated users can delete own guestbook media" ON storage.objects;
CREATE POLICY "Authenticated users can delete own guestbook media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'guestbook-media' AND auth.uid()::text = (storage.foldername(name))[1]);
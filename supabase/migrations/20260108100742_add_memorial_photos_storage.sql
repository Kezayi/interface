/*
  # Add Storage for Memorial Photos

  1. Storage Configuration
    - Create `memorial-photos` bucket for storing memorial photos
    - Set bucket to public for easy access
    - Enable RLS policies for upload/delete operations
    
  2. Security
    - Allow public read access to memorial photos
    - Allow authenticated users to upload photos
    - Allow authors to delete their memorial photos
    
  This migration fixes the performance issue caused by storing large base64 images in the database.
*/

-- Create memorial-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'memorial-photos',
  'memorial-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can view memorial photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload memorial photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own memorial photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own memorial photos" ON storage.objects;

-- Allow public read access to memorial photos
CREATE POLICY "Public can view memorial photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'memorial-photos');

-- Allow authenticated users to upload memorial photos
CREATE POLICY "Authenticated users can upload memorial photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'memorial-photos');

-- Allow users to update their own memorial photos
CREATE POLICY "Users can update their own memorial photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'memorial-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own memorial photos
CREATE POLICY "Users can delete their own memorial photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'memorial-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
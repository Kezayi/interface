/*
  # Add HEIF/HEIC Support to Storage Bucket
  
  ## Changes
    - Update `guestbook-media` bucket to support additional image formats
    - Add HEIF/HEIC formats commonly used by modern Android phones
    - Add additional video formats for better compatibility
  
  ## New MIME Types
    - image/heif - High Efficiency Image Format
    - image/heic - High Efficiency Image Container
    - image/jpg - Alternative JPEG MIME type
    - video/3gpp - 3GP video format (some Android phones)
    - video/x-msvideo - AVI format
  
  ## Notes
    - These formats are commonly used by Samsung and other Android devices
    - This should resolve upload issues from mobile devices
*/

-- Update the allowed MIME types for the guestbook-media bucket
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heif',
  'image/heic',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/3gpp',
  'video/x-msvideo'
]
WHERE id = 'guestbook-media';
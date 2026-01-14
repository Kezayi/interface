/*
  # Update Media Support for Multiple Files
  
  ## Changes to `guestbook_messages` table
    - Remove `media_url` and `media_type` columns
    - Add `media_items` (jsonb) - Array of media objects with url and type
    - Each message can have up to 3 photos and 1 video
  
  ## Structure of media_items
    [
      { "url": "https://...", "type": "photo" },
      { "url": "https://...", "type": "video" }
    ]
*/

-- Remove old media columns and add new media_items column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guestbook_messages' AND column_name = 'media_url'
  ) THEN
    ALTER TABLE public.guestbook_messages DROP COLUMN media_url;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guestbook_messages' AND column_name = 'media_type'
  ) THEN
    ALTER TABLE public.guestbook_messages DROP COLUMN media_type;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guestbook_messages' AND column_name = 'media_items'
  ) THEN
    ALTER TABLE public.guestbook_messages ADD COLUMN media_items jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
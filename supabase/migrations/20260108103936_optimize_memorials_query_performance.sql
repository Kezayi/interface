/*
  # Optimize Memorials Query Performance

  ## 1. Performance Optimizations
    - Add composite index on `is_published` and `created_at` for fast filtering and sorting
    - This index specifically optimizes the homepage query that loads published memorials
    - The DESC ordering on created_at matches the query pattern

  ## 2. Benefits
    - Dramatically faster query execution for loading published memorials
    - Reduced database load
    - Better user experience on homepage

  ## Notes
    - Index created with IF NOT EXISTS to be idempotent
    - Covers the most common query pattern: WHERE is_published = true ORDER BY created_at DESC
*/

-- Create composite index for published memorials ordered by creation date
-- This optimizes the main homepage query
CREATE INDEX IF NOT EXISTS idx_memorials_published_created 
  ON public.memorials(is_published, created_at DESC)
  WHERE is_published = true;

-- Add index on created_at for general date sorting
CREATE INDEX IF NOT EXISTS idx_memorials_created_at 
  ON public.memorials(created_at DESC);

-- Add index on author_id if not exists (for author queries)
CREATE INDEX IF NOT EXISTS idx_memorials_author_id 
  ON public.memorials(author_id);

-- Analyze the table to update statistics for query planner
ANALYZE public.memorials;
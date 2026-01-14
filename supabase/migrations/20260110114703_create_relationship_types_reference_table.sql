/*
  # Create Relationship Types Reference Table

  ## Purpose
  Create a centralized reference table for managing relationship types between memorial authors and deceased persons.
  This enables:
  - Systematic relationship classification
  - Reciprocal relationship inference (if A is uncle of B, then B is nephew/niece of A)
  - Statistical analysis and grouping by relationship categories
  - Dynamic frontend loading of relationship options
  - Easy system evolution and multilingual support

  ## New Tables
  
  ### `relationship_types`
  Master table containing all possible relationship types with their metadata:
  - `id` (bigserial, primary key) - Unique identifier
  - `code` (text, unique) - Machine-readable code for the relationship (e.g., 'father', 'uncle')
  - `label_fr` (text) - French display label (e.g., 'Père', 'Oncle')
  - `category` (text) - Category grouping: 'family', 'in_law', 'social', 'professional'
  - `gender` (text) - Gender specification: 'male', 'female', 'neutral'
  - `reciprocal_code` (text, nullable) - Code of the reciprocal relationship
  - `description` (text) - Additional context about the relationship
  - `display_order` (integer) - Order for display in UI (within category)
  - `is_active` (boolean) - Whether this relationship type is currently available
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record update timestamp

  ## Security
  - Enable RLS on relationship_types
  - Allow public read access (needed for form display)
  - Restrict write access to authenticated admin users only

  ## Indexes
  - Primary key on id
  - Unique index on code
  - Index on category for efficient category-based queries
  - Index on is_active for filtering active relationships

  ## Notes
  - Reciprocal relationships are defined by referencing codes (not IDs) to maintain clarity
  - This structure supports future extensions like multi-language labels
  - The system can infer family trees by following reciprocal relationships
*/

-- Create relationship_types table
CREATE TABLE IF NOT EXISTS relationship_types (
  id bigserial PRIMARY KEY,
  code text UNIQUE NOT NULL,
  label_fr text NOT NULL,
  category text NOT NULL CHECK (category IN ('family', 'in_law', 'social', 'professional')),
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'neutral')),
  reciprocal_code text,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_relationship_types_category ON relationship_types(category);
CREATE INDEX IF NOT EXISTS idx_relationship_types_active ON relationship_types(is_active);
CREATE INDEX IF NOT EXISTS idx_relationship_types_display_order ON relationship_types(display_order);

-- Enable RLS
ALTER TABLE relationship_types ENABLE ROW LEVEL SECURITY;

-- Allow public read access for form display
CREATE POLICY "Anyone can view active relationship types"
  ON relationship_types
  FOR SELECT
  USING (is_active = true);

-- Restrict write access to admin users only
CREATE POLICY "Only admins can manage relationship types"
  ON relationship_types
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Add foreign key constraint for reciprocal relationships
ALTER TABLE relationship_types
  ADD CONSTRAINT fk_reciprocal_code
  FOREIGN KEY (reciprocal_code)
  REFERENCES relationship_types(code)
  DEFERRABLE INITIALLY DEFERRED;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_relationship_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_relationship_types_updated_at_trigger ON relationship_types;
CREATE TRIGGER update_relationship_types_updated_at_trigger
  BEFORE UPDATE ON relationship_types
  FOR EACH ROW
  EXECUTE FUNCTION update_relationship_types_updated_at();

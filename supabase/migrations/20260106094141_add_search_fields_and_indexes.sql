/*
  # Ajout de champs et index pour la recherche

  1. Objectif
    - Ajouter les champs nécessaires pour la recherche et publication
    - Optimiser les recherches sur le nom du défunt
    - Permettre des recherches multi-critères rapides
    - Ajouter un index de recherche full-text

  2. Nouvelles colonnes
    - is_published: Indique si le mémorial est publié et visible dans les recherches
    - location: Lieu associé au défunt (ville, pays)
    - short_bio: Courte biographie pour affichage dans les résultats

  3. Index de recherche
    - Index sur deceased_full_name pour les recherches ILIKE
    - Index sur date_of_birth et date_of_death pour les filtres par année
    - Index sur location pour les recherches géographiques
    - Extension pg_trgm pour la recherche floue

  4. Valeurs par défaut
    - is_published = true par défaut (rétrocompatibilité)
    - location et short_bio peuvent être NULL
*/

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memorials' AND column_name = 'is_published') THEN
    ALTER TABLE memorials ADD COLUMN is_published boolean DEFAULT true NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memorials' AND column_name = 'location') THEN
    ALTER TABLE memorials ADD COLUMN location text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'memorials' AND column_name = 'short_bio') THEN
    ALTER TABLE memorials ADD COLUMN short_bio text;
  END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_memorials_deceased_name_trgm 
  ON memorials USING gin (deceased_full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_memorials_deceased_name_lower 
  ON memorials (LOWER(deceased_full_name));

CREATE INDEX IF NOT EXISTS idx_memorials_birth_date 
  ON memorials (date_of_birth) 
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_memorials_death_date 
  ON memorials (date_of_death) 
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_memorials_location_trgm 
  ON memorials USING gin (location gin_trgm_ops) 
  WHERE location IS NOT NULL AND is_published = true;

CREATE INDEX IF NOT EXISTS idx_memorials_published_created 
  ON memorials (is_published, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memorials_search_composite 
  ON memorials (deceased_full_name, date_of_birth, date_of_death, location) 
  WHERE is_published = true;
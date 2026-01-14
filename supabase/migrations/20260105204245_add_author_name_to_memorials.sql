/*
  # Ajout du nom de l'auteur aux mémoriaux

  ## Changements

  ### 1. Table `memorials`
  - Ajout de `author_name` (text) - Nom public de l'auteur de l'avis de décès

  ## Notes importantes
  - Ce champ permet d'afficher publiquement qui a publié l'avis de décès
  - Le nom peut être différent du nom d'utilisateur
*/

-- Ajouter le champ author_name à la table memorials
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'memorials' AND column_name = 'author_name'
  ) THEN
    ALTER TABLE memorials ADD COLUMN author_name text;
  END IF;
END $$;

-- Mettre à jour les mémoriaux existants avec un nom par défaut
UPDATE memorials 
SET author_name = 'Auteur inconnu' 
WHERE author_name IS NULL;

-- Rendre le champ NOT NULL après avoir mis à jour les données existantes
ALTER TABLE memorials ALTER COLUMN author_name SET NOT NULL;

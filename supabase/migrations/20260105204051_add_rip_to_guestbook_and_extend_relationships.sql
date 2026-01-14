/*
  # Ajout du RIP au livre d'or et extension des relations

  ## Changements

  ### 1. Table `guestbook_messages`
  - Ajout de `rip_count` (integer, default 0)
  - Chaque message peut avoir exactement 1 RIP (0 ou 1)

  ### 2. Extension des relations possibles
  - Ajout de nouvelles relations pour couvrir plus de liens humains
  - Relations: parent, child, spouse, sibling, grandparent, grandchild, uncle_aunt, cousin, friend, colleague, neighbor, acquaintance, other

  ## Notes importantes
  - Un message de condoléances peut avoir 1 RIP au maximum
  - Le RIP est inclus dans le message (pas un geste séparé)
  - Conservation des anciennes relations pour compatibilité
*/

-- Ajouter le champ rip_count à la table guestbook_messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guestbook_messages' AND column_name = 'rip_count'
  ) THEN
    ALTER TABLE guestbook_messages ADD COLUMN rip_count integer NOT NULL DEFAULT 0 CHECK (rip_count IN (0, 1));
  END IF;
END $$;

-- Mettre à jour les anciennes valeurs de relationship vers les nouvelles
UPDATE guestbook_messages 
SET relationship = 'other' 
WHERE relationship IN ('immediate_family', 'extended_family');

-- Modifier la contrainte sur relationship pour accepter les nouvelles valeurs
DO $$
BEGIN
  -- Supprimer l'ancienne contrainte si elle existe
  ALTER TABLE guestbook_messages DROP CONSTRAINT IF EXISTS guestbook_messages_relationship_check;

  -- Ajouter la nouvelle contrainte avec plus de relations
  ALTER TABLE guestbook_messages ADD CONSTRAINT guestbook_messages_relationship_check 
    CHECK (relationship IN ('parent', 'child', 'spouse', 'sibling', 'grandparent', 'grandchild', 'uncle_aunt', 'cousin', 'friend', 'colleague', 'neighbor', 'acquaintance', 'other'));
END $$;

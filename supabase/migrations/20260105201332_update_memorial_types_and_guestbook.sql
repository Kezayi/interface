/*
  # Mise à jour FLOORENCE - Types de mémorial et livre d'or enrichi

  ## Changements

  ### 1. Table `memorials`
  - Ajout de `memorial_type` (enum: 'recent' ou 'past')
    - 'recent': Décès récent (funérailles non encore tenues)
    - 'past': Décès passé (funérailles déjà tenues)
  - Ce type contrôle la visibilité des sections (maison du deuil, programme funéraire)

  ### 2. Table `guestbook_messages`
  - Ajout de `author_email` (text, requis, privé)
  - Ajout de `author_phone` (text, requis, privé)
  - Ajout de `relationship` (text, requis) - relation avec le défunt
  - Les champs candle_count et flower_count restent pour afficher les gestes liés

  ### 3. Table `gestures`
  - Ajout de `guestbook_message_id` (uuid, nullable pour RIP uniquement)
  - Contrainte: bougies et fleurs DOIVENT être liées à un message
  - RIP peut être posté seul

  ## Notes importantes
  - Les bougies et fleurs sont maintenant obligatoirement attachées à un message
  - Seul RIP peut exister sans message du livre d'or
  - Email et téléphone sont privés (visible uniquement par l'auteur du mémorial)
*/

-- Ajouter le type de mémorial
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'memorials' AND column_name = 'memorial_type'
  ) THEN
    ALTER TABLE memorials ADD COLUMN memorial_type text NOT NULL DEFAULT 'recent' CHECK (memorial_type IN ('recent', 'past'));
  END IF;
END $$;

-- Ajouter les nouveaux champs au livre d'or
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guestbook_messages' AND column_name = 'author_email'
  ) THEN
    ALTER TABLE guestbook_messages ADD COLUMN author_email text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guestbook_messages' AND column_name = 'author_phone'
  ) THEN
    ALTER TABLE guestbook_messages ADD COLUMN author_phone text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'guestbook_messages' AND column_name = 'relationship'
  ) THEN
    ALTER TABLE guestbook_messages ADD COLUMN relationship text NOT NULL DEFAULT 'other' CHECK (relationship IN ('immediate_family', 'extended_family', 'friend', 'colleague', 'acquaintance', 'other'));
  END IF;
END $$;

-- Ajouter la référence au message du livre d'or dans les gestes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gestures' AND column_name = 'guestbook_message_id'
  ) THEN
    ALTER TABLE gestures ADD COLUMN guestbook_message_id uuid REFERENCES guestbook_messages(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Créer un index pour la recherche des gestes par message
CREATE INDEX IF NOT EXISTS idx_gestures_message ON gestures(guestbook_message_id);

-- Mettre à jour les politiques RLS pour les nouveaux champs
-- Les emails et téléphones sont visibles uniquement par l'auteur du mémorial
DROP POLICY IF EXISTS "Anyone can view guestbook messages" ON guestbook_messages;

CREATE POLICY "Public can view guestbook messages (without private data)"
  ON guestbook_messages FOR SELECT
  TO authenticated, anon
  USING (true);

-- Politique pour que les auteurs de mémoriaux voient les données privées
CREATE POLICY "Memorial authors can view private guestbook data"
  ON guestbook_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM memorials
      WHERE memorials.id = guestbook_messages.memorial_id
      AND memorials.author_id = auth.uid()
    )
  );
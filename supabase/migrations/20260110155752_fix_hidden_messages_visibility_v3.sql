/*
  # Empêcher l'affichage des messages masqués au FrontOffice

  1. Modifications des politiques RLS
    - Mise à jour de la politique de lecture des guestbook_messages pour exclure les messages masqués (is_hidden = true)
    - Les messages masqués ne seront visibles que par les admins

  2. Sécurité
    - Les messages masqués ne sont plus visibles au public
    - Seul le BackOffice (admins) peut voir les messages masqués
*/

-- Supprimer l'ancienne politique de lecture publique des messages
DROP POLICY IF EXISTS "Anyone can view guestbook messages" ON guestbook_messages;

-- Créer une nouvelle politique qui exclut les messages masqués pour le public
CREATE POLICY "Public can view non-hidden guestbook messages"
  ON guestbook_messages FOR SELECT
  TO authenticated, anon
  USING (is_hidden = false OR is_hidden IS NULL);

-- Créer une politique spécifique pour les admins qui peuvent tout voir
CREATE POLICY "Admins can view all guestbook messages including hidden"
  ON guestbook_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

/*
  # Nettoyer les anciennes politiques de gestes

  1. Supprimer les politiques obsolètes
    - Supprimer "Anonymous users can add gestures" (remplacée par la nouvelle politique)

  2. Résultat final
    - Une politique pour les RIP (gratuits, accessibles à tous)
    - Une politique pour les gestes payants (authentification requise)
*/

-- Supprimer l'ancienne politique pour les anonymes
DROP POLICY IF EXISTS "Anonymous users can add gestures" ON gestures;
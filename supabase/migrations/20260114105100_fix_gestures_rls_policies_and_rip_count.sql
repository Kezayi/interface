/*
  # Corriger les politiques RLS pour les gestes et le comptage des RIP

  1. Problème identifié
    - Les utilisateurs ne peuvent pas publier de messages avec des gestes (cierges/fleurs)
    - Les RIP ne sont pas comptabilisés correctement
    - Les politiques RLS "Authenticated users can add gestures" exige user_id = auth.uid()
      mais le code permet aux anonymes d'ajouter des gestes payants

  2. Solution
    - Supprimer les politiques restrictives actuelles
    - Créer des politiques plus permissives qui permettent:
      * RIP gratuits pour tous (authentifiés et anonymes)
      * Cierges et fleurs pour tous (pour permettre les paiements anonymes)
    - Les gestes sont liés au message de condoléances, donc sécurisés par cette relation

  3. Sécurité
    - Les gestes restent liés aux messages de condoléances
    - Les paiements seront vérifiés par le système de facturation
    - RLS maintenu pour la lecture (déjà sécurisé)
*/

-- Supprimer toutes les anciennes politiques d'insertion
DROP POLICY IF EXISTS "Anonymous users can add gestures" ON gestures;
DROP POLICY IF EXISTS "Authenticated users can add gestures" ON gestures;
DROP POLICY IF EXISTS "Users can add RIP gestures" ON gestures;
DROP POLICY IF EXISTS "Authenticated users can add paid gestures" ON gestures;

-- Créer une politique permissive pour les RIP (gratuits)
CREATE POLICY "Anyone can add RIP gestures"
  ON gestures FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    gesture_type = 'rip' 
    AND (is_paid = false OR is_paid IS NULL)
  );

-- Créer une politique permissive pour les gestes payants (cierges et fleurs)
-- Permet aux utilisateurs authentifiés ET anonymes d'ajouter des gestes payants
-- Le système de paiement vérifiera la validité du paiement séparément
CREATE POLICY "Anyone can add paid gestures"
  ON gestures FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    gesture_type IN ('candle', 'flower')
    AND guestbook_message_id IS NOT NULL
  );

-- Vérifier que la politique de lecture existe toujours
-- (devrait déjà exister mais on s'assure qu'elle est là)
DROP POLICY IF EXISTS "Anyone can view gesture counts" ON gestures;
CREATE POLICY "Anyone can view gesture counts"
  ON gestures FOR SELECT
  TO authenticated, anon
  USING (true);

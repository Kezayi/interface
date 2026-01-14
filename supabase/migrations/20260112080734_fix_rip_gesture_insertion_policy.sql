/*
  # Corriger les politiques RLS pour permettre l'insertion des gestes RIP

  1. Problème identifié
    - Les gestes RIP ne sont pas insérés correctement
    - La politique RLS "Authenticated users can add gestures" est trop restrictive
    - Elle vérifie user_id = auth.uid() mais les RIP peuvent être anonymes

  2. Solution
    - Modifier la politique pour permettre les RIP anonymes
    - Permettre aussi les RIP avec user_id NULL pour les utilisateurs connectés

  3. Sécurité
    - Les gestes restent sécurisés
    - Seuls les RIP peuvent être anonymes
    - Les cierges et fleurs restent payants et nécessitent une authentification
*/

-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Authenticated users can add gestures" ON gestures;

-- Créer une nouvelle politique plus permissive pour les RIP
CREATE POLICY "Users can add RIP gestures"
  ON gestures FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    gesture_type = 'rip' AND is_paid = false
  );

-- Créer une politique stricte pour les gestes payants
CREATE POLICY "Authenticated users can add paid gestures"
  ON gestures FOR INSERT
  TO authenticated
  WITH CHECK (
    gesture_type IN ('candle', 'flower') 
    AND is_paid = true 
    AND user_id = auth.uid()
  );
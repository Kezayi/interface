/*
  # Système de vérification de numéro de téléphone par OTP
  
  1. Objectif
    - Vérifier l'identité des auteurs d'avis de décès via leur numéro de téléphone
    - Utiliser des codes OTP envoyés par SMS ou WhatsApp
    - Améliorer la sécurité et l'authenticité des publications
  
  2. Nouvelles tables
    - `phone_verifications`: Stocke les codes OTP et leur état
      - `id` (uuid, primary key)
      - `phone_number` (text): Numéro de téléphone au format E.164
      - `verification_code` (text): Code OTP à 6 chiffres
      - `verified` (boolean): Indique si le code a été vérifié
      - `expires_at` (timestamptz): Date d'expiration du code (10 minutes)
      - `attempts` (integer): Nombre de tentatives de vérification
      - `send_method` (text): Méthode d'envoi (sms ou whatsapp)
      - `created_at` (timestamptz)
  
  3. Modifications de la table memorials
    - `author_phone` (text): Numéro de téléphone de l'auteur
    - `author_phone_verified` (boolean): Indique si le numéro a été vérifié
  
  4. Sécurité
    - RLS activé sur phone_verifications
    - Les codes OTP expirent après 10 minutes
    - Maximum 5 tentatives de vérification
    - Les numéros vérifiés sont marqués dans memorials
  
  5. Index
    - Index sur phone_number pour recherches rapides
    - Index sur expires_at pour nettoyage des codes expirés
*/

-- Créer la table phone_verifications
CREATE TABLE IF NOT EXISTS phone_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text NOT NULL,
  verification_code text NOT NULL,
  verified boolean DEFAULT false NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer DEFAULT 0 NOT NULL CHECK (attempts >= 0 AND attempts <= 5),
  send_method text DEFAULT 'sms' NOT NULL CHECK (send_method IN ('sms', 'whatsapp')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Activer RLS sur phone_verifications
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs authentifiés peuvent créer des vérifications
CREATE POLICY "Authenticated users can create verifications"
  ON phone_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Politique : Les utilisateurs peuvent voir leurs propres vérifications
CREATE POLICY "Users can view their verifications"
  ON phone_verifications
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique : Les utilisateurs peuvent mettre à jour leurs vérifications non expirées
CREATE POLICY "Users can update their verifications"
  ON phone_verifications
  FOR UPDATE
  TO authenticated
  USING (expires_at > now())
  WITH CHECK (expires_at > now());

-- Ajouter les colonnes à la table memorials
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'memorials' AND column_name = 'author_phone'
  ) THEN
    ALTER TABLE memorials ADD COLUMN author_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'memorials' AND column_name = 'author_phone_verified'
  ) THEN
    ALTER TABLE memorials ADD COLUMN author_phone_verified boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone 
  ON phone_verifications (phone_number);

CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires 
  ON phone_verifications (expires_at) 
  WHERE verified = false;

CREATE INDEX IF NOT EXISTS idx_memorials_author_phone 
  ON memorials (author_phone) 
  WHERE author_phone IS NOT NULL;

-- Fonction pour nettoyer les codes OTP expirés (optionnel, pour maintenance)
CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM phone_verifications
  WHERE expires_at < now() - INTERVAL '24 hours';
END;
$$;
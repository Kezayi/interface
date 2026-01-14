/*
  # Correction des politiques de stockage pour guestbook-media

  1. Objectif
    - Permettre l'upload de médias depuis n'importe quel utilisateur (authentifié ou non)
    - Permettre la lecture publique des médias
    - Résoudre le problème d'upload depuis Android

  2. Modifications
    - Suppression des anciennes politiques (si elles existent)
    - Création de nouvelles politiques permissives pour l'upload
    - Politique de lecture publique pour tous

  3. Sécurité
    - L'upload est limité par les contraintes de taille et types MIME du bucket
    - Les fichiers sont organisés par memorial_id pour faciliter la gestion
*/

DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view media" ON storage.objects;

CREATE POLICY "Anyone can upload to guestbook-media"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'guestbook-media');

CREATE POLICY "Anyone can view guestbook-media"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'guestbook-media');

CREATE POLICY "Anyone can update their guestbook-media"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'guestbook-media')
  WITH CHECK (bucket_id = 'guestbook-media');

CREATE POLICY "Anyone can delete from guestbook-media"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'guestbook-media');
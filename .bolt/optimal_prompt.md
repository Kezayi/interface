# Prompt Optimal - Résolution Authentification Admin

## Contexte
Application React + Supabase avec système d'authentification administrateur. Un compte admin existe dans `auth.users` et `admin_users` mais l'authentification échoue avec l'erreur "Compte administrateur introuvable ou inactif".

## Problème Observé
- Email: admin@floorence.com (ID: 9b86b05e-6396-41a0-9ad5-5872ee881471)
- Le compte existe et `is_active = true` dans la table `admin_users`
- La fonction `get_current_admin_profile()` retourne un tableau vide lors de l'authentification
- L'erreur se produit dans `AdminAuthContext.tsx` ligne 125-127 après `signInWithPassword`

## Diagnostic Requis
1. Vérifier que la table `admin_users` possède toutes les colonnes requises par `get_current_admin_profile()`:
   - id, email, full_name, role, is_active
   - last_login_at, created_at, created_by (possiblement manquantes)

2. Vérifier que la fonction `get_current_admin_profile()` :
   - Utilise le bon type de données pour `role` (text vs enum admin_role)
   - A le bon signature de retour
   - N'a pas de problème de permissions

3. Vérifier les politiques RLS sur `admin_users`:
   - Chercher des récursions (politiques qui interrogent `admin_users` pour vérifier l'accès à `admin_users`)
   - Les politiques doivent utiliser `id = auth.uid()` directement sans sous-requêtes récursives

## Solution Attendue
1. Ajouter les colonnes manquantes à `admin_users` si nécessaire
2. Corriger la fonction `get_current_admin_profile()` pour utiliser `text` au lieu de `admin_role`
3. Remplacer les politiques RLS récursives par des politiques simples:
   ```sql
   -- Lecture du profil personnel
   USING (id = auth.uid())

   -- Mise à jour du profil personnel
   USING (id = auth.uid()) WITH CHECK (id = auth.uid())
   ```
4. Tester la connexion avec admin@floorence.com

## Résultat Final
Le compte admin doit pouvoir se connecter au BackOffice sans erreur.

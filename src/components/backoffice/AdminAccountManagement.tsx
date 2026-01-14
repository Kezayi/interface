import { useState, useEffect } from 'react';
import { User, Mail, Shield, Calendar, Key, Save } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { supabaseShim as supabase } from '../../lib/supabaseShim';

export function AdminAccountManagement() {
  const { admin, logAction } = useAdminAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (admin) {
      setFullName(admin.full_name);
    }
  }, [admin]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!admin) return;

      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ full_name: fullName })
        .eq('id', admin.id);

      if (updateError) throw updateError;

      await logAction(
        'ADMIN_PROFILE_UPDATE',
        'admin_users',
        admin.id,
        { full_name: fullName },
        'Mise à jour du profil administrateur'
      );

      setSuccess('Profil mis à jour avec succès');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);

    try {
      if (!admin) return;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: admin.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Mot de passe actuel incorrect');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      await logAction(
        'ADMIN_PASSWORD_CHANGE',
        'admin_users',
        admin.id,
        {},
        'Changement de mot de passe'
      );

      setSuccess('Mot de passe changé avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  if (!admin) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-light text-gray-900 mb-2">Mon compte administrateur</h2>
        <p className="text-sm text-gray-600">
          Gérez vos informations personnelles et vos paramètres de sécurité
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Informations du profil</h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              Modifier
            </button>
          )}
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </div>
            </label>
            <input
              type="email"
              value={admin.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              L'email ne peut pas être modifié
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nom complet
              </div>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={!isEditing}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Rôle
              </div>
            </label>
            <input
              type="text"
              value={admin.role === 'super_admin' ? 'Super Administrateur' : 'Administrateur Support'}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Membre depuis
              </div>
            </label>
            <input
              type="text"
              value={new Date(admin.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          {isEditing && (
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFullName(admin.full_name);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Changer le mot de passe
          </div>
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe actuel
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 8 caractères
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <Key className="w-4 h-4" />
            Changer le mot de passe
          </button>
        </form>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Sécurité</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Toutes les modifications sont enregistrées dans le journal d'audit</li>
          <li>• Utilisez un mot de passe fort et unique</li>
          <li>• Ne partagez jamais vos identifiants</li>
        </ul>
      </div>
    </div>
  );
}

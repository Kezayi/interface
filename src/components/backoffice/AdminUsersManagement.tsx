import { useState, useEffect } from 'react';
import { Plus, Shield, Mail, User, Calendar, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { supabaseShim as supabase } from '../../lib/supabaseShim';
import { Admin } from '../../lib/backoffice-types';

export function AdminUsersManagement() {
  const { admin, logAction } = useAdminAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'super_admin' | 'support_admin'>('support_admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_all_admin_profiles');

      if (error) throw error;

      setAdmins(data || []);
    } catch (err: any) {
      console.error('Error loading admins:', err);
      setError('Erreur lors du chargement des administrateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setCreating(true);

    try {
      if (!admin) return;

      const { data: userId, error: createError } = await supabase.rpc('create_admin_user', {
        p_email: email,
        p_password: password,
        p_full_name: fullName,
        p_role: role,
      });

      if (createError) throw createError;

      if (userId) {
        await logAction(
          'ADMIN_USER_CREATE',
          'admin_users',
          userId,
          { email, full_name: fullName, role },
          `Création d'un nouvel administrateur: ${email}`
        );

        setSuccess(`Administrateur ${email} créé avec succès`);
        setEmail('');
        setFullName('');
        setPassword('');
        setConfirmPassword('');
        setRole('support_admin');
        setShowCreateForm(false);
        loadAdmins();
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de l\'administrateur');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (adminId: string, currentStatus: boolean) => {
    if (!admin) return;

    try {
      const targetAdmin = admins.find(a => a.id === adminId);
      if (!targetAdmin) return;

      const { error: updateError } = await supabase.rpc('update_admin_user', {
        p_admin_id: adminId,
        p_full_name: targetAdmin.full_name,
        p_role: targetAdmin.role,
        p_is_active: !currentStatus,
      });

      if (updateError) throw updateError;

      await logAction(
        'ADMIN_USER_STATUS_CHANGE',
        'admin_users',
        adminId,
        { is_active: !currentStatus },
        `${!currentStatus ? 'Activation' : 'Désactivation'} du compte administrateur`
      );

      setSuccess(`Compte ${!currentStatus ? 'activé' : 'désactivé'} avec succès`);
      loadAdmins();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la modification du statut');
    }
  };

  if (!admin || admin.role !== 'super_admin') {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Accès réservé aux Super Administrateurs</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-gray-900 mb-2">Gestion des administrateurs</h2>
          <p className="text-sm text-gray-600">
            Créez et gérez les comptes administrateurs
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvel administrateur
        </button>
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

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Créer un nouvel administrateur</h3>
          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@floorence.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                  />
                  <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jean Dupont"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                  />
                  <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle
                </label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'super_admin' | 'support_admin')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent appearance-none"
                    required
                  >
                    <option value="support_admin">Administrateur Support</option>
                    <option value="super_admin">Super Administrateur</option>
                  </select>
                  <Shield className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Support: accès limité aux fonctions de modération
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {creating ? 'Création...' : 'Créer l\'administrateur'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Administrateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière connexion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créé le
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins.map((adminUser) => (
                  <tr key={adminUser.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{adminUser.full_name}</div>
                        <div className="text-sm text-gray-500">{adminUser.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        adminUser.role === 'super_admin'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {adminUser.role === 'super_admin' ? 'Super Admin' : 'Support'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {adminUser.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" />
                          Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3" />
                          Inactif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {adminUser.last_login_at
                        ? new Date(adminUser.last_login_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Jamais'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(adminUser.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {adminUser.id !== admin.id && (
                        <button
                          onClick={() => handleToggleActive(adminUser.id, adminUser.is_active)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                            adminUser.is_active
                              ? 'text-red-700 hover:bg-red-50'
                              : 'text-green-700 hover:bg-green-50'
                          }`}
                        >
                          {adminUser.is_active ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              Désactiver
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              Activer
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Rôles et permissions</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• <strong>Super Administrateur</strong>: Accès complet à toutes les fonctionnalités</li>
          <li>• <strong>Administrateur Support</strong>: Accès limité aux fonctions de modération et support</li>
          <li>• Les comptes désactivés ne peuvent plus se connecter</li>
          <li>• Toutes les actions sont tracées dans le journal d'audit</li>
        </ul>
      </div>
    </div>
  );
}

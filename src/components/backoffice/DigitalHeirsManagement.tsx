import { useEffect, useState } from 'react';
import { Users, CheckCircle, Clock } from 'lucide-react';
import { supabaseShim as supabase } from '../../lib/supabaseShim';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { DigitalHeir } from '../../lib/backoffice-types';

export function DigitalHeirsManagement() {
  const { admin, logAction } = useAdminAuth();
  const [heirs, setHeirs] = useState<DigitalHeir[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHeir, setSelectedHeir] = useState<DigitalHeir | null>(null);
  const [activationNote, setActivationNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadHeirs();
  }, []);

  const loadHeirs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('digital_heirs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHeirs(data || []);
    } catch (error) {
      console.error('Error loading heirs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateHeir = async () => {
    if (!selectedHeir || !activationNote.trim()) {
      alert('Veuillez fournir une note d\'activation obligatoire');
      return;
    }

    if (!confirm('Confirmer l\'activation de cet héritier numérique ?')) {
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('digital_heirs')
        .update({
          status: 'active',
          activation_note: activationNote,
          activated_by: admin?.id,
          activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedHeir.id);

      if (error) throw error;

      await logAction(
        'HEIR_ACTIVATED',
        'digital_heir',
        selectedHeir.id,
        {
          heir_name: selectedHeir.heir_name,
          heir_email: selectedHeir.heir_email,
          memorial_id: selectedHeir.memorial_id,
        },
        activationNote
      );

      alert('Héritier numérique activé avec succès');
      setActivationNote('');
      setSelectedHeir(null);
      loadHeirs();
    } catch (error) {
      console.error('Error activating heir:', error);
      alert('Erreur lors de l\'activation');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'pending_activation':
        return 'bg-yellow-100 text-yellow-700';
      case 'inactive':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending_activation':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Actif',
      pending_activation: 'En attente d\'activation',
      inactive: 'Inactif',
    };
    return labels[status] || status;
  };

  if (selectedHeir) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setSelectedHeir(null);
            setActivationNote('');
          }}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Retour à la liste
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-medium text-gray-900 mb-2">{selectedHeir.heir_name}</h2>
            <p className="text-sm text-gray-600">{selectedHeir.heir_email}</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getStatusColor(selectedHeir.status)}`}>
                  {getStatusIcon(selectedHeir.status)}
                  {getStatusLabel(selectedHeir.status)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                <p className="text-gray-900">{selectedHeir.relationship || 'Non spécifiée'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <p className="text-gray-900">{selectedHeir.heir_phone || 'Non spécifié'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Créé le</label>
                <p className="text-gray-900">{new Date(selectedHeir.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>

            {selectedHeir.activation_note && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-900 mb-2">Note d'activation</h4>
                <p className="text-sm text-green-800 whitespace-pre-wrap">{selectedHeir.activation_note}</p>
                {selectedHeir.activated_at && (
                  <p className="text-xs text-green-700 mt-2">
                    Activé le {new Date(selectedHeir.activated_at).toLocaleString('fr-FR')}
                  </p>
                )}
              </div>
            )}

            {selectedHeir.status === 'pending_activation' && admin?.role === 'super_admin' && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Activer l'héritier numérique</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note d'activation (obligatoire)
                    </label>
                    <textarea
                      value={activationNote}
                      onChange={(e) => setActivationNote(e.target.value)}
                      placeholder="Décrivez la procédure de vérification effectuée..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      rows={4}
                    />
                  </div>
                  <button
                    onClick={handleActivateHeir}
                    disabled={processing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Activation...' : 'Activer l\'héritier'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">Héritiers numériques</h2>
        <p className="text-sm text-gray-600">
          Gestion et activation des héritiers numériques
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {heirs.length === 0 ? (
              <p className="text-center text-gray-600 py-8">Aucun héritier numérique trouvé</p>
            ) : (
              heirs.map((heir) => (
                <div
                  key={heir.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedHeir(heir)}
                >
                  <Users className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 mb-1">{heir.heir_name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{heir.heir_email}</span>
                      <span>•</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getStatusColor(heir.status)}`}>
                        {getStatusIcon(heir.status)}
                        {getStatusLabel(heir.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Règles d'activation</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Vérification d'identité obligatoire</li>
          <li>• Note d'activation détaillée requise</li>
          <li>• Procédure humaine stricte</li>
          <li>• Traçabilité complète</li>
        </ul>
      </div>
    </div>
  );
}

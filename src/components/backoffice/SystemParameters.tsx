import { useEffect, useState } from 'react';
import { Settings, Edit, Save, X } from 'lucide-react';
import { supabaseShim as supabase } from '../../lib/supabaseShim';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { SystemParameter } from '../../lib/backoffice-types';

export function SystemParameters() {
  const { admin, logAction } = useAdminAuth();
  const [parameters, setParameters] = useState<SystemParameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [justification, setJustification] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadParameters();
  }, []);

  const loadParameters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_parameters')
        .select('*')
        .order('key');

      if (error) throw error;
      setParameters(data || []);
    } catch (error) {
      console.error('Error loading parameters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (parameter: SystemParameter) => {
    setEditing(parameter.id);
    setEditValue(parameter.value);
    setJustification('');
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setEditValue('');
    setJustification('');
  };

  const handleSaveParameter = async (parameter: SystemParameter) => {
    if (!justification.trim()) {
      alert('Veuillez fournir une justification obligatoire');
      return;
    }

    if (!editValue.trim()) {
      alert('La valeur ne peut pas être vide');
      return;
    }

    if (!admin) {
      alert('Session administrateur invalide');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase.rpc('update_system_param', {
        p_key: parameter.key,
        p_value: editValue,
        p_admin_id: admin.id,
        p_justification: justification,
      });

      if (error) throw error;

      alert('Paramètre mis à jour avec succès');
      handleCancelEdit();
      loadParameters();
    } catch (error: any) {
      console.error('Error updating parameter:', error);
      alert(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setProcessing(false);
    }
  };

  const formatValue = (parameter: SystemParameter) => {
    if (parameter.key.includes('price')) {
      return `${Number(parameter.value).toLocaleString('fr-FR')} FCFA`;
    }
    return parameter.value;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">Paramètres système</h2>
        <p className="text-sm text-gray-600">
          Configuration des tarifs et paramètres de la plateforme
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          parameters.map((parameter) => (
            <div key={parameter.id} className="p-6">
              {editing === parameter.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {parameter.key}
                    </label>
                    {parameter.description && (
                      <p className="text-sm text-gray-600 mb-2">{parameter.description}</p>
                    )}
                    <input
                      type={parameter.data_type === 'number' ? 'number' : 'text'}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                    {parameter.key.includes('price') && (
                      <p className="text-xs text-gray-500 mt-1">
                        Valeur en FCFA • Actuellement: {formatValue(parameter)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Justification (obligatoire)
                    </label>
                    <textarea
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      placeholder="Expliquez pourquoi ce changement est nécessaire..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSaveParameter(parameter)}
                      disabled={processing}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={18} />
                      {processing ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={processing}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <X size={18} />
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{parameter.key}</h3>
                    {parameter.description && (
                      <p className="text-sm text-gray-600 mb-2">{parameter.description}</p>
                    )}
                    <div className="flex items-center gap-4">
                      <p className="text-2xl font-light text-gray-900">{formatValue(parameter)}</p>
                      {parameter.is_sensitive && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                          Sensible
                        </span>
                      )}
                    </div>
                    {parameter.last_modified_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        Modifié le {new Date(parameter.last_modified_at).toLocaleDateString('fr-FR')}
                        {parameter.change_justification && ` • ${parameter.change_justification}`}
                      </p>
                    )}
                  </div>
                  {admin?.role === 'super_admin' && (
                    <button
                      onClick={() => handleStartEdit(parameter)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Edit size={18} />
                      Modifier
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">Règles de modification</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Justification obligatoire pour chaque modification</li>
          <li>• Notification automatique aux autres administrateurs</li>
          <li>• Enregistrement dans le journal d'audit</li>
          <li>• Réservé aux super administrateurs</li>
        </ul>
      </div>
    </div>
  );
}

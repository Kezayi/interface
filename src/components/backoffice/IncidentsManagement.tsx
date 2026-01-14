import { useEffect, useState } from 'react';
import { AlertTriangle, Plus, Paperclip, Clock, CheckCircle } from 'lucide-react';
import { supabaseShim as supabase } from '../../lib/supabaseShim';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { Incident } from '../../lib/backoffice-types';

export function IncidentsManagement() {
  const { admin, logAction } = useAdminAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'investigating' | 'resolved' | 'closed'>('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    type: 'payment_unconfirmed' as any,
    priority: 'medium' as any,
    title: '',
    description: '',
    memorial_id: '',
    transaction_id: '',
  });

  const [resolutionNotes, setResolutionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (error) {
      console.error('Error loading incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredIncidents = incidents.filter(i =>
    statusFilter === 'all' ? true : i.status === statusFilter
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      critical: 'Critique',
      high: 'Haute',
      medium: 'Moyenne',
      low: 'Basse',
    };
    return labels[priority] || priority;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: 'Ouvert',
      investigating: 'En cours',
      resolved: 'Résolu',
      closed: 'Fermé',
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      payment_unconfirmed: 'Paiement non confirmé',
      double_charge: 'Double débit',
      dispute: 'Contestation',
      transfer_issue: 'Problème de reversement',
      technical_error: 'Erreur technique',
      user_report: 'Signalement utilisateur',
    };
    return labels[type] || type;
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase
        .from('incidents')
        .insert({
          type: formData.type,
          priority: formData.priority,
          title: formData.title,
          description: formData.description,
          memorial_id: formData.memorial_id || null,
          transaction_id: formData.transaction_id || null,
          assigned_to: admin?.id,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;

      await logAction(
        'INCIDENT_CREATED',
        'incident',
        data.id,
        {
          type: formData.type,
          priority: formData.priority,
          title: formData.title,
        },
        `Création d'un incident: ${formData.title}`
      );

      alert('Incident créé avec succès');
      setShowCreateForm(false);
      setFormData({
        type: 'payment_unconfirmed',
        priority: 'medium',
        title: '',
        description: '',
        memorial_id: '',
        transaction_id: '',
      });
      loadIncidents();
    } catch (error) {
      console.error('Error creating incident:', error);
      alert('Erreur lors de la création de l\'incident');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateStatus = async (newStatus: 'investigating' | 'resolved' | 'closed') => {
    if (!selectedIncident) return;

    if (newStatus === 'resolved' && !resolutionNotes.trim()) {
      alert('Veuillez fournir des notes de résolution');
      return;
    }

    setProcessing(true);
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'resolved' || newStatus === 'closed') {
        updateData.resolved_at = new Date().toISOString();
        if (resolutionNotes.trim()) {
          updateData.resolution_notes = resolutionNotes;
        }
      }

      const { error } = await supabase
        .from('incidents')
        .update(updateData)
        .eq('id', selectedIncident.id);

      if (error) throw error;

      await logAction(
        'INCIDENT_STATUS_UPDATED',
        'incident',
        selectedIncident.id,
        {
          old_status: selectedIncident.status,
          new_status: newStatus,
          title: selectedIncident.title,
        },
        resolutionNotes || `Changement de statut vers ${newStatus}`
      );

      alert('Statut de l\'incident mis à jour');
      setResolutionNotes('');
      setSelectedIncident(null);
      loadIncidents();
    } catch (error) {
      console.error('Error updating incident status:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setProcessing(false);
    }
  };

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setShowCreateForm(false)}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Retour à la liste
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-medium text-gray-900">Créer un nouvel incident</h2>
          </div>

          <form onSubmit={handleCreateIncident} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type d'incident *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
              >
                <option value="payment_unconfirmed">Paiement non confirmé</option>
                <option value="double_charge">Double débit</option>
                <option value="dispute">Contestation</option>
                <option value="transfer_issue">Problème de reversement</option>
                <option value="technical_error">Erreur technique</option>
                <option value="user_report">Signalement utilisateur</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priorité *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="critical">Critique</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Résumé court de l'incident"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description détaillée de l'incident..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                rows={5}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Memorial (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.memorial_id}
                  onChange={(e) => setFormData({ ...formData, memorial_id: e.target.value })}
                  placeholder="UUID de l'espace mémorial"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Transaction (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.transaction_id}
                  onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                  placeholder="UUID de la transaction"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={processing}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Création...' : 'Créer l\'incident'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (selectedIncident) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setSelectedIncident(null);
            setResolutionNotes('');
          }}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Retour à la liste
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className={`p-6 border-b border-gray-200 ${getPriorityColor(selectedIncident.priority)} border`}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-medium text-gray-900 mb-2">{selectedIncident.title}</h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium">{getTypeLabel(selectedIncident.type)}</span>
                  <span>•</span>
                  <span>{getPriorityLabel(selectedIncident.priority)}</span>
                  <span>•</span>
                  <span>{getStatusLabel(selectedIncident.status)}</span>
                </div>
              </div>
              <AlertTriangle className={`w-6 h-6 ${getPriorityColor(selectedIncident.priority).split(' ')[0]}`} />
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <p className="text-gray-900 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">{selectedIncident.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Créé le</label>
                <p className="text-gray-900">{new Date(selectedIncident.created_at).toLocaleString('fr-FR')}</p>
              </div>

              {selectedIncident.resolved_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Résolu le</label>
                  <p className="text-gray-900">{new Date(selectedIncident.resolved_at).toLocaleString('fr-FR')}</p>
                </div>
              )}

              {selectedIncident.memorial_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Memorial ID</label>
                  <p className="text-gray-900 font-mono text-sm">{selectedIncident.memorial_id}</p>
                </div>
              )}

              {selectedIncident.transaction_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                  <p className="text-gray-900 font-mono text-sm">{selectedIncident.transaction_id}</p>
                </div>
              )}
            </div>

            {selectedIncident.resolution_notes && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-900 mb-2">Notes de résolution</h4>
                <p className="text-sm text-green-800 whitespace-pre-wrap">{selectedIncident.resolution_notes}</p>
              </div>
            )}

            {selectedIncident.status !== 'closed' && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>

                <div className="space-y-4">
                  {selectedIncident.status === 'open' && (
                    <button
                      onClick={() => handleUpdateStatus('investigating')}
                      disabled={processing}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Clock size={18} />
                      Passer en cours d'investigation
                    </button>
                  )}

                  {(selectedIncident.status === 'open' || selectedIncident.status === 'investigating') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes de résolution
                      </label>
                      <textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Décrivez la résolution de l'incident..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        rows={4}
                      />
                      <div className="flex gap-3 mt-2">
                        <button
                          onClick={() => handleUpdateStatus('resolved')}
                          disabled={processing}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle size={18} />
                          Marquer comme résolu
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedIncident.status === 'resolved' && (
                    <button
                      onClick={() => handleUpdateStatus('closed')}
                      disabled={processing}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Fermer l'incident
                    </button>
                  )}
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">Gestion des incidents</h2>
          <p className="text-sm text-gray-600">
            Suivi des problèmes techniques et financiers
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus size={18} />
          Créer un incident
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="open">Ouvert</option>
            <option value="investigating">En cours</option>
            <option value="resolved">Résolu</option>
            <option value="closed">Fermé</option>
          </select>

          <div className="flex-1 text-right text-sm text-gray-600">
            {filteredIncidents.length} incident(s)
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIncidents.length === 0 ? (
              <p className="text-center text-gray-600 py-8">Aucun incident trouvé</p>
            ) : (
              filteredIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedIncident(incident)}
                >
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${getPriorityColor(incident.priority).split(' ')[0]}`} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 mb-1">{incident.title}</h3>
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">{incident.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className={getPriorityColor(incident.priority).split(' ')[0]}>{getPriorityLabel(incident.priority)}</span>
                      <span>•</span>
                      <span>{getStatusLabel(incident.status)}</span>
                      <span>•</span>
                      <span>{new Date(incident.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Types d'incidents couverts</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Paiement non confirmé</li>
          <li>• Double débit</li>
          <li>• Contestation utilisateur</li>
          <li>• Problème de reversement</li>
          <li>• Erreur technique</li>
          <li>• Signalement utilisateur</li>
        </ul>
      </div>
    </div>
  );
}

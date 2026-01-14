import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Type, FileText } from 'lucide-react';
import { supabaseShim as supabase } from '../lib/supabaseShim';
import { useAuth } from '../contexts/AuthContext';

type MemorialEvent = {
  id?: string;
  memorial_id?: string;
  event_type: string;
  event_date: string;
  location: string;
  description: string;
};

interface EventFormProps {
  memorialId: string;
  event?: MemorialEvent | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EVENT_TYPE_OPTIONS = [
  'Retrait de deuil',
  'Messe de requiem',
  'Minute de silence',
  'Commémoration',
  'Cérémonie d\'hommage',
  'Recueillement collectif',
  'Autre',
];

export default function EventForm({
  memorialId,
  event,
  onClose,
  onSuccess,
}: EventFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MemorialEvent>({
    event_type: event?.event_type || '',
    event_date: event?.event_date
      ? new Date(event.event_date).toISOString().slice(0, 16)
      : '',
    location: event?.location || '',
    description: event?.description || '',
  });
  const [customEventType, setCustomEventType] = useState('');
  const [showCustomType, setShowCustomType] = useState(
    event?.event_type && !EVENT_TYPE_OPTIONS.includes(event.event_type)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const eventType = showCustomType ? customEventType : formData.event_type;

      if (!eventType || !formData.event_date || !formData.location) {
        alert('Veuillez remplir tous les champs obligatoires');
        setLoading(false);
        return;
      }

      const eventData = {
        memorial_id: memorialId,
        author_id: user.id,
        event_type: eventType,
        event_date: new Date(formData.event_date).toISOString(),
        location: formData.location,
        description: formData.description,
      };

      if (event?.id) {
        const { error } = await supabase
          .from('memorial_events')
          .update(eventData)
          .eq('id', event.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('memorial_events')
          .insert(eventData);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving event:', error);
      const errorMessage = error?.message || 'Une erreur inconnue est survenue';
      alert(`Erreur lors de la sauvegarde: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEventTypeChange = (value: string) => {
    if (value === 'Autre') {
      setShowCustomType(true);
      setFormData({ ...formData, event_type: '' });
    } else {
      setShowCustomType(false);
      setFormData({ ...formData, event_type: value });
      setCustomEventType('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {event ? 'Modifier l\'événement' : 'Nouvel événement de recueillement'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                <span>Type d'événement *</span>
              </div>
            </label>
            <select
              value={showCustomType ? 'Autre' : formData.event_type}
              onChange={(e) => handleEventTypeChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
              disabled={loading}
            >
              <option value="">Sélectionner un type</option>
              {EVENT_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {showCustomType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type personnalisé *
              </label>
              <input
                type="text"
                value={customEventType}
                onChange={(e) => setCustomEventType(e.target.value)}
                placeholder="Entrez le type d'événement"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                required
                disabled={loading}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Date et heure *</span>
              </div>
            </label>
            <input
              type="datetime-local"
              value={formData.event_date}
              onChange={(e) =>
                setFormData({ ...formData, event_date: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Lieu *</span>
              </div>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Adresse ou nom du lieu"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Description / Commentaires</span>
              </div>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Détails supplémentaires sur l'événement (facultatif)"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              disabled={loading}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Une notification sera automatiquement envoyée à toutes les personnes ayant laissé un message dans le livre d'or.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading
                ? 'Enregistrement...'
                : event
                ? 'Mettre à jour'
                : 'Créer l\'événement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

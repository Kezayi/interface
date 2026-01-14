import { useEffect, useState } from 'react';
import { Bell, BellOff, AlertCircle, Eye } from 'lucide-react';
import { supabaseShim as supabase } from '../../lib/supabaseShim';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationType {
  key: string;
  label: string;
  description: string;
  is_enabled: boolean;
  is_system: boolean;
}

export function NotificationsSupervision() {
  const { admin, logAction } = useAdminAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([
    {
      key: 'new_guestbook_message',
      label: 'Nouveau message dans le livre d\'or',
      description: 'Notifie l\'auteur quand un nouveau message est posté',
      is_enabled: true,
      is_system: true,
    },
    {
      key: 'new_event',
      label: 'Nouvel événement',
      description: 'Notifie les followers quand un événement est créé',
      is_enabled: true,
      is_system: true,
    },
    {
      key: 'event_reminder',
      label: 'Rappel d\'événement',
      description: 'Rappelle les événements à venir',
      is_enabled: true,
      is_system: true,
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotificationType = async (notificationType: NotificationType) => {
    if (!notificationType.is_system) {
      alert('Seules les notifications système peuvent être désactivées');
      return;
    }

    const newStatus = !notificationType.is_enabled;
    const action = newStatus ? 'activé' : 'désactivé';

    if (!confirm(`Êtes-vous sûr de vouloir ${newStatus ? 'activer' : 'désactiver'} ce type de notification ?`)) {
      return;
    }

    setProcessing(true);
    try {
      setNotificationTypes(types =>
        types.map(t =>
          t.key === notificationType.key
            ? { ...t, is_enabled: newStatus }
            : t
        )
      );

      await logAction(
        'NOTIFICATION_TYPE_TOGGLED',
        'notification_type',
        notificationType.key,
        {
          type: notificationType.key,
          label: notificationType.label,
          old_status: notificationType.is_enabled,
          new_status: newStatus,
        },
        `Type de notification ${action}: ${notificationType.label}`
      );

      alert(`Type de notification ${action} avec succès`);
    } catch (error) {
      console.error('Error toggling notification type:', error);
      alert('Erreur lors de la modification');
      setNotificationTypes(types =>
        types.map(t =>
          t.key === notificationType.key
            ? { ...t, is_enabled: notificationType.is_enabled }
            : t
        )
      );
    } finally {
      setProcessing(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      new_guestbook_message: 'Nouveau message',
      new_event: 'Nouvel événement',
      event_reminder: 'Rappel événement',
      system: 'Système',
    };
    return labels[type] || type;
  };

  if (selectedNotification) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedNotification(null)}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Retour à la liste
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-medium text-gray-900 mb-2">Détails de la notification</h2>
            <p className="text-sm text-gray-600">
              {getTypeLabel(selectedNotification.type)} • {new Date(selectedNotification.created_at).toLocaleString('fr-FR')}
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
              <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedNotification.title}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <p className="text-gray-900 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">{selectedNotification.message}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <p className="text-gray-900">{getTypeLabel(selectedNotification.type)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <p className="text-gray-900">{selectedNotification.is_read ? 'Lue' : 'Non lue'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <p className="text-gray-900 font-mono text-sm">{selectedNotification.user_id}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Envoyée le</label>
                <p className="text-gray-900">{new Date(selectedNotification.created_at).toLocaleString('fr-FR')}</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Mode lecture seule :</strong> Les administrateurs ne peuvent pas modifier ou supprimer les notifications envoyées.
                Cette restriction garantit la traçabilité des communications.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">Supervision des notifications</h2>
        <p className="text-sm text-gray-600">
          Visualisation et gestion des types de notifications système
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Types de notifications</h3>
        <div className="space-y-3">
          {notificationTypes.map((type) => (
            <div
              key={type.key}
              className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex-shrink-0">
                {type.is_enabled ? (
                  <Bell className="w-5 h-5 text-green-600" />
                ) : (
                  <BellOff className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 mb-1">{type.label}</h4>
                <p className="text-sm text-gray-600 mb-2">{type.description}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    type.is_enabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {type.is_enabled ? 'Activé' : 'Désactivé'}
                  </span>
                  {type.is_system && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      Système
                    </span>
                  )}
                </div>
              </div>
              {admin?.role === 'super_admin' && type.is_system && (
                <button
                  onClick={() => handleToggleNotificationType(type)}
                  disabled={processing}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    type.is_enabled
                      ? 'text-red-700 border border-red-300 hover:bg-red-50'
                      : 'text-green-700 border border-green-300 hover:bg-green-50'
                  }`}
                >
                  {type.is_enabled ? 'Désactiver' : 'Activer'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Notifications récentes (100 dernières)
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-center text-gray-600 py-8">Aucune notification trouvée</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedNotification(notification)}
                >
                  <Bell className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    notification.is_read ? 'text-gray-400' : 'text-blue-600'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 mb-1">{notification.title}</h4>
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">{notification.message}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{getTypeLabel(notification.type)}</span>
                      <span>•</span>
                      <span>{new Date(notification.created_at).toLocaleDateString('fr-FR')}</span>
                      {!notification.is_read && (
                        <>
                          <span>•</span>
                          <span className="text-blue-600">Non lue</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Eye className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-red-900 mb-2 flex items-center gap-2">
          <AlertCircle size={16} />
          Interdictions strictes
        </h4>
        <ul className="text-sm text-red-800 space-y-1">
          <li>• Aucune création de notification marketing</li>
          <li>• Aucune relance émotionnelle des utilisateurs</li>
          <li>• Uniquement des notifications système légitimes</li>
          <li>• Pas de modification du wording sans justification</li>
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Actions possibles</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Visualiser les notifications envoyées</li>
          <li>• Désactiver un type de notification système</li>
          <li>• Consulter les statistiques d'envoi</li>
        </ul>
      </div>
    </div>
  );
}

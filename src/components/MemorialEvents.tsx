import { useEffect, useState } from 'react';
import { Calendar, MapPin, CheckCircle, Plus, Trash2, Edit2 } from 'lucide-react';
import { supabaseShim as supabase } from '../lib/supabaseShim';
import { useAuth } from '../contexts/AuthContext';

type MemorialEvent = {
  id: string;
  memorial_id: string;
  author_id: string;
  event_type: string;
  event_date: string;
  location: string;
  description: string;
  created_at: string;
  confirmations?: EventConfirmation[];
  confirmation_count?: number;
  user_confirmed?: boolean;
};

type EventConfirmation = {
  id: string;
  event_id: string;
  user_id: string | null;
  anonymous_id: string | null;
  created_at: string;
};

interface MemorialEventsProps {
  memorialId: string;
  memorialAuthorId: string;
  onEditEvent: (event: MemorialEvent) => void;
  onCreateEvent: () => void;
}

export default function MemorialEvents({
  memorialId,
  memorialAuthorId,
  onEditEvent,
  onCreateEvent,
}: MemorialEventsProps) {
  const { user } = useAuth();
  const [events, setEvents] = useState<MemorialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingEventId, setConfirmingEventId] = useState<string | null>(null);

  const isAuthor = user?.id === memorialAuthorId;
  const anonymousId = localStorage.getItem('anonymousId') || `anon_${Date.now()}_${Math.random()}`;

  useEffect(() => {
    if (!localStorage.getItem('anonymousId')) {
      localStorage.setItem('anonymousId', anonymousId);
    }
    loadEvents();

    const subscription = supabase
      .channel(`memorial_events_${memorialId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'memorial_events',
          filter: `memorial_id=eq.${memorialId}`,
        },
        () => {
          loadEvents();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_confirmations',
        },
        () => {
          loadEvents();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [memorialId, user]);

  const loadEvents = async () => {
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('memorial_events')
        .select('*')
        .eq('memorial_id', memorialId)
        .order('event_date', { ascending: true });

      if (eventsError) throw eventsError;

      if (eventsData && eventsData.length > 0) {
        const eventIds = eventsData.map(e => e.id);

        const { data: allConfirmations, error: confirmError } = await supabase
          .from('event_confirmations')
          .select('*')
          .in('event_id', eventIds);

        if (confirmError) throw confirmError;

        const confirmationsByEvent = (allConfirmations || []).reduce((acc, conf) => {
          if (!acc[conf.event_id]) acc[conf.event_id] = [];
          acc[conf.event_id].push(conf);
          return acc;
        }, {} as Record<string, any[]>);

        const eventsWithConfirmations = eventsData.map((event) => {
          const confirmations = confirmationsByEvent[event.id] || [];
          const userConfirmed = confirmations.some(
            (c) =>
              (user && c.user_id === user.id) ||
              (!user && c.anonymous_id === anonymousId)
          );

          return {
            ...event,
            confirmations,
            confirmation_count: confirmations.length,
            user_confirmed: userConfirmed,
          };
        });

        setEvents(eventsWithConfirmations);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEvent = async (eventId: string) => {
    setConfirmingEventId(eventId);
    try {
      const event = events.find((e) => e.id === eventId);
      if (!event) return;

      if (event.user_confirmed) {
        const { error } = await supabase
          .from('event_confirmations')
          .delete()
          .eq('event_id', eventId)
          .eq(user ? 'user_id' : 'anonymous_id', user ? user.id : anonymousId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('event_confirmations').insert({
          event_id: eventId,
          user_id: user?.id || null,
          anonymous_id: user ? null : anonymousId,
        });

        if (error) throw error;
      }

      await loadEvents();
    } catch (error) {
      console.error('Error confirming event:', error);
    } finally {
      setConfirmingEventId(null);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

    try {
      const { error } = await supabase
        .from('memorial_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      await loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isPastEvent = (eventDate: string) => {
    return new Date(eventDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isAuthor && (
        <div className="flex justify-end">
          <button
            onClick={onCreateEvent}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un événement</span>
          </button>
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun événement publié
          </h3>
          <p className="text-gray-600">
            {isAuthor
              ? "Créez le premier événement de recueillement pour informer les proches."
              : "Aucun événement n'a été publié pour le moment."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const isPast = isPastEvent(event.event_date);
            return (
              <div
                key={event.id}
                className={`bg-white rounded-lg shadow-sm border ${
                  isPast ? 'border-gray-200 opacity-75' : 'border-gray-300'
                } overflow-hidden`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {event.event_type}
                        </h3>
                        {isPast && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            Passé
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className="capitalize">{formatDate(event.event_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                    </div>
                    {isAuthor && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEditEvent(event)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                      {event.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        {event.confirmation_count || 0} confirmation
                        {(event.confirmation_count || 0) > 1 ? 's' : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => handleConfirmEvent(event.id)}
                      disabled={confirmingEventId === event.id}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors touch-manipulation ${
                        event.user_confirmed
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <CheckCircle
                        className={`w-4 h-4 ${
                          event.user_confirmed ? 'fill-current' : ''
                        }`}
                      />
                      <span>
                        {confirmingEventId === event.id
                          ? 'Chargement...'
                          : event.user_confirmed
                          ? 'Confirmé'
                          : 'Confirmer ma présence'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

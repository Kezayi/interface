import { useEffect, useState, useMemo } from 'react';
import { Memorial, GuestbookMessage } from '../lib/supabase';
import { supabaseQuery } from '../lib/supabaseClient';
import { MapPin, Calendar, Clock, Flame, Flower, Heart, Edit2, MessageSquare, X, HandHeart } from 'lucide-react';
import { GuestbookForm } from './GuestbookForm';
import { GuestbookMessages } from './GuestbookMessages';
import { FollowButton } from './FollowButton';
import { ShareButton } from './ShareButton';
import { ContributionsSection } from './ContributionsSection';
import { MemorialEdit } from './MemorialEdit';
import { Footer } from './Footer';
import { useAuth } from '../contexts/AuthContext';
import MemorialEvents from './MemorialEvents';
import EventForm from './EventForm';
import AuthorRating from './AuthorRating';

type MemorialViewProps = {
  memorialId: string;
  onNavigateToLegalPage?: (view: 'cgu' | 'privacy') => void;
};

type GestureCounts = {
  rip: number;
  candle: number;
  flower: number;
};

export function MemorialView({ memorialId, onNavigateToLegalPage }: MemorialViewProps) {
  const { user } = useAuth();
  const [memorial, setMemorial] = useState<Memorial | null>(null);
  const [gestureCounts, setGestureCounts] = useState<GestureCounts>({ rip: 0, candle: 0, flower: 0 });
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'house' | 'funeral' | 'events'>('house');
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    loadMemorialData();
    setImageError(false);
  }, [memorialId]);

  const loadMemorialData = async () => {
    setLoading(true);
    try {
      const { data: memorialData } = await supabaseQuery<Memorial>('memorials', {
        select: '*',
        eq: { id: memorialId },
        maybeSingle: true,
      });

      if (memorialData && Array.isArray(memorialData) && memorialData.length > 0) {
        const memorial = memorialData[0];
        setMemorial(memorial);

        if (memorial.house_address_text) {
          setActiveTab('house');
        } else if (memorial.funeral_date) {
          setActiveTab('funeral');
        } else {
          setActiveTab('events');
        }
      }

      const { data: gesturesData } = await supabaseQuery<{ gesture_type: string }>('gestures', {
        select: 'gesture_type',
        eq: { memorial_id: memorialId },
      });

      if (gesturesData && Array.isArray(gesturesData)) {
        const counts = gesturesData.reduce(
          (acc, g) => {
            acc[g.gesture_type as keyof GestureCounts]++;
            return acc;
          },
          { rip: 0, candle: 0, flower: 0 }
        );
        setGestureCounts(counts);
      }

      const { data: messagesData } = await supabaseQuery<GuestbookMessage>('guestbook_messages', {
        select: '*',
        eq: { memorial_id: memorialId, is_hidden: false },
        order: { column: 'created_at', ascending: false },
      });

      if (messagesData && Array.isArray(messagesData)) {
        setMessages(messagesData);
      }
    } catch (error) {
      console.error('Error loading memorial:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date invalide';
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const daysSinceDeath = useMemo(() => {
    if (!memorial?.date_of_death) return 0;
    const deathDate = new Date(memorial.date_of_death);
    if (isNaN(deathDate.getTime())) return 0;
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - deathDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }, [memorial?.date_of_death]);

  const ageAtDeath = useMemo(() => {
    if (!memorial?.date_of_birth || !memorial?.date_of_death) return 0;
    const birth = new Date(memorial.date_of_birth);
    const death = new Date(memorial.date_of_death);
    if (isNaN(birth.getTime()) || isNaN(death.getTime())) return 0;
    let age = death.getFullYear() - birth.getFullYear();
    const monthDiff = death.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && death.getDate() < birth.getDate())) {
      age--;
    }
    return age < 0 ? 0 : age;
  }, [memorial?.date_of_birth, memorial?.date_of_death]);

  const directionsUrl = useMemo(() => {
    if (!memorial?.house_gps_lat || !memorial?.house_gps_lng) return null;
    return `https://www.google.com/maps/dir/?api=1&destination=${memorial.house_gps_lat},${memorial.house_gps_lng}`;
  }, [memorial?.house_gps_lat, memorial?.house_gps_lng]);

  const canEdit = () => {
    if (!user || !memorial) return false;
    return user.id === memorial.author_id || user.email === memorial.heir_email;
  };

  const shouldShowContributeButton = () => {
    if (!memorial) return false;
    if (memorial.memorial_type !== 'recent') return false;
    if (!memorial.funeral_date) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const funeralDate = new Date(memorial.funeral_date);
    if (isNaN(funeralDate.getTime())) return false;
    funeralDate.setHours(0, 0, 0, 0);

    return today <= funeralDate;
  };

  const handleEditSave = () => {
    setIsEditing(false);
    loadMemorialData();
  };

  const handleContribute = () => {
    const width = 800;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    window.open(
      'https://e-billing.digitech-africa.com/3vQ3M8l',
      'Contribution',
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!memorial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Mémorial introuvable</div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <MemorialEdit
        memorial={memorial}
        onSave={handleEditSave}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20 md:pb-0">
      <div className="bg-white border-b-2 border-gray-300 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 w-full">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <div className="w-full md:w-1/3 space-y-4">
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 p-5">
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
                  {memorial.deceased_full_name}
                </h1>
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <p className="text-sm font-medium">
                    {formatDate(memorial.date_of_birth)} - {formatDate(memorial.date_of_death)}
                  </p>
                </div>
                <p className="text-gray-600 text-xs bg-gray-100 inline-block px-3 py-1.5 rounded-full">
                  Parti(e) il y a {daysSinceDeath} jour{daysSinceDeath > 1 ? 's' : ''} à l'âge de {ageAtDeath} ans
                </p>
              </div>

              <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden shadow-lg border-2 border-gray-300 flex items-center justify-center">
                {memorial.deceased_photo_url && !imageError ? (
                  <img
                    src={memorial.deceased_photo_url}
                    alt={memorial.deceased_full_name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                )}
              </div>

              <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 p-5">
                <div className="flex items-center justify-around text-center">
                  <div className="flex flex-col items-center">
                    <Heart className="w-6 h-6 text-red-500 mb-1" />
                    <span className="text-2xl font-semibold text-gray-900">{gestureCounts.rip}</span>
                    <span className="text-xs text-gray-600 uppercase tracking-wide mt-1">RIP</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Flame className="w-6 h-6 text-amber-500 mb-1" />
                    <span className="text-2xl font-semibold text-gray-900">{gestureCounts.candle}</span>
                    <span className="text-xs text-gray-600 uppercase tracking-wide mt-1">Bougies</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Flower className="w-6 h-6 text-rose-500 mb-1" />
                    <span className="text-2xl font-semibold text-gray-900">{gestureCounts.flower}</span>
                    <span className="text-xs text-gray-600 uppercase tracking-wide mt-1">Fleurs</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-white rounded-xl p-6 shadow-md border border-gray-200">
              <div className="mb-4">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-base">
                  {memorial.announcement_text || 'Aucun message'}
                </p>
              </div>

              <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-4"></div>

              <p className="text-xs text-gray-500 italic">
                Publié par {memorial.author_name || 'Anonyme'} le {formatDate(memorial.created_at)} à {formatTime(memorial.created_at)}.{' '}
                {memorial.author_id && (
                  <AuthorRating
                    memorialId={memorial.id}
                    authorId={memorial.author_id}
                  />
                )}
              </p>

              <div className="mt-6 flex gap-2 flex-wrap">
                <button
                  onClick={() => setShowMessageModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors touch-manipulation"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm">Rédiger Message</span>
                </button>
                <FollowButton memorialId={memorial.id} />
                {shouldShowContributeButton() && (
                  <button
                    onClick={handleContribute}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors touch-manipulation"
                  >
                    <HandHeart className="w-4 h-4" />
                    <span className="text-sm">Contribuer</span>
                  </button>
                )}
                <ShareButton
                  memorialName={memorial.deceased_full_name}
                  memorialId={memorial.id}
                />
                {canEdit() && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors touch-manipulation"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Modifier</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 w-full">
        {(memorial.memorial_type === 'recent' || memorial.house_address_text || memorial.funeral_date) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex border-b border-gray-200">
              {memorial.house_address_text && (
                <button
                  onClick={() => setActiveTab('house')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors touch-manipulation ${
                    activeTab === 'house'
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Maison du deuil
                </button>
              )}
              {memorial.funeral_date && (
                <button
                  onClick={() => setActiveTab('funeral')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors touch-manipulation ${
                    activeTab === 'funeral'
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Programme des Obsèques
                </button>
              )}
              {memorial.memorial_type === 'recent' && (
                <button
                  onClick={() => setActiveTab('events')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors touch-manipulation ${
                    activeTab === 'events'
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Recueillement
                </button>
              )}
            </div>

            <div className={`p-6 transition-colors duration-300 ${
              activeTab === 'house'
                ? 'bg-stone-50'
                : activeTab === 'funeral'
                ? 'bg-slate-50'
                : 'bg-emerald-50/30'
            }`}>
              {activeTab === 'house' && (
                <div>
                  {memorial.house_address_text ? (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-gray-700 whitespace-pre-wrap">{memorial.house_address_text}</p>
                        {directionsUrl && (
                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-2 text-sm text-gray-900 underline hover:text-gray-700"
                          >
                            Obtenir l'itinéraire
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Aucune information sur la maison du deuil</p>
                  )}
                </div>
              )}

              {activeTab === 'funeral' && (
                <div>
                  {memorial.funeral_date ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="text-gray-900">{formatDate(memorial.funeral_date)}</p>
                        </div>
                      </div>

                      {memorial.funeral_time && (
                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-500">Heure</p>
                            <p className="text-gray-900">{memorial.funeral_time}</p>
                          </div>
                        </div>
                      )}

                      {memorial.funeral_location && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-500">Lieu</p>
                            <p className="text-gray-900">{memorial.funeral_location}</p>
                          </div>
                        </div>
                      )}

                      {memorial.funeral_steps && Array.isArray(memorial.funeral_steps) && memorial.funeral_steps.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <p className="text-sm text-gray-500 font-medium">Programme détaillé</p>
                          {memorial.funeral_steps.map((step: any, index: number) => (
                            <div key={index} className="border-l-2 border-gray-300 pl-4">
                              <p className="font-medium text-gray-900">{step.description}</p>
                              {step.time && <p className="text-sm text-gray-600">{step.time}</p>}
                              {step.location && <p className="text-sm text-gray-600">{step.location}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Aucune information sur le programme des obsèques</p>
                  )}
                </div>
              )}

              {activeTab === 'events' && (
                <MemorialEvents
                  memorialId={memorial.id}
                  memorialAuthorId={memorial.author_id}
                  onEditEvent={(event) => {
                    setEditingEvent(event);
                    setShowEventForm(true);
                  }}
                  onCreateEvent={() => {
                    setEditingEvent(null);
                    setShowEventForm(true);
                  }}
                />
              )}
            </div>
          </div>
        )}

        {memorial.contributions_enabled && (
          <ContributionsSection memorialId={memorial.id} />
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-900 px-6 py-4">
            <h2 className="text-lg font-medium text-white">Livre D'or</h2>
            <p className="text-sm text-gray-300 italic mt-1">(avec photos et/ou vidéo)</p>
          </div>
          <div className="p-6">
            <GuestbookMessages messages={messages} />
          </div>
        </div>
      </div>

      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-medium text-gray-900">Rédiger message</h2>
              <button
                onClick={() => setShowMessageModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <GuestbookForm
                memorialId={memorial.id}
                onSuccess={() => {
                  setShowMessageModal(false);
                  loadMemorialData();
                }}
                onCancel={() => setShowMessageModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {showEventForm && (
        <EventForm
          memorialId={memorial.id}
          event={editingEvent}
          onClose={() => {
            setShowEventForm(false);
            setEditingEvent(null);
          }}
          onSuccess={() => {
            setShowEventForm(false);
            setEditingEvent(null);
          }}
        />
      )}

      <Footer onNavigate={onNavigateToLegalPage} />
    </div>
  );
}

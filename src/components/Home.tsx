import { useEffect, useState } from 'react';
import { Memorial } from '../lib/supabase';
import { supabaseQuery } from '../lib/supabaseClient';
import { Footer } from './Footer';
import { MessageInTheWind } from './MessageInTheWind';
import { Grid, List, Calendar, LayoutGrid, MapPin, Clock, RefreshCw } from 'lucide-react';
import { memorialCache } from '../lib/memorialCache';

type HomeProps = {
  onCreateMemorial: () => void;
  onViewMemorial: (memorialId: string) => void;
  onNavigateToLegalPage?: (view: 'cgu' | 'privacy') => void;
};

type ViewMode = 'grid' | 'list' | 'timeline' | 'masonry';

type UpcomingFuneral = {
  memorial_id: string;
  deceased_full_name: string;
  funeral_date: string;
  funeral_location: string;
  deceased_photo_url: string;
};

type UpcomingEvent = {
  id: string;
  memorial_id: string;
  event_type: string;
  event_date: string;
  location: string;
  deceased_full_name: string;
  deceased_photo_url: string;
};

export function Home({ onCreateMemorial, onViewMemorial, onNavigateToLegalPage }: HomeProps) {
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [upcomingFunerals, setUpcomingFunerals] = useState<UpcomingFuneral[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('masonry');

  useEffect(() => {
    memorialCache.clear();
    loadMemorials();
    loadUpcomingFunerals();
    loadUpcomingEvents();
  }, []);

  const loadMemorials = async () => {
    try {
      console.log('Loading memorials from database...');
      const { data, error } = await supabaseQuery<Memorial>('memorials', {
        select: 'id,deceased_full_name,deceased_photo_url,date_of_birth,date_of_death,created_at',
        eq: { is_published: true },
        order: { column: 'created_at', ascending: false },
        limit: 50,
      });

      if (error) {
        console.error('Error loading memorials:', error);
      } else if (data && Array.isArray(data)) {
        console.log('Loaded memorials:', data.length);
        memorialCache.set(data);
        setMemorials(data);
      } else {
        console.log('No memorials found');
        setMemorials([]);
      }
    } catch (error) {
      console.error('Exception loading memorials:', error);
      setMemorials([]);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadUpcomingFunerals = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabaseQuery<UpcomingFuneral>('memorials', {
        select: 'id:id,memorial_id:id,deceased_full_name,funeral_date,funeral_location,deceased_photo_url',
        eq: { is_published: true },
        gte: { funeral_date: today.toISOString() },
        order: { column: 'funeral_date', ascending: true },
        limit: 10,
      });

      if (error) {
        console.error('Error loading upcoming funerals:', error);
      } else if (data && Array.isArray(data)) {
        setUpcomingFunerals(data);
      }
    } catch (error) {
      console.error('Exception loading upcoming funerals:', error);
    }
  };

  const loadUpcomingEvents = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabaseQuery<UpcomingEvent>('memorial_events', {
        select: 'id,memorial_id,event_type,event_date,location,memorials!inner(deceased_full_name,deceased_photo_url,is_published)',
        gte: { event_date: today.toISOString() },
        order: { column: 'event_date', ascending: true },
        limit: 10,
      });

      if (error) {
        console.error('Error loading upcoming events:', error);
      } else if (data && Array.isArray(data)) {
        const formattedEvents = data.map((event: any) => ({
          id: event.id,
          memorial_id: event.memorial_id,
          event_type: event.event_type,
          event_date: event.event_date,
          location: event.location,
          deceased_full_name: event.memorials?.deceased_full_name || '',
          deceased_photo_url: event.memorials?.deceased_photo_url || '',
        })).filter((event: UpcomingEvent) => event.deceased_full_name);
        setUpcomingEvents(formattedEvents);
      }
    } catch (error) {
      console.error('Exception loading upcoming events:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderGridView = () => (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
      {memorials.map((memorial) => (
        <button
          key={memorial.id}
          onClick={() => onViewMemorial(memorial.id)}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow text-left touch-manipulation"
        >
          <div className="h-48 w-full bg-gray-100 flex items-center justify-center">
            {memorial.deceased_photo_url ? (
              <img
                src={memorial.deceased_photo_url}
                alt={memorial.deceased_full_name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {memorial.deceased_full_name}
            </h3>
            <p className="text-sm text-gray-600">
              {formatDate(memorial.date_of_birth)} - {formatDate(memorial.date_of_death)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-3">
      {memorials.map((memorial) => (
        <button
          key={memorial.id}
          onClick={() => onViewMemorial(memorial.id)}
          className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow w-full p-4 flex gap-4 items-center text-left touch-manipulation"
        >
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
            {memorial.deceased_photo_url ? (
              <img
                src={memorial.deceased_photo_url}
                alt={memorial.deceased_full_name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-medium text-gray-900 mb-1 truncate">
              {memorial.deceased_full_name}
            </h3>
            <p className="text-sm text-gray-600">
              {formatDate(memorial.date_of_birth)} - {formatDate(memorial.date_of_death)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );

  const renderTimelineView = () => (
    <div className="space-y-6">
      {memorials.map((memorial) => (
        <button
          key={memorial.id}
          onClick={() => onViewMemorial(memorial.id)}
          className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow w-full text-left touch-manipulation overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row">
            <div className="w-full sm:w-48 h-48 bg-gray-100 flex-shrink-0 flex items-center justify-center">
              {memorial.deceased_photo_url ? (
                <img
                  src={memorial.deceased_photo_url}
                  alt={memorial.deceased_full_name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              )}
            </div>
            <div className="p-4 flex-1">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900">
                  {memorial.deceased_full_name}
                </h3>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {formatDate(memorial.created_at)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {formatDate(memorial.date_of_birth)} - {formatDate(memorial.date_of_death)}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );

  const renderMasonryView = () => (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
      {memorials.map((memorial) => (
        <button
          key={memorial.id}
          onClick={() => onViewMemorial(memorial.id)}
          className="group relative aspect-square rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all touch-manipulation bg-gray-100 flex items-center justify-center"
        >
          {memorial.deceased_photo_url ? (
            <>
              <img
                src={memorial.deceased_photo_url}
                alt={memorial.deceased_full_name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform group-hover:scale-105 absolute inset-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <h3 className="text-sm font-medium mb-1 line-clamp-1">
                    {memorial.deceased_full_name}
                  </h3>
                  <p className="text-xs opacity-90">
                    {formatDate(memorial.date_of_birth)} - {formatDate(memorial.date_of_death)}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <p className="text-sm mt-2 text-gray-700 font-medium px-2 text-center">
                {memorial.deceased_full_name}
              </p>
            </div>
          )}
        </button>
      ))}
    </div>
  );

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8 w-full">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-medium text-gray-900">
              Dernières Publications
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-gray-200 animate-pulse"
              />
            ))}
          </div>
        </div>
        <Footer onNavigate={onNavigateToLegalPage} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8 w-full">
        {memorials.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Aucun mémorial pour le moment</p>
            <button
              onClick={onCreateMemorial}
              className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors touch-manipulation"
            >
              Créer le premier mémorial
            </button>
          </div>
        ) : (
          <>
            <MessageInTheWind onViewMemorial={onViewMemorial} />

            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-medium text-gray-900">
                Dernières Publications
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    memorialCache.clear();
                    loadMemorials();
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                  title="Rafraîchir"
                >
                  <RefreshCw size={18} />
                </button>
                <div className="flex gap-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Grille"
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Liste"
                >
                  <List size={18} />
                </button>
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'timeline'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Chronologique"
                >
                  <Calendar size={18} />
                </button>
                <button
                  onClick={() => setViewMode('masonry')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'masonry'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Mosaïque"
                >
                  <LayoutGrid size={18} />
                </button>
              </div>
            </div>
            </div>

            {viewMode === 'grid' && renderGridView()}
            {viewMode === 'list' && renderListView()}
            {viewMode === 'timeline' && renderTimelineView()}
            {viewMode === 'masonry' && renderMasonryView()}
          </>
        )}

        {(upcomingFunerals.length > 0 || upcomingEvents.length > 0) && (
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Obsèques à venir
              </h2>
              {upcomingFunerals.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucune obsèque programmée pour le moment</p>
              ) : (
                <div className="space-y-4">
                  {upcomingFunerals.map((funeral) => (
                    <button
                      key={funeral.memorial_id}
                      onClick={() => onViewMemorial(funeral.memorial_id)}
                      className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors border border-gray-200"
                    >
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          {funeral.deceased_photo_url ? (
                            <img
                              src={funeral.deceased_photo_url}
                              alt={funeral.deceased_full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm mb-1">
                            {funeral.deceased_full_name}
                          </h3>
                          <div className="flex items-start gap-1 text-xs text-gray-600 mb-1">
                            <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{formatDateTime(funeral.funeral_date)}</span>
                          </div>
                          {funeral.funeral_location && (
                            <div className="flex items-start gap-1 text-xs text-gray-600">
                              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-1">{funeral.funeral_location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Recueillements
              </h2>
              {upcomingEvents.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucun recueillement programmé pour le moment</p>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onViewMemorial(event.memorial_id)}
                      className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors border border-gray-200"
                    >
                      <div className="flex gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          {event.deceased_photo_url ? (
                            <img
                              src={event.deceased_photo_url}
                              alt={event.deceased_full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm mb-1">
                            {event.deceased_full_name}
                          </h3>
                          <p className="text-xs font-medium text-gray-700 mb-1">{event.event_type}</p>
                          <div className="flex items-start gap-1 text-xs text-gray-600 mb-1">
                            <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{formatDateTime(event.event_date)}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-start gap-1 text-xs text-gray-600">
                              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span className="line-clamp-1">{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer onNavigate={onNavigateToLegalPage} />
    </div>
  );
}

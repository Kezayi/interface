import { useEffect, useState } from 'react';
import { Search, FileText, Eye, MapPin, ArrowLeft } from 'lucide-react';
import { supabaseShim as supabase } from '../../lib/supabaseShim';
import { Memorial } from '../../lib/supabase';
import { MemorialView } from '../MemorialView';

export function MemorialsList() {
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'recent' | 'past'>('all');
  const [searchType, setSearchType] = useState<'deceased' | 'author' | 'all'>('all');
  const [selectedMemorialId, setSelectedMemorialId] = useState<string | null>(null);

  useEffect(() => {
    performSearch();
  }, [searchQuery, searchType]);

  const performSearch = async () => {
    setLoading(true);
    try {
      if (!searchQuery.trim()) {
        await loadMemorials();
        return;
      }

      let memorialsData: Memorial[] = [];

      if (searchType === 'deceased' || searchType === 'all') {
        const { data, error } = await supabase
          .from('memorials')
          .select('*')
          .or(`deceased_full_name.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%,author_name.ilike.%${searchQuery}%`)
          .order('created_at', { ascending: false });

        if (!error && data) {
          memorialsData = [...memorialsData, ...data];
        }
      }

      if (searchType === 'author' || searchType === 'all') {
        const { data: messages, error } = await supabase
          .from('guestbook_messages')
          .select('memorial_id, memorials(*)')
          .or(`author_name.ilike.%${searchQuery}%,author_first_name.ilike.%${searchQuery}%,author_last_name.ilike.%${searchQuery}%`);

        if (!error && messages) {
          const authorMemorials = messages
            .map((msg: any) => msg.memorials)
            .filter((m: Memorial) => m && !memorialsData.some(existing => existing.id === m.id));

          memorialsData = [...memorialsData, ...authorMemorials];
        }
      }

      setMemorials(memorialsData);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMemorials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('memorials')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMemorials(data || []);
    } catch (error) {
      console.error('Error loading memorials:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMemorials = memorials.filter(memorial => {
    const matchesType = typeFilter === 'all' || memorial.memorial_type === typeFilter;
    return matchesType;
  });

  if (selectedMemorialId) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedMemorialId(null)}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la liste</span>
        </button>
        <MemorialView memorialId={selectedMemorialId} onNavigateToLegalPage={() => {}} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">Espaces mémoriels</h2>
        <p className="text-sm text-gray-600">Lecture seule - Aucune modification autorisée</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un défunt, un auteur ou un lieu..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>

            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="all">Tous</option>
              <option value="deceased">Défunts uniquement</option>
              <option value="author">Auteurs uniquement</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            >
              <option value="all">Tous les types</option>
              <option value="recent">Décès récent</option>
              <option value="past">Décès passé</option>
            </select>
          </div>

          {searchQuery && (
            <p className="text-sm text-gray-600">
              {filteredMemorials.length} résultat{filteredMemorials.length !== 1 ? 's' : ''} trouvé{filteredMemorials.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMemorials.length === 0 ? (
              <p className="text-center text-gray-600 py-8">Aucun espace trouvé</p>
            ) : (
              filteredMemorials.map((memorial) => (
                <div
                  key={memorial.id}
                  onClick={() => setSelectedMemorialId(memorial.id)}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <img
                    src={memorial.deceased_photo_url}
                    alt={memorial.deceased_full_name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 mb-1">{memorial.deceased_full_name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{new Date(memorial.date_of_birth).toLocaleDateString('fr-FR')} - {new Date(memorial.date_of_death).toLocaleDateString('fr-FR')}</span>
                      <span>•</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        memorial.memorial_type === 'recent'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {memorial.memorial_type === 'recent' ? 'Décès récent' : 'Décès passé'}
                      </span>
                      <span>•</span>
                      <span>Créé le {new Date(memorial.created_at).toLocaleDateString('fr-FR')}</span>
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
        <h4 className="text-sm font-medium text-red-900 mb-2">Interdictions strictes</h4>
        <ul className="text-sm text-red-800 space-y-1">
          <li>• Aucune modification des avis</li>
          <li>• Aucune modification du programme</li>
          <li>• Aucune modification des messages</li>
          <li>• Lecture seule uniquement</li>
        </ul>
      </div>
    </div>
  );
}

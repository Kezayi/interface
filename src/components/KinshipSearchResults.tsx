import { useEffect, useState } from 'react';
import { Search, Users, AlertCircle, Network, UserCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  Author,
  StrictRelationType,
  buildKinshipMesh,
  DeducedRelationship,
  getRelationLabel,
  findPotentialRelativesBySurname,
  mapLegacyRelationToStrict,
} from '../lib/kinshipInference';
import { MeshOfLiving } from './MeshOfLiving';

interface Memorial {
  id: string;
  deceased_full_name: string;
  deceased_photo_url: string | null;
  date_of_birth: string;
  date_of_death: string;
  location: string | null;
  short_bio: string | null;
  author_name: string;
}

interface KinshipSearchResultsProps {
  searchQuery: string;
  onSelectMemorial: (memorialId: string) => void;
}

type SearchResultType = {
  type: 'deceased' | 'author';
  memorial: Memorial;
  authors: Author[];
  searchedAuthor?: Author;
  deducedRelationships: DeducedRelationship[];
};

export default function KinshipSearchResults({
  searchQuery,
  onSelectMemorial,
}: KinshipSearchResultsProps) {
  const [results, setResults] = useState<SearchResultType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGraph, setShowGraph] = useState<string | null>(null);

  useEffect(() => {
    performSearch();
  }, [searchQuery]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const deceasedResults = await searchByDeceased();
      const authorResults = await searchByAuthor();

      const combinedResults = [...deceasedResults, ...authorResults];
      setResults(combinedResults);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchByDeceased = async (): Promise<SearchResultType[]> => {
    const { data: memorials, error } = await supabase
      .from('memorials')
      .select('*')
      .eq('is_published', true)
      .ilike('deceased_full_name', `%${searchQuery}%`)
      .limit(10);

    if (error || !memorials) return [];

    const results: SearchResultType[] = [];

    for (const memorial of memorials) {
      const authors = await fetchAuthorsForMemorial(memorial.id);
      const deceased = {
        firstName: memorial.deceased_full_name.split(' ')[0],
        lastName: memorial.deceased_full_name.split(' ').slice(1).join(' ') || memorial.deceased_full_name,
      };

      const deducedRelationships = buildKinshipMesh(authors, deceased);

      results.push({
        type: 'deceased',
        memorial,
        authors,
        deducedRelationships,
      });
    }

    return results;
  };

  const searchByAuthor = async (): Promise<SearchResultType[]> => {
    const { data: messages, error } = await supabase
      .from('guestbook_messages')
      .select('*, memorials!inner(*)')
      .eq('is_hidden', false)
      .or(`author_name.ilike.%${searchQuery}%,author_first_name.ilike.%${searchQuery}%,author_last_name.ilike.%${searchQuery}%`);

    if (error || !messages) return [];

    const results: SearchResultType[] = [];
    const processedMemorials = new Set<string>();

    for (const message of messages) {
      const memorial = (message as any).memorials;
      if (!memorial || !memorial.is_published) continue;
      if (processedMemorials.has(memorial.id)) continue;

      processedMemorials.add(memorial.id);

      const authors = await fetchAuthorsForMemorial(memorial.id);
      const deceased = {
        firstName: memorial.deceased_full_name.split(' ')[0],
        lastName: memorial.deceased_full_name.split(' ').slice(1).join(' ') || memorial.deceased_full_name,
      };

      const searchedAuthor = authors.find(
        (a) =>
          a.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.lastName.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const deducedRelationships = buildKinshipMesh(authors, deceased);

      results.push({
        type: 'author',
        memorial,
        authors,
        searchedAuthor,
        deducedRelationships,
      });
    }

    return results;
  };

  const fetchAuthorsForMemorial = async (memorialId: string): Promise<Author[]> => {
    const { data, error } = await supabase
      .from('guestbook_messages')
      .select('*')
      .eq('memorial_id', memorialId)
      .eq('is_hidden', false);

    if (error || !data) return [];

    return data.map((msg, idx) => {
      const firstName = msg.author_first_name || msg.author_name.split(' ')[0];
      const lastName =
        msg.author_last_name ||
        msg.author_name.split(' ').slice(1).join(' ') ||
        '';

      const strictRelation = mapLegacyRelationToStrict(msg.relationship);

      return {
        id: msg.id || `${memorialId}-${idx}`,
        firstName,
        lastName,
        relationType: strictRelation || ('friend' as StrictRelationType),
        deceasedId: memorialId,
        message: msg.message_text,
        timestamp: msg.created_at,
      };
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderDeceasedResult = (result: SearchResultType) => {
    const { memorial, authors, deducedRelationships } = result;
    const deceased = {
      id: memorial.id,
      firstName: memorial.deceased_full_name.split(' ')[0],
      lastName: memorial.deceased_full_name.split(' ').slice(1).join(' ') || memorial.deceased_full_name,
    };

    const authorsByRelation = authors.reduce((acc, author) => {
      const relation = getRelationLabel(author.relationType);
      if (!acc[relation]) acc[relation] = [];
      acc[relation].push(author);
      return acc;
    }, {} as Record<string, Author[]>);

    const potentialRelatives = findPotentialRelativesBySurname(authors);

    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 shadow-md">
              {memorial.deceased_photo_url ? (
                <img
                  src={memorial.deceased_photo_url}
                  alt={memorial.deceased_full_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UserCircle className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{memorial.deceased_full_name}</h2>
              <p className="text-gray-600 mb-2">
                {formatDate(memorial.date_of_birth)} - {formatDate(memorial.date_of_death)}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>{authors.length} auteur{authors.length > 1 ? 's' : ''} de condoléances</span>
              </div>
              {deducedRelationships.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-yellow-600 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{deducedRelationships.length} lien{deducedRelationships.length > 1 ? 's' : ''} de parenté déduit{deducedRelationships.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Cercle de {deceased.firstName}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {Object.entries(authorsByRelation).map(([relation, authorList]) => (
              <div key={relation} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  {relation} ({authorList.length})
                </h4>
                <div className="space-y-1">
                  {authorList.map((author, idx) => (
                    <div key={idx} className="text-sm text-gray-700">
                      • {author.firstName} {author.lastName}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {potentialRelatives.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-gray-900">Parentés Potentielles</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Personnes partageant le même nom de famille :
              </p>
              {Array.from(potentialRelatives.entries()).map(([surname, group]) => (
                <div key={surname} className="mb-2">
                  <span className="font-semibold text-gray-900">{surname.toUpperCase()}</span>:{' '}
                  {group.map((a) => `${a.firstName}`).join(', ')}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setShowGraph(showGraph === memorial.id ? null : memorial.id)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              <Network className="w-4 h-4" />
              <span>{showGraph === memorial.id ? 'Masquer' : 'Voir'} le Maillage des Vivants</span>
            </button>
            <button
              onClick={() => onSelectMemorial(memorial.id)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Voir le mémorial
            </button>
          </div>

          {showGraph === memorial.id && (
            <div className="mt-6">
              <MeshOfLiving deceased={deceased} authors={authors} />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAuthorResult = (result: SearchResultType) => {
    const { memorial, authors, searchedAuthor, deducedRelationships } = result;

    if (!searchedAuthor) return null;

    const deceased = {
      id: memorial.id,
      firstName: memorial.deceased_full_name.split(' ')[0],
      lastName: memorial.deceased_full_name.split(' ').slice(1).join(' ') || memorial.deceased_full_name,
    };

    const relatedToSearchedAuthor = deducedRelationships.filter(
      (rel) => rel.authorA.id === searchedAuthor.id || rel.authorB.id === searchedAuthor.id
    );

    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3 mb-4">
            <UserCircle className="w-12 h-12 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {searchedAuthor.firstName} {searchedAuthor.lastName}
              </h2>
              <p className="text-sm text-gray-600">Auteur de message de condoléances</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-gray-900">
              <span className="font-semibold text-blue-600">{getRelationLabel(searchedAuthor.relationType)}</span> de{' '}
              <button
                onClick={() => onSelectMemorial(memorial.id)}
                className="font-semibold text-gray-900 hover:text-blue-600 underline"
              >
                {deceased.firstName} {deceased.lastName}
              </button>
            </p>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Network className="w-5 h-5" />
            Connexions Indirectes
          </h3>

          {relatedToSearchedAuthor.length > 0 ? (
            <div className="space-y-3 mb-6">
              {relatedToSearchedAuthor.map((rel, idx) => {
                const otherAuthor = rel.authorA.id === searchedAuthor.id ? rel.authorB : rel.authorA;
                return (
                  <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="font-semibold text-gray-900 mb-1">{rel.labelFr}</p>
                    <p className="text-sm text-gray-600 italic">{rel.explanation}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Confiance: {Math.round(rel.confidence * 100)}%
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600 mb-6">
              Aucune relation directe déduite avec les autres auteurs. Voir le maillage complet ci-dessous.
            </p>
          )}

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setShowGraph(showGraph === memorial.id ? null : memorial.id)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              <Network className="w-4 h-4" />
              <span>{showGraph === memorial.id ? 'Masquer' : 'Voir'} le Maillage Complet</span>
            </button>
            <button
              onClick={() => onSelectMemorial(memorial.id)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Voir le mémorial
            </button>
          </div>

          {showGraph === memorial.id && (
            <div className="mt-6">
              <MeshOfLiving deceased={deceased} authors={authors} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Maillage Social de Filiation</h1>
          <p className="text-gray-600">
            Recherche pour "{searchQuery}" - {results.length} résultat{results.length !== 1 ? 's' : ''}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Analyse des liens de parenté...</p>
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun résultat trouvé</h3>
            <p className="text-gray-600">Essayez de modifier votre recherche</p>
          </div>
        ) : (
          <div className="space-y-6">
            {results.map((result, idx) => (
              <div key={idx}>
                {result.type === 'deceased' ? renderDeceasedResult(result) : renderAuthorResult(result)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

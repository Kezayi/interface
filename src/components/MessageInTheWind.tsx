import { useEffect, useState } from 'react';
import { supabaseQuery } from '../lib/supabaseClient';
import { Wind } from 'lucide-react';

type RandomMessage = {
  id: string;
  message_text: string;
  author_name: string;
  relationship: string | null;
  created_at: string;
  memorial_id: string;
  deceased_full_name: string;
};

const CACHE_KEY = 'messageInTheWind';
const CACHE_DURATION = 1 * 60 * 60 * 1000;

export function MessageInTheWind({ onViewMemorial }: { onViewMemorial: (memorialId: string) => void }) {
  const [message, setMessage] = useState<RandomMessage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRandomMessage();
  }, []);

  const loadRandomMessage = async () => {
    const cached = localStorage.getItem(CACHE_KEY);

    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();

        if (now - timestamp < CACHE_DURATION) {
          setMessage(data);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error parsing cached message:', error);
      }
    }

    try {
      const { data, error } = await supabaseQuery<any>('guestbook_messages', {
        select: 'id,message_text,author_name,relationship,created_at,memorial_id,memorials!inner(deceased_full_name,is_published)',
        order: { column: 'created_at', ascending: false },
        limit: 100,
      });

      if (error || !data || data.length === 0) {
        setLoading(false);
        return;
      }

      const publishedMessages = data
        .filter((msg: any) => msg.memorials?.is_published && msg.message_text?.trim())
        .map((msg: any) => ({
          id: msg.id,
          message_text: msg.message_text,
          author_name: msg.author_name,
          relationship: msg.relationship,
          created_at: msg.created_at,
          memorial_id: msg.memorial_id,
          deceased_full_name: msg.memorials.deceased_full_name,
        }));

      if (publishedMessages.length > 0) {
        const randomIndex = Math.floor(Math.random() * publishedMessages.length);
        const randomMessage = publishedMessages[randomIndex];

        setMessage(randomMessage);

        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            data: randomMessage,
            timestamp: Date.now(),
          })
        );
      }
    } catch (error) {
      console.error('Error loading random message:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const translateRelationship = (relationship: string | null): string => {
    if (!relationship) return '';

    const translations: Record<string, string> = {
      'spouse': 'Conjoint(e)',
      'child': 'Enfant',
      'parent': 'Parent',
      'sibling': 'Frère/Sœur',
      'grandparent': 'Grand-parent',
      'grandchild': 'Petit-enfant',
      'uncle_aunt': 'Oncle/Tante',
      'nephew_niece': 'Neveu/Nièce',
      'cousin': 'Cousin(e)',
      'friend': 'Ami(e)',
      'colleague': 'Collègue',
      'neighbor': 'Voisin(e)',
      'other': 'Autre',
      'son': 'Fils',
      'daughter': 'Fille',
      'father': 'Père',
      'mother': 'Mère',
      'brother': 'Frère',
      'sister': 'Sœur',
      'grandfather': 'Grand-père',
      'grandmother': 'Grand-mère',
      'grandson': 'Petit-fils',
      'granddaughter': 'Petite-fille',
    };

    return translations[relationship] || relationship;
  };

  if (loading || !message) {
    return null;
  }

  return (
    <div className="mb-12">
      <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-lg shadow-md border border-blue-100 p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <Wind className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Ces mots du {formatDate(message.created_at)}
          </h2>
        </div>

        <blockquote className="relative">
          <div className="text-4xl text-blue-200 absolute -top-2 -left-1">"</div>
          <p className="text-gray-700 text-base md:text-lg leading-relaxed pl-6 pr-6 italic">
            {message.message_text}
          </p>
          <div className="text-4xl text-blue-200 absolute -bottom-6 right-0">"</div>
        </blockquote>

        <div className="mt-8 pt-4 border-t border-blue-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{message.author_name}</span>
                {message.relationship && (
                  <span className="text-gray-500"> · {translateRelationship(message.relationship)}</span>
                )}
              </p>
              <button
                onClick={() => onViewMemorial(message.memorial_id)}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                Pour {message.deceased_full_name}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {formatDate(message.created_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

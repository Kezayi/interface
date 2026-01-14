import { useState } from 'react';
import { supabaseShim as supabase } from '../lib/supabaseShim';
import { useAuth } from '../contexts/AuthContext';
import { GuestbookMessage } from '../lib/supabase';
import { Flame, Flower, Heart, X } from 'lucide-react';

type GuestbookProps = {
  memorialId: string;
  messages: GuestbookMessage[];
  onMessageAdded: () => void;
};

export function Guestbook({ memorialId, messages, onMessageAdded }: GuestbookProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [authorPhone, setAuthorPhone] = useState('');
  const [relationship, setRelationship] = useState<'parent' | 'child' | 'spouse' | 'sibling' | 'grandparent' | 'grandchild' | 'uncle_aunt' | 'cousin' | 'friend' | 'colleague' | 'neighbor' | 'acquaintance' | 'other'>('other');
  const [addRip, setAddRip] = useState(false);
  const [candleCount, setCandleCount] = useState(0);
  const [flowerCount, setFlowerCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'photo' | 'video' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Veuillez vous connecter pour laisser un message');
      return;
    }

    if (!message.trim() || !authorName.trim() || !authorEmail.trim() || !authorPhone.trim()) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    setLoading(true);

    try {
      const { data: messageData, error: messageError } = await supabase
        .from('guestbook_messages')
        .insert({
          memorial_id: memorialId,
          user_id: user.id,
          author_name: authorName.trim(),
          author_email: authorEmail.trim(),
          author_phone: authorPhone.trim(),
          relationship: relationship,
          message_text: message.trim(),
          rip_count: addRip ? 1 : 0,
          candle_count: candleCount,
          flower_count: flowerCount,
        })
        .select()
        .single();

      if (messageError) throw messageError;

      if (addRip && messageData) {
        await supabase.from('gestures').insert({
          memorial_id: memorialId,
          user_id: user.id,
          gesture_type: 'rip',
          is_paid: false,
          guestbook_message_id: messageData.id,
        });
      }

      if (candleCount > 0 && messageData) {
        const candleGestures = Array.from({ length: candleCount }, () => ({
          memorial_id: memorialId,
          user_id: user.id,
          gesture_type: 'candle' as const,
          is_paid: true,
          payment_amount: 5,
          guestbook_message_id: messageData.id,
        }));
        await supabase.from('gestures').insert(candleGestures);
      }

      if (flowerCount > 0 && messageData) {
        const flowerGestures = Array.from({ length: flowerCount }, () => ({
          memorial_id: memorialId,
          user_id: user.id,
          gesture_type: 'flower' as const,
          is_paid: true,
          payment_amount: 10,
          guestbook_message_id: messageData.id,
        }));
        await supabase.from('gestures').insert(flowerGestures);
      }

      setMessage('');
      setAuthorName('');
      setAuthorEmail('');
      setAuthorPhone('');
      setRelationship('other');
      setAddRip(false);
      setCandleCount(0);
      setFlowerCount(0);
      onMessageAdded();
    } catch (error) {
      console.error('Error posting message:', error);
      alert('Échec de l\'envoi du message');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRelationshipLabel = (relationship: string) => {
    const labels: Record<string, string> = {
      parent: 'Parent',
      child: 'Enfant',
      spouse: 'Époux/Épouse',
      sibling: 'Frère/Sœur',
      grandparent: 'Grand-parent',
      grandchild: 'Petit-enfant',
      uncle_aunt: 'Oncle/Tante',
      cousin: 'Cousin(e)',
      friend: 'Ami(e)',
      colleague: 'Collègue',
      neighbor: 'Voisin(e)',
      acquaintance: 'Connaissance',
      other: 'Autre',
    };
    return labels[relationship] || relationship;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Livre d'or</h2>

      <form onSubmit={handleSubmit} className="mb-6 space-y-3">
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Votre nom"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          maxLength={100}
          required
        />

        <input
          type="email"
          value={authorEmail}
          onChange={(e) => setAuthorEmail(e.target.value)}
          placeholder="Votre email (privé)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          required
        />

        <input
          type="tel"
          value={authorPhone}
          onChange={(e) => setAuthorPhone(e.target.value)}
          placeholder="Votre téléphone (privé)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          required
        />

        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value as typeof relationship)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          required
        >
          <option value="parent">Parent</option>
          <option value="child">Enfant</option>
          <option value="spouse">Époux/Épouse</option>
          <option value="sibling">Frère/Sœur</option>
          <option value="grandparent">Grand-parent</option>
          <option value="grandchild">Petit-enfant</option>
          <option value="uncle_aunt">Oncle/Tante</option>
          <option value="cousin">Cousin(e)</option>
          <option value="friend">Ami(e)</option>
          <option value="colleague">Collègue</option>
          <option value="neighbor">Voisin(e)</option>
          <option value="acquaintance">Connaissance</option>
          <option value="other">Autre</option>
        </select>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Laissez un message de condoléances..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
          maxLength={500}
          required
        />

        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Ajouter des gestes symboliques (facultatif)</p>

          <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={addRip}
              onChange={(e) => setAddRip(e.target.checked)}
              className="w-4 h-4"
            />
            <Heart className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-900">RIP (gratuit)</span>
          </label>

          <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-md">
            <Flame className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <label className="text-sm text-gray-900 block mb-1">Nombre de cierges (payant)</label>
              <input
                type="number"
                min="0"
                max="999"
                value={candleCount}
                onChange={(e) => setCandleCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border border-gray-300 rounded-md">
            <Flower className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div className="flex-1">
              <label className="text-sm text-gray-900 block mb-1">Nombre de fleurs (payant)</label>
              <input
                type="number"
                min="0"
                max="999"
                value={flowerCount}
                onChange={(e) => setFlowerCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Envoi...' : 'Publier le message'}
        </button>
      </form>

      <div className="space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Aucun message pour le moment</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="border-b border-gray-100 pb-4 last:border-b-0">
              <div className="mb-2">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="font-medium text-gray-900">{msg.author_name}</p>
                    <p className="text-xs text-gray-500">{getRelationshipLabel(msg.relationship)}</p>
                  </div>
                  <p className="text-xs text-gray-500">{formatDate(msg.created_at)}</p>
                </div>
                {(msg.rip_count > 0 || msg.candle_count > 0 || msg.flower_count > 0) && (
                  <div className="flex gap-3 mt-2 text-sm">
                    {msg.rip_count > 0 && (
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <Heart className="w-4 h-4" />
                        <span className="font-medium">RIP</span>
                      </span>
                    )}
                    {msg.candle_count > 0 && (
                      <span className="flex items-center gap-1.5 text-amber-600">
                        <Flame className="w-4 h-4" />
                        <span className="font-medium">{msg.candle_count}</span>
                        <span className="text-gray-600">cierge{msg.candle_count > 1 ? 's' : ''}</span>
                      </span>
                    )}
                    {msg.flower_count > 0 && (
                      <span className="flex items-center gap-1.5 text-rose-600">
                        <Flower className="w-4 h-4" />
                        <span className="font-medium">{msg.flower_count}</span>
                        <span className="text-gray-600">fleur{msg.flower_count > 1 ? 's' : ''}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
              <p className="text-gray-700 leading-relaxed">{msg.message_text}</p>
              {msg.media_items && msg.media_items.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {msg.media_items.map((item, index) => (
                    <div
                      key={index}
                      className="relative cursor-pointer group"
                      onClick={() => setLightboxMedia(item)}
                    >
                      {item.type === 'photo' ? (
                        <img
                          src={item.url}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-20 sm:h-24 object-cover rounded-md hover:opacity-90 transition-opacity"
                        />
                      ) : (
                        <div className="relative w-full h-20 sm:h-24">
                          <video
                            src={item.url}
                            className="w-full h-full object-cover rounded-md"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-30 rounded-md group-hover:bg-opacity-40 transition-opacity">
                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {lightboxMedia && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-95 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={() => setLightboxMedia(null)}
        >
          <button
            onClick={() => setLightboxMedia(null)}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2 bg-gray-800 bg-opacity-75 text-white rounded-full hover:bg-opacity-90 transition-opacity z-10"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="w-full max-w-full sm:max-w-6xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {lightboxMedia.type === 'photo' ? (
              <img
                src={lightboxMedia.url}
                alt="Photo agrandie"
                className="w-full h-full max-h-[90vh] object-contain mx-auto"
              />
            ) : (
              <video
                src={lightboxMedia.url}
                controls
                autoPlay
                className="w-full h-auto max-h-[90vh] mx-auto"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

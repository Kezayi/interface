import { useState, memo } from 'react';
import { GuestbookMessage } from '../lib/supabase';
import { Flame, Flower, Heart, X } from 'lucide-react';
import { useRelationshipTypes } from '../lib/useRelationshipTypes';

type GuestbookMessagesProps = {
  messages: GuestbookMessage[];
};

export const GuestbookMessages = memo(function GuestbookMessages({ messages }: GuestbookMessagesProps) {
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'photo' | 'video' } | null>(null);
  const { getLabel } = useRelationshipTypes();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-0">
      {messages.length === 0 ? (
        <p className="text-center text-gray-500 py-8">Aucun message pour le moment</p>
      ) : (
        messages.map((msg, index) => (
          <div
            key={msg.id}
            className={`p-4 border-b border-gray-200 last:border-b-0 ${
              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
            }`}
          >
            <div className="mb-2">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="font-medium text-gray-900">{msg.author_name}</p>
                  <p className="text-xs text-gray-500">{getLabel(msg.relationship)}</p>
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
              <div className="mt-4 flex justify-center">
                <div className="grid grid-cols-3 gap-3 max-w-lg">
                  {msg.media_items.map((item, index) => (
                    <div
                      key={index}
                      className="relative cursor-pointer group border-2 border-gray-300 rounded-md overflow-hidden hover:border-gray-400 transition-colors"
                      onClick={() => setLightboxMedia(item)}
                    >
                      {item.type === 'photo' ? (
                        <img
                          src={item.url}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-24 sm:h-28 object-cover hover:opacity-90 transition-opacity"
                        />
                      ) : (
                        <div className="relative w-full h-24 sm:h-28">
                          <video
                            src={item.url}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-30 group-hover:bg-opacity-40 transition-opacity">
                            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))
      )}

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
});

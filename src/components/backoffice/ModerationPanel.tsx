import { useEffect, useState } from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { supabaseShim as supabase } from '../../lib/supabaseShim';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface GuestbookMessage {
  id: string;
  memorial_id: string;
  author_name: string;
  message_text: string;
  is_hidden: boolean;
  created_at: string;
}

export function ModerationPanel() {
  const { admin, logAction } = useAdminAuth();
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<GuestbookMessage | null>(null);
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState<'injurious' | 'dignity_violation' | 'off_context' | 'commercial_exploitation'>('injurious');
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('visible');

  useEffect(() => {
    loadMessages();
  }, [filter]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('guestbook_messages')
        .select('*');

      if (filter === 'visible') {
        query = query.eq('is_hidden', false);
      } else if (filter === 'hidden') {
        query = query.eq('is_hidden', true);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHideMessage = async () => {
    if (!selectedMessage || !reason.trim()) {
      alert('Veuillez fournir une raison obligatoire');
      return;
    }

    if (!confirm('Confirmer le masquage de ce message ?')) {
      return;
    }

    setProcessing(true);
    try {
      const { error: updateError } = await supabase
        .from('guestbook_messages')
        .update({
          is_hidden: true,
          hidden_at: new Date().toISOString(),
          hidden_by: admin?.id,
        })
        .eq('id', selectedMessage.id);

      if (updateError) throw updateError;

      const { error: moderationError } = await supabase
        .from('moderation_actions')
        .insert({
          admin_id: admin?.id,
          target_type: 'guestbook_message',
          target_id: selectedMessage.id,
          action: 'hide',
          reason: reason,
          reason_category: category,
        });

      if (moderationError) throw moderationError;

      await logAction(
        'MESSAGE_HIDDEN',
        'guestbook_message',
        selectedMessage.id,
        {
          author: selectedMessage.author_name,
          category: category,
        },
        reason
      );

      setSelectedMessage({
        ...selectedMessage,
        is_hidden: true,
      });
      setReason('');
      loadMessages();
      alert('Message masqué avec succès');
    } catch (error) {
      console.error('Error hiding message:', error);
      alert('Erreur lors du masquage');
    } finally {
      setProcessing(false);
    }
  };

  const handleRestoreMessage = async () => {
    if (!selectedMessage || !reason.trim()) {
      alert('Veuillez fournir une raison obligatoire');
      return;
    }

    setProcessing(true);
    try {
      const { error: updateError } = await supabase
        .from('guestbook_messages')
        .update({
          is_hidden: false,
          hidden_at: null,
          hidden_by: null,
        })
        .eq('id', selectedMessage.id);

      if (updateError) throw updateError;

      const { error: moderationError } = await supabase
        .from('moderation_actions')
        .insert({
          admin_id: admin?.id,
          target_type: 'guestbook_message',
          target_id: selectedMessage.id,
          action: 'restore',
          reason: reason,
          reason_category: category,
        });

      if (moderationError) throw moderationError;

      await logAction(
        'MESSAGE_RESTORED',
        'guestbook_message',
        selectedMessage.id,
        {
          author: selectedMessage.author_name,
        },
        reason
      );

      setSelectedMessage({
        ...selectedMessage,
        is_hidden: false,
      });
      setReason('');
      loadMessages();
      alert('Message restauré avec succès');
    } catch (error) {
      console.error('Error restoring message:', error);
      alert('Erreur lors de la restauration');
    } finally {
      setProcessing(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      injurious: 'Propos injurieux',
      dignity_violation: 'Atteinte à la dignité',
      off_context: 'Hors contexte',
      commercial_exploitation: 'Exploitation commerciale/politique',
    };
    return labels[cat] || cat;
  };

  if (selectedMessage) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setSelectedMessage(null);
            setReason('');
          }}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Retour à la liste
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className={`p-6 border-b border-gray-200 ${selectedMessage.is_hidden ? 'bg-red-50' : 'bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-medium text-gray-900 mb-2">Message de {selectedMessage.author_name}</h2>
                <p className="text-sm text-gray-600">{new Date(selectedMessage.created_at).toLocaleString('fr-FR')}</p>
              </div>
              {selectedMessage.is_hidden ? (
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  Masqué
                </span>
              ) : (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  Visible
                </span>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contenu du message</label>
              <p className="text-gray-900 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">{selectedMessage.message_text}</p>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedMessage.is_hidden ? 'Restaurer le message' : 'Masquer le message'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="injurious">Propos injurieux</option>
                    <option value="dignity_violation">Atteinte à la dignité</option>
                    <option value="off_context">Hors contexte</option>
                    <option value="commercial_exploitation">Exploitation commerciale/politique</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raison (obligatoire)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Décrivez la raison de l'action..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    rows={4}
                  />
                </div>

                {selectedMessage.is_hidden ? (
                  <button
                    onClick={handleRestoreMessage}
                    disabled={processing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Restauration...' : 'Restaurer le message'}
                  </button>
                ) : (
                  <button
                    onClick={handleHideMessage}
                    disabled={processing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Masquage...' : 'Masquer le message'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">Modération minimaliste</h2>
        <p className="text-sm text-gray-600">
          Intervention uniquement pour contenus problématiques
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('visible')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'visible'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Messages visibles
        </button>
        <button
          onClick={() => setFilter('hidden')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'hidden'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Messages masqués
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tous les messages
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.length === 0 ? (
              <p className="text-center text-gray-600 py-8">Aucun message trouvé</p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                    message.is_hidden
                      ? 'border-red-300 bg-red-50 hover:bg-red-100'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedMessage(message)}
                >
                  {message.is_hidden ? (
                    <EyeOff className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{message.author_name}</h3>
                      {message.is_hidden && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                          Masqué
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">{message.message_text}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(message.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">Champ d'intervention</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Propos injurieux uniquement</li>
          <li>• Atteinte manifeste à la dignité</li>
          <li>• Contenu hors contexte</li>
          <li>• Exploitation politique ou commerciale</li>
        </ul>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { supabaseShim as supabase } from '../lib/supabaseShim';
import { useAuth } from '../contexts/AuthContext';
import { Flame, Flower, Heart, Image, Video, X } from 'lucide-react';
import { optimizeImage } from '../lib/imageOptimizer';
import { useRelationshipTypes } from '../lib/useRelationshipTypes';
import {
  groupRelationshipsByCategory,
  CATEGORY_LABELS,
  RelationshipTypesByCategory
} from '../lib/relationshipTypes';

type GuestbookFormProps = {
  memorialId: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export function GuestbookForm({ memorialId, onSuccess, onCancel }: GuestbookFormProps) {
  const { user } = useAuth();
  const { relationshipTypes: allRelationshipTypes, loading: loadingRelationships } = useRelationshipTypes();
  const [message, setMessage] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [authorPhone, setAuthorPhone] = useState('');
  const [relationship, setRelationship] = useState<string>('acquaintance');
  const [addRip, setAddRip] = useState(false);
  const [candleCount, setCandleCount] = useState(0);
  const [flowerCount, setFlowerCount] = useState(0);
  const [photos, setPhotos] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const relationshipTypes = useMemo(
    () => groupRelationshipsByCategory(allRelationshipTypes),
    [allRelationshipTypes]
  );

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    if (imageFiles.length === 0) return;

    if (photos.length + imageFiles.length > 3) {
      alert('Vous ne pouvez ajouter que 3 photos maximum');
      return;
    }

    for (const file of imageFiles) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`La photo ${file.name} est trop volumineuse (max 10 MB)`);
        return;
      }
    }

    setPhotos([...photos, ...imageFiles]);
    e.target.value = '';
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Veuillez sélectionner une vidéo');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('La vidéo est trop volumineuse (max 50 MB)');
      return;
    }

    setVideo(file);
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setVideo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || !authorName.trim() || !authorEmail.trim() || !authorPhone.trim()) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    setLoading(true);

    try {
      const mediaItems: Array<{ url: string; type: 'photo' | 'video' }> = [];

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const optimizedPhoto = await optimizeImage(photo, 1200, 1200, 0.85);

        const fileName = `${memorialId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('guestbook-media')
          .upload(fileName, optimizedPhoto, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Photo upload error:', uploadError);
          throw new Error(`Erreur upload photo ${i + 1}: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('guestbook-media')
          .getPublicUrl(fileName);

        mediaItems.push({ url: publicUrl, type: 'photo' });
      }

      if (video) {
        const fileExt = video.name.split('.').pop();
        const fileName = `${memorialId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('guestbook-media')
          .upload(fileName, video, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Video upload error:', uploadError);
          throw new Error(`Erreur upload vidéo: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('guestbook-media')
          .getPublicUrl(fileName);

        mediaItems.push({ url: publicUrl, type: 'video' });
      }

      console.log('All media uploaded. Inserting message into database...');

      const nameParts = authorName.trim().split(' ');
      const firstName = nameParts[0] || authorName.trim();
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      const { data: messageData, error: messageError } = await supabase
        .from('guestbook_messages')
        .insert({
          memorial_id: memorialId,
          user_id: user?.id || null,
          author_name: authorName.trim(),
          author_first_name: firstName,
          author_last_name: lastName,
          author_email: authorEmail.trim(),
          author_phone: authorPhone.trim(),
          relationship: relationship,
          message_text: message.trim(),
          rip_count: addRip ? 1 : 0,
          candle_count: candleCount,
          flower_count: flowerCount,
          media_items: mediaItems,
        })
        .select()
        .single();

      if (messageError) {
        console.error('Database insert error:', messageError);
        throw new Error(`Erreur base de données: ${messageError.message}`);
      }

      console.log('Message inserted successfully:', messageData);

      if (addRip && messageData) {
        console.log('Inserting RIP gesture...');
        const { error: ripError } = await supabase.from('gestures').insert({
          memorial_id: memorialId,
          user_id: user?.id || null,
          gesture_type: 'rip',
          is_paid: false,
          guestbook_message_id: messageData.id,
        });
        if (ripError) {
          console.error('RIP gesture error:', ripError);
          throw new Error(`Erreur geste RIP: ${ripError.message}`);
        }
      }

      if (candleCount > 0 && messageData) {
        console.log('Inserting candle gestures...');
        const candleGestures = Array.from({ length: candleCount }, () => ({
          memorial_id: memorialId,
          user_id: user?.id || null,
          gesture_type: 'candle' as const,
          is_paid: true,
          payment_amount: 5,
          guestbook_message_id: messageData.id,
        }));
        const { error: candleError } = await supabase.from('gestures').insert(candleGestures);
        if (candleError) {
          console.error('Candle gesture error:', candleError);
          throw new Error(`Erreur geste cierge: ${candleError.message}`);
        }
      }

      if (flowerCount > 0 && messageData) {
        console.log('Inserting flower gestures...');
        const flowerGestures = Array.from({ length: flowerCount }, () => ({
          memorial_id: memorialId,
          user_id: user?.id || null,
          gesture_type: 'flower' as const,
          is_paid: true,
          payment_amount: 10,
          guestbook_message_id: messageData.id,
        }));
        const { error: flowerError } = await supabase.from('gestures').insert(flowerGestures);
        if (flowerError) {
          console.error('Flower gesture error:', flowerError);
          throw new Error(`Erreur geste fleur: ${flowerError.message}`);
        }
      }

      console.log('All operations completed successfully');

      setMessage('');
      setAuthorName('');
      setAuthorEmail('');
      setAuthorPhone('');
      setRelationship('acquaintance');
      setAddRip(false);
      setCandleCount(0);
      setFlowerCount(0);
      setPhotos([]);
      setVideo(null);
      onSuccess();
    } catch (error: any) {
      console.error('Error posting message:', error);
      const errorMessage = error?.message || error?.error_description || error?.toString() || 'Échec de l\'envoi du message';
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-safe">
      <input
        type="text"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        placeholder="Votre nom"
        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 text-base touch-manipulation"
        maxLength={100}
        required
      />

      <input
        type="email"
        value={authorEmail}
        onChange={(e) => setAuthorEmail(e.target.value)}
        placeholder="Votre email (privé)"
        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 text-base touch-manipulation"
        required
      />

      <input
        type="tel"
        value={authorPhone}
        onChange={(e) => setAuthorPhone(e.target.value)}
        placeholder="Votre téléphone (privé)"
        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 text-base touch-manipulation"
        required
      />

      <div>
        <p className="text-sm text-gray-600 mb-2">
          Le/La défunt(e) était quoi pour vous ?
        </p>
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 text-base touch-manipulation"
          required
          disabled={loadingRelationships}
        >
          {loadingRelationships ? (
            <option value="">Chargement...</option>
          ) : (
            <>
              {(Object.keys(relationshipTypes) as Array<keyof RelationshipTypesByCategory>).map((category) => (
                relationshipTypes[category].length > 0 && (
                  <optgroup key={category} label={CATEGORY_LABELS[category]}>
                    {relationshipTypes[category].map((relType) => (
                      <option key={relType.code} value={relType.code}>
                        {relType.label_fr}
                      </option>
                    ))}
                  </optgroup>
                )
              ))}
            </>
          )}
        </select>
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Laissez un message de condoléances..."
        rows={4}
        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none text-base touch-manipulation"
        maxLength={500}
        required
      />

      <div className="space-y-4">
        <p className="text-base font-medium text-gray-700">Ajouter des médias (facultatif)</p>

        <div className="space-y-3">
          <label className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-md transition-colors touch-manipulation ${
            photos.length >= 3
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
              : 'border-gray-300 cursor-pointer hover:bg-gray-50 active:bg-gray-100'
          }`}>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoSelect}
              disabled={photos.length >= 3}
              className="hidden"
            />
            <Image className="w-5 h-5 text-gray-500" />
            <span className="text-base text-gray-600">
              Ajouter des photos ({photos.length}/3)
            </span>
          </label>

          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-20 sm:h-24 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 p-1 bg-gray-900 bg-opacity-75 text-white rounded-full hover:bg-opacity-90 transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-md transition-colors touch-manipulation ${
            video
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
              : 'border-gray-300 cursor-pointer hover:bg-gray-50 active:bg-gray-100'
          }`}>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              disabled={!!video}
              className="hidden"
            />
            <Video className="w-5 h-5 text-gray-500" />
            <span className="text-base text-gray-600">
              Ajouter une vidéo {video ? '(1/1)' : '(0/1)'}
            </span>
          </label>

          {video && (
            <div className="relative group">
              <video
                src={URL.createObjectURL(video)}
                className="w-full h-24 sm:h-32 object-cover rounded-md"
              />
              <button
                type="button"
                onClick={removeVideo}
                className="absolute top-2 right-2 p-1.5 bg-gray-900 bg-opacity-75 text-white rounded-full hover:bg-opacity-90 transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="border-t pt-4 space-y-4">
        <p className="text-base font-medium text-gray-700 mb-2">Ajouter des gestes symboliques (facultatif)</p>

        <label className="flex items-center gap-3 p-4 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 active:bg-gray-100 touch-manipulation">
          <input
            type="checkbox"
            checked={addRip}
            onChange={(e) => setAddRip(e.target.checked)}
            className="w-5 h-5"
          />
          <Heart className="w-5 h-5 text-gray-600" />
          <span className="text-base text-gray-900">RIP (gratuit)</span>
        </label>

        <div className="flex items-center gap-3 p-4 border border-gray-300 rounded-md">
          <Flame className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <label className="text-base text-gray-900 block mb-2">Nombre de cierges (payant)</label>
            <input
              type="number"
              min="0"
              max="999"
              value={candleCount}
              onChange={(e) => setCandleCount(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 text-base touch-manipulation"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 border border-gray-300 rounded-md">
          <Flower className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <div className="flex-1">
            <label className="text-base text-gray-900 block mb-2">Nombre de fleurs (payant)</label>
            <input
              type="number"
              min="0"
              max="999"
              value={flowerCount}
              onChange={(e) => setFlowerCount(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 text-base touch-manipulation"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-6 pb-4">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:flex-1 bg-gray-200 text-gray-700 py-4 px-6 rounded-md hover:bg-gray-300 active:bg-gray-400 transition-colors text-base font-medium touch-manipulation"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:flex-1 bg-gray-900 text-white py-4 px-6 rounded-md hover:bg-gray-800 active:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium touch-manipulation"
        >
          {loading ? 'Envoi en cours...' : 'Publier le message'}
        </button>
      </div>
    </form>
  );
}

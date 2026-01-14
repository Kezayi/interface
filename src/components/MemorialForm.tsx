import { useState } from 'react';
import { supabaseShim as supabase } from '../lib/supabaseShim';
import { useAuth } from '../contexts/AuthContext';
import { Upload, MapPin, Plus, Trash2 } from 'lucide-react';
import { PhoneVerification } from './PhoneVerification';
import { optimizeImage } from '../lib/imageOptimizer';
import { memorialCache } from '../lib/memorialCache';

type MemorialFormProps = {
  onSuccess: (memorialId: string) => void;
  onCancel: () => void;
};

type FuneralStep = {
  type: string;
  description: string;
  time?: string;
  location?: string;
};

type FormStep = 'phone-verification' | 'memorial-details';

export function MemorialForm({ onSuccess, onCancel }: MemorialFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<FormStep>('memorial-details');
  const [verifiedPhone, setVerifiedPhone] = useState('');

  const [formData, setFormData] = useState({
    memorial_type: 'recent' as 'recent' | 'past',
    author_name: '',
    deceased_full_name: '',
    deceased_photo_url: '',
    date_of_birth: '',
    date_of_death: '',
    announcement_text: '',
    heir_email: '',
    house_address_text: '',
    house_gps_lat: '',
    house_gps_lng: '',
    funeral_date: '',
    funeral_time: '',
    funeral_location: '',
  });
  const [funeralSteps, setFuneralSteps] = useState<FuneralStep[]>([]);
  const [gettingLocation, setGettingLocation] = useState(false);

  const handlePhoneVerified = (phoneNumber: string) => {
    setVerifiedPhone(phoneNumber);
    setCurrentStep('memorial-details');
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const optimizedFile = await optimizeImage(file);

      const fileName = `${user.id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('memorial-photos')
        .upload(fileName, optimizedFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        setError('Erreur lors du téléchargement de la photo');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('memorial-photos')
        .getPublicUrl(fileName);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(optimizedFile);

      setFormData({ ...formData, deceased_photo_url: publicUrl });
    } catch (err) {
      console.error('Error handling photo:', err);
      setError('Erreur lors du traitement de la photo');
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          house_gps_lat: position.coords.latitude.toFixed(6),
          house_gps_lng: position.coords.longitude.toFixed(6),
        });
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Impossible d\'obtenir votre localisation');
        setGettingLocation(false);
      }
    );
  };

  const addFuneralStep = () => {
    setFuneralSteps([...funeralSteps, { type: '', description: '', time: '', location: '' }]);
  };

  const updateFuneralStep = (index: number, field: keyof FuneralStep, value: string) => {
    const updated = [...funeralSteps];
    updated[index] = { ...updated[index], [field]: value };
    setFuneralSteps(updated);
  };

  const removeFuneralStep = (index: number) => {
    setFuneralSteps(funeralSteps.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const memorialData: any = {
        author_id: user.id,
        memorial_type: formData.memorial_type,
        author_name: formData.author_name,
        author_phone: verifiedPhone || null,
        author_phone_verified: verifiedPhone ? true : false,
        deceased_full_name: formData.deceased_full_name,
        deceased_photo_url: formData.deceased_photo_url,
        date_of_birth: formData.date_of_birth,
        date_of_death: formData.date_of_death,
        announcement_text: formData.announcement_text,
        heir_email: formData.heir_email,
      };

      if (formData.memorial_type === 'recent') {
        if (formData.house_address_text) {
          memorialData.house_address_text = formData.house_address_text;
        }
        if (formData.house_gps_lat && formData.house_gps_lng) {
          memorialData.house_gps_lat = parseFloat(formData.house_gps_lat);
          memorialData.house_gps_lng = parseFloat(formData.house_gps_lng);
        }
        if (formData.funeral_date) {
          memorialData.funeral_date = formData.funeral_date;
        }
        if (formData.funeral_time) {
          memorialData.funeral_time = formData.funeral_time;
        }
        if (formData.funeral_location) {
          memorialData.funeral_location = formData.funeral_location;
        }
        if (funeralSteps.length > 0) {
          memorialData.funeral_steps = funeralSteps.filter(step => step.type && step.description);
        }
      }

      const { data, error: insertError } = await supabase
        .from('memorials')
        .insert(memorialData)
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        memorialCache.clear();
        onSuccess(data.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la création du mémorial');
    } finally {
      setLoading(false);
    }
  };

  if (currentStep === 'phone-verification') {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <PhoneVerification
          onVerified={handlePhoneVerified}
          onCancel={onCancel}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-light text-gray-900">Créer un espace mémorial</h2>
          <div className="mt-2 flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">
            <span className="font-medium">Numéro vérifié:</span>
            <span>{verifiedPhone}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type de mémorial <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                <input
                  type="radio"
                  name="memorial_type"
                  value="recent"
                  checked={formData.memorial_type === 'recent'}
                  onChange={(e) => setFormData({ ...formData, memorial_type: e.target.value as 'recent' | 'past' })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Décès récent</p>
                  <p className="text-sm text-gray-600 mt-1">Les funérailles n'ont pas encore eu lieu. Inclut la maison du deuil et le programme funéraire.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                <input
                  type="radio"
                  name="memorial_type"
                  value="past"
                  checked={formData.memorial_type === 'past'}
                  onChange={(e) => setFormData({ ...formData, memorial_type: e.target.value as 'recent' | 'past' })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Décès passé</p>
                  <p className="text-sm text-gray-600 mt-1">Les funérailles ont déjà eu lieu. Archive mémorial uniquement.</p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="author_name" className="block text-sm font-medium text-gray-700 mb-1">
              Votre nom (auteur de l'avis) <span className="text-red-500">*</span>
            </label>
            <input
              id="author_name"
              type="text"
              value={formData.author_name}
              onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Votre nom complet"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Ce nom sera affiché publiquement sous l'avis de décès</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo du défunt <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
                required
              />
              <label
                htmlFor="photo-upload"
                className="block w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden"
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Cliquer pour télécharger la photo</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="deceased_full_name" className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <input
              id="deceased_full_name"
              type="text"
              value={formData.deceased_full_name}
              onChange={(e) => setFormData({ ...formData, deceased_full_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1">
                Date de naissance <span className="text-red-500">*</span>
              </label>
              <input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                required
              />
            </div>

            <div>
              <label htmlFor="date_of_death" className="block text-sm font-medium text-gray-700 mb-1">
                Date de décès <span className="text-red-500">*</span>
              </label>
              <input
                id="date_of_death"
                type="date"
                value={formData.date_of_death}
                onChange={(e) => setFormData({ ...formData, date_of_death: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="announcement_text" className="block text-sm font-medium text-gray-700 mb-1">
              Annonce de décès <span className="text-red-500">*</span>
            </label>
            <textarea
              id="announcement_text"
              value={formData.announcement_text}
              onChange={(e) => setFormData({ ...formData, announcement_text: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              placeholder="Brève annonce du décès..."
              required
            />
          </div>

          <div>
            <label htmlFor="heir_email" className="block text-sm font-medium text-gray-700 mb-1">
              Email de l'héritier numérique <span className="text-red-500">*</span>
            </label>
            <input
              id="heir_email"
              type="email"
              value={formData.heir_email}
              onChange={(e) => setFormData({ ...formData, heir_email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="heritier@example.com"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Cette personne pourra gérer le mémorial si vous devenez indisponible
            </p>
          </div>

          {formData.memorial_type === 'recent' && (
            <div className="space-y-4 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900">Maison du deuil (optionnel)</h3>

              <div>
                <label htmlFor="house_address_text" className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse de la maison du deuil
                </label>
                <input
                  id="house_address_text"
                  type="text"
                  value={formData.house_address_text}
                  onChange={(e) => setFormData({ ...formData, house_address_text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="123 Rue Exemple, Ville, Code Postal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Localisation GPS
                </label>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="mb-3 flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">
                    {gettingLocation ? 'Obtention de la position...' : 'Utiliser ma position actuelle'}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="house_gps_lat" className="block text-xs text-gray-600 mb-1">
                      Latitude
                    </label>
                    <input
                      id="house_gps_lat"
                      type="text"
                      value={formData.house_gps_lat}
                      onChange={(e) => setFormData({ ...formData, house_gps_lat: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                      placeholder="45.508888"
                    />
                  </div>
                  <div>
                    <label htmlFor="house_gps_lng" className="block text-xs text-gray-600 mb-1">
                      Longitude
                    </label>
                    <input
                      id="house_gps_lng"
                      type="text"
                      value={formData.house_gps_lng}
                      onChange={(e) => setFormData({ ...formData, house_gps_lng: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                      placeholder="-73.561668"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Permet aux visiteurs d'obtenir un itinéraire vers la maison du deuil
                </p>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Programme des funérailles (optionnel)</h3>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="funeral_date" className="block text-sm font-medium text-gray-700 mb-1">
                      Date des funérailles
                    </label>
                    <input
                      id="funeral_date"
                      type="date"
                      value={formData.funeral_date}
                      onChange={(e) => setFormData({ ...formData, funeral_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>

                  <div>
                    <label htmlFor="funeral_time" className="block text-sm font-medium text-gray-700 mb-1">
                      Heure des funérailles
                    </label>
                    <input
                      id="funeral_time"
                      type="time"
                      value={formData.funeral_time}
                      onChange={(e) => setFormData({ ...formData, funeral_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>

                  <div>
                    <label htmlFor="funeral_location" className="block text-sm font-medium text-gray-700 mb-1">
                      Lieu des funérailles
                    </label>
                    <input
                      id="funeral_location"
                      type="text"
                      value={formData.funeral_location}
                      onChange={(e) => setFormData({ ...formData, funeral_location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="Nom du lieu"
                    />
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Étapes du programme funéraire
                      </label>
                      <button
                        type="button"
                        onClick={addFuneralStep}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter une étape
                      </button>
                    </div>

                    {funeralSteps.length > 0 && (
                      <div className="space-y-4">
                        {funeralSteps.map((step, index) => (
                          <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-gray-700">Étape {index + 1}</span>
                              <button
                                type="button"
                                onClick={() => removeFuneralStep(index)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="space-y-3">
                              <input
                                type="text"
                                value={step.type}
                                onChange={(e) => updateFuneralStep(index, 'type', e.target.value)}
                                placeholder="Type d'étape (ex: Veillée, Messe, Inhumation)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                              />

                              <textarea
                                value={step.description}
                                onChange={(e) => updateFuneralStep(index, 'description', e.target.value)}
                                placeholder="Description de l'étape"
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm resize-none"
                              />

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  value={step.time || ''}
                                  onChange={(e) => updateFuneralStep(index, 'time', e.target.value)}
                                  placeholder="Heure (ex: 14h30)"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                                />

                                <input
                                  type="text"
                                  value={step.location || ''}
                                  onChange={(e) => updateFuneralStep(index, 'location', e.target.value)}
                                  placeholder="Lieu (optionnel)"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : 'Créer le mémorial'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

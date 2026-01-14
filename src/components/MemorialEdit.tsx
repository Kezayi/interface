import { useState } from 'react';
import { supabaseShim as supabase } from '../lib/supabaseShim';
import { useAuth } from '../contexts/AuthContext';
import { Memorial } from '../lib/supabase';
import { Upload, X, MapPin, Plus, Trash2 } from 'lucide-react';

type MemorialEditProps = {
  memorial: Memorial;
  onSave: () => void;
  onCancel: () => void;
};

type FuneralStep = {
  type: string;
  description: string;
  time?: string;
  location?: string;
};

export function MemorialEdit({ memorial, onSave, onCancel }: MemorialEditProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string>(memorial.deceased_photo_url);
  const [gettingLocation, setGettingLocation] = useState(false);

  const [formData, setFormData] = useState({
    deceased_full_name: memorial.deceased_full_name,
    deceased_photo_url: memorial.deceased_photo_url,
    date_of_birth: memorial.date_of_birth,
    date_of_death: memorial.date_of_death,
    announcement_text: memorial.announcement_text,
    house_address_text: memorial.house_address_text || '',
    house_gps_lat: memorial.house_gps_lat?.toString() || '',
    house_gps_lng: memorial.house_gps_lng?.toString() || '',
    funeral_date: memorial.funeral_date || '',
    funeral_time: memorial.funeral_time || '',
    funeral_location: memorial.funeral_location || '',
  });

  const [funeralSteps, setFuneralSteps] = useState<FuneralStep[]>(
    (memorial.funeral_steps as FuneralStep[]) || []
  );

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        setFormData({ ...formData, deceased_photo_url: result });
      };
      reader.readAsDataURL(file);
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
      const updateData: any = {
        deceased_full_name: formData.deceased_full_name,
        deceased_photo_url: formData.deceased_photo_url,
        date_of_birth: formData.date_of_birth,
        date_of_death: formData.date_of_death,
        announcement_text: formData.announcement_text,
        house_address_text: formData.house_address_text || null,
        funeral_date: formData.funeral_date || null,
        funeral_time: formData.funeral_time || null,
        funeral_location: formData.funeral_location || null,
        funeral_steps: funeralSteps.filter(step => step.type && step.description),
        updated_at: new Date().toISOString(),
      };

      if (formData.house_gps_lat && formData.house_gps_lng) {
        updateData.house_gps_lat = parseFloat(formData.house_gps_lat);
        updateData.house_gps_lng = parseFloat(formData.house_gps_lng);
      } else {
        updateData.house_gps_lat = null;
        updateData.house_gps_lng = null;
      }

      const { error: updateError } = await supabase
        .from('memorials')
        .update(updateData)
        .eq('id', memorial.id);

      if (updateError) throw updateError;

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la mise à jour du mémorial');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-light text-gray-900">Modifier le mémorial</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo du défunt
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
              />
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Aperçu"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="absolute bottom-3 right-3 bg-white px-4 py-2 rounded-md shadow-sm border border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Changer</span>
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="photo-upload"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Cliquez pour choisir une photo</span>
                </label>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom complet du défunt <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.deceased_full_name}
              onChange={(e) => setFormData({ ...formData, deceased_full_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de naissance <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de décès <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date_of_death}
                onChange={(e) => setFormData({ ...formData, date_of_death: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Texte de l'annonce <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.announcement_text}
              onChange={(e) => setFormData({ ...formData, announcement_text: e.target.value })}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              required
            />
          </div>

          {memorial.memorial_type === 'recent' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse de la maison du deuil
                </label>
                <input
                  type="text"
                  value={formData.house_address_text}
                  onChange={(e) => setFormData({ ...formData, house_address_text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="Adresse complète"
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
                    <label htmlFor="edit_house_gps_lat" className="block text-xs text-gray-600 mb-1">
                      Latitude
                    </label>
                    <input
                      id="edit_house_gps_lat"
                      type="text"
                      value={formData.house_gps_lat}
                      onChange={(e) => setFormData({ ...formData, house_gps_lat: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                      placeholder="45.508888"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit_house_gps_lng" className="block text-xs text-gray-600 mb-1">
                      Longitude
                    </label>
                    <input
                      id="edit_house_gps_lng"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date des funérailles
                </label>
                <input
                  type="date"
                  value={formData.funeral_date}
                  onChange={(e) => setFormData({ ...formData, funeral_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure des funérailles
                </label>
                <input
                  type="time"
                  value={formData.funeral_time}
                  onChange={(e) => setFormData({ ...formData, funeral_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lieu des funérailles
                </label>
                <input
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
                    Étapes du programme funéraire (optionnel)
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
            </>
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
              className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

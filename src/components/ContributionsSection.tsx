import { useEffect, useState } from 'react';
import { supabaseShim as supabase } from '../lib/supabaseShim';
import { useAuth } from '../contexts/AuthContext';
import { DollarSign } from 'lucide-react';

type ContributionsSectionProps = {
  memorialId: string;
};

export function ContributionsSection({ memorialId }: ContributionsSectionProps) {
  const { user } = useAuth();
  const [contributionCount] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    contributor_name: '',
    contributor_phone: '',
    amount: '',
  });

  useEffect(() => {
    loadContributionCount();
  }, [memorialId]);

  const loadContributionCount = async () => {
    try {
      const { error } = await supabase
        .from('funeral_contributions')
        .select('id', { count: 'exact', head: true })
        .eq('memorial_id', memorialId)
        .eq('payment_status', 'completed');

      if (error) throw error;
    } catch (error) {
      console.error('Error loading contributions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Veuillez vous connecter pour contribuer');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('funeral_contributions').insert({
        memorial_id: memorialId,
        contributor_user_id: user.id,
        contributor_name: formData.contributor_name.trim(),
        contributor_phone: formData.contributor_phone.trim(),
        amount: parseFloat(formData.amount),
        payment_status: 'completed',
      });

      if (error) throw error;

      setFormData({ contributor_name: '', contributor_phone: '', amount: '' });
      setShowForm(false);
      loadContributionCount();
      alert('Merci pour votre contribution');
    } catch (error) {
      console.error('Error submitting contribution:', error);
      alert('Échec de l\'envoi de la contribution');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Contributions funéraires</h2>
        <div className="flex items-center gap-2 text-gray-600">
          <DollarSign className="w-5 h-5" />
          <span className="text-sm">{contributionCount} contributions</span>
        </div>
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
        >
          Faire une contribution
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="contributor_name" className="block text-sm font-medium text-gray-700 mb-1">
              Votre nom
            </label>
            <input
              id="contributor_name"
              type="text"
              value={formData.contributor_name}
              onChange={(e) => setFormData({ ...formData, contributor_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
            />
          </div>

          <div>
            <label htmlFor="contributor_phone" className="block text-sm font-medium text-gray-700 mb-1">
              Numéro de téléphone
            </label>
            <input
              id="contributor_phone"
              type="tel"
              value={formData.contributor_phone}
              onChange={(e) => setFormData({ ...formData, contributor_phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="+1234567890"
              required
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              Montant
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="1"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Traitement...' : 'Contribuer'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

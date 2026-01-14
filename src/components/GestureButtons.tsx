import { useState } from 'react';
import { supabaseShim as supabase } from '../lib/supabaseShim';
import { useAuth } from '../contexts/AuthContext';
import { Heart } from 'lucide-react';

type GestureButtonsProps = {
  memorialId: string;
  onGestureAdded: () => void;
};

export function GestureButtons({ memorialId, onGestureAdded }: GestureButtonsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const addGesture = async (gestureType: 'rip' | 'candle' | 'flower') => {
    if (!user) {
      alert('Veuillez vous connecter pour ajouter un geste');
      return;
    }

    setLoading(gestureType);

    try {
      const isPaid = gestureType !== 'rip';

      const { error } = await supabase.from('gestures').insert({
        memorial_id: memorialId,
        user_id: user.id,
        gesture_type: gestureType,
        is_paid: isPaid,
        payment_amount: isPaid ? (gestureType === 'candle' ? 5 : 10) : null,
      });

      if (error) throw error;

      onGestureAdded();
    } catch (error) {
      console.error('Error adding gesture:', error);
      alert('Échec de l\'ajout du geste');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex justify-center">
      <button
        onClick={() => addGesture('rip')}
        disabled={loading !== null}
        className="flex items-center gap-2 py-3 px-6 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 touch-manipulation"
      >
        <Heart className="w-5 h-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-900">RIP</span>
        {loading === 'rip' && <span className="text-xs">(ajout...)</span>}
      </button>
    </div>
  );
}

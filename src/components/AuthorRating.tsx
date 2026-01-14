import React, { useState, useEffect } from 'react';
import { ThumbsUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AuthorRatingProps {
  memorialId: string;
  authorId: string;
}

interface LegitimacyData {
  count: number;
  has_clicked: boolean;
}

function getAnonymousId(): string {
  let anonymousId = localStorage.getItem('floorence_anonymous_id');
  if (!anonymousId) {
    anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('floorence_anonymous_id', anonymousId);
  }
  return anonymousId;
}

export default function AuthorRating({ memorialId, authorId }: AuthorRatingProps) {
  const { user } = useAuth();
  const [legitimacy, setLegitimacy] = useState<LegitimacyData>({ count: 0, has_clicked: false });
  const [loading, setLoading] = useState(true);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    loadLegitimacy();
  }, [memorialId, authorId, user]);

  const loadLegitimacy = async () => {
    try {
      const userId = user?.id || null;
      const anonymousId = userId ? null : getAnonymousId();

      const { data, error } = await supabase
        .rpc('get_author_legitimacy_for_memorial', {
          p_memorial_id: memorialId,
          p_author_id: authorId,
          p_user_id: userId,
          p_anonymous_id: anonymousId
        });

      if (error) throw error;
      if (data) {
        setLegitimacy(data);
      }
    } catch (error) {
      console.error('Error loading legitimacy:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async () => {
    if (clicking) return;

    setClicking(true);
    try {
      const userId = user?.id || null;
      const anonymousId = userId ? null : getAnonymousId();

      const { data, error } = await supabase
        .rpc('toggle_author_legitimacy', {
          p_memorial_id: memorialId,
          p_author_id: authorId,
          p_user_id: userId,
          p_anonymous_id: anonymousId
        });

      if (error) throw error;
      if (data) {
        setLegitimacy(data);
      }
    } catch (error: any) {
      console.error('Error toggling legitimacy:', error);
      alert(error.message || 'Erreur lors de la confirmation');
    } finally {
      setClicking(false);
    }
  };

  if (loading) {
    return <span className="text-xs text-gray-500 italic">Légitimité ...</span>;
  }

  return (
    <button
      onClick={handleClick}
      disabled={clicking}
      className={`inline-flex items-center gap-1 text-xs transition-colors ${
        legitimacy.has_clicked
          ? 'text-blue-600 font-medium'
          : 'text-gray-500 hover:text-blue-600'
      } ${clicking ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
      title={legitimacy.has_clicked ? 'Vous avez confirmé la légitimité' : 'Confirmer la légitimité de cet auteur'}
    >
      <ThumbsUp className={`h-3 w-3 ${legitimacy.has_clicked ? 'fill-current' : ''}`} />
      <span>Légitimité {legitimacy.count}</span>
    </button>
  );
}

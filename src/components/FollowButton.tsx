import { useEffect, useState } from 'react';
import { supabaseShim as supabase } from '../lib/supabaseShim';
import { useAuth } from '../contexts/AuthContext';
import { Bell, BellOff, X } from 'lucide-react';

type FollowButtonProps = {
  memorialId: string;
};

export function FollowButton({ memorialId }: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [followerName, setFollowerName] = useState('');
  const [followerEmail, setFollowerEmail] = useState('');
  const [followerPhone, setFollowerPhone] = useState('');

  useEffect(() => {
    checkFollowStatus();
  }, [user, memorialId]);

  const checkFollowStatus = async () => {
    try {
      if (user) {
        const { data } = await supabase
          .from('memorial_followers')
          .select('id')
          .eq('memorial_id', memorialId)
          .eq('user_id', user.id)
          .maybeSingle();

        setIsFollowing(!!data);
      } else {
        const storedEmail = localStorage.getItem(`follow_email_${memorialId}`);
        if (storedEmail) {
          const { data } = await supabase
            .from('memorial_followers')
            .select('id')
            .eq('memorial_id', memorialId)
            .eq('follower_email', storedEmail)
            .maybeSingle();

          setIsFollowing(!!data);
        }
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollowClick = () => {
    if (user) {
      toggleFollow();
    } else {
      if (isFollowing) {
        handleUnfollowAnonymous();
      } else {
        setShowModal(true);
      }
    }
  };

  const toggleFollow = async () => {
    setLoading(true);

    try {
      if (isFollowing) {
        await supabase
          .from('memorial_followers')
          .delete()
          .eq('memorial_id', memorialId)
          .eq('user_id', user!.id);

        setIsFollowing(false);
      } else {
        await supabase.from('memorial_followers').insert({
          memorial_id: memorialId,
          user_id: user!.id,
          notify_funeral_updates: true,
          notify_funeral_reminder: true,
        });

        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert('Échec de la mise à jour du statut');
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousFollow = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!followerName.trim() || !followerEmail.trim() || !followerPhone.trim()) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      await supabase.from('memorial_followers').insert({
        memorial_id: memorialId,
        follower_name: followerName.trim(),
        follower_email: followerEmail.trim(),
        follower_phone: followerPhone.trim(),
        notify_funeral_updates: true,
        notify_funeral_reminder: true,
      });

      localStorage.setItem(`follow_email_${memorialId}`, followerEmail.trim());
      setIsFollowing(true);
      setShowModal(false);
      setFollowerName('');
      setFollowerEmail('');
      setFollowerPhone('');
    } catch (error) {
      console.error('Error following memorial:', error);
      alert('Échec du suivi du mémorial');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollowAnonymous = async () => {
    const storedEmail = localStorage.getItem(`follow_email_${memorialId}`);
    if (!storedEmail) return;

    setLoading(true);

    try {
      await supabase
        .from('memorial_followers')
        .delete()
        .eq('memorial_id', memorialId)
        .eq('follower_email', storedEmail);

      localStorage.removeItem(`follow_email_${memorialId}`);
      setIsFollowing(false);
    } catch (error) {
      console.error('Error unfollowing:', error);
      alert('Échec de l\'arrêt du suivi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleFollowClick}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors disabled:opacity-50 touch-manipulation ${
          isFollowing
            ? 'bg-gray-900 text-white hover:bg-gray-800'
            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        }`}
      >
        {isFollowing ? (
          <>
            <Bell className="w-4 h-4" />
            <span className="text-sm font-medium">Suivi</span>
          </>
        ) : (
          <>
            <BellOff className="w-4 h-4" />
            <span className="text-sm font-medium">Suivre</span>
          </>
        )}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-medium text-gray-900">Suivre ce mémorial</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAnonymousFollow} className="p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Recevez des notifications pour les mises à jour et rappels des funérailles.
              </p>
              <input
                type="text"
                value={followerName}
                onChange={(e) => setFollowerName(e.target.value)}
                placeholder="Votre nom"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                required
              />
              <input
                type="email"
                value={followerEmail}
                onChange={(e) => setFollowerEmail(e.target.value)}
                placeholder="Votre email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                required
              />
              <input
                type="tel"
                value={followerPhone}
                onChange={(e) => setFollowerPhone(e.target.value)}
                placeholder="Votre téléphone"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                required
              />
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors touch-manipulation"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 touch-manipulation"
                >
                  {loading ? 'Envoi...' : 'Suivre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

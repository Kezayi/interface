import { useEffect, useState } from 'react';
import { Search, Flower2, Flame, Heart, ArrowUpDown } from 'lucide-react';
import { supabaseShim as supabase } from '../../lib/supabaseShim';
import { Memorial } from '../../lib/supabase';

interface GestureStats {
  memorial_id: string;
  memorial_name: string;
  deceased_photo_url: string;
  total_rip: number;
  total_candles: number;
  total_flowers: number;
  total_gestures: number;
}

export function SymbolicGesturesSupervision() {
  const [stats, setStats] = useState<GestureStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadGestureStats();
  }, []);

  const loadGestureStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_gesture_stats_by_memorial');

      if (error) {
        console.error('Error loading gesture stats:', error);
        return;
      }

      const formattedStats: GestureStats[] = (data || []).map((row: any) => ({
        memorial_id: row.memorial_id,
        memorial_name: row.memorial_name,
        deceased_photo_url: row.deceased_photo_url,
        total_rip: Number(row.total_rip || 0),
        total_candles: Number(row.total_candles || 0),
        total_flowers: Number(row.total_flowers || 0),
        total_gestures: Number(row.total_gestures || 0),
      }));

      setStats(formattedStats);
    } catch (error) {
      console.error('Error loading gesture stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStats = stats
    .filter(stat =>
      stat.memorial_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.total_gestures - a.total_gestures;
      } else {
        return a.total_gestures - b.total_gestures;
      }
    });

  const totalGlobalGestures = stats.reduce((sum, stat) => sum + stat.total_gestures, 0);
  const totalGlobalRIP = stats.reduce((sum, stat) => sum + stat.total_rip, 0);
  const totalGlobalCandles = stats.reduce((sum, stat) => sum + stat.total_candles, 0);
  const totalGlobalFlowers = stats.reduce((sum, stat) => sum + stat.total_flowers, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">Supervision des gestes symboliques</h2>
        <p className="text-sm text-gray-600">
          Totaux agrégés par espace • Aucun classement utilisateur
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Total gestes</span>
            <Heart className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-light text-gray-900">{totalGlobalGestures}</p>
          <p className="text-xs text-gray-500 mt-1">Tous espaces confondus</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">RIP</span>
            <Heart className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-3xl font-light text-gray-900">{totalGlobalRIP}</p>
          <p className="text-xs text-gray-500 mt-1">Gestes gratuits</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Cierges</span>
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-3xl font-light text-gray-900">{totalGlobalCandles}</p>
          <p className="text-xs text-gray-500 mt-1">Gestes symboliques</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Fleurs</span>
            <Flower2 className="w-5 h-5 text-pink-400" />
          </div>
          <p className="text-3xl font-light text-gray-900">{totalGlobalFlowers}</p>
          <p className="text-xs text-gray-500 mt-1">Gestes symboliques</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un espace..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span className="text-sm">
              {sortOrder === 'desc' ? 'Plus de gestes' : 'Moins de gestes'}
            </span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStats.length === 0 ? (
              <p className="text-center text-gray-600 py-8">Aucun espace trouvé</p>
            ) : (
              filteredStats.map((stat) => (
                <div
                  key={stat.memorial_id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
                >
                  <img
                    src={stat.deceased_photo_url}
                    alt={stat.memorial_name}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 mb-2">{stat.memorial_name}</h3>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="text-gray-700">{stat.total_rip} RIP</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="text-gray-700">{stat.total_candles} cierges</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Flower2 className="w-4 h-4 text-pink-500" />
                        <span className="text-gray-700">{stat.total_flowers} fleurs</span>
                      </div>
                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="font-medium text-gray-900">{stat.total_gestures}</span>
                        <span className="text-gray-600">total</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-red-900 mb-2">Données interdites</h4>
        <ul className="text-sm text-red-800 space-y-1">
          <li>• Aucun classement utilisateurs (qui a fait le plus de gestes)</li>
          <li>• Aucun détail individuel exploitable (qui a fait quel geste)</li>
          <li>• Uniquement des totaux agrégés par espace</li>
          <li>• Respect de la confidentialité des contributeurs</li>
        </ul>
      </div>
    </div>
  );
}

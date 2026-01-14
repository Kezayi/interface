import { useEffect, useState } from 'react';
import { Flower2, Flame, Heart, TrendingUp, DollarSign, FileText, Calendar } from 'lucide-react';
import { supabaseShim as supabase } from '../../lib/supabaseShim';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface FinancialData {
  type: string;
  count: number;
  current_price: number;
  total_revenue: number;
}

export function GesturesPricingManagement() {
  const { admin } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    console.log('[GesturesPricingManagement] useEffect triggered', { admin: !!admin, startDate, endDate });
    if (admin) {
      loadFinancialData();
    } else {
      console.log('[GesturesPricingManagement] No admin, skipping load');
      setLoading(false);
    }
  }, [startDate, endDate, admin]);

  useEffect(() => {
    console.log('[GesturesPricingManagement] financialData updated:', financialData);
    console.log('[GesturesPricingManagement] totalRevenue:', financialData.reduce((sum, item) => sum + item.total_revenue, 0));
    console.log('[GesturesPricingManagement] totalTransactions:', financialData.reduce((sum, item) => sum + item.count, 0));
  }, [financialData]);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      let startDateISO = null;
      let endDateISO = null;

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        startDateISO = start.toISOString();
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        endDateISO = end.toISOString();
      }

      console.log('[GesturesPricingManagement] Loading with dates:', { startDateISO, endDateISO });

      const [pricesRes, gestureStatsRes] = await Promise.all([
        supabase
          .from('system_parameters')
          .select('key, value')
          .in('key', ['price_publication', 'price_rip', 'price_candle', 'price_flower']),
        supabase.rpc('get_gesture_financial_stats', {
          start_date: startDateISO,
          end_date: endDateISO,
        }),
      ]);

      console.log('[GesturesPricingManagement] Prices response:', pricesRes);
      console.log('[GesturesPricingManagement] Gesture stats response:', gestureStatsRes);

      if (pricesRes.error) {
        console.error('[GesturesPricingManagement] Prices error:', pricesRes.error);
        throw pricesRes.error;
      }
      if (gestureStatsRes.error) {
        console.error('[GesturesPricingManagement] Gesture stats error:', gestureStatsRes.error);
        throw gestureStatsRes.error;
      }

      const pricesMap = (pricesRes.data || []).reduce((acc: Record<string, number>, item) => {
        acc[item.key] = Number(item.value);
        return acc;
      }, {});

      console.log('[GesturesPricingManagement] Prices map:', pricesMap);

      const gestureStatsMap = (gestureStatsRes.data || []).reduce((acc: Record<string, any>, item: any) => {
        acc[item.gesture_type] = item;
        return acc;
      }, {});

      console.log('[GesturesPricingManagement] Gesture stats map:', gestureStatsMap);

      const gestureTypes = ['rip', 'candle', 'flower'];
      const gestureStats = gestureTypes.map(type => {
        const stats = gestureStatsMap[type] || { count: 0, total_revenue: 0 };
        return {
          type: type === 'rip' ? 'RIP' : type === 'candle' ? 'Cierge' : 'Fleur',
          count: Number(stats.count || 0),
          current_price: pricesMap[`price_${type}`] || 0,
          total_revenue: Number(stats.total_revenue || 0),
        };
      });

      console.log('[GesturesPricingManagement] Final gesture stats:', gestureStats);

      const allData: FinancialData[] = gestureStats;

      console.log('[GesturesPricingManagement] Setting financial data:', allData);
      setFinancialData(allData);
      setError('');
    } catch (err: any) {
      console.error('[GesturesPricingManagement] Error loading financial data:', err);
      setError(err.message || 'Erreur lors du chargement des données');
      setFinancialData([]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'RIP':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'Cierge':
        return <Flame className="w-5 h-5 text-orange-500" />;
      case 'Fleur':
        return <Flower2 className="w-5 h-5 text-pink-500" />;
      default:
        return null;
    }
  };

  const totalRevenue = financialData.reduce((sum, item) => sum + item.total_revenue, 0);
  const totalTransactions = financialData.reduce((sum, item) => sum + item.count, 0);

  if (!admin) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">Suivi financier Gestes Symboliques</h2>
        <p className="text-sm text-gray-600">
          Chiffre d'affaires des gestes symboliques uniquement (prix historiques)
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Chiffre d'affaires total</span>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>
          {loading ? (
            <div className="flex items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-light text-gray-900">
                {totalRevenue.toLocaleString('fr-FR')} FCFA
              </p>
              <p className="text-xs text-gray-500 mt-1">Prix historiques - Aucun effet rétroactif</p>
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Transactions totales</span>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          {loading ? (
            <div className="flex items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-light text-gray-900">
                {totalTransactions.toLocaleString('fr-FR')}
              </p>
              <p className="text-xs text-gray-500 mt-1">Gestes symboliques uniquement</p>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Suivi par période</h3>
            <p className="text-sm text-gray-600">Filtrez les données par date</p>
          </div>
          <Calendar className="w-6 h-6 text-gray-400" />
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date de début</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date de fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="mt-6 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Réinitialiser
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Prix actuel</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">CA (prix historique)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {financialData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Aucune donnée disponible pour la période sélectionnée
                    </td>
                  </tr>
                ) : (
                  financialData.map((item) => (
                    <tr key={item.type} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getIcon(item.type)}
                          <span className="text-sm font-medium text-gray-900">{item.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm text-gray-900">
                          {item.current_price.toLocaleString('fr-FR')} FCFA
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm text-gray-900">
                          {item.count.toLocaleString('fr-FR')}
                        </span>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {item.total_revenue.toLocaleString('fr-FR')} FCFA
                      </span>
                    </td>
                  </tr>
                  ))
                )}
                {financialData.length > 0 && (
                  <tr className="bg-gray-50 font-semibold">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900">TOTAL</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right"></td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {totalTransactions.toLocaleString('fr-FR')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {totalRevenue.toLocaleString('fr-FR')} FCFA
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Système de prix - Règles importantes</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• <strong>Prix historique:</strong> Chaque transaction enregistre le prix au moment de sa création</li>
          <li>• <strong>Aucun effet rétroactif:</strong> Les changements de prix n'affectent pas les transactions passées</li>
          <li>• <strong>Calculs exacts:</strong> Tous les montants sont exacts au FCFA près - Tolérance ZÉRO</li>
          <li>• <strong>Prix actuel:</strong> Les prix actuels proviennent de l'onglet Paramètres</li>
          <li>• <strong>Modification des prix:</strong> Rendez-vous dans Paramètres pour modifier les prix</li>
        </ul>
      </div>
    </div>
  );
}

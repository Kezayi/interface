import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Shield,
  Euro,
  AlertTriangle,
  FileText,
  Settings,
  LogOut,
  TrendingUp,
  Activity,
  Heart,
  Bell,
  ArrowLeft,
  UserCog
} from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { supabaseShim as supabase } from '../../lib/supabaseShim';
import { BackOfficeStats } from '../../lib/backoffice-types';

type AdminView = 'dashboard' | 'account' | 'admins' | 'memorials' | 'heirs' | 'moderation' | 'gestures' | 'financial' | 'incidents' | 'notifications' | 'audit' | 'parameters';

interface AdminDashboardProps {
  onViewChange: (view: AdminView) => void;
  currentView: AdminView;
  onNavigateToFrontOffice?: () => void;
}

export function AdminDashboard({ onViewChange, currentView, onNavigateToFrontOffice }: AdminDashboardProps) {
  const { admin, signOut } = useAdminAuth();
  const [stats, setStats] = useState<BackOfficeStats>({
    total_memorials: 0,
    active_memorials: 0,
    total_gestures: 0,
    total_revenue: 0,
    pending_transactions: 0,
    open_incidents: 0,
    critical_incidents: 0,
  });
  const [gesturesRevenue, setGesturesRevenue] = useState(0);
  const [contributionsRevenue, setContributionsRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentView === 'dashboard') {
      loadStats();
    }
  }, [currentView]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_dashboard_stats');

      if (error) {
        console.error('Error loading stats:', error);
        return;
      }

      if (data) {
        setGesturesRevenue(data.gestures_revenue || 0);
        setContributionsRevenue(data.contributions_revenue || 0);

        setStats({
          total_memorials: data.total_memorials || 0,
          active_memorials: data.active_memorials || 0,
          total_gestures: data.total_gestures || 0,
          total_revenue: data.total_revenue || 0,
          pending_transactions: data.pending_transactions || 0,
          open_incidents: data.open_incidents || 0,
          critical_incidents: data.critical_incidents || 0,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'dashboard' as AdminView, label: 'Tableau de bord', icon: LayoutDashboard, roles: ['super_admin', 'support_admin'] },
    { id: 'account' as AdminView, label: 'Mon compte', icon: Users, roles: ['super_admin', 'support_admin'] },
    { id: 'admins' as AdminView, label: 'Administrateurs', icon: UserCog, roles: ['super_admin'] },
    { id: 'memorials' as AdminView, label: 'Espaces mémoriels', icon: FileText, roles: ['super_admin', 'support_admin'] },
    { id: 'heirs' as AdminView, label: 'Héritiers numériques', icon: Users, roles: ['super_admin'] },
    { id: 'moderation' as AdminView, label: 'Modération', icon: Shield, roles: ['super_admin', 'support_admin'] },
    { id: 'gestures' as AdminView, label: 'Gestes symboliques', icon: Heart, roles: ['super_admin', 'support_admin'] },
    { id: 'financial' as AdminView, label: 'Finances', icon: Euro, roles: ['super_admin'] },
    { id: 'incidents' as AdminView, label: 'Incidents', icon: AlertTriangle, roles: ['super_admin', 'support_admin'] },
    { id: 'notifications' as AdminView, label: 'Notifications', icon: Bell, roles: ['super_admin'] },
    { id: 'audit' as AdminView, label: 'Journal d\'audit', icon: Activity, roles: ['super_admin'] },
    { id: 'parameters' as AdminView, label: 'Paramètres', icon: Settings, roles: ['super_admin'] },
  ];

  const visibleMenuItems = menuItems.filter(item =>
    admin && item.roles.includes(admin.role)
  );

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-light text-gray-900">FLOORENCE BackOffice</h1>
            <p className="text-sm text-gray-600">
              {admin?.full_name} • {admin?.role === 'super_admin' ? 'Super Administrateur' : 'Administrateur Support'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onNavigateToFrontOffice && (
              <button
                onClick={onNavigateToFrontOffice}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={18} />
                <span>FrontOffice</span>
              </button>
            )}
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        <nav className="flex items-center gap-2 overflow-x-auto pb-2">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {currentView === 'dashboard' && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-medium text-gray-900 mb-4">Vue d'ensemble</h2>
              <p className="text-sm text-gray-600 mb-6">
                Indicateurs de supervision (non marketing, non émotionnel)
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Espaces mémoriels</span>
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-3xl font-light text-gray-900">{stats.total_memorials}</p>
                  <p className="text-xs text-gray-500 mt-1">Total créés</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Gestes symboliques</span>
                    <TrendingUp className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-3xl font-light text-gray-900">{stats.total_gestures}</p>
                  <p className="text-xs text-gray-500 mt-1">Transactions réussies</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Volume Gestes Symboliques</span>
                    <Heart className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-3xl font-light text-gray-900">{gesturesRevenue.toLocaleString('fr-FR')} FCFA</p>
                  <p className="text-xs text-gray-500 mt-1">Revenus confirmés</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Volume Contributions</span>
                    <Euro className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-3xl font-light text-gray-900">{contributionsRevenue.toLocaleString('fr-FR')} FCFA</p>
                  <p className="text-xs text-gray-500 mt-1">Revenus confirmés</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Transactions en attente</span>
                    <Activity className="w-5 h-5 text-yellow-500" />
                  </div>
                  <p className="text-3xl font-light text-gray-900">{stats.pending_transactions}</p>
                  <p className="text-xs text-gray-500 mt-1">À vérifier</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Incidents ouverts</span>
                    <AlertTriangle className={`w-5 h-5 ${stats.open_incidents > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
                  </div>
                  <p className="text-3xl font-light text-gray-900">{stats.open_incidents}</p>
                  <p className="text-xs text-gray-500 mt-1">En cours de traitement</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Incidents critiques</span>
                    <AlertTriangle className={`w-5 h-5 ${stats.critical_incidents > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                  </div>
                  <p className="text-3xl font-light text-gray-900">{stats.critical_incidents}</p>
                  <p className="text-xs text-gray-500 mt-1">Urgents</p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Principes du BackOffice</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Lecture prioritaire sur l'action</li>
                <li>• Traçabilité absolue de toutes les actions</li>
                <li>• Immuabilité des données sensibles</li>
                <li>• Aucun indicateur émotionnel ou marketing</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

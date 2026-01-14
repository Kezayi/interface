import { useState } from 'react';
import { Home, Search, Plus, LogIn, LogOut, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface MobileBottomNavProps {
  onNavigate: (view: 'home' | 'create' | 'auth' | 'search') => void;
  onSearch: (query: string) => void;
  currentView: string;
}

export function MobileBottomNav({ onNavigate, onSearch, currentView }: MobileBottomNavProps) {
  const { user, signOut } = useAuth();
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      onNavigate('search');
      setShowSearchModal(false);
      setSearchQuery('');
    }
  };

  const navItems = [
    {
      id: 'home',
      icon: Home,
      label: 'Accueil',
      onClick: () => onNavigate('home'),
    },
    {
      id: 'search',
      icon: Search,
      label: 'Rechercher',
      onClick: () => setShowSearchModal(true),
    },
    {
      id: 'create',
      icon: Plus,
      label: 'Créer',
      onClick: () => onNavigate('create'),
    },
    {
      id: 'auth',
      icon: user ? LogOut : LogIn,
      label: user ? 'Profil' : 'Connexion',
      onClick: async () => {
        if (user) {
          await signOut();
          onNavigate('home');
        } else {
          onNavigate('auth');
        }
      },
    },
  ];

  return (
    <>
      {showSearchModal && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Rechercher</h3>
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSearch}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un défunt par nom..."
                className="w-full px-4 py-3 text-gray-700 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                autoFocus
              />
              <button
                type="submit"
                className="w-full mt-4 bg-gray-900 text-white px-4 py-3 rounded-md hover:bg-gray-800 transition-colors"
              >
                Rechercher
              </button>
            </form>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all touch-manipulation ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} strokeWidth={2} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

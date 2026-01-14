import { useState } from 'react';
import { Search, Menu, X, Plus, LogIn, LogOut, Shield, Flower2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onNavigate: (view: 'home' | 'create' | 'auth' | 'search' | 'backoffice') => void;
  onSearch: (query: string) => void;
}

export default function Header({ onNavigate, onSearch }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      onNavigate('search');
      setIsMenuOpen(false);
      setSearchQuery('');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  const handleNavigation = (view: 'home' | 'create' | 'auth' | 'backoffice') => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleNavigation('home')}
            className="flex items-center gap-2 md:gap-3 group touch-manipulation"
          >
            <Flower2 className="w-7 h-7 md:w-8 md:h-8 text-gray-800 group-hover:text-gray-600 transition-colors" />
            <div className="flex flex-col">
              <span className="text-lg md:text-2xl font-light text-gray-900 group-hover:text-gray-700 transition-colors">
                FLOORENCE
              </span>
              <span className="text-[10px] md:text-xs text-gray-600 italic" style={{ fontFamily: "'Times New Roman', serif" }}>
                Aux bons soins des vivants
              </span>
            </div>
          </button>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg text-gray-800 hover:bg-gray-100/80 transition-colors touch-manipulation"
            aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="mt-4 pt-4 border-t border-gray-200/50 space-y-3 animate-fadeIn">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un défunt par nom..."
                className="w-full px-4 py-2.5 pl-10 pr-4 text-gray-800 bg-white/90 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent touch-manipulation placeholder:text-gray-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </form>

            <button
              onClick={() => handleNavigation('create')}
              className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors touch-manipulation"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm font-medium">Créer un mémorial</span>
            </button>

            {user ? (
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center gap-2 w-full text-gray-800 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50/80 transition-colors touch-manipulation bg-white/50"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Se déconnecter</span>
              </button>
            ) : (
              <button
                onClick={() => handleNavigation('auth')}
                className="flex items-center justify-center gap-2 w-full text-gray-800 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50/80 transition-colors touch-manipulation bg-white/50"
              >
                <LogIn className="h-5 w-5" />
                <span className="text-sm font-medium">Se connecter</span>
              </button>
            )}

            <button
              onClick={() => handleNavigation('backoffice')}
              className="flex items-center justify-center gap-2 w-full text-gray-800 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50/80 transition-colors touch-manipulation bg-white/50"
            >
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">BackOffice</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

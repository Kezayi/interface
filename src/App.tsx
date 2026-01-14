import { useState, lazy, Suspense, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { AuthForm } from './components/AuthForm';
import { Home } from './components/Home';
import Header from './components/Header';
import KinshipSearchResults from './components/KinshipSearchResults';
import { CGU } from './components/CGU';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';

const BackOffice = lazy(() => import('./components/backoffice/BackOffice').then(module => ({ default: module.BackOffice })));
const MemorialForm = lazy(() => import('./components/MemorialForm').then(module => ({ default: module.MemorialForm })));
const MemorialView = lazy(() => import('./components/MemorialView').then(module => ({ default: module.MemorialView })));

type View = 'home' | 'create' | 'view' | 'auth' | 'search' | 'cgu' | 'privacy' | 'backoffice';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedMemorialId, setSelectedMemorialId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleViewMemorial = (memorialId: string) => {
    setSelectedMemorialId(memorialId);
    setCurrentView('view');
  };

  const publicViews: View[] = ['home', 'view', 'search', 'cgu', 'privacy', 'backoffice'];
  const isPublicView = publicViews.includes(currentView);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">FLOORENCE</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700 mb-2">Une erreur est survenue:</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">FLOORENCE</h1>
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  const handleCreateSuccess = (memorialId: string) => {
    setSelectedMemorialId(memorialId);
    setCurrentView('view');
  };

  const handleNavigation = (view: View) => {
    setCurrentView(view);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFooterNavigation = (view: 'cgu' | 'privacy' | 'backoffice') => {
    setCurrentView(view);
  };

  const renderContent = () => {
    const requiresAuth = !isPublicView && currentView !== 'auth';

    if (!user && requiresAuth) {
      return (
        <>
          <Header onNavigate={handleNavigation} onSearch={handleSearch} />
          <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <AuthForm onSuccess={() => setCurrentView('home')} />
          </div>
        </>
      );
    }

    switch (currentView) {
      case 'search':
        return (
          <>
            <Header onNavigate={handleNavigation} onSearch={handleSearch} />
            <KinshipSearchResults
              searchQuery={searchQuery}
              onSelectMemorial={handleViewMemorial}
            />
            <Footer onNavigate={handleFooterNavigation} />
          </>
        );
      case 'create':
        return (
          <>
            <Header onNavigate={handleNavigation} onSearch={handleSearch} />
            <div className="min-h-screen bg-gray-50 py-8">
              <Suspense fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              }>
                <MemorialForm
                  onSuccess={handleCreateSuccess}
                  onCancel={() => setCurrentView('home')}
                />
              </Suspense>
            </div>
            <Footer onNavigate={handleFooterNavigation} />
          </>
        );
      case 'view':
        return selectedMemorialId ? (
          <>
            <Header onNavigate={handleNavigation} onSearch={handleSearch} />
            <Suspense fallback={
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            }>
              <MemorialView
                memorialId={selectedMemorialId}
                onNavigateToLegalPage={handleFooterNavigation}
              />
            </Suspense>
          </>
        ) : (
          <>
            <Header onNavigate={handleNavigation} onSearch={handleSearch} />
            <Home
              onCreateMemorial={() => setCurrentView('create')}
              onViewMemorial={handleViewMemorial}
              onNavigateToLegalPage={handleFooterNavigation}
            />
          </>
        );
      case 'auth':
        return (
          <>
            <Header onNavigate={handleNavigation} onSearch={handleSearch} />
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
              <AuthForm onSuccess={() => setCurrentView('home')} />
            </div>
            <Footer onNavigate={handleFooterNavigation} />
          </>
        );
      case 'cgu':
        return (
          <>
            <Header onNavigate={handleNavigation} onSearch={handleSearch} />
            <CGU />
            <Footer onNavigate={handleFooterNavigation} />
          </>
        );
      case 'privacy':
        return (
          <>
            <Header onNavigate={handleNavigation} onSearch={handleSearch} />
            <PrivacyPolicy />
            <Footer onNavigate={handleFooterNavigation} />
          </>
        );
      case 'backoffice':
        return (
          <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                <p className="text-sm text-gray-600">Chargement...</p>
              </div>
            </div>
          }>
            <BackOffice onNavigateToFrontOffice={() => setCurrentView('home')} />
          </Suspense>
        );
      default:
        return (
          <>
            <Header onNavigate={handleNavigation} onSearch={handleSearch} />
            <Home
              onCreateMemorial={() => setCurrentView('create')}
              onViewMemorial={handleViewMemorial}
              onNavigateToLegalPage={handleFooterNavigation}
            />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-20 md:pb-0">
      {renderContent()}
      <MobileBottomNav
        onNavigate={handleNavigation}
        onSearch={handleSearch}
        currentView={currentView}
      />
    </div>
  );
}

function App() {
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Configuration manquante:', {
        VITE_SUPABASE_URL: supabaseUrl ? 'OK' : 'MANQUANT',
        VITE_SUPABASE_ANON_KEY: supabaseKey ? 'OK' : 'MANQUANT',
      });
      setConfigError(
        'Configuration Supabase manquante. Les variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont requises dans le fichier .env'
      );
    } else {
      console.log('✓ Configuration Supabase détectée');
    }
  }, []);

  if (configError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">FLOORENCE</h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800 font-semibold mb-2">Configuration manquante</p>
            <p className="text-sm text-yellow-700 mb-4">{configError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Recharger
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <AdminAuthProvider>
        <AppContent />
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;

import { useState, lazy, Suspense } from 'react';
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

  const handleViewMemorial = (memorialId: string) => {
    setSelectedMemorialId(memorialId);
    setCurrentView('view');
  };

  const publicViews: View[] = ['home', 'view', 'search', 'cgu', 'privacy', 'backoffice'];
  const isPublicView = publicViews.includes(currentView);

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
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <AppContent />
      </AdminAuthProvider>
    </AuthProvider>
  );
}

export default App;

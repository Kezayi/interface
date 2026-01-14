import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { MemorialsList } from './MemorialsList';
import { FinancialManagement } from './FinancialManagement';
import { AuditLog } from './AuditLog';
import { DigitalHeirsManagement } from './DigitalHeirsManagement';
import { ModerationPanel } from './ModerationPanel';
import { IncidentsManagement } from './IncidentsManagement';
import { SystemParameters } from './SystemParameters';
import { SymbolicGesturesSupervision } from './SymbolicGesturesSupervision';
import { NotificationsSupervision } from './NotificationsSupervision';
import { AdminAccountManagement } from './AdminAccountManagement';
import { AdminUsersManagement } from './AdminUsersManagement';

type AdminView = 'dashboard' | 'account' | 'admins' | 'memorials' | 'heirs' | 'moderation' | 'gestures' | 'financial' | 'incidents' | 'notifications' | 'audit' | 'parameters';

interface BackOfficeProps {
  onNavigateToFrontOffice?: () => void;
}

export function BackOffice({ onNavigateToFrontOffice }: BackOfficeProps) {
  const { admin, loading } = useAdminAuth();
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');

  useEffect(() => {
    console.log('[BackOffice] Admin state changed:', admin ? 'logged in' : 'not logged in', 'loading:', loading);
  }, [admin, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="text-sm text-gray-600 mt-2">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return <AdminLogin />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <AdminDashboard onViewChange={setCurrentView} currentView={currentView} onNavigateToFrontOffice={onNavigateToFrontOffice} />;
      case 'account':
        return (
          <>
            <AdminDashboard onViewChange={setCurrentView} currentView={currentView} onNavigateToFrontOffice={onNavigateToFrontOffice} />
            <div className="max-w-7xl mx-auto px-4 py-8">
              <AdminAccountManagement />
            </div>
          </>
        );
      case 'admins':
        return (
          <>
            <AdminDashboard onViewChange={setCurrentView} currentView={currentView} onNavigateToFrontOffice={onNavigateToFrontOffice} />
            <div className="max-w-7xl mx-auto px-4 py-8">
              <AdminUsersManagement />
            </div>
          </>
        );
      case 'memorials':
        return (
          <>
            <AdminDashboard onViewChange={setCurrentView} currentView={currentView} onNavigateToFrontOffice={onNavigateToFrontOffice} />
            <div className="max-w-7xl mx-auto px-4 py-8">
              <MemorialsList />
            </div>
          </>
        );
      case 'heirs':
        return (
          <>
            <AdminDashboard onViewChange={setCurrentView} currentView={currentView} onNavigateToFrontOffice={onNavigateToFrontOffice} />
            <div className="max-w-7xl mx-auto px-4 py-8">
              <DigitalHeirsManagement />
            </div>
          </>
        );
      case 'moderation':
        return (
          <>
            <AdminDashboard onViewChange={setCurrentView} currentView={currentView} onNavigateToFrontOffice={onNavigateToFrontOffice} />
            <div className="max-w-7xl mx-auto px-4 py-8">
              <ModerationPanel />
            </div>
          </>
        );
      case 'gestures':
        return (
          <>
            <AdminDashboard onViewChange={setCurrentView} currentView={currentView} onNavigateToFrontOffice={onNavigateToFrontOffice} />
            <div className="max-w-7xl mx-auto px-4 py-8">
              <SymbolicGesturesSupervision />
            </div>
          </>
        );
      case 'financial':
        return (
          <>
            <AdminDashboard onViewChange={setCurrentView} currentView={currentView} onNavigateToFrontOffice={onNavigateToFrontOffice} />
            <div className="max-w-7xl mx-auto px-4 py-8">
              <FinancialManagement />
            </div>
          </>
        );
      case 'incidents':
        return (
          <>
            <AdminDashboard onViewChange={setCurrentView} currentView={currentView} onNavigateToFrontOffice={onNavigateToFrontOffice} />
            <div className="max-w-7xl mx-auto px-4 py-8">
              <IncidentsManagement />
            </div>
          </>
        );
      case 'notifications':
        return (
          <>
            <AdminDashboard onViewChange={setCurrentView} currentView={currentView} onNavigateToFrontOffice={onNavigateToFrontOffice} />
            <div className="max-w-7xl mx-auto px-4 py-8">
              <NotificationsSupervision />
            </div>
          </>
        );
      case 'audit':
        return (
          <>
            <AdminDashboard onViewChange={setCurrentView} currentView={currentView} onNavigateToFrontOffice={onNavigateToFrontOffice} />
            <div className="max-w-7xl mx-auto px-4 py-8">
              <AuditLog />
            </div>
          </>
        );
      case 'parameters':
        return (
          <>
            <AdminDashboard onViewChange={setCurrentView} currentView={currentView} onNavigateToFrontOffice={onNavigateToFrontOffice} />
            <div className="max-w-7xl mx-auto px-4 py-8">
              <SystemParameters />
            </div>
          </>
        );
      default:
        return <AdminDashboard onViewChange={setCurrentView} currentView={currentView} onNavigateToFrontOffice={onNavigateToFrontOffice} />;
    }
  };

  return <div className="min-h-screen bg-gray-50">{renderView()}</div>;
}

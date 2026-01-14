import { Flame } from 'lucide-react';
import { useAdminAuth } from '../contexts/AdminAuthContext';

interface FooterProps {
  onNavigate?: (view: 'cgu' | 'privacy' | 'backoffice') => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const { admin } = useAdminAuth();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-center text-sm text-gray-600 mb-4">
          © 2026 Floorence by Michel ANNE. All rights reserved.
        </p>
        {onNavigate && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <button
                onClick={() => onNavigate('cgu')}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors text-center"
              >
                Conditions générales d'utilisation
              </button>
              <button
                onClick={() => onNavigate('privacy')}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors text-center"
              >
                Politique de confidentialité
              </button>
            </div>
            <div className="text-center">
              <button
                onClick={() => onNavigate('backoffice')}
                className="inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-100 transition-colors group"
                title={admin ? 'Accès administrateur ouvert' : 'Accès administrateur verrouillé'}
              >
                <Flame
                  className={`w-5 h-5 transition-colors ${
                    admin ? 'text-green-500 animate-pulse' : 'text-red-500 animate-pulse'
                  }`}
                  style={{
                    filter: admin
                      ? 'drop-shadow(0 0 8px rgba(34, 197, 94, 0.8)) drop-shadow(0 0 12px rgba(34, 197, 94, 0.4))'
                      : 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.8)) drop-shadow(0 0 12px rgba(239, 68, 68, 0.4))',
                    animation: 'flicker 1.5s ease-in-out infinite',
                  }}
                />
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes flicker {
          0%, 100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          20% {
            opacity: 0.7;
            transform: scale(1.1) translateY(-2px);
          }
          40% {
            opacity: 0.85;
            transform: scale(0.95) translateY(0);
          }
          60% {
            opacity: 0.75;
            transform: scale(1.08) translateY(-1.5px);
          }
          80% {
            opacity: 0.9;
            transform: scale(0.98) translateY(-0.5px);
          }
        }
      `}</style>
    </footer>
  );
}

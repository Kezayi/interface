import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">FLOORENCE</h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 mb-2 font-semibold">Une erreur est survenue</p>
              <p className="text-sm text-red-600 mb-2">
                {this.state.error?.message || 'Erreur inconnue'}
              </p>
              <details className="text-left">
                <summary className="cursor-pointer text-xs text-red-500 hover:text-red-700">
                  Détails techniques
                </summary>
                <pre className="text-xs mt-2 p-2 bg-red-100 rounded overflow-auto max-h-40">
                  {this.state.error?.stack}
                </pre>
              </details>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

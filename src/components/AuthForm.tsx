import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

type AuthFormProps = {
  onSuccess?: () => void;
};

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await resetPassword(email);
        if (error) {
          setError(error.message);
        } else {
          setSuccess('Un email de réinitialisation a été envoyé. Vérifiez votre boîte de réception.');
        }
      } else if (isSignUp) {
        if (!fullName.trim()) {
          setError('Le nom complet est requis');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setError(error.message);
        } else {
          onSuccess?.();
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          onSuccess?.();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-2xl font-light text-gray-900 mb-6 text-center">
        {isForgotPassword ? 'Réinitialiser le mot de passe' : isSignUp ? 'Créer un compte' : 'Se connecter'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && !isForgotPassword && (
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            required
          />
        </div>

        {!isForgotPassword && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              required
              minLength={6}
            />
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Veuillez patienter...' : isForgotPassword ? 'Envoyer le lien' : isSignUp ? 'Créer un compte' : 'Se connecter'}
        </button>
      </form>

      {!isForgotPassword && !isSignUp && (
        <button
          onClick={() => {
            setIsForgotPassword(true);
            setError('');
            setSuccess('');
          }}
          className="w-full mt-3 text-sm text-gray-600 hover:text-gray-900"
        >
          Mot de passe oublié ?
        </button>
      )}

      <button
        onClick={() => {
          setIsSignUp(!isSignUp);
          setIsForgotPassword(false);
          setError('');
          setSuccess('');
        }}
        className="w-full mt-4 text-sm text-gray-600 hover:text-gray-900"
      >
        {isSignUp ? 'Déjà un compte ? Se connecter' : 'Besoin d\'un compte ? S\'inscrire'}
      </button>

      {isForgotPassword && (
        <button
          onClick={() => {
            setIsForgotPassword(false);
            setError('');
            setSuccess('');
          }}
          className="w-full mt-2 text-sm text-gray-600 hover:text-gray-900"
        >
          Retour à la connexion
        </button>
      )}
    </div>
  );
}

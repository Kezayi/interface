import { useState } from 'react';
import { Smartphone, Send, CheckCircle } from 'lucide-react';
import { supabaseShim as supabase } from '../lib/supabaseShim';

type PhoneVerificationProps = {
  onVerified: (phoneNumber: string) => void;
  onCancel: () => void;
};

type VerificationStep = 'phone' | 'code' | 'verified';

export function PhoneVerification({ onVerified, onCancel }: PhoneVerificationProps) {
  const [step, setStep] = useState<VerificationStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sendMethod, setSendMethod] = useState<'sms' | 'whatsapp'>('sms');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devCode, setDevCode] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(5);

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned;
  };

  const handleSendCode = async () => {
    if (!phoneNumber) {
      setError('Veuillez saisir un numéro de téléphone');
      return;
    }

    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    setError('');
    setLoading(true);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('send-otp', {
        body: {
          phoneNumber: formattedPhone,
          method: sendMethod,
        },
      });

      if (functionError) {
        throw new Error(functionError.message || 'Erreur lors de l\'envoi du code');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.devCode) {
        setDevCode(data.devCode);
      }

      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'envoi du code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Veuillez saisir un code à 6 chiffres');
      return;
    }

    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    setError('');
    setLoading(true);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('verify-otp', {
        body: {
          phoneNumber: formattedPhone,
          code: verificationCode,
        },
      });

      if (functionError) {
        throw new Error(functionError.message || 'Erreur lors de la vérification');
      }

      if (data.error) {
        if (data.attemptsLeft !== undefined) {
          setAttemptsLeft(data.attemptsLeft);
        }
        throw new Error(data.error);
      }

      setStep('verified');
      setTimeout(() => {
        onVerified(formattedPhone);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gray-100 rounded-lg">
          <Smartphone className="w-6 h-6 text-gray-700" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Vérification du numéro</h3>
          <p className="text-sm text-gray-600">Confirmez votre identité pour publier l'avis</p>
        </div>
      </div>

      {step === 'phone' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Numéro de téléphone <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="+242 06 000 00 00"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format international avec indicatif pays (ex: +242 pour le Congo)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Méthode d'envoi <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                <input
                  type="radio"
                  name="method"
                  value="sms"
                  checked={sendMethod === 'sms'}
                  onChange={(e) => setSendMethod(e.target.value as 'sms')}
                />
                <div>
                  <p className="font-medium text-gray-900">SMS</p>
                  <p className="text-xs text-gray-600">Recevoir le code par message texte</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors">
                <input
                  type="radio"
                  name="method"
                  value="whatsapp"
                  checked={sendMethod === 'whatsapp'}
                  onChange={(e) => setSendMethod(e.target.value as 'whatsapp')}
                />
                <div>
                  <p className="font-medium text-gray-900">WhatsApp</p>
                  <p className="text-xs text-gray-600">Recevoir le code via WhatsApp</p>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSendCode}
              disabled={loading || !phoneNumber}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Envoi...' : 'Envoyer le code'}
            </button>
          </div>
        </div>
      )}

      {step === 'code' && (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              Un code de vérification a été envoyé au numéro{' '}
              <span className="font-medium">{phoneNumber}</span> par{' '}
              <span className="font-medium">{sendMethod === 'sms' ? 'SMS' : 'WhatsApp'}</span>.
            </p>
            {devCode && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs font-medium text-yellow-800 mb-1">Mode développement</p>
                <p className="text-sm font-mono text-yellow-900">Code: {devCode}</p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              Code de vérification <span className="text-red-500">*</span>
            </label>
            <input
              id="code"
              type="text"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3 py-3 text-center text-2xl font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 tracking-widest"
              placeholder="000000"
              autoFocus
            />
            {attemptsLeft < 5 && (
              <p className="text-xs text-orange-600 mt-1">
                {attemptsLeft} tentative{attemptsLeft > 1 ? 's' : ''} restante{attemptsLeft > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setStep('phone');
                setVerificationCode('');
                setError('');
                setDevCode('');
                setAttemptsLeft(5);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Changer le numéro
            </button>
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Vérification...' : 'Vérifier'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleSendCode}
            disabled={loading}
            className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Renvoyer le code
          </button>
        </div>
      )}

      {step === 'verified' && (
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Numéro vérifié</h4>
          <p className="text-sm text-gray-600">
            Votre numéro de téléphone a été vérifié avec succès
          </p>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Euro, CheckCircle, XCircle, Clock, RefreshCw, Heart } from 'lucide-react';
import { supabaseShim as supabase } from '../../lib/supabaseShim';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { FinancialTransaction } from '../../lib/backoffice-types';
import { GesturesPricingManagement } from './GesturesPricingManagement';

type FinancialView = 'gestures' | 'contributions';

export function FinancialManagement() {
  const { admin, logAction } = useAdminAuth();
  const [currentView, setCurrentView] = useState<FinancialView>('gestures');
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'SUCCESS_MANUAL' | 'REFUNDED'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);
  const [verificationNote, setVerificationNote] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewFilteredTransactions = currentView === 'contributions'
    ? transactions.filter(t => t.type === 'contribution' || t.type === 'publication')
    : transactions;

  const filteredTransactions = viewFilteredTransactions.filter(t =>
    statusFilter === 'all' ? true : t.status === statusFilter
  );

  const handleMarkAsSuccessManual = async () => {
    if (!selectedTransaction || !verificationNote.trim()) {
      alert('Veuillez fournir une note de vérification');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update({
          status: 'SUCCESS_MANUAL',
          manual_verification_note: verificationNote,
          verified_by: admin?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedTransaction.id);

      if (error) throw error;

      await logAction(
        'TRANSACTION_VERIFIED',
        'financial_transaction',
        selectedTransaction.id,
        {
          transaction_uuid: selectedTransaction.transaction_uuid,
          amount: selectedTransaction.amount,
          old_status: selectedTransaction.status,
          new_status: 'SUCCESS_MANUAL',
        },
        verificationNote
      );

      alert('Transaction validée manuellement');
      setVerificationNote('');
      setSelectedTransaction(null);
      loadTransactions();
    } catch (error) {
      console.error('Error verifying transaction:', error);
      alert('Erreur lors de la validation');
    } finally {
      setProcessing(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedTransaction || !refundReason.trim()) {
      alert('Veuillez fournir une raison de remboursement');
      return;
    }

    if (!confirm('Confirmer le remboursement de cette transaction ?')) {
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update({
          status: 'REFUNDED',
          refund_reason: refundReason,
          refunded_by: admin?.id,
          refunded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedTransaction.id);

      if (error) throw error;

      await logAction(
        'TRANSACTION_REFUNDED',
        'financial_transaction',
        selectedTransaction.id,
        {
          transaction_uuid: selectedTransaction.transaction_uuid,
          amount: selectedTransaction.amount,
          old_status: selectedTransaction.status,
        },
        refundReason
      );

      alert('Transaction remboursée');
      setRefundReason('');
      setSelectedTransaction(null);
      loadTransactions();
    } catch (error) {
      console.error('Error refunding transaction:', error);
      alert('Erreur lors du remboursement');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
      case 'SUCCESS_MANUAL':
        return 'bg-green-100 text-green-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'FAILED':
        return 'bg-red-100 text-red-700';
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
      case 'SUCCESS_MANUAL':
        return <CheckCircle className="w-4 h-4" />;
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4" />;
      case 'REFUNDED':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (selectedTransaction) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setSelectedTransaction(null);
            setVerificationNote('');
            setRefundReason('');
          }}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Retour à la liste
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-medium text-gray-900 mb-2">Transaction Details</h2>
            <p className="text-sm text-gray-600 font-mono">{selectedTransaction.transaction_uuid}</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                <p className="text-2xl font-light text-gray-900">{Number(selectedTransaction.amount).toLocaleString('fr-FR')} FCFA</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getStatusColor(selectedTransaction.status)}`}>
                  {getStatusIcon(selectedTransaction.status)}
                  {selectedTransaction.status}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <p className="text-gray-900">{selectedTransaction.type}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Créé le</label>
                <p className="text-gray-900">{new Date(selectedTransaction.created_at).toLocaleString('fr-FR')}</p>
              </div>
            </div>

            {(selectedTransaction.status === 'PENDING' || selectedTransaction.status === 'FAILED') && admin?.role === 'super_admin' && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Valider manuellement</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note de vérification (obligatoire)
                    </label>
                    <textarea
                      value={verificationNote}
                      onChange={(e) => setVerificationNote(e.target.value)}
                      placeholder="Décrivez la vérification effectuée et les preuves..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      rows={4}
                    />
                  </div>
                  <button
                    onClick={handleMarkAsSuccessManual}
                    disabled={processing}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Validation...' : 'Valider comme SUCCESS_MANUAL'}
                  </button>
                </div>
              </div>
            )}

            {(selectedTransaction.status === 'SUCCESS' || selectedTransaction.status === 'SUCCESS_MANUAL') && admin?.role === 'super_admin' && !selectedTransaction.refunded_at && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Remboursement</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Raison du remboursement (obligatoire)
                    </label>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Décrivez la raison du remboursement..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      rows={4}
                    />
                  </div>
                  <button
                    onClick={handleRefund}
                    disabled={processing}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Remboursement...' : 'Rembourser'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'gestures') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
          <button
            onClick={() => setCurrentView('gestures')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'gestures'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Gestes Symboliques
            </div>
          </button>
          <button
            onClick={() => setCurrentView('contributions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'contributions'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Euro className="w-4 h-4" />
              Contributions
            </div>
          </button>
        </div>
        <GesturesPricingManagement />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
        <button
          onClick={() => setCurrentView('gestures')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'gestures'
              ? 'bg-green-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Gestes Symboliques
          </div>
        </button>
        <button
          onClick={() => setCurrentView('contributions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'contributions'
              ? 'bg-green-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Euro className="w-4 h-4" />
            Contributions
          </div>
        </button>
      </div>

      <div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">Contributions</h2>
        <p className="text-sm text-gray-600">Registre de réconciliation des transactions en FCFA</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="SUCCESS">Réussi</option>
            <option value="SUCCESS_MANUAL">Validé manuellement</option>
            <option value="FAILED">Échoué</option>
            <option value="REFUNDED">Remboursé</option>
          </select>

          <div className="flex-1 text-right text-sm text-gray-600">
            {filteredTransactions.length} transaction(s)
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <p className="text-center text-gray-600 py-8">Aucune transaction trouvée</p>
            ) : (
              filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedTransaction(transaction)}
                >
                  <Euro className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">{Number(transaction.amount).toLocaleString('fr-FR')} FCFA</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getStatusColor(transaction.status)}`}>
                        {getStatusIcon(transaction.status)}
                        {transaction.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-mono text-xs">{transaction.transaction_uuid.substring(0, 8)}...</span>
                      <span>•</span>
                      <span>{transaction.type}</span>
                      <span>•</span>
                      <span>{new Date(transaction.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-red-900 mb-2">Interdictions absolues</h4>
        <ul className="text-sm text-red-800 space-y-1">
          <li>• Modifier les montants</li>
          <li>• Supprimer les transactions SUCCESS</li>
          <li>• Réécrire l'historique</li>
        </ul>
      </div>
    </div>
  );
}

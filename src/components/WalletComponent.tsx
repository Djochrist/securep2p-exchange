import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Send, 
  QrCode, 
  Copy, 
  Download,
  Upload,
  Plus,
  Eye,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import WalletModel from 'models/WalletModel';
import type { Transaction, Wallet as WalletType } from 'types';

interface WalletComponentProps {
  setActiveTab: React.Dispatch<React.SetStateAction<'dashboard' | 'wallet' | 'messaging' | 'network' | 'settings' | 'contacts'>>;
}

const WalletComponent: React.FC<WalletComponentProps> = ({ setActiveTab }) => {
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [sendForm, setSendForm] = useState({
    toAddress: '',
    amount: '',
    message: ''
  });
  const [filter, setFilter] = useState<'all' | 'send' | 'receive' | 'pending'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const walletModel = WalletModel.getInstance();

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = () => {
    const walletData = walletModel.getWallet();
    setWallet(walletData);
    
    const transactionHistory = walletModel.getTransactionHistory();
    setTransactions(transactionHistory);
  };

  const handleSendTokens = async () => {
    if (!sendForm.toAddress || !sendForm.amount) {
      setError('Adresse et montant requis');
      return;
    }

    const amount = parseFloat(sendForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Montant invalide');
      return;
    }

    if (!wallet || amount > wallet.balance) {
      setError('Solde insuffisant');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const transaction = await walletModel.createTransaction(
        sendForm.toAddress,
        amount,
        sendForm.message || undefined
      );

      setSuccess(`Transaction créée: ${transaction.id.substring(0, 8)}...`);
      setSendForm({ toAddress: '', amount: '', message: '' });
      setShowSendModal(false);
      loadWalletData();
    } catch (error) {
      setError(`Erreur lors de l'envoi: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveQR = () => {
    if (!wallet) return;

    try {
      const receiveData = walletModel.generateReceiveQR();
      console.log('QR Data:', receiveData);
      setShowReceiveModal(true);
    } catch (error) {
      setError(`Erreur lors de la génération du QR: ${error}`);
    }
  };

  const handleAddTestTokens = async () => {
    try {
      await walletModel.addTestTokens(100);
      setSuccess('100 tokens de test ajoutés');
      loadWalletData();
    } catch (error) {
      setError(`Erreur: ${error}`);
    }
  };

  const handleExportTransactions = () => {
    try {
      const data = walletModel.exportTransactions('json');
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${wallet?.address.substring(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess('Transactions exportées');
    } catch (error) {
      setError(`Erreur d'export: ${error}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('Copié dans le presse-papiers');
    }).catch(() => {
      setError('Erreur lors de la copie');
    });
  };

  const getFilteredTransactions = () => {
    if (!wallet) return [];

    return transactions.filter(tx => {
      switch (filter) {
        case 'send':
          return tx.fromAddress === wallet.address;
        case 'receive':
          return tx.toAddress === wallet.address;
        case 'pending':
          return tx.status === 'pending';
        default:
          return true;
      }
    });
  };

  const getTransactionIcon = (transaction: Transaction) => {
    if (!wallet) return <Clock className="w-5 h-5 text-gray-500" />;

    const isSent = transaction.fromAddress === wallet.address;
    
    if (transaction.status === 'pending') {
      return <Clock className="w-5 h-5 text-yellow-500" />;
    } else if (transaction.status === 'confirmed') {
      return isSent ? 
        <ArrowUpRight className="w-5 h-5 text-red-500" /> : 
        <ArrowDownLeft className="w-5 h-5 text-green-500" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Confirmé</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">En attente</span>;
      case 'failed':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Échec</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Inconnu</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Portefeuille
        </h1>
        <p className="text-gray-600">
          Gérez vos tokens et transactions sécurisées
        </p>
      </div>

      {/* Alertes */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button onClick={() => setError('')} className="mt-2 text-red-500 hover:text-red-700 text-sm">
            Fermer
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-600">{success}</p>
          <button onClick={() => setSuccess('')} className="mt-2 text-green-500 hover:text-green-700 text-sm">
            Fermer
          </button>
        </div>
      )}

      {/* Solde principal */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-100 text-sm">Solde disponible</p>
            <p className="text-4xl font-bold">
              {wallet?.balance.toFixed(2) || '0.00'}
            </p>
            <p className="text-indigo-100 text-sm">STP (SecureP2P Tokens)</p>
          </div>
          <Wallet className="w-12 h-12 text-indigo-200" />
        </div>

        <div className="mt-6 flex space-x-4">
          <button
            onClick={() => setShowSendModal(true)}
            className="flex-1 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-colors flex items-center justify-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Envoyer</span>
          </button>
          <button
            onClick={handleReceiveQR}
            className="flex-1 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-colors flex items-center justify-center space-x-2"
          >
            <QrCode className="w-4 h-4" />
            <span>Recevoir</span>
          </button>
          <button
            onClick={handleAddTestTokens}
            className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Test</span>
          </button>
        </div>
      </div>

      {/* Adresse du portefeuille */}
      {wallet && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Adresse du portefeuille
          </h2>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <code className="flex-1 text-sm text-gray-700 font-mono">
              {wallet.address}
            </code>
            <button
              onClick={() => copyToClipboard(wallet.address)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Historique des transactions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Historique des transactions
          </h2>
          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Toutes</option>
              <option value="send">Envoyées</option>
              <option value="receive">Reçues</option>
              <option value="pending">En attente</option>
            </select>
            <button
              onClick={handleExportTransactions}
              className="px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Exporter</span>
            </button>
          </div>
        </div>

        {getFilteredTransactions().length > 0 ? (
          <div className="space-y-3">
            {getFilteredTransactions().map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {getTransactionIcon(transaction)}
                  <div>
                    <p className="font-medium text-gray-900">
                      {wallet && transaction.fromAddress === wallet.address ? 'Envoi' : 'Réception'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {wallet && transaction.fromAddress === wallet.address
                        ? `Vers ${transaction.toAddress.substring(0, 8)}...${transaction.toAddress.substring(transaction.toAddress.length - 4)}`
                        : `De ${transaction.fromAddress.substring(0, 8)}...${transaction.fromAddress.substring(transaction.fromAddress.length - 4)}`
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {transaction.timestamp.toLocaleString()}
                    </p>
                    {transaction.message && (
                      <p className="text-xs text-gray-600 italic">
                        "{transaction.message}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    wallet && transaction.fromAddress === wallet.address 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {wallet && transaction.fromAddress === wallet.address ? '-' : '+'}
                    {transaction.amount.toFixed(2)} STP
                  </p>
                  {transaction.fee > 0 && wallet && transaction.fromAddress === wallet.address && (
                    <p className="text-xs text-gray-500">
                      Frais: {transaction.fee.toFixed(4)} STP
                    </p>
                  )}
                  <div className="mt-1">
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Wallet className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600">Aucune transaction trouvée</p>
            <p className="text-sm text-gray-500 mt-1">
              {filter === 'all' ? 'Vos transactions apparaîtront ici' : `Aucune transaction ${filter}`}
            </p>
          </div>
        )}
      </div>

      {/* Modal d'envoi */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Envoyer des tokens
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse du destinataire
                </label>
                <input
                  type="text"
                  value={sendForm.toAddress}
                  onChange={(e) => setSendForm(prev => ({ ...prev, toAddress: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0x..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant (STP)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={wallet?.balance || 0}
                  value={sendForm.amount}
                  onChange={(e) => setSendForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Solde disponible: {wallet?.balance.toFixed(2) || '0.00'} STP
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message (optionnel)
                </label>
                <textarea
                  value={sendForm.message}
                  onChange={(e) => setSendForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Message à joindre..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowSendModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                onClick={handleSendTokens}
                disabled={loading || !sendForm.toAddress || !sendForm.amount}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de réception */}
      {showReceiveModal && wallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recevoir des tokens
            </h3>
            
            <div className="text-center">
              <div className="bg-gray-100 p-8 rounded-lg mb-4">
                <QrCode className="mx-auto w-24 h-24 text-gray-400" />
                <p className="text-sm text-gray-600 mt-2">
                  QR Code (simulé)
                </p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Votre adresse:
                  </p>
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                    <code className="flex-1 text-xs text-gray-700 font-mono">
                      {wallet.address}
                    </code>
                    <button
                      onClick={() => copyToClipboard(wallet.address)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowReceiveModal(false)}
              className="w-full mt-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletComponent;
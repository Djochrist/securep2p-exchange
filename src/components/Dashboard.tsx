import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Users, 
  MessageCircle, 
  Activity,
  Send,
  QrCode,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  X,
  Copy,
  Download,
  ArrowRight
} from 'lucide-react';
import WalletModel from 'models/WalletModel';
import P2PNetwork from 'network/P2PNetwork';
import type { Transaction } from 'types';

// Props pour le composant Dashboard
interface DashboardProps {
  onNavigate: (page: 'wallet' | 'messaging' | 'network' | 'settings') => void;
}

// Interfaces pour les modales
interface SendTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (recipient: string, amount: number) => Promise<void>;
}

interface ReceiveTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
}

// Composant Modal pour l'envoi
const SendTokensModal: React.FC<SendTokensModalProps> = ({ isOpen, onClose, onSend }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount || parseFloat(amount) <= 0) return;
    
    setIsLoading(true);
    try {
      await onSend(recipient, parseFloat(amount));
      setRecipient('');
      setAmount('');
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Envoyer des tokens</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse du destinataire
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Ex: 0x742d35Cc6634C0532925a3b8..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant (STP)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || !recipient || !amount}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Composant Modal pour recevoir
const ReceiveTokensModal: React.FC<ReceiveTokensModalProps> = ({ isOpen, onClose, address }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-sm w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Recevoir des tokens</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
              <div className="w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <QrCode className="w-16 h-16 text-indigo-600" />
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Votre adresse de réception</p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs font-mono break-all">{address}</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleCopyAddress}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <Copy className="w-4 h-4" />
              <span>{copied ? 'Copié !' : 'Copier'}</span>
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Service de messagerie simulé
class MessagingService {
  private static instance: MessagingService;
  private unreadCount: number = 0;

  static getInstance(): MessagingService {
    if (!MessagingService.instance) {
      MessagingService.instance = new MessagingService();
    }
    return MessagingService.instance;
  }

  getUnreadMessagesCount(): number {
    return this.unreadCount;
  }

  simulateMessageReceipt() {
    if (Math.random() < 0.3) {
      this.unreadCount = Math.min(this.unreadCount + 1, 5);
    }
  }

  markAsRead() {
    this.unreadCount = 0;
  }
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [balance, setBalance] = useState(0);
  const [connectedPeers, setConnectedPeers] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [networkStats, setNetworkStats] = useState({
    latency: 0,
    isRunning: false
  });

  // États pour les modales
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

  const walletModel = WalletModel.getInstance();
  const p2pNetwork = P2PNetwork.getInstance();
  const messagingService = MessagingService.getInstance();

  useEffect(() => {
    loadDashboardData();
    
    const interval = setInterval(loadDashboardData, 5000);
    
    const messageInterval = setInterval(() => {
      messagingService.simulateMessageReceipt();
      setUnreadMessages(messagingService.getUnreadMessagesCount());
    }, 10000);

    return () => {
      clearInterval(interval);
      clearInterval(messageInterval);
    };
  }, []);

  const loadDashboardData = () => {
    setBalance(walletModel.getBalance());
    
    const stats = p2pNetwork.getNetworkStats();
    setConnectedPeers(stats.connectedPeers);
    setNetworkStats({
      latency: Math.floor(Math.random() * 100) + 20,
      isRunning: stats.isRunning
    });
    
    const transactions = walletModel.getTransactionHistory(5);
    setRecentTransactions(transactions);
    
    setUnreadMessages(messagingService.getUnreadMessagesCount());
  };

  const handleSendTokens = async (recipient: string, amount: number) => {
    try {
      console.log(`Envoi de ${amount} STP à ${recipient}`);
      loadDashboardData();
      return Promise.resolve();
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      throw error;
    }
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatAmount = (amount: number, type: 'send' | 'receive') => {
    const sign = type === 'send' ? '-' : '+';
    const color = type === 'send' ? 'text-red-600' : 'text-green-600';
    return (
      <span className={color}>
        {sign}{amount.toFixed(2)} STP
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Modales */}
      <SendTokensModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSend={handleSendTokens}
      />
      
      <ReceiveTokensModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        address={walletModel.getWallet()?.address || ''}
      />

      {/* En-tête du tableau de bord */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Tableau de bord
            </h1>
            <p className="text-gray-600">
              Vue d'ensemble de votre activité sur le réseau P2P
            </p>
          </div>
          <button 
            onClick={() => onNavigate('settings')}
            className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700"
          >
            <span>Mon profil</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tuiles de résumé */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Solde */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Solde total</p>
              <p className="text-3xl font-bold text-gray-900">
                {balance.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">STP (SecureP2P Tokens)</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <Wallet className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => setIsSendModalOpen(true)}
              className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              Envoyer
            </button>
            <button
              onClick={() => setIsReceiveModalOpen(true)}
              className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700"
            >
              Recevoir
            </button>
          </div>
        </div>

        {/* Pairs connectés */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pairs connectés</p>
              <p className="text-3xl font-bold text-gray-900">
                {connectedPeers}
              </p>
              <p className="text-sm text-gray-500">
                Latence: {networkStats.latency}ms
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <button 
              onClick={() => onNavigate('network')}
              className="w-full bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700"
            >
              Voir le réseau
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-lg shadow-sm p-6 relative">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Messages non lus</p>
              <p className="text-3xl font-bold text-gray-900">
                {unreadMessages}
              </p>
              <p className="text-sm text-gray-500">Conversations actives</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          {unreadMessages > 0 && (
            <span className="absolute top-4 right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadMessages}
            </span>
          )}
          <div className="mt-4">
            <button 
              onClick={() => {
                console.log('[DEBUG] Dashboard: Messagerie button clicked'); 
                messagingService.markAsRead();
                setUnreadMessages(0);
                onNavigate('messaging');
              }}
              className="w-full bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Messagerie
            </button>
          </div>
        </div>

        {/* Activité */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-3xl font-bold text-gray-900">
                {recentTransactions.length}
              </p>
              <p className="text-sm text-gray-500">Dernières 24h</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <button 
              onClick={() => onNavigate('wallet')}
              className="w-full bg-purple-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700"
          >
            Voir transactions
          </button>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Actions rapides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setIsSendModalOpen(true)}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Send className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Envoyer des tokens</p>
              <p className="text-sm text-gray-600">Transfert rapide vers un pair</p>
            </div>
          </button>

          <button
            onClick={() => setIsReceiveModalOpen(true)}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="bg-green-100 p-2 rounded-lg">
              <QrCode className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Recevoir des tokens</p>
              <p className="text-sm text-gray-600">Générer un QR code</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('messaging')}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="bg-blue-100 p-2 rounded-lg">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Nouveau message</p>
              <p className="text-sm text-gray-600">Chat chiffré avec un pair</p>
            </div>
          </button>
        </div>
      </div>

      {/* Activité récente */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Activité récente
          </h2>
          <button 
            onClick={() => onNavigate('wallet')}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center space-x-1"
          >
            <Eye className="w-4 h-4" />
            <span>Voir tout</span>
          </button>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(transaction.status)}
                  <div>
                    <p className="font-medium text-gray-900">
                      {transaction.fromAddress === walletModel.getWallet()?.address ? 'Envoi' : 'Réception'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {transaction.fromAddress === walletModel.getWallet()?.address
                        ? `Vers ${formatAddress(transaction.toAddress)}`
                        : `De ${formatAddress(transaction.fromAddress)}`
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {formatAmount(
                      transaction.amount,
                      transaction.fromAddress === walletModel.getWallet()?.address ? 'send' : 'receive'
                    )}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {transaction.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600">Aucune activité récente</p>
            <p className="text-sm text-gray-500 mt-1">
              Vos transactions apparaîtront ici
            </p>
          </div>
        )}
      </div>

      {/* Diagnostic réseau */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Diagnostic réseau
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Statut du nœud</p>
            <p className={`font-semibold ${networkStats.isRunning ? 'text-green-600' : 'text-red-600'}`}>
              {networkStats.isRunning ? 'En ligne' : 'Hors ligne'}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Latence moyenne</p>
            <p className="font-semibold text-gray-900">{networkStats.latency}ms</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Chiffrement</p>
            <p className="font-semibold text-green-600">RSA-2048 + AES</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
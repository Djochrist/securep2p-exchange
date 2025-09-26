import React, { useState, useEffect } from 'react';
import type { User } from 'types';
import UserModel from './models/UserModel';
import WalletModel from './models/WalletModel';
import P2PNetwork from './network/P2PNetwork';

// Composants
import AuthComponent from './components/AuthComponent';
import Dashboard from './components/Dashboard';
import WalletComponent from './components/WalletComponent';
import MessagingComponent from './components/MessagingComponent';
import NetworkComponent from './components/NetworkComponent';
import SettingsComponent from './components/SettingsComponent';
import ContactComponent from './components/ContactComponent';
import { Footer } from './components/Footer';

// Icons
import { 
  Home,
  Wallet,
  MessageCircle,
  Network,
  Settings,
  User as UserIcon,
  Bell,
  Wifi,
  WifiOff
} from 'lucide-react';

type TabType = 'dashboard' | 'wallet' | 'messaging' | 'network' | 'settings' | 'contacts';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);

  // Modèles
  const userModel = UserModel.getInstance();
  const walletModel = WalletModel.getInstance();
  const p2pNetwork = P2PNetwork.getInstance();

  useEffect(() => {
    // Vérifie s'il y a un utilisateur connecté au démarrage
    const user = userModel.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      initializeServices(user);
    }
  }, []);

  const initializeServices = async (user: User) => {
    try {
      // Initialise le portefeuille
      await walletModel.initializeWallet(user);
      
      // Initialise le réseau P2P
      const localPeer = {
        id: user.id,
        address: user.address,
        publicKey: user.publicKey,
        status: 'online' as const,
        lastSeen: new Date(),
        capabilities: ['messages', 'transactions'],
        version: '1.0.0'
      };
      
      await p2pNetwork.initialize({
        ...localPeer,
        status: "connected"
      });
      setIsConnected(true);
      
      // Configure les gestionnaires de messages
      setupMessageHandlers();
      
      addNotification('Connexion au réseau P2P réussie');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      addNotification('Erreur de connexion au réseau');
    }
  };

  const setupMessageHandlers = () => {
    // Gestionnaire pour les transactions
    p2pNetwork.onMessage('transaction', (message, fromPeer) => {
      console.log('Transaction reçue:', message.payload);
      addNotification(`Transaction reçue de ${fromPeer.substring(0, 8)}...`);
    });

    // Gestionnaire pour les messages de chat
    p2pNetwork.onMessage('message', (message, fromPeer) => {
      console.log('Message reçu:', message.payload);
      addNotification(`Nouveau message de ${fromPeer.substring(0, 8)}...`);
    });
  };

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    await initializeServices(user);
  };

  const handleLogout = async () => {
    if (currentUser) {
      await userModel.logout();
      await p2pNetwork.shutdown();
      setCurrentUser(null);
      setIsConnected(false);
      setNotifications([]);
      setActiveTab('dashboard');
    }
  };

  const addNotification = (message: string) => {
    setNotifications(prev => [message, ...prev.slice(0, 4)]); 
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif !== message));
    }, 5000);
  };

  // Fonction de navigation pour le Dashboard
  const handleDashboardNavigate = (page: 'wallet' | 'messaging' | 'network' | 'settings') => {
    console.log(`[DEBUG] App: handleDashboardNavigate called with ->`, page);
    setActiveTab(page);
  };

  // Si aucun utilisateur connecté, affiche l'écran d'authentification
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <AuthComponent onLogin={handleLogin} />
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord', icon: Home },
    { id: 'wallet', label: 'Portefeuille', icon: Wallet },
    { id: 'messaging', label: 'Messagerie', icon: MessageCircle },
    { id: 'network', label: 'Réseau', icon: Network },
    { id: 'settings', label: 'Paramètres', icon: Settings },
    { id: 'contacts', label: 'Contacts', icon: UserIcon } 
  ] as const;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={handleDashboardNavigate} />;
      case 'wallet':
        return <WalletComponent setActiveTab={setActiveTab} />;
      case 'messaging':
        return <MessagingComponent setActiveTab={setActiveTab} />;
      case 'network':
        return <NetworkComponent setActiveTab={setActiveTab} />;
      case 'settings':
        return <SettingsComponent onLogout={handleLogout} setActiveTab={setActiveTab} />;
      case 'contacts':
        return <ContactComponent setActiveTab={setActiveTab} />;
      default:
        return <Dashboard onNavigate={handleDashboardNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo et titre */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P2P</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">SecureP2P Exchange</h1>
                  <p className="text-xs text-gray-500">Plateforme d'échange sécurisé pair-à-pair</p>
                </div>
              </div>
            </div>

            {/* Statut et actions */}
            <div className="flex items-center space-x-4">
              {/* Statut réseau */}
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm text-gray-600">
                  {isConnected ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>

              {/* Notifications */}
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </div>

              {/* Profil utilisateur */}
              <div className="flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">{currentUser.nickname}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications flottantes */}
      {notifications.length > 0 && (
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className="bg-white shadow-lg rounded-lg p-3 border-l-4 border-indigo-500 max-w-sm"
            >
              <p className="text-sm text-gray-700">{notification}</p>
            </div>
          ))}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-6">
          {/* Sidebar avec onglets */}
          <div className="w-64 bg-white rounded-lg shadow-sm p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Contenu principal */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Footer with developer branding */}
      <Footer />
    </div>
  );
};

export default App;
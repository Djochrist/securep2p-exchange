import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Users, 
  Plus,
  Wifi,
  WifiOff,
  Settings,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import P2PNetwork from 'network/P2PNetwork';
import type { Peer } from 'types';

const NetworkComponent: React.FC = () => {
  const [connectedPeers, setConnectedPeers] = useState<Peer[]>([]);
  const [discoveredPeers, setDiscoveredPeers] = useState<Peer[]>([]);
  const [networkStats, setNetworkStats] = useState({
    connectedPeers: 0,
    totalPeers: 0,
    isRunning: false,
    localPeerId: null as string | null
  });
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [showAddPeerModal, setShowAddPeerModal] = useState(false);
  const [newPeerForm, setNewPeerForm] = useState({
    address: '',
    publicKey: ''
  });
  const [logs, setLogs] = useState<Array<{
    id: string;
    timestamp: Date;
    level: 'info' | 'warning' | 'error';
    message: string;
  }>>([]);

  const p2pNetwork = P2PNetwork.getInstance();

  useEffect(() => {
    loadNetworkData();
    initializeLogs();
    
    // Actualise les données toutes les 3 secondes
    const interval = setInterval(loadNetworkData, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadNetworkData = () => {
    const stats = p2pNetwork.getNetworkStats();
    setNetworkStats(stats);
    
    const peers = p2pNetwork.getConnectedPeers();
    setConnectedPeers(peers);
  };

  const initializeLogs = () => {
    const initialLogs = [
      {
        id: 'log_1',
        timestamp: new Date(Date.now() - 300000),
        level: 'info' as const,
        message: 'Nœud P2P démarré avec succès'
      },
      {
        id: 'log_2',
        timestamp: new Date(Date.now() - 240000),
        level: 'info' as const,
        message: 'Connexion au serveur STUN établie'
      },
      {
        id: 'log_3',
        timestamp: new Date(Date.now() - 180000),
        level: 'warning' as const,
        message: 'Tentative de connexion UPnP échouée'
      },
      {
        id: 'log_4',
        timestamp: new Date(Date.now() - 120000),
        level: 'info' as const,
        message: 'Découverte de 3 pairs disponibles'
      },
      {
        id: 'log_5',
        timestamp: new Date(Date.now() - 60000),
        level: 'info' as const,
        message: 'Handshake réussi avec pair_abc123'
      }
    ];
    setLogs(initialLogs);
  };

  const handleDiscoverPeers = async () => {
    setIsDiscovering(true);
    addLog('info', 'Démarrage de la découverte de pairs...');
    
    try {
      const discovered = await p2pNetwork.discoverPeers();
      setDiscoveredPeers(discovered);
      addLog('info', `${discovered.length} pairs découverts`);
    } catch (error) {
      addLog('error', `Erreur lors de la découverte: ${error}`);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleConnectToPeer = async (peer: Peer) => {
    addLog('info', `Tentative de connexion à ${peer.id}...`);
    
    try {
      await p2pNetwork.connectToPeer({
        id: peer.id,
        address: peer.address,
        publicKey: peer.publicKey
      });
      
      addLog('info', `Connexion établie avec ${peer.id}`);
      loadNetworkData();
      
      // Retire le pair de la liste découverte
      setDiscoveredPeers(prev => prev.filter(p => p.id !== peer.id));
    } catch (error) {
      addLog('error', `Échec de connexion à ${peer.id}: ${error}`);
    }
  };

  const handleDisconnectFromPeer = async (peerId: string) => {
    addLog('info', `Déconnexion de ${peerId}...`);
    
    try {
      await p2pNetwork.disconnectFromPeer(peerId);
      addLog('info', `Déconnecté de ${peerId}`);
      loadNetworkData();
    } catch (error) {
      addLog('error', `Erreur lors de la déconnexion: ${error}`);
    }
  };

  const handlePingPeer = async (peerId: string) => {
    try {
      const latency = await p2pNetwork.pingPeer(peerId);
      addLog('info', `Ping ${peerId}: ${latency}ms`);
    } catch (error) {
      addLog('warning', `Ping échoué pour ${peerId}: ${error}`);
    }
  };

  const handleAddPeerManually = async () => {
    if (!newPeerForm.address) {
      addLog('error', 'Adresse requise');
      return;
    }

    try {
      const peerId = `manual_${Date.now()}`;
      await p2pNetwork.connectToPeer({
        id: peerId,
        address: newPeerForm.address,
        publicKey: newPeerForm.publicKey || 'manual_key'
      });
      
      addLog('info', `Connexion manuelle établie avec ${newPeerForm.address}`);
      setShowAddPeerModal(false);
      setNewPeerForm({ address: '', publicKey: '' });
      loadNetworkData();
    } catch (error) {
      addLog('error', `Échec de connexion manuelle: ${error}`);
    }
  };

  const addLog = (level: 'info' | 'warning' | 'error', message: string) => {
    const newLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date(),
      level,
      message
    };
    
    setLogs(prev => [newLog, ...prev].slice(0, 20)); // Garde seulement 20 logs
  };

  const getStatusIcon = (status: Peer['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-gray-500" />;
      case 'banned':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Wifi className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLogIcon = (level: 'info' | 'warning' | 'error') => {
    switch (level) {
      case 'info':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const formatAddress = (address: string) => {
    if (address.includes(':')) {
      return address; // IP:port
    }
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Réseau P2P
        </h1>
        <p className="text-gray-600">
          Gestion des connexions pair-à-pair et diagnostic réseau
        </p>
      </div>

      {/* Statistiques réseau */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Statut du nœud</p>
              <p className={`text-xl font-bold ${
                networkStats.isRunning ? 'text-green-600' : 'text-red-600'
              }`}>
                {networkStats.isRunning ? 'En ligne' : 'Hors ligne'}
              </p>
            </div>
            {networkStats.isRunning ? (
              <Wifi className="w-8 h-8 text-green-500" />
            ) : (
              <WifiOff className="w-8 h-8 text-red-500" />
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pairs connectés</p>
              <p className="text-xl font-bold text-gray-900">
                {networkStats.connectedPeers}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Latence moyenne</p>
              <p className="text-xl font-bold text-gray-900">
                45ms
              </p>
            </div>
            <Zap className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sécurité</p>
              <p className="text-xl font-bold text-green-600">
                Actif
              </p>
            </div>
            <Shield className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Actions réseau */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Actions réseau
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleDiscoverPeers}
            disabled={isDiscovering}
            className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100"
          >
            <Network className={`w-5 h-5 text-indigo-600 ${isDiscovering ? 'animate-spin' : ''}`} />
            <span className="font-medium text-gray-900">
              {isDiscovering ? 'Découverte...' : 'Découvrir des pairs'}
            </span>
          </button>

          <button
            onClick={() => setShowAddPeerModal(true)}
            className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-900">Ajouter un pair</span>
          </button>

          <button className="flex items-center justify-center space-x-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Settings className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Configuration</span>
          </button>
        </div>
      </div>

      {/* Pairs connectés */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Pairs connectés ({connectedPeers.length})
        </h2>
        
        {connectedPeers.length > 0 ? (
          <div className="space-y-3">
            {connectedPeers.map((peer) => (
              <div
                key={peer.id}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  {getStatusIcon(peer.status)}
                  <div>
                    <p className="font-medium text-gray-900">
                      {peer.id.substring(0, 12)}...
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatAddress(peer.address)}
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-500">
                        Version: {peer.version}
                      </span>
                      {peer.latency && (
                        <span className="text-xs text-gray-500">
                          Latence: {peer.latency}ms
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePingPeer(peer.id)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                  >
                    Ping
                  </button>
                  <button
                    onClick={() => handleDisconnectFromPeer(peer.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                  >
                    Déconnecter
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Network className="mx-auto w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600">Aucun pair connecté</p>
            <p className="text-sm text-gray-500 mt-1">
              Découvrez des pairs pour commencer
            </p>
          </div>
        )}
      </div>

      {/* Pairs découverts */}
      {discoveredPeers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pairs découverts ({discoveredPeers.length})
          </h2>
          
          <div className="space-y-3">
            {discoveredPeers.map((peer) => (
              <div
                key={peer.id}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <WifiOff className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {peer.id.substring(0, 12)}...
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatAddress(peer.address)}
                    </p>
                    <span className="text-xs text-gray-500">
                      Découvert - Non connecté
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleConnectToPeer(peer)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                >
                  Se connecter
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs réseau */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Logs réseau
          </h2>
          <button
            onClick={() => setLogs([])}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Effacer
          </button>
        </div>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              {getLogIcon(log.level)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{log.message}</p>
                <p className="text-xs text-gray-500">
                  {log.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {logs.length === 0 && (
            <div className="text-center py-4">
              <Activity className="mx-auto w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Aucun log réseau</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'ajout de pair */}
      {showAddPeerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ajouter un pair manuellement
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse (IP:port ou ID)
                </label>
                <input
                  type="text"
                  value={newPeerForm.address}
                  onChange={(e) => setNewPeerForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="192.168.1.100:8080 ou peer_id"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clé publique (optionnel)
                </label>
                <textarea
                  value={newPeerForm.publicKey}
                  onChange={(e) => setNewPeerForm(prev => ({ ...prev, publicKey: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Clé publique RSA..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddPeerModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddPeerManually}
                disabled={!newPeerForm.address}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkComponent;
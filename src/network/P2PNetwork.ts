/**
 * Service réseau P2P utilisant WebRTC pour les connexions pair-à-pair
 */

import type { Peer, P2PMessage, NetworkConfig } from 'types';
import CryptoService from 'security/CryptoService';

interface PeerConnection extends RTCPeerConnection {
  peerId: string;
  dataChannel?: RTCDataChannel;
  lastSeen: Date;
}

class P2PNetwork {
  private static instance: P2PNetwork;
  private peers: Map<string, PeerConnection> = new Map();
  private localPeer: Peer | null = null;
  private config: NetworkConfig;
  private cryptoService: CryptoService;
  private messageHandlers: Map<string, (message: P2PMessage, fromPeer: string) => void> = new Map();
  private isRunning = false;

  private constructor() {
  this.cryptoService = CryptoService.getInstance();
    this.config = {
      port: 8080,
      maxPeers: 50,
      bootstrapNodes: [],
      enableUPnP: true,
      enableRelay: false
    };
  }

  public static getInstance(): P2PNetwork {
    if (!P2PNetwork.instance) {
      P2PNetwork.instance = new P2PNetwork();
    }
    return P2PNetwork.instance;
  }

  /**
   * Initialise le nœud P2P local
   */
  async initialize(localPeer: Peer): Promise<void> {
    this.localPeer = localPeer;
    this.isRunning = true;
    
    console.log(`Nœud P2P initialisé: ${localPeer.id}`);
  }

  /**
   * Se connecte à un pair
   */
  async connectToPeer(peerInfo: { id: string; address: string; publicKey: string }): Promise<void> {
    if (this.peers.has(peerInfo.id)) {
      console.log(`Déjà connecté au pair ${peerInfo.id}`);
      return;
    }

    try {
      const connection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }) as PeerConnection;

      connection.peerId = peerInfo.id;
      connection.lastSeen = new Date();

      // Configuration des événements de connexion
      connection.oniceconnectionstatechange = () => {
        console.log(`État de connexion ICE avec ${peerInfo.id}: ${connection.iceConnectionState}`);
        
        if (connection.iceConnectionState === 'disconnected' || 
            connection.iceConnectionState === 'failed') {
          this.handlePeerDisconnection(peerInfo.id);
        }
      };

      connection.ondatachannel = (event) => {
        this.setupDataChannel(event.channel, peerInfo.id);
      };

      // Crée un canal de données
      const dataChannel = connection.createDataChannel('p2p-messages', {
        ordered: true
      });

      connection.dataChannel = dataChannel;
      this.setupDataChannel(dataChannel, peerInfo.id);

      // Crée une offre
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);

      // Dans une vraie implémentation, l'offre serait envoyée via un serveur de signaling
      // Ici, on simule le processus
      await this.simulateSignaling(connection, peerInfo);

      this.peers.set(peerInfo.id, connection);
      console.log(`Connexion établie avec le pair ${peerInfo.id}`);
      
    } catch (error) {
      console.error(`Erreur lors de la connexion au pair ${peerInfo.id}:`, error);
      throw error;
    }
  }

  /**
   * Diffuse un message à tous les pairs connectés
   */
  async broadcastMessage(message: P2PMessage): Promise<void> {
    if (!this.localPeer) {
      throw new Error('Nœud P2P non initialisé');
    }

    // Signe le message
    const keyPair = this.cryptoService.getKeyPair();
    if (keyPair) {
      try {
        const messageData = JSON.stringify({
          type: message.type,
          payload: message.payload,
          timestamp: message.timestamp,
          from: message.from
        });
        
        const signingKeyPair = await this.cryptoService.generateSigningKeyPair();
        message.signature = await this.cryptoService.signData(messageData, signingKeyPair.privateKey);
      } catch (error) {
        console.error('Erreur lors de la signature du message:', error);
      }
    }

    const messageStr = JSON.stringify(message);
    
    // Envoie à tous les pairs connectés
    for (const [peerId, connection] of this.peers.entries()) {
      if (connection.dataChannel && connection.dataChannel.readyState === 'open') {
        try {
          connection.dataChannel.send(messageStr);
          console.log(`Message envoyé au pair ${peerId}`);
        } catch (error) {
          console.error(`Erreur lors de l'envoi du message au pair ${peerId}:`, error);
        }
      }
    }
  }

  /**
   * Envoie un message à un pair spécifique
   */
  async sendMessageToPeer(peerId: string, message: P2PMessage): Promise<void> {
    const connection = this.peers.get(peerId);
    if (!connection || !connection.dataChannel) {
      throw new Error(`Pair ${peerId} non connecté`);
    }

    if (connection.dataChannel.readyState !== 'open') {
      throw new Error(`Canal de données fermé pour le pair ${peerId}`);
    }

    try {
      // Signe le message
      const keyPair = this.cryptoService.getKeyPair();
      if (keyPair) {
        const messageData = JSON.stringify({
          type: message.type,
          payload: message.payload,
          timestamp: message.timestamp,
          from: message.from
        });
        
        const signingKeyPair = await this.cryptoService.generateSigningKeyPair();
        message.signature = await this.cryptoService.signData(messageData, signingKeyPair.privateKey);
      }

      connection.dataChannel.send(JSON.stringify(message));
      console.log(`Message privé envoyé au pair ${peerId}`);
    } catch (error) {
      console.error(`Erreur lors de l'envoi du message privé au pair ${peerId}:`, error);
      throw error;
    }
  }

  /**
   * Enregistre un gestionnaire de message
   */
  onMessage(messageType: string, handler: (message: P2PMessage, fromPeer: string) => void): void {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Supprime un gestionnaire de message
   */
  offMessage(messageType: string): void {
    this.messageHandlers.delete(messageType);
  }

  /**
   * Obtient la liste des pairs connectés
   */
  getConnectedPeers(): Peer[] {
    const peers: Peer[] = [];
    
    for (const [peerId, connection] of this.peers.entries()) {
      if (connection.iceConnectionState === 'connected') {
        peers.push({
          id: peerId,
          address: peerId, // Simplifié pour l'exemple
          publicKey: '', // Devrait être récupéré lors du handshake
          status: 'connected',
          lastSeen: connection.lastSeen,
          capabilities: ['messages', 'transactions'],
          version: '1.0.0'
        });
      }
    }
    
    return peers;
  }

  /**
   * Ping un pair pour tester la connexion
   */
  async pingPeer(peerId: string): Promise<number> {
    const startTime = Date.now();
    
    const pingMessage: P2PMessage = {
      type: 'ping',
      payload: { timestamp: startTime },
      signature: '',
      timestamp: new Date(),
      from: this.localPeer?.id || ''
    };

    return new Promise((resolve, reject) => {
      // Enregistre un gestionnaire temporaire pour le pong
      const pongHandler = (message: P2PMessage) => {
        if (message.type === 'pong' && message.payload.originalTimestamp === startTime) {
          const latency = Date.now() - startTime;
          this.messageHandlers.delete('pong');
          resolve(latency);
        }
      };

      this.messageHandlers.set('pong', pongHandler);

      // Envoie le ping
      this.sendMessageToPeer(peerId, pingMessage).catch(reject);

      // Timeout après 5 secondes
      setTimeout(() => {
        this.messageHandlers.delete('pong');
        reject(new Error('Timeout du ping'));
      }, 5000);
    });
  }

  /**
   * Se déconnecte d'un pair
   */
  async disconnectFromPeer(peerId: string): Promise<void> {
    const connection = this.peers.get(peerId);
    if (connection) {
      connection.close();
      this.peers.delete(peerId);
      console.log(`Déconnecté du pair ${peerId}`);
    }
  }

  /**
   * Ferme toutes les connexions
   */
  async shutdown(): Promise<void> {
    this.isRunning = false;
    
    for (const [peerId, connection] of this.peers.entries()) {
      connection.close();
    }
    
    this.peers.clear();
    this.messageHandlers.clear();
    console.log('Nœud P2P arrêté');
  }

  /**
   * Met à jour la configuration réseau
   */
  updateConfig(config: Partial<NetworkConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Obtient la configuration actuelle
   */
  getConfig(): NetworkConfig {
    return { ...this.config };
  }

  /**
   * Obtient les statistiques réseau
   */
  getNetworkStats(): {
    connectedPeers: number;
    totalPeers: number;
    isRunning: boolean;
    localPeerId: string | null;
  } {
    const connectedPeers = this.getConnectedPeers().length;
    
    return {
      connectedPeers,
      totalPeers: this.peers.size,
      isRunning: this.isRunning,
      localPeerId: this.localPeer?.id || null
    };
  }

  // Méthodes privées
  private setupDataChannel(dataChannel: RTCDataChannel, peerId: string): void {
    dataChannel.onopen = () => {
      console.log(`Canal de données ouvert avec ${peerId}`);
      this.sendHandshake(peerId);
    };

    dataChannel.onmessage = (event) => {
      try {
        const message: P2PMessage = JSON.parse(event.data);
        this.handleMessage(message, peerId);
      } catch (error) {
        console.error(`Erreur lors du traitement du message de ${peerId}:`, error);
      }
    };

    dataChannel.onerror = (error) => {
      console.error(`Erreur du canal de données avec ${peerId}:`, error);
    };

    dataChannel.onclose = () => {
      console.log(`Canal de données fermé avec ${peerId}`);
    };
  }

  private async sendHandshake(peerId: string): Promise<void> {
    if (!this.localPeer) return;

    const handshakeMessage: P2PMessage = {
      type: 'handshake',
      payload: {
        peerId: this.localPeer.id,
        publicKey: this.localPeer.publicKey,
        capabilities: this.localPeer.capabilities,
        version: this.localPeer.version
      },
      signature: '',
      timestamp: new Date(),
      from: this.localPeer.id
    };

    await this.sendMessageToPeer(peerId, handshakeMessage);
  }

  private handleMessage(message: P2PMessage, fromPeer: string): void {
    // Met à jour la dernière activité du pair
    const connection = this.peers.get(fromPeer);
    if (connection) {
      connection.lastSeen = new Date();
    }

    // Gère les messages système
    switch (message.type) {
      case 'handshake':
        this.handleHandshake(message, fromPeer);
        break;
      case 'ping':
        this.handlePing(message, fromPeer);
        break;
      case 'pong':
        // Traité par le gestionnaire de ping
        break;
      default:
        // Appelle le gestionnaire approprié
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
          handler(message, fromPeer);
        } else {
          console.warn(`Aucun gestionnaire pour le message de type: ${message.type}`);
        }
    }
  }

  private handleHandshake(message: P2PMessage, fromPeer: string): void {
    console.log(`Handshake reçu de ${fromPeer}:`, message.payload);
    
    // Ici, on pourrait valider la clé publique du pair
    // et mettre à jour nos informations sur ce pair
  }

  private async handlePing(message: P2PMessage, fromPeer: string): Promise<void> {
    const pongMessage: P2PMessage = {
      type: 'pong',
      payload: {
        originalTimestamp: message.payload.timestamp,
        timestamp: Date.now()
      },
      signature: '',
      timestamp: new Date(),
      from: this.localPeer?.id || ''
    };

    await this.sendMessageToPeer(fromPeer, pongMessage);
  }

  private handlePeerDisconnection(peerId: string): void {
    console.log(`Pair ${peerId} déconnecté`);
    this.peers.delete(peerId);
  }

  private async simulateSignaling(
    connection: PeerConnection,
    peerInfo: { id: string; address: string; publicKey: string }
  ): Promise<void> {
    // Dans une vraie implémentation, ceci serait géré par un serveur de signaling
    // Ici, on simule le processus pour le mode développement
    
    try {
      // Simule la réception d'une réponse
      const answer = await connection.createAnswer();
      await connection.setRemoteDescription(answer);
      
      console.log(`Signaling simulé pour ${peerInfo.id}`);
    } catch (error) {
      console.error('Erreur lors du signaling simulé:', error);
    }
  }

  /**
   * Découvre les pairs via différentes méthodes
   */
  async discoverPeers(): Promise<Peer[]> {
    // Implémentation simplifiée - dans une vraie app, utiliserait mDNS, DHT, etc.
    const discoveredPeers: Peer[] = [];
    
    // Simulation de découverte de pairs
    for (let i = 0; i < 3; i++) {
      discoveredPeers.push({
        id: `peer_${i}_${Math.random().toString(36).substr(2, 6)}`,
        address: `192.168.1.${100 + i}:8080`,
        publicKey: `fake_public_key_${i}`,
        status: 'disconnected',
        lastSeen: new Date(),
        capabilities: ['messages', 'transactions'],
        version: '1.0.0'
      });
    }
    
    return discoveredPeers;
  }
}

export default P2PNetwork;
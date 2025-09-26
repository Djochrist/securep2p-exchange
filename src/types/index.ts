// Types centralisés pour la plateforme P2P

export interface User {
  id: string;
  publicKey: string;
  address: string;
  nickname: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
}

export interface Wallet {
  address: string;
  balance: number;
  publicKey: string;
  privateKey?: string; // Stockée chiffrée
}

export interface Transaction {
  id: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  fee: number;
  message?: string;
  timestamp: Date;
  signature: string;
  nonce: number;
  status: 'pending' | 'confirmed' | 'failed';
  blockHash?: string;
}

export interface Message {
  id: string;
  fromAddress: string;
  toAddress: string;
  content: string; // Contenu chiffré
  timestamp: Date;
  signature: string;
  isRead: boolean;
  isEncrypted: boolean;
}

export interface Peer {
  id: string;
  address: string;
  publicKey: string;
  nickname?: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'banned';
  latency?: number;
  lastSeen: Date;
  capabilities: string[];
  version: string;
}

export interface NetworkConfig {
  port: number;
  maxPeers: number;
  bootstrapNodes: string[];
  enableUPnP: boolean;
  enableRelay: boolean;
}

export interface SecurityConfig {
  keySize: number;
  encryptionAlgorithm: string;
  hashAlgorithm: string;
  autoLock: boolean;
  autoLockTimeout: number;
}

export interface AppConfig {
  user: User;
  wallet: Wallet;
  network: NetworkConfig;
  security: SecurityConfig;
  ui: {
    theme: 'light' | 'dark';
    language: string;
    notifications: boolean;
  };
}

export interface P2PMessage {
  type: 'handshake' | 'transaction' | 'message' | 'ping' | 'pong';
  payload: any;
  signature: string;
  timestamp: Date;
  from: string;
}

export interface CryptoKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag?: string;
}

export interface SignedData {
  data: string;
  signature: string;
  publicKey: string;
}
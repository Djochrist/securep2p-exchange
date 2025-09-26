/**
 * Modèle utilisateur - Gestion des données utilisateur et authentification
 */

import type { User, CryptoKeyPair } from 'types';
import CryptoService from 'security/CryptoService';

class UserModel {
  private static instance: UserModel;
  private currentUser: User | null = null;
  private cryptoService: CryptoService;

  private constructor() {
  this.cryptoService = CryptoService.getInstance();
  }

  public static getInstance(): UserModel {
    if (!UserModel.instance) {
      UserModel.instance = new UserModel();
    }
    return UserModel.instance;
  }

  /**
   * Crée un nouveau compte utilisateur
   */
  async createUser(nickname: string): Promise<User> {
    try {
      // Génère une nouvelle paire de clés
      const keyPair = await this.cryptoService.generateKeyPair();
      const signingKeyPair = await this.cryptoService.generateSigningKeyPair();
      
      // Génère l'adresse à partir de la clé publique
      const address = await this.cryptoService.generateAddress(keyPair.publicKey);
      
      // Exporte la clé publique
      const publicKeyPEM = await this.cryptoService.exportPublicKey(keyPair.publicKey);

      const user: User = {
        id: this.generateUserId(),
        publicKey: publicKeyPEM,
        address: address,
        nickname: nickname,
        status: 'offline',
        lastSeen: new Date()
      };

      // Sauvegarde l'utilisateur et les clés
      await this.saveUser(user, keyPair, signingKeyPair);
      
      this.currentUser = user;
      return user;
    } catch (error) {
      throw new Error(`Erreur lors de la création de l'utilisateur: ${error}`);
    }
  }

  /**
   * Authentifie un utilisateur existant
   */
  async authenticateUser(userId: string, passphrase?: string): Promise<User> {
    try {
      const userData = this.loadUserData(userId);
      if (!userData) {
        throw new Error('Utilisateur non trouvé');
      }

      // Charge les clés si une passphrase est fournie
      if (passphrase) {
        await this.loadUserKeys(userId);
      }

      this.currentUser = userData;
      this.currentUser.status = 'online';
      this.currentUser.lastSeen = new Date();

      await this.saveUserData(this.currentUser);
      return this.currentUser;
    } catch (error) {
      throw new Error(`Erreur d'authentification: ${error}`);
    }
  }

  /**
   * Met à jour le statut de l'utilisateur
   */
  async updateUserStatus(status: User['status']): Promise<void> {
    if (!this.currentUser) {
      throw new Error('Aucun utilisateur connecté');
    }

    this.currentUser.status = status;
    this.currentUser.lastSeen = new Date();
    await this.saveUserData(this.currentUser);
  }

  /**
   * Met à jour le profil utilisateur
   */
  async updateUserProfile(updates: Partial<Pick<User, 'nickname' | 'avatar'>>): Promise<User> {
    if (!this.currentUser) {
      throw new Error('Aucun utilisateur connecté');
    }

    this.currentUser = { ...this.currentUser, ...updates };
    await this.saveUserData(this.currentUser);
    return this.currentUser;
  }

  /**
   * Déconnecte l'utilisateur
   */
  async logout(): Promise<void> {
    if (this.currentUser) {
      this.currentUser.status = 'offline';
      this.currentUser.lastSeen = new Date();
      await this.saveUserData(this.currentUser);
    }
    
    this.currentUser = null;
    this.cryptoService.setKeyPair(null as any);
  }

  /**
   * Exporte les clés de l'utilisateur (chiffrées)
   */
  async exportKeys(passphrase: string): Promise<{
    publicKey: string;
    encryptedPrivateKey: string;
  }> {
    const keyPair = this.cryptoService.getKeyPair();
    if (!keyPair) {
      throw new Error('Aucune clé disponible');
    }

    try {
      // Exporte la clé publique
      const publicKey = await this.cryptoService.exportPublicKey(keyPair.publicKey);
      
      // Exporte et chiffre la clé privée avec la passphrase
      const privateKeyData = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      const encryptedPrivateKey = await this.encryptWithPassphrase(
        this.arrayBufferToBase64(privateKeyData),
        passphrase
      );

      return {
        publicKey,
        encryptedPrivateKey
      };
    } catch (error) {
      throw new Error(`Erreur lors de l'export des clés: ${error}`);
    }
  }

  /**
   * Importe des clés utilisateur
   */
  async importKeys(
    publicKeyPEM: string,
    encryptedPrivateKey: string,
    passphrase: string
  ): Promise<CryptoKeyPair> {
    try {
      // Importe la clé publique
      const publicKey = await this.cryptoService.importPublicKey(publicKeyPEM);
      
      // Déchiffre et importe la clé privée
      const decryptedPrivateKey = await this.decryptWithPassphrase(encryptedPrivateKey, passphrase);
      const privateKeyData = this.base64ToArrayBuffer(decryptedPrivateKey);
      
      const privateKey = await window.crypto.subtle.importKey(
        'pkcs8',
        privateKeyData,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256'
        },
        true,
        ['decrypt']
      );

      const keyPair = { publicKey, privateKey };
      this.cryptoService.setKeyPair(keyPair);
      
      return keyPair;
    } catch (error) {
      throw new Error(`Erreur lors de l'import des clés: ${error}`);
    }
  }

  /**
   * Vérifie si un utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.currentUser.status !== 'offline';
  }

  /**
   * Retourne l'utilisateur actuel
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Liste tous les utilisateurs locaux
   */
  listLocalUsers(): User[] {
    const users: User[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('user_')) {
        try {
          const userData = JSON.parse(localStorage.getItem(key) || '');
          users.push(userData);
        } catch (error) {
          console.warn(`Erreur lors du chargement de l'utilisateur ${key}:`, error);
        }
      }
    }
    return users;
  }

  /**
   * Supprime un utilisateur local
   */
  async deleteUser(userId: string): Promise<void> {
    localStorage.removeItem(`user_${userId}`);
    localStorage.removeItem(`keys_${userId}`);
    
    if (this.currentUser?.id === userId) {
      this.currentUser = null;
    }
  }

  // Méthodes privées
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveUser(
    user: User,
    keyPair: CryptoKeyPair,
    signingKeyPair: CryptoKeyPair
  ): Promise<void> {
    // Sauvegarde les données utilisateur
    await this.saveUserData(user);
    
    // Sauvegarde les clés (pour le mode développement, en production utiliser un coffre-fort)
    const keyData = {
      encryptionKeys: keyPair,
      signingKeys: signingKeyPair,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(`keys_${user.id}`, JSON.stringify(keyData));
  }

  private async saveUserData(user: User): Promise<void> {
    localStorage.setItem(`user_${user.id}`, JSON.stringify(user));
  }

  private loadUserData(userId: string): User | null {
    try {
      const data = localStorage.getItem(`user_${userId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Erreur lors du chargement de l'utilisateur ${userId}:`, error);
      return null;
    }
  }

  private async loadUserKeys(userId: string): Promise<void> {
    try {
      const keyData = localStorage.getItem(`keys_${userId}`);
      if (!keyData) {
        throw new Error('Clés non trouvées');
      }

      // En production, déchiffrer avec la passphrase
      const keys = JSON.parse(keyData);
      this.cryptoService.setKeyPair(keys.encryptionKeys);
    } catch (error) {
      throw new Error(`Erreur lors du chargement des clés: ${error}`);
    }
  }

  private async encryptWithPassphrase(data: string, passphrase: string): Promise<string> {
    // Implémentation simplifiée - en production, utiliser PBKDF2 + AES
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('salt'), // En production, utiliser un salt aléatoire
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoder.encode(data)
    );

    return JSON.stringify({
      ciphertext: this.arrayBufferToBase64(encrypted),
  iv: this.arrayBufferToBase64(iv.buffer)
    });
  }

  private async decryptWithPassphrase(encryptedData: string, passphrase: string): Promise<string> {
    const { ciphertext, iv } = JSON.parse(encryptedData);
    
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: this.base64ToArrayBuffer(iv) },
      key,
      this.base64ToArrayBuffer(ciphertext)
    );

    return new TextDecoder().decode(decrypted);
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export default UserModel;
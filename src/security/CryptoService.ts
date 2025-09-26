/**
 * Service de cryptographie utilisant l'API Web Crypto
 * Implémente RSA + AES pour un chiffrement hybride sécurisé
 */

import type { CryptoKeyPair, EncryptedData } from 'types';

class CryptoService {
  private static instance: CryptoService;
  private keyPair: CryptoKeyPair | null = null;

  private constructor() {}

  public static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService();
    }
    return CryptoService.instance;
  }

  /**
   * Génère une nouvelle paire de clés RSA
   */
  async generateKeyPair(): Promise<CryptoKeyPair> {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true, // extractable
        ["encrypt", "decrypt"]
      );

      this.keyPair = keyPair;
      return keyPair;
    } catch (error) {
      throw new Error(`Erreur lors de la génération des clés: ${error}`);
    }
  }

  /**
   * Génère une clé AES pour le chiffrement symétrique
   */
  async generateAESKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  /**
   * Chiffre des données avec AES-GCM
   */
  async encryptAES(data: string, key: CryptoKey): Promise<EncryptedData> {
    try {
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encodedData = new TextEncoder().encode(data);

      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        key,
        encodedData
      );

      return {
        ciphertext: this.arrayBufferToBase64(encrypted),
  iv: this.arrayBufferToBase64(iv.buffer),
      };
    } catch (error) {
      throw new Error(`Erreur lors du chiffrement AES: ${error}`);
    }
  }

  /**
   * Déchiffre des données avec AES-GCM
   */
  async decryptAES(encryptedData: EncryptedData, key: CryptoKey): Promise<string> {
    try {
      const ciphertext = this.base64ToArrayBuffer(encryptedData.ciphertext);
      const iv = this.base64ToArrayBuffer(encryptedData.iv);

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        key,
        ciphertext
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      throw new Error(`Erreur lors du déchiffrement AES: ${error}`);
    }
  }

  /**
   * Chiffre une clé AES avec RSA
   */
  async encryptAESKeyWithRSA(aesKey: CryptoKey, publicKey: CryptoKey): Promise<string> {
    try {
      const exportedKey = await window.crypto.subtle.exportKey("raw", aesKey);
      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: "RSA-OAEP",
        },
        publicKey,
        exportedKey
      );

      return this.arrayBufferToBase64(encrypted);
    } catch (error) {
      throw new Error(`Erreur lors du chiffrement de la clé AES: ${error}`);
    }
  }

  /**
   * Déchiffre une clé AES avec RSA
   */
  async decryptAESKeyWithRSA(encryptedKey: string, privateKey: CryptoKey): Promise<CryptoKey> {
    try {
      const keyData = this.base64ToArrayBuffer(encryptedKey);
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: "RSA-OAEP",
        },
        privateKey,
        keyData
      );

      return await window.crypto.subtle.importKey(
        "raw",
        decrypted,
        "AES-GCM",
        true,
        ["encrypt", "decrypt"]
      );
    } catch (error) {
      throw new Error(`Erreur lors du déchiffrement de la clé AES: ${error}`);
    }
  }

  /**
   * Signe des données avec RSA-PSS
   */
  async signData(data: string, privateKey: CryptoKey): Promise<string> {
    try {
      const encodedData = new TextEncoder().encode(data);
      
      const signature = await window.crypto.subtle.sign(
        {
          name: "RSA-PSS",
          saltLength: 32,
        },
        privateKey,
        encodedData
      );

      return this.arrayBufferToBase64(signature);
    } catch (error) {
      throw new Error(`Erreur lors de la signature: ${error}`);
    }
  }

  /**
   * Vérifie une signature avec RSA-PSS
   */
  async verifySignature(data: string, signature: string, publicKey: CryptoKey): Promise<boolean> {
    try {
      const encodedData = new TextEncoder().encode(data);
      const signatureBuffer = this.base64ToArrayBuffer(signature);

      return await window.crypto.subtle.verify(
        {
          name: "RSA-PSS",
          saltLength: 32,
        },
        publicKey,
        signatureBuffer,
        encodedData
      );
    } catch (error) {
      console.error("Erreur lors de la vérification de signature:", error);
      return false;
    }
  }

  /**
   * Génère une paire de clés pour la signature
   */
  async generateSigningKeyPair(): Promise<CryptoKeyPair> {
    return await window.crypto.subtle.generateKey(
      {
        name: "RSA-PSS",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    );
  }

  /**
   * Exporte une clé publique au format PEM
   */
  async exportPublicKey(publicKey: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey("spki", publicKey);
    return this.arrayBufferToPEM(exported, "PUBLIC KEY");
  }

  /**
   * Importe une clé publique depuis le format PEM
   */
  async importPublicKey(pemKey: string): Promise<CryptoKey> {
    const keyData = this.pemToArrayBuffer(pemKey);
    return await window.crypto.subtle.importKey(
      "spki",
      keyData,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"]
    );
  }

  /**
   * Génère un hash SHA-256
   */
  async generateHash(data: string): Promise<string> {
    const encodedData = new TextEncoder().encode(data);
    const hash = await window.crypto.subtle.digest("SHA-256", encodedData);
    return this.arrayBufferToHex(hash);
  }

  /**
   * Génère une adresse à partir d'une clé publique
   */
  async generateAddress(publicKey: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey("spki", publicKey);
    const hash = await window.crypto.subtle.digest("SHA-256", exported);
    return this.arrayBufferToHex(hash).substring(0, 40);
  }

  // Utilitaires de conversion
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

  private arrayBufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private arrayBufferToPEM(buffer: ArrayBuffer, type: string): string {
    const base64 = this.arrayBufferToBase64(buffer);
    const pem = base64.match(/.{1,64}/g)?.join('\n') || '';
    return `-----BEGIN ${type}-----\n${pem}\n-----END ${type}-----`;
  }

  private pemToArrayBuffer(pem: string): ArrayBuffer {
    const base64 = pem
      .replace(/-----BEGIN.*-----/, '')
      .replace(/-----END.*-----/, '')
      .replace(/\s/g, '');
    return this.base64ToArrayBuffer(base64);
  }

  /**
   * Chiffrement hybride complet (RSA + AES)
   */
  async hybridEncrypt(data: string, recipientPublicKey: CryptoKey): Promise<{
    encryptedData: EncryptedData;
    encryptedAESKey: string;
  }> {
    // Génère une clé AES temporaire
    const aesKey = await this.generateAESKey();
    
    // Chiffre les données avec AES
    const encryptedData = await this.encryptAES(data, aesKey);
    
    // Chiffre la clé AES avec RSA
    const encryptedAESKey = await this.encryptAESKeyWithRSA(aesKey, recipientPublicKey);
    
    return {
      encryptedData,
      encryptedAESKey
    };
  }

  /**
   * Déchiffrement hybride complet (RSA + AES)
   */
  async hybridDecrypt(
    encryptedData: EncryptedData,
    encryptedAESKey: string,
    privateKey: CryptoKey
  ): Promise<string> {
    // Déchiffre la clé AES avec RSA
    const aesKey = await this.decryptAESKeyWithRSA(encryptedAESKey, privateKey);
    
    // Déchiffre les données avec AES
    return await this.decryptAES(encryptedData, aesKey);
  }

  // Getters
  getKeyPair(): CryptoKeyPair | null {
    return this.keyPair;
  }

  setKeyPair(keyPair: CryptoKeyPair): void {
    this.keyPair = keyPair;
  }
}

export default CryptoService;
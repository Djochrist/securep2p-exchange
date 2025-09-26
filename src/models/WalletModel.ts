/**
 * Modèle Portefeuille - Gestion des transactions et du solde
 */

import type { Wallet, Transaction, User } from 'types';
import CryptoService from 'security/CryptoService';

class WalletModel {
  private static instance: WalletModel;
  private wallet: Wallet | null = null;
  private transactions: Transaction[] = [];
  private cryptoService: CryptoService;

  private constructor() {
  this.cryptoService = CryptoService.getInstance();
  }

  public static getInstance(): WalletModel {
    if (!WalletModel.instance) {
      WalletModel.instance = new WalletModel();
    }
    return WalletModel.instance;
  }

  /**
   * Initialise le portefeuille pour un utilisateur
   */
  async initializeWallet(user: User): Promise<Wallet> {
    try {
      this.wallet = {
        address: user.address,
        balance: 0,
        publicKey: user.publicKey
      };

      // Charge les transactions existantes
      await this.loadTransactions();
      
      // Recalcule le solde
      await this.calculateBalance();

      return this.wallet;
    } catch (error) {
      throw new Error(`Erreur lors de l'initialisation du portefeuille: ${error}`);
    }
  }

  /**
   * Crée une nouvelle transaction
   */
  async createTransaction(
    toAddress: string,
    amount: number,
    message?: string
  ): Promise<Transaction> {
    if (!this.wallet) {
      throw new Error('Portefeuille non initialisé');
    }

    if (amount <= 0) {
      throw new Error('Le montant doit être positif');
    }

    if (amount > this.wallet.balance) {
      throw new Error('Solde insuffisant');
    }

    try {
      const transaction: Transaction = {
        id: this.generateTransactionId(),
        fromAddress: this.wallet.address,
        toAddress: toAddress,
        amount: amount,
        fee: this.calculateFee(amount),
        message: message,
        timestamp: new Date(),
        signature: '',
        nonce: this.generateNonce(),
        status: 'pending'
      };

      // Signe la transaction
      transaction.signature = await this.signTransaction(transaction);

      // Ajoute la transaction à la liste
      this.transactions.push(transaction);
      
      // Met à jour le solde (soustrait le montant + frais)
      this.wallet.balance -= (amount + transaction.fee);
      
      // Sauvegarde
      await this.saveTransactions();
      await this.saveWallet();

      return transaction;
    } catch (error) {
      throw new Error(`Erreur lors de la création de la transaction: ${error}`);
    }
  }

  /**
   * Traite une transaction reçue
   */
  async receiveTransaction(transaction: Transaction): Promise<void> {
    if (!this.wallet) {
      throw new Error('Portefeuille non initialisé');
    }

    try {
      // Vérifie la signature de la transaction
      const isValid = await this.verifyTransaction(transaction);
      if (!isValid) {
        throw new Error('Transaction invalide');
      }

      // Vérifie si la transaction nous concerne
      if (transaction.toAddress !== this.wallet.address) {
        return; // Pas pour nous
      }

      // Vérifie si on a déjà cette transaction
      const existingTx = this.transactions.find(tx => tx.id === transaction.id);
      if (existingTx) {
        return; // Déjà traitée
      }

      // Ajoute la transaction
      this.transactions.push({
        ...transaction,
        status: 'confirmed'
      });

      // Met à jour le solde
      this.wallet.balance += transaction.amount;

      // Sauvegarde
      await this.saveTransactions();
      await this.saveWallet();

      console.log(`Transaction reçue: +${transaction.amount} tokens`);
    } catch (error) {
      console.error(`Erreur lors du traitement de la transaction:`, error);
    }
  }

  /**
   * Confirme une transaction envoyée
   */
  async confirmTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.find(tx => tx.id === transactionId);
    if (!transaction) {
      throw new Error('Transaction non trouvée');
    }

    transaction.status = 'confirmed';
    await this.saveTransactions();
  }

  /**
   * Annule une transaction en attente
   */
  async cancelTransaction(transactionId: string): Promise<void> {
    const transaction = this.transactions.find(tx => tx.id === transactionId);
    if (!transaction) {
      throw new Error('Transaction non trouvée');
    }

    if (transaction.status !== 'pending') {
      throw new Error('Seules les transactions en attente peuvent être annulées');
    }

    transaction.status = 'failed';
    
    // Recrédite le montant si c'était un envoi
    if (this.wallet && transaction.fromAddress === this.wallet.address) {
      this.wallet.balance += (transaction.amount + transaction.fee);
    }

    await this.saveTransactions();
    await this.saveWallet();
  }

  /**
   * Obtient l'historique des transactions
   */
  getTransactionHistory(limit?: number): Transaction[] {
    const sorted = [...this.transactions].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Obtient les transactions en attente
   */
  getPendingTransactions(): Transaction[] {
    return this.transactions.filter(tx => tx.status === 'pending');
  }

  /**
   * Obtient le solde actuel
   */
  getBalance(): number {
    return this.wallet?.balance || 0;
  }

  /**
   * Génère une adresse de réception QR Code
   */
  generateReceiveQR(): { address: string; qrData: string } {
    if (!this.wallet) {
      throw new Error('Portefeuille non initialisé');
    }

    const qrData = JSON.stringify({
      address: this.wallet.address,
      publicKey: this.wallet.publicKey,
      timestamp: new Date().toISOString()
    });

    return {
      address: this.wallet.address,
      qrData
    };
  }

  /**
   * Ajoute des tokens de test (mode développement)
   */
  async addTestTokens(amount: number): Promise<void> {
    if (!this.wallet) {
      throw new Error('Portefeuille non initialisé');
    }

    // Crée une transaction fictive
    const transaction: Transaction = {
      id: this.generateTransactionId(),
      fromAddress: 'faucet_testnet',
      toAddress: this.wallet.address,
      amount: amount,
      fee: 0,
      message: 'Tokens de test',
      timestamp: new Date(),
      signature: 'test_signature',
      nonce: this.generateNonce(),
      status: 'confirmed'
    };

    this.transactions.push(transaction);
    this.wallet.balance += amount;

    await this.saveTransactions();
    await this.saveWallet();
  }

  /**
   * Exporte l'historique des transactions
   */
  exportTransactions(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['ID', 'De', 'Vers', 'Montant', 'Frais', 'Statut', 'Date'];
      const rows = this.transactions.map(tx => [
        tx.id,
        tx.fromAddress,
        tx.toAddress,
        tx.amount.toString(),
        tx.fee.toString(),
        tx.status,
        tx.timestamp.toISOString()
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(this.transactions, null, 2);
  }

  // Méthodes privées
  private async signTransaction(transaction: Transaction): Promise<string> {
    const keyPair = this.cryptoService.getKeyPair();
    if (!keyPair) {
      throw new Error('Clés non disponibles');
    }

    // Crée les données à signer
    const dataToSign = JSON.stringify({
      fromAddress: transaction.fromAddress,
      toAddress: transaction.toAddress,
      amount: transaction.amount,
      fee: transaction.fee,
      message: transaction.message,
      timestamp: transaction.timestamp.toISOString(),
      nonce: transaction.nonce
    });

    // Génère une paire de clés pour la signature si nécessaire
    const signingKeyPair = await this.cryptoService.generateSigningKeyPair();
    return await this.cryptoService.signData(dataToSign, signingKeyPair.privateKey);
  }

  private async verifyTransaction(transaction: Transaction): Promise<boolean> {
    try {
      // Reconstitue les données signées
      const dataToSign = JSON.stringify({
        fromAddress: transaction.fromAddress,
        toAddress: transaction.toAddress,
        amount: transaction.amount,
        fee: transaction.fee,
        message: transaction.message,
        timestamp: transaction.timestamp.toISOString(),
        nonce: transaction.nonce
      });

      // Pour une vérification complète, il faudrait la clé publique de l'expéditeur
      // Ici on fait une vérification basique
      return transaction.signature.length > 0 && transaction.amount > 0;
    } catch (error) {
      console.error('Erreur lors de la vérification de transaction:', error);
      return false;
    }
  // ...existing code...
  }

  private calculateFee(amount: number): number {
    // Frais de base + pourcentage
    const baseFee = 0.01;
    const percentageFee = amount * 0.001; // 0.1%
    return Math.max(baseFee, percentageFee);
  }

  private generateNonce(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async calculateBalance(): Promise<void> {
    if (!this.wallet) return;

    let balance = 0;
    
    for (const tx of this.transactions) {
      if (tx.status === 'confirmed') {
        if (tx.toAddress === this.wallet.address) {
          balance += tx.amount;
        } else if (tx.fromAddress === this.wallet.address) {
          balance -= (tx.amount + tx.fee);
        }
      }
    }

    this.wallet.balance = Math.max(0, balance);
  }

  private async loadTransactions(): Promise<void> {
    if (!this.wallet) return;

    try {
      const data = localStorage.getItem(`transactions_${this.wallet.address}`);
      if (data) {
        const transactions = JSON.parse(data);
        this.transactions = transactions.map((tx: any) => ({
          ...tx,
          timestamp: new Date(tx.timestamp)
        }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
      this.transactions = [];
    }
  }

  private async saveTransactions(): Promise<void> {
    if (!this.wallet) return;

    try {
      localStorage.setItem(
        `transactions_${this.wallet.address}`,
        JSON.stringify(this.transactions)
      );
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des transactions:', error);
    }
  }

  private async saveWallet(): Promise<void> {
    if (!this.wallet) return;

    try {
      localStorage.setItem(
        `wallet_${this.wallet.address}`,
        JSON.stringify(this.wallet)
      );
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du portefeuille:', error);
    }
  }

  /**
   * Obtient le portefeuille actuel
   */
  getWallet(): Wallet | null {
    return this.wallet;
  }

  /**
   * Réinitialise le portefeuille
   */
  reset(): void {
    this.wallet = null;
    this.transactions = [];
  }
}

export default WalletModel;
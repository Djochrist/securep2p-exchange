# SecureP2P Exchange

## Introduction

**SecureP2P Exchange** est une application web éducative développée dans le cadre du cours de **Projet Informatique** qui simule un système d'échange pair-à-pair sécurisé. Cette plateforme démontre les concepts fondamentaux des réseaux P2P, de la cryptographie moderne et des portefeuilles numériques.

L'application offre une interface utilisateur moderne construite avec **React 18**, **TypeScript** et **Tailwind CSS**, intégrant des animations fluides avec **Framer Motion** et **GSAP**. Elle simule un écosystème complet d'échange sécurisé avec chiffrement de bout en bout, messagerie privée et gestion de transactions.

## Fonctionnalités

### Système d'authentification sécurisé
- **Création de comptes** avec génération automatique de paires de clés RSA-2048
- **Authentification locale** avec gestion des sessions utilisateur
- **Gestion des profils** avec persistance des données utilisateur
- **Support multi-utilisateurs** sur un même dispositif

### Portefeuille numérique avancé
- **Solde en temps réel** avec calcul automatique des transactions
- **Génération d'adresses** basée sur les clés publiques
- **Envoi et réception de tokens** STP (SecureP2P Tokens) 
- **Historique complet** des transactions avec filtrage et recherche
- **Export des données** au format JSON et CSV
- **Tokens de test** pour l'évaluation et les démonstrations
- **Calcul automatique des frais** de transaction

###  Messagerie chiffrée P2P
- **Chiffrement de bout en bout** avec algorithmes RSA + AES-GCM
- **Interface de chat en temps réel** avec notifications
- **Contacts prédéfinis** pour les tests (équipe de développement)
- **Signature numérique** de tous les messages
- **Indicateurs de statut** (en ligne, hors ligne, dernière connexion)
- **Gestion des conversations** avec historique persistant

### Simulation de réseau P2P
- **Découverte de pairs** automatique (simulée)
- **Connexions WebRTC** pour les communications directes
- **Protocole de handshake** sécurisé entre pairs
- **Monitoring du réseau** avec statistiques en temps réel
- **Gestion des déconnexions** et reconnexions automatiques
- **Support du ping/pong** pour vérifier la latence

### Tableau de bord interactif
- **Vue d'ensemble** de l'activité utilisateur
- **Statistiques en temps réel** (solde, pairs connectés, messages)
- **Actions rapides** (envoi, réception, messagerie)
- **Notifications contextuelles** pour les événements importants
- **Diagnostic réseau** avec état de connexion

### Paramètres et gestion
- **Configuration du profil** utilisateur
- **Gestion des clés cryptographiques** avec export/import sécurisé
- **Paramètres de réseau** P2P configurables
- **Options de sécurité** avancées
- **Déconnexion sécurisée** avec nettoyage des sessions

## Points forts

### 🛡️ Sécurité de niveau professionnel
- **Cryptographie hybride** : RSA-2048 pour l'échange de clés + AES-256-GCM pour les données
- **Web Crypto API** native pour des performances optimales
- **Signatures numériques** RSA-PSS pour l'authentification des messages
- **Génération d'adresses** par hachage SHA-256 des clés publiques
- **Protection contre la réutilisation** avec système de nonces

### Interface utilisateur moderne
- **Design responsive** adapté à tous les écrans
- **Animations fluides** avec Framer Motion et GSAP
- **Composants accessibles** avec Headless UI
- **Thème cohérent** avec Tailwind CSS
- **Icônes professionnelles** Lucide React
- **Feedback visuel** immédiat pour toutes les actions

### Architecture technique solide
- **Pattern Singleton** pour la gestion des services
- **Séparation des responsabilités** avec modèles dédiés
- **TypeScript strict** pour la sécurité des types
- **Gestion d'état réactive** avec Zustand
- **Persistance locale** avec localStorage chiffré
- **Gestion d'erreurs** robuste à tous les niveaux

### Simulation réaliste P2P
- **WebRTC DataChannels** pour les connexions directes
- **Protocole de découverte** de pairs simulé
- **Gestion des états** de connexion complexes
- **Tolérance aux pannes** avec reconnexion automatique
- **Monitoring réseau** avec métriques détaillées

### Performance et optimisation
- **Chargement rapide** avec Vite
- **Bundle optimisé** avec tree-shaking
- **Rendu conditionnel** pour minimiser les re-renders
- **Mémoire optimisée** avec nettoyage automatique des ressources
- **Debouncing** intelligent pour les opérations réseau

## Limites

### Simulation vs réalité
- **Réseau P2P simulé** : pas de vraies connexions Internet entre pairs distants
- **Serveur de signaling** fictif : utilise une logique locale plutôt qu'un serveur dédié
- **Blockchain simulée** : pas de validation distribuée réelle des transactions
- **Persistance locale uniquement** : données perdues si le stockage local est effacé

### Sécurité en développement
- **Clés stockées en clair** dans localStorage (en production, utiliser un HSM ou KeyVault)
- **Pas de protection PIN/biométrie** pour l'accès au portefeuille
- **Salt fixe** pour la dérivation de clés (devrait être aléatoire)
- **Pas d'audit de sécurité** formel des implémentations cryptographiques

### Limitations techniques
- **Support WebRTC** variable selon les navigateurs et réseaux
- **Pas de support mobile natif** (PWA uniquement)
- **Stockage limité** par les quotas du navigateur
- **Pas de synchronisation cloud** entre appareils

## Cas d'utilisation réelle

### Éducation et formation
- **Cours de cryptographie** : démonstration pratique des algorithmes RSA et AES
- **Apprentissage P2P** : compréhension des défis des réseaux décentralisés
- **Formation blockchain** : introduction aux concepts de transactions et signatures
- **Sécurité informatique** : sensibilisation aux bonnes pratiques cryptographiques

### Recherche et développement
- **Prototype rapide** pour tester des concepts P2P
- **Validation d'interfaces** utilisateur pour applications crypto
- **Tests de performance** des API Web Crypto
- **Évaluation de l'UX** pour les portefeuilles numériques

### Présentation commerciale
- **Démonstration client** de capacités techniques
- **Proof of concept** pour des projets blockchain
- **Portfolio développeur** montrant la maîtrise des technologies modernes
- **Support marketing** pour expliquer des concepts techniques complexes

### Base de développement
- **Architecture de référence** pour des applications Web3
- **Composants réutilisables** pour d'autres projets crypto
- **Patterns de design** pour interfaces sécurisées
- **Intégration d'APIs** cryptographiques dans le navigateur

## Installation et déploiement

### 🔧 Prérequis
- **Node.js** 18+ avec npm ou pnpm
- **Navigateur moderne** avec support WebRTC et Web Crypto API
- **HTTPS requis** pour les fonctionnalités cryptographiques (en production)

### 📦 Installation locale
```bash
# Cloner le repository
git clone https://github.com/Djochrist/securep2p-exchange.git
cd securep2p-exchange

# Installer les dépendances
npm install
# ou
pnpm install

# Lancer le serveur de développement
npm run dev
# ou  
pnpm dev
```

### 🌐 Déploiement en production
```bash
# Build de production
npm run build

# Déploiement GitHub Pages (configuré)
npm run deploy
```

L'application est automatiquement déployée sur **GitHub Pages** à chaque push sur la branche principale.

### 🔗 Accès en ligne
- **Demo live** : [https://djochrist.github.io/securep2p-exchange](https://djochrist.github.io/securep2p-exchange)
- **Repository GitHub** : [https://github.com/Djochrist/securep2p-exchange](https://github.com/Djochrist/securep2p-exchange)

### 🧪 Tests et validation
1. Ouvrir l'application dans le navigateur
2. Créer un nouveau compte utilisateur
3. Tester les fonctions de portefeuille avec les tokens de test
4. Essayer la messagerie avec les contacts prédéfinis
5. Vérifier le monitoring réseau dans l'onglet correspondant

## Auteurs et remerciements

### 👨‍💻 Équipe de développement

Ce projet a été réalisé par trois étudiants dans le cadre du cours de **Projet Informatique** :

- **[Djochrist Kuma-Kuma Unsim](https://github.com/Djochrist)**
- **Michael Losinu** - 
- **Carrel Kime** - 

### Technologies utilisées

Merci aux créateurs et mainteneurs des technologies open source utilisées :
- **React & TypeScript** pour le framework de développement
- **Tailwind CSS** pour le système de design
- **Framer Motion & GSAP** pour les animations
- **Vite** pour l'outillage de développement  
- **Web Crypto API** pour la cryptographie native
- **WebRTC** pour les communications P2P

### Contexte académique

Projet réalisé dans le cadre du programme d'études en informatique, démontrant la maîtrise de :
- Travail en équipe et gestion de projet
- Développement d'applications web modernes
- Intégration de technologies de sécurité avancées
- Conception d'architectures logicielles robustes


**Version** : 1.0.0  
**Licence** : MIT  
**Dernière mise à jour** : Septembre 2025

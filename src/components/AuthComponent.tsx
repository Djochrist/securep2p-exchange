import React, { useState, useEffect } from 'react';
import type { User } from 'types';
import UserModel from 'models/UserModel';
import { UserPlus, LogIn, Key, Eye, EyeOff } from 'lucide-react';

interface AuthComponentProps {
  onLogin: (user: User) => void;
}

const AuthComponent: React.FC<AuthComponentProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [nickname, setNickname] = useState('');
  const [userId, setUserId] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  const userModel = UserModel.getInstance();

  useEffect(() => {
    // Charge la liste des utilisateurs locaux
    setUsers(userModel.listLocalUsers());
  }, []);

  const handleRegister = async () => {
    if (!nickname.trim()) {
      setError('Le pseudonyme est requis');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await userModel.createUser(nickname.trim());
      onLogin(user);
    } catch (error) {
      setError(`Erreur lors de la création du compte: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!userId) {
      setError('Veuillez sélectionner un utilisateur');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await userModel.authenticateUser(userId, passphrase);
      onLogin(user);
    } catch (error) {
      setError(`Erreur de connexion: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (selectedUserId: string) => {
    setUserId(selectedUserId);
    const selectedUser = users.find(u => u.id === selectedUserId);
    if (selectedUser) {
      setNickname(selectedUser.nickname);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">P2P</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            SecureP2P Exchange
          </h2>
          <p className="mt-2 text-gray-600">
            Plateforme d'échange sécurisé pair-à-pair
          </p>
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ Mode développement - Tokens sans valeur réelle
            </p>
          </div>
        </div>

        {/* Sélecteur de mode */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'login'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Connexion</span>
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mode === 'register'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Créer un compte</span>
          </button>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {mode === 'register' ? (
            // Mode création de compte
            <div className="space-y-4">
              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                  Pseudonyme
                </label>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Entrez votre pseudonyme"
                  disabled={loading}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Key className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Génération automatique des clés</p>
                    <p className="mt-1">
                      Une paire de clés RSA sera automatiquement générée pour sécuriser vos transactions et messages.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleRegister}
                disabled={loading || !nickname.trim()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Créer le compte'
                )}
              </button>
            </div>
          ) : (
            // Mode connexion
            <div className="space-y-4">
              {users.length > 0 ? (
                <div>
                  <label htmlFor="user-select" className="block text-sm font-medium text-gray-700">
                    Sélectionner un utilisateur
                  </label>
                  <select
                    id="user-select"
                    value={userId}
                    onChange={(e) => handleUserSelect(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={loading}
                  >
                    <option value="">Choisir un utilisateur...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.nickname} ({user.address.substring(0, 8)}...)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserPlus className="mx-auto w-12 h-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Aucun compte trouvé. Créez d'abord un compte.
                  </p>
                </div>
              )}

              {users.length > 0 && (
                <>
                  <div>
                    <label htmlFor="passphrase" className="block text-sm font-medium text-gray-700">
                      Phrase de passe (optionnel pour le développement)
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="passphrase"
                        type={showPassphrase ? 'text' : 'password'}
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Phrase de passe (optionnel)"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassphrase(!showPassphrase)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassphrase ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleLogin}
                    disabled={loading || !userId}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Se connecter'
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Informations de sécurité */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Sécurité et chiffrement
          </h3>
          <div className="space-y-2 text-xs text-gray-600">
            <p>• Chiffrement RSA 2048 bits pour les clés</p>
            <p>• Chiffrement hybride RSA + AES-GCM pour les messages</p>
            <p>• Signatures numériques RSA-PSS pour l'authentification</p>
            <p>• Stockage local sécurisé des clés (mode développement)</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Plateforme éducative - TP Universitaire
          </p>
          <p className="mt-1">
            Ne pas utiliser avec des fonds réels
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthComponent;
import React, { useState } from 'react';
import { 
  Settings,
  Key,
  Shield,
  Download,
  Upload,
  RotateCcw,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  LogOut,
  Trash2,
  FileText,
  Globe,
  Moon,
  Sun,
  Bell
} from 'lucide-react';
import UserModel from 'models/UserModel';
import type { User } from 'types';
interface SettingsComponentProps {
  onLogout: () => void;
  setActiveTab: React.Dispatch<React.SetStateAction<'dashboard' | 'wallet' | 'messaging' | 'network' | 'settings' | 'contacts'>>;
}

const SettingsComponent: React.FC<SettingsComponentProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'network' | 'preferences'>('account');
  const [showPassphraseModal, setShowPassphraseModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const userModel = UserModel.getInstance();
  const currentUser = userModel.getCurrentUser();

  const handleExportKeys = async () => {
    if (!passphrase) {
      setMessage({ type: 'error', text: 'Phrase de passe requise' });
      return;
    }

    setLoading(true);
    try {
      const keys = await userModel.exportKeys(passphrase);
      
      // Crée un fichier de sauvegarde
      const backup = {
        user: currentUser,
        keys: keys,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `secureP2P_backup_${currentUser?.id.substring(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Sauvegarde créée avec succès' });
      setShowExportModal(false);
      setPassphrase('');
    } catch (error) {
      setMessage({ type: 'error', text: `Erreur lors de l'export: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  const handleRotateKeys = async () => {
    if (!confirm('Êtes-vous sûr de vouloir générer de nouvelles clés ? Cette action est irréversible.')) {
      return;
    }

    setLoading(true);
    try {
      // Ici on pourrait implémenter la rotation des clés
      // Pour l'instant, on simule
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMessage({ type: 'success', text: 'Nouvelles clés générées avec succès' });
    } catch (error) {
      setMessage({ type: 'error', text: `Erreur lors de la rotation: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt('Tapez "SUPPRIMER" pour confirmer la suppression définitive de votre compte:');
    if (confirmation !== 'SUPPRIMER') {
      return;
    }

    if (!currentUser) return;

    try {
      await userModel.deleteUser(currentUser.id);
      setMessage({ type: 'success', text: 'Compte supprimé' });
      setTimeout(() => {
        onLogout();
      }, 1000);
    } catch (error) {
      setMessage({ type: 'error', text: `Erreur lors de la suppression: ${error}` });
    }
  };

  const clearMessage = () => {
    setTimeout(() => setMessage(null), 5000);
  };

  if (message) {
    clearMessage();
  }

  const tabs = [
    { id: 'account', label: 'Compte & Clés', icon: Key },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'network', label: 'Réseau', icon: Globe },
    { id: 'preferences', label: 'Préférences', icon: Settings }
  ] as const;

  const renderAccountTab = () => (
    <div className="space-y-6">
      {/* Informations du compte */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Informations du compte
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pseudonyme
            </label>
            <input
              type="text"
              value={currentUser?.nickname || ''}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID utilisateur
            </label>
            <input
              type="text"
              value={currentUser?.id || ''}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 font-mono text-sm"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adresse du portefeuille
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={currentUser?.address || ''}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 font-mono text-sm"
            />
            <button
              onClick={() => navigator.clipboard.writeText(currentUser?.address || '')}
              className="p-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Gestion des clés */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Gestion des clés cryptographiques
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
            <div className="flex items-center space-x-3">
              <Key className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="font-medium text-gray-900">Clé publique RSA</p>
                <p className="text-sm text-gray-600">Utilisée pour le chiffrement et les signatures</p>
              </div>
            </div>
            <span className="text-sm text-green-600 font-medium">2048 bits</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center justify-center space-x-2 p-3 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              <span>Exporter les clés</span>
            </button>

            <button className="flex items-center justify-center space-x-2 p-3 border border-gray-300 rounded-md hover:bg-gray-50">
              <Upload className="w-4 h-4" />
              <span>Importer des clés</span>
            </button>

            <button
              onClick={handleRotateKeys}
              disabled={loading}
              className="flex items-center justify-center space-x-2 p-3 border border-orange-300 text-orange-700 rounded-md hover:bg-orange-50 disabled:bg-gray-100"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Générer nouvelles clés</span>
            </button>
          </div>
        </div>
      </div>

      {/* Actions dangereuses */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-4">
          Zone dangereuse
        </h3>
        <div className="space-y-4">
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <LogOut className="w-4 h-4" />
            <span>Se déconnecter</span>
          </button>

          <button
            onClick={handleDeleteAccount}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4" />
            <span>Supprimer le compte</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      {/* Configuration de sécurité */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Configuration de sécurité
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
            <div>
              <p className="font-medium text-gray-900">Verrouillage automatique</p>
              <p className="text-sm text-gray-600">Verrouille l'application après inactivité</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
            <div>
              <p className="font-medium text-gray-900">Chiffrement des données locales</p>
              <p className="text-sm text-gray-600">Chiffre les données stockées localement</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg bg-white">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-gray-900">Délai de verrouillage</p>
              <span className="text-sm text-gray-600">5 minutes</span>
            </div>
            <input
              type="range"
              min="1"
              max="60"
              defaultValue="5"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1 min</span>
              <span>60 min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Algorithmes de chiffrement */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Algorithmes de chiffrement
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
            <span className="text-sm font-medium text-gray-900">Chiffrement asymétrique</span>
            <span className="text-sm text-green-600">RSA-2048</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
            <span className="text-sm font-medium text-gray-900">Chiffrement symétrique</span>
            <span className="text-sm text-green-600">AES-256-GCM</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
            <span className="text-sm font-medium text-gray-900">Fonction de hachage</span>
            <span className="text-sm text-green-600">SHA-256</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-white rounded-lg">
            <span className="text-sm font-medium text-gray-900">Signature numérique</span>
            <span className="text-sm text-green-600">RSA-PSS</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNetworkTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Configuration réseau
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Port d'écoute
            </label>
            <input
              type="number"
              defaultValue="8080"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre maximum de pairs
            </label>
            <input
              type="number"
              defaultValue="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
            <div>
              <p className="font-medium text-gray-900">UPnP</p>
              <p className="text-sm text-gray-600">Mappage automatique des ports</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Préférences de l'interface
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
            <div>
              <p className="font-medium text-gray-900">Thème sombre</p>
              <p className="text-sm text-gray-600">Utilise un thème sombre pour l'interface</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
            <div>
              <p className="font-medium text-gray-900">Notifications</p>
              <p className="text-sm text-gray-600">Affiche les notifications pour les nouveaux messages</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Langue
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return renderAccountTab();
      case 'security':
        return renderSecurityTab();
      case 'network':
        return renderNetworkTab();
      case 'preferences':
        return renderPreferencesTab();
      default:
        return renderAccountTab();
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Paramètres
        </h1>
        <p className="text-gray-600">
          Configuration de la sécurité, du réseau et des préférences
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div className={`rounded-lg p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            )}
            <p className={`text-sm ${
              message.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      <div className="flex space-x-6">
        {/* Navigation des onglets */}
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

        {/* Contenu des onglets */}
        <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Modal d'export des clés */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Exporter les clés
            </h3>
            
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Attention</p>
                    <p className="mt-1">
                      Gardez cette sauvegarde en lieu sûr. Elle contient vos clés privées chiffrées.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phrase de passe pour chiffrer l'export
                </label>
                <div className="relative">
                  <input
                    type={showPassphrase ? 'text' : 'password'}
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Entrez une phrase de passe forte"
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
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setPassphrase('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                onClick={handleExportKeys}
                disabled={loading || !passphrase}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Export...' : 'Exporter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsComponent;
import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  Lock, 
  Shield, 
  Plus,
  Search,
  MoreVertical,
  Paperclip,
  Smile
} from 'lucide-react';
interface MessagingComponentProps {
  setActiveTab: React.Dispatch<React.SetStateAction<'dashboard' | 'wallet' | 'messaging' | 'network' | 'settings' | 'contacts'>>;
}

interface Contact {
  id: string;
  name: string;
  address: string;
  avatar?: string;
  lastSeen: Date;
  isOnline: boolean;
}

interface Contact {
  id: string;
  name: string;
  address: string;
  avatar?: string;
  lastSeen: Date;
  isOnline: boolean;
}

interface ChatMessage {
  id: string;
  fromAddress: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  isEncrypted: boolean;
}

interface Conversation {
  id: string;
  contact: Contact;
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
  unreadCount: number;
}

const MessagingComponent: React.FC<MessagingComponentProps> = ({ setActiveTab }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Simule des conversations de test
    initializeTestConversations();
  }, []);

  const initializeTestConversations = () => {
    const testContacts: Contact[] = [
      {
        id: 'contact_1',
        name: 'Michael Losinu',
        address: '0x1111111111111111111111111111111111111111',
        isOnline: true,
        lastSeen: new Date()
      },
      {
        id: 'contact_2',
        name: 'Carrel Kime',
        address: '0x2222222222222222222222222222222222222222',
        isOnline: true,
        lastSeen: new Date()
      },
      {
        id: 'contact_3',
        name: 'Djochrist Kuma-Kuma',
        address: '0x3333333333333333333333333333333333333333',
        isOnline: true,
        lastSeen: new Date()
      }
    ];

    const testConversations: Conversation[] = testContacts.map((contact, index) => {
      const devMessages = [
        {
          id: `msg_${index}_1`,
          fromAddress: contact.address,
          content:
            contact.name === 'Michael Losinu'
              ? "Hello, c'est Michael Losinu. Bienvenue sur SecureP2P Exchange !"
              : contact.name === 'Carrel Kime'
              ? "Salut, ici Carrel Kime. N'hésite pas à tester la messagerie !"
              : "Bienvenue, je suis Djochrist Kuma-Kuma, Kalimement toujours.",
          timestamp: new Date(Date.now() - 3600000 + index * 300000),
          isRead: true,
          isEncrypted: true
        },
        {
          id: `msg_${index}_2`,
          fromAddress: 'self',
          content: `Merci pour le message !`,
          timestamp: new Date(Date.now() - 3300000 + index * 300000),
          isRead: true,
          isEncrypted: true
        }
      ];

      return {
        id: `conv_${contact.id}`,
        contact,
  messages: devMessages,
  lastMessage: devMessages[devMessages.length - 1],
  unreadCount: devMessages.filter(m => !m.isRead && m.fromAddress !== 'self').length
      };
    });

    setConversations(testConversations);
    if (testConversations.length > 0) {
      setActiveConversation(testConversations[0].id);
    }
  };

  const sendMessage = () => {
    if (!messageInput.trim() || !activeConversation) return;

    const conversation = conversations.find(c => c.id === activeConversation);
    if (!conversation) return;

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      fromAddress: 'self',
      content: messageInput.trim(),
      timestamp: new Date(),
      isRead: true,
      isEncrypted: true
    };

    setConversations(prevConversations =>
      prevConversations.map(conv => {
        if (conv.id === activeConversation) {
          const updatedMessages = [...conv.messages, newMessage];
          return {
            ...conv,
            messages: updatedMessages,
            lastMessage: newMessage
          };
        }
        return conv;
      })
    );

    setMessageInput('');

    // Simule une réponse automatique après 2 secondes
    setTimeout(() => {
      const replyMessage: ChatMessage = {
        id: `msg_reply_${Date.now()}`,
        fromAddress: conversation.contact.address,
        content: 'Message reçu et déchiffré avec succès ! 🔐',
        timestamp: new Date(),
        isRead: false,
        isEncrypted: true
      };

      setConversations(prevConversations =>
        prevConversations.map(conv => {
          if (conv.id === activeConversation) {
            const updatedMessages = [...conv.messages, replyMessage];
            return {
              ...conv,
              messages: updatedMessages,
              lastMessage: replyMessage,
              unreadCount: conv.unreadCount + 1
            };
          }
          return conv;
        })
      );
    }, 2000);
  };

  const markAsRead = (conversationId: string) => {
    setConversations(prevConversations =>
      prevConversations.map(conv => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            messages: conv.messages.map(msg => ({ ...msg, isRead: true })),
            unreadCount: 0
          };
        }
        return conv;
      })
    );
  };

  const filteredConversations = conversations.filter(conv =>
    conv.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.contact.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConv = conversations.find(c => c.id === activeConversation);

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    
    if (diff < 60000) { // Moins d'1 minute
      return 'À l\'instant';
    } else if (diff < 3600000) { // Moins d'1 heure
      return `${Math.floor(diff / 60000)}min`;
    } else if (diff < 86400000) { // Moins d'1 jour
      return `${Math.floor(diff / 3600000)}h`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm h-[600px] flex">
      {/* Liste des conversations */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        {/* En-tête des conversations */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Messagerie chiffrée
            </h2>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Liste des conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => {
                  setActiveConversation(conversation.id);
                  markAsRead(conversation.id);
                }}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  activeConversation === conversation.id ? 'bg-indigo-50 border-indigo-200' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {conversation.contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {conversation.contact.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {conversation.contact.name}
                      </p>
                      <div className="flex items-center space-x-1">
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(conversation.lastMessage.timestamp)}
                          </span>
                        )}
                        {conversation.unreadCount > 0 && (
                          <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 mt-1">
                      <Lock className="w-3 h-3 text-green-500" />
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage?.content || 'Aucun message'}
                      </p>
                    </div>
                    
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {conversation.contact.address.substring(0, 10)}...
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="mx-auto w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm">Aucune conversation trouvée</p>
            </div>
          )}
        </div>
      </div>

      {/* Zone de chat */}
      <div className="flex-1 flex flex-col">
        {activeConv ? (
          <>
            {/* En-tête du chat */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {activeConv.contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {activeConv.contact.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border border-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {activeConv.contact.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Shield className="w-3 h-3 text-green-500" />
                      <span>Chiffrement E2E actif</span>
                      <span>•</span>
                      <span>
                        {activeConv.contact.isOnline ? 'En ligne' : 'Hors ligne'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeConv.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.fromAddress === 'self' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.fromAddress === 'self'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs ${
                        message.fromAddress === 'self' ? 'text-indigo-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {message.isEncrypted && (
                        <Lock className={`w-3 h-3 ${
                          message.fromAddress === 'self' ? 'text-indigo-200' : 'text-green-500'
                        }`} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Barre de saisie */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md">
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Tapez votre message chiffré..."
                    className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700">
                    <Smile className="w-4 h-4" />
                  </button>
                </div>
                
                <button
                  onClick={sendMessage}
                  disabled={!messageInput.trim()}
                  className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center justify-center mt-2">
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Shield className="w-3 h-3 text-green-500" />
                  <span>Messages chiffrés avec RSA + AES-GCM</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="mx-auto w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Messagerie sécurisée
              </h3>
              <p className="text-gray-600 mb-4">
                Sélectionnez une conversation pour commencer à chatter
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
                <div className="flex items-start space-x-2">
                  <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Chiffrement de bout en bout</p>
                    <p className="mt-1">
                      Tous vos messages sont chiffrés avec RSA + AES et signés numériquement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingComponent;
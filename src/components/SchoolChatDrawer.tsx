import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Image as ImageIcon, 
  CheckCheck, 
  Clock, 
  ShieldCheck, 
  Smartphone,
  Paperclip,
  Trash2,
  Sparkles,
  ArrowDown
} from 'lucide-react';
import { ChatMessage, SchoolInfo, PlatformSettings, DEFAULT_PLATFORM_SETTINGS } from '../types';
import { fetchChatMessages, sendChatMessage, fetchPlatformSettings, compressImageForChat } from '../lib/db';
import { isAppOnline } from '../lib/offlineStorage';
import { Session } from '../lib/auth';

interface SchoolChatDrawerProps {
  session: Session;
  schoolInfo: SchoolInfo;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export const SchoolChatDrawer: React.FC<SchoolChatDrawerProps> = ({
  session,
  schoolInfo,
  isOpen,
  onClose,
  onOpen,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef<boolean>(false);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track when user scrolls up to read history
  const handleChatScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 60;
    userScrolledUpRef.current = !isNearBottom;
    setShowScrollBottomBtn(!isNearBottom);
  };

  const scrollToChatBottom = (smooth: boolean = true) => {
    userScrolledUpRef.current = false;
    setShowScrollBottomBtn(false);
    if (messagesContainerRef.current) {
      if (smooth) {
        messagesContainerRef.current.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' });
      } else {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }
  };

  useEffect(() => {
    const refreshSettings = () => {
      fetchPlatformSettings().then(setPlatformSettings);
    };

    refreshSettings();

    const handleSettingsUpdate = (e: any) => {
      if (e.detail) {
        setPlatformSettings(e.detail);
      } else {
        refreshSettings();
      }
    };

    window.addEventListener('cardschool_platform_settings_updated', handleSettingsUpdate);
    window.addEventListener('storage', refreshSettings);
    window.addEventListener('focus', refreshSettings);

    return () => {
      window.removeEventListener('cardschool_platform_settings_updated', handleSettingsUpdate);
      window.removeEventListener('storage', refreshSettings);
      window.removeEventListener('focus', refreshSettings);
    };
  }, []);

  const loadMessages = async () => {
    try {
      const msgs = await fetchChatMessages(session.userId);
      setMessages(prev => {
        if (prev.length === msgs.length) {
          const hasDiff = prev.some((m, idx) => m.id !== msgs[idx]?.id || m.message !== msgs[idx]?.message || m.status !== msgs[idx]?.status);
          if (!hasDiff) return prev;
        }
        return msgs;
      });
      
      // Calculate unread admin messages
      if (!isOpen) {
        const unread = msgs.filter(m => m.senderRole === 'admin' && m.status !== 'read').length;
        setUnreadCount(unread);
      } else {
        setUnreadCount(0);
      }
    } catch (e) {
      console.error('Error loading chat messages:', e);
    }
  };

  useEffect(() => {
    loadMessages();

    const handleNewMsg = (e: any) => {
      const newMsg = e.detail as ChatMessage;
      if (newMsg && (!newMsg.schoolId || newMsg.schoolId === session.userId)) {
        setMessages(prev => {
          const timeMs = new Date(newMsg.createdAt).getTime();
          const exists = prev.some(m => 
            m.id === newMsg.id || 
            (m.schoolId === newMsg.schoolId && m.senderRole === newMsg.senderRole && m.message === newMsg.message && Math.abs(new Date(m.createdAt).getTime() - timeMs) < 4000)
          );
          if (exists) return prev;
          return [...prev, newMsg];
        });
      }
    };

    window.addEventListener('cardschool_chat_message_received', handleNewMsg);
    
    // Polling adapté : 6s si le chat est ouvert, 30s s'il est fermé, et uniquement si connecté
    const intervalMs = isOpen ? 6000 : 30000;
    const interval = setInterval(() => {
      if (isAppOnline()) {
        loadMessages().catch(() => {});
      }
    }, intervalMs);

    return () => {
      window.removeEventListener('cardschool_chat_message_received', handleNewMsg);
      clearInterval(interval);
    };
  }, [session.userId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      // Only scroll down if user has not scrolled up
      if (!userScrolledUpRef.current) {
        setTimeout(() => scrollToChatBottom(false), 80);
      }
    }
  }, [isOpen, messages]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 20 Mo.');
        return;
      }
      setIsCompressingImage(true);
      try {
        const compressed = await compressImageForChat(file, 1024, 1024, 0.72);
        setSelectedImage(compressed);
      } catch (err) {
        console.warn('Image compression fallback:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setIsCompressingImage(false);
      }
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSending) return;
    if (!inputText.trim() && !selectedImage) return;

    const messageText = inputText.trim() || (selectedImage ? '📎 Preuve de paiement Mobile Money transmise' : '');
    const imageToSend = selectedImage || undefined;

    setInputText('');
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsSending(true);

    try {
      const sent = await sendChatMessage(
        session.userId,
        schoolInfo.name || session.schoolName || 'Mon Établissement',
        'school',
        messageText,
        imageToSend
      );

      setMessages(prev => {
        const timeMs = new Date(sent.createdAt).getTime();
        const exists = prev.some(m => 
          m.id === sent.id || 
          (m.schoolId === sent.schoolId && m.senderRole === sent.senderRole && m.message === sent.message && Math.abs(new Date(m.createdAt).getTime() - timeMs) < 4000)
        );
        if (exists) return prev;
        return [...prev, sent];
      });
      setTimeout(() => scrollToChatBottom(true), 60);
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Erreur lors de l\'envoi du message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickPrompt = (text: string) => {
    setInputText(text);
  };

  return (
    <>
      {/* Floating launcher trigger */}
      {!isOpen && (
        <button
          onClick={onOpen}
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 sm:p-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center gap-3 cursor-pointer border-2 border-emerald-400/30"
          title="Assistance & Validation de Paiement"
        >
          <div className="relative">
            <MessageSquare className="w-5 sm:w-6 h-5 sm:h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="font-extrabold text-xs hidden sm:inline tracking-wide">
            Support & Paiement
          </span>
        </button>
      )}

      {/* Floating Chat Box */}
      {isOpen && (
        <div className="fixed inset-x-3 bottom-3 sm:inset-auto sm:bottom-6 sm:right-6 z-50 w-auto sm:w-[420px] h-[560px] max-h-[88vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-slideUp">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-800 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <MessageSquare className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <h3 className="font-black text-sm leading-tight flex items-center gap-1.5">
                  Support & Validation
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                </h3>
                <p className="text-[11px] text-emerald-100 font-medium">
                  Service direct SukuPass Togo
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/20 transition-colors text-white/80 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick status bar */}
          <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100/80 flex items-center justify-between text-[11px]">
            <span className="font-bold text-emerald-900 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Statut actuel :
            </span>
            <span className={`font-black uppercase px-2 py-0.5 rounded-md text-[10px] ${
              schoolInfo.subscriptionPlan === 'pro'
                ? 'bg-emerald-600 text-white'
                : (schoolInfo.subscriptionPlan === 'suspended' ? 'bg-red-500 text-white' : 'bg-amber-100 text-amber-900 border border-amber-200')
            }`}>
              {schoolInfo.subscriptionPlan === 'pro' ? 'PRO (Illimité)' : (schoolInfo.subscriptionPlan === 'suspended' ? 'Suspendu' : 'Découverte (Gratuit)')}
            </span>
          </div>

          {/* Messages scroll area */}
          <div 
            ref={messagesContainerRef} 
            onScroll={handleChatScroll} 
            className="flex-1 min-h-0 p-4 overflow-y-auto space-y-3 bg-[#faf9f6] relative"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mb-3">
                  <Smartphone className="w-7 h-7" />
                </div>
                <h4 className="text-xs font-black text-gray-800 mb-1">Besoin d'aide ou d'activer le Plan PRO ?</h4>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed max-w-xs mb-3">
                  Réglez votre abonnement ({platformSettings.annualPriceCFA.toLocaleString()} F) par T-Money ou Flooz et joignez directement la capture de votre reçu pour activation immédiate.
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  <button
                    onClick={() => handleQuickPrompt(`Bonjour, j'ai effectué le transfert T-Money vers le ${platformSettings.tmoneyNumber}. Voici ma preuve de paiement :`)}
                    className="text-[10px] font-bold bg-white hover:bg-emerald-50 text-emerald-800 px-2.5 py-1.5 rounded-lg border border-emerald-200 shadow-xs transition-all cursor-pointer"
                  >
                    💳 T-Money ({platformSettings.tmoneyNumber})
                  </button>
                  <button
                    onClick={() => handleQuickPrompt(`Bonjour, j'ai effectué le transfert Flooz vers le ${platformSettings.floozNumber}. Voici ma preuve de paiement :`)}
                    className="text-[10px] font-bold bg-white hover:bg-emerald-50 text-emerald-800 px-2.5 py-1.5 rounded-lg border border-emerald-200 shadow-xs transition-all cursor-pointer"
                  >
                    📱 Flooz ({platformSettings.floozNumber})
                  </button>
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderRole === 'school';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1 text-[9px] text-gray-400 font-semibold mb-0.5 px-1">
                      <span>{isMe ? 'Vous' : 'Support SukuPass'}</span>
                      <span>•</span>
                      <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-3 shadow-sm text-xs leading-relaxed ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-tr-none'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                      }`}
                    >
                      {/* Attachment if present */}
                      {m.attachmentUrl && (
                        <div className="mb-2 overflow-hidden rounded-xl border border-white/20 bg-black/10">
                          <img
                            src={m.attachmentUrl}
                            alt="Preuve de paiement"
                            className="max-h-48 w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => window.open(m.attachmentUrl, '_blank')}
                          />
                          <div className={`p-1.5 text-[9px] font-bold flex items-center justify-between ${isMe ? 'bg-emerald-800/60 text-emerald-100' : 'bg-gray-100 text-gray-600'}`}>
                            <span className="flex items-center gap-1">
                              <Paperclip className="w-3 h-3" /> Reçu de transaction
                            </span>
                            <span className="underline">Agrandir</span>
                          </div>
                        </div>
                      )}

                      <p className="whitespace-pre-wrap">{m.message}</p>
                    </div>

                    {isMe && m.status === 'validated' && (
                      <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5 px-1">
                        <CheckCheck className="w-3 h-3" /> Validé PRO par l'administration
                      </span>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />

            {/* Floating jump to bottom button when scrolled up */}
            {showScrollBottomBtn && (
              <div className="sticky bottom-2 flex justify-center z-20 pointer-events-none">
                <button
                  type="button"
                  onClick={() => scrollToChatBottom(true)}
                  className="pointer-events-auto px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold rounded-full shadow-lg flex items-center gap-1.5 transition-all cursor-pointer animate-bounce-once"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>Nouveaux messages</span>
                </button>
              </div>
            )}
          </div>

          {/* Selected image preview or processing state */}
          {isCompressingImage && (
            <div className="p-2.5 bg-amber-50 border-t border-amber-200 flex items-center gap-2 text-amber-800 text-xs font-bold animate-pulse">
              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin shrink-0" />
              <span>Optimisation et préparation de l'image...</span>
            </div>
          )}

          {selectedImage && !isCompressingImage && (
            <div className="p-2.5 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={selectedImage} alt="Aperçu" className="w-10 h-10 object-cover rounded-lg border border-emerald-300 shadow-sm" />
                <div>
                  <p className="text-[11px] font-black text-emerald-900">Reçu / Capture sélectionnée</p>
                  <p className="text-[9px] text-emerald-700">Image optimisée • Prête à l'envoi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Supprimer l'image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isCompressingImage || isSending}
              className="p-2.5 bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 rounded-xl transition-all border border-gray-200 cursor-pointer disabled:opacity-50"
              title="Joindre une capture de paiement ou photo"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="Écrivez votre message..."
              className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-emerald-500 transition-all text-gray-800 placeholder-gray-400"
            />

            <button
              type="submit"
              disabled={isSending || (!inputText.trim() && !selectedImage)}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
              title="Envoyer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

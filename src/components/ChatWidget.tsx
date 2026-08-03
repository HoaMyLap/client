'use client';

import React, { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { createChatStompClient } from '@/lib/socket';
import { Client } from '@stomp/stompjs';
import { MessageSquare, MessageSquareMore, X, Send, Clock, Maximize2, Minimize2, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl: string | null;
  targetId: string;
  targetType: string;
  content: string;
  createdAt: string;
}

interface ChatWidgetProps {
  targetType: 'WORKSPACE' | 'PROJECT';
  targetId: string;
  targetName: string;
  isViewer?: boolean;
  positionClass?: string; // e.g., "bottom-6 right-6"
  isOpen?: boolean;
  onToggle?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

// Sound synthesizer using Web Audio API (cross-browser and fileless)
const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // Quick double chime chime sound
    const playChime = (freq: number, timeOffset: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + timeOffset);
      
      gain.gain.setValueAtTime(0.04, ctx.currentTime + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.18);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + timeOffset);
      osc.stop(ctx.currentTime + timeOffset + 0.2);
    };

    playChime(659.25, 0); // E5
    playChime(880.00, 0.08); // A5
  } catch (e) {
    console.warn('Audio Context block:', e);
  }
};

export default function ChatWidget({
  targetType,
  targetId,
  targetName,
  isViewer = false,
  positionClass = 'bottom-6 right-6',
  isOpen,
  onToggle,
  isExpanded,
  onToggleExpand
}: ChatWidgetProps) {
  const { t, language } = useLanguage();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [soundEnabled, setSoundEnabled] = useState(true);

  const stompClientRef = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  const soundEnabledRef = useRef(soundEnabled);

  // Sync soundEnabled ref
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Load sound setting from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chat_sound_enabled');
      if (saved !== null) {
        setSoundEnabled(saved === 'true');
      }
    }
  }, []);

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem('chat_sound_enabled', String(newVal));
  };

  const formatMessageTime = (createdAtStr: string) => {
    if (!createdAtStr) return '';
    try {
      let dateStr = createdAtStr;
      if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-')) {
        dateStr = dateStr + 'Z';
      }
      const d = new Date(dateStr);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error('Failed to parse date:', e);
      return '';
    }
  };

  const activeIsOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const activeIsExpanded = isExpanded !== undefined ? isExpanded : internalIsExpanded;

  // Toggle chat drawer open/close
  const toggleChat = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
    if (!activeIsOpen) {
      setUnreadCount(0);
    }
  };

  const toggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalIsExpanded(!internalIsExpanded);
    }
  };

  // Connect WebSocket and load history
  useEffect(() => {
    if (!targetId) return;

    // Load message history
    const loadHistory = async () => {
      try {
        setLoading(true);
        const data = await api.chat.getHistory(targetType, targetId);
        setMessages(data || []);
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();

    // Connect STOMP client
    const client = createChatStompClient(targetType, targetId, (message: ChatMessage) => {
      setMessages((prev) => {
        // Avoid duplicate messages
        if (prev.some((m) => m.id === message.id)) return prev;

        // Play chime sound if message is from someone else and sound is enabled
        if (message.senderId !== currentUserId && soundEnabledRef.current) {
          playNotificationSound();
        }

        return [...prev, message];
      });

      // Increment unread count if chat widget is closed
      if (!activeIsOpen) {
        setUnreadCount((count) => count + 1);
      }
    });

    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [targetType, targetId, activeIsOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeIsOpen]);

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    const text = inputContent.trim();
    setInputContent('');

    try {
      await api.chat.sendMessage(targetType, targetId, text);
    } catch (err) {
      console.error('Failed to send chat message:', err);
      setInputContent(text); // Restore text on failure
    }
  };

  // Determine chat theme and icons based on type
  const isWorkspace = targetType === 'WORKSPACE';
  const ChatIcon = isWorkspace ? MessageSquareMore : MessageSquare;
  const triggerColorClass = isWorkspace 
    ? 'bg-[#4f46e5] hover:bg-[#4338ca] hover:scale-105' 
    : 'bg-[#7c3aed] hover:bg-[#6d28d9] hover:scale-105';

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <button
        onClick={toggleChat}
        className={`fixed ${positionClass} h-14 w-14 rounded-full text-white flex items-center justify-center shadow-xl transition-all z-40 border-0 cursor-pointer ${triggerColorClass}`}
        title={isWorkspace 
          ? (language === 'vi' ? 'Chat nhóm Workspace' : 'Workspace Chat') 
          : (language === 'vi' ? 'Chat nhóm Dự án' : 'Project Chat')
        }
      >
        <ChatIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Solid Chat Drawer Panel */}
      {activeIsOpen && (
        <div 
          className={`fixed bottom-24 right-6 max-w-[calc(100vw-32px)] max-h-[calc(100vh-120px)] z-50 shadow-2xl rounded-3xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300 border bg-[#f4f2f7] dark:bg-[#0e0c14] border-[#e1dbe9] dark:border-[#221c2e] ${
            activeIsExpanded ? 'w-[850px] max-w-[85vw] h-[750px] max-h-[85vh]' : 'w-[380px] h-[550px]'
          } transition-all duration-300`}
        >
          {/* Header */}
          <div className="p-4 flex items-center justify-between bg-[#eae3f0] dark:bg-[#15121f] border-b border-[#e1dbe9] dark:border-[#221c2e]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`p-2 rounded-xl text-white shrink-0 ${isWorkspace ? 'bg-[#4f46e5]' : 'bg-[#7c3aed]'}`}>
                <ChatIcon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <h4 className={`text-xs font-black uppercase tracking-wider ${isWorkspace ? 'text-[#4f46e5] dark:text-[#818cf8]' : 'text-[#7c3aed] dark:text-[#a78bfa]'}`}>
                  {isWorkspace ? 'Workspace Chat' : 'Project Chat'}
                </h4>
                <p className="text-[11px] font-bold truncate mt-0.5 text-zinc-800 dark:text-zinc-200" title={targetName}>
                  {targetName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              {/* Sound Toggle Button */}
              <button
                onClick={toggleSound}
                className="p-1.5 rounded-full hover:bg-[#dbd3e3] dark:hover:bg-[#252033] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-all border-0 bg-transparent cursor-pointer"
                title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>

              {/* Maximize / Minimize Button */}
              <button
                onClick={toggleExpand}
                className="p-1.5 rounded-full hover:bg-[#dbd3e3] dark:hover:bg-[#252033] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-all border-0 bg-transparent cursor-pointer"
                title={activeIsExpanded ? 'Thu nhỏ' : 'Phóng to'}
              >
                {activeIsExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              
              {/* Close Button */}
              <button
                onClick={toggleChat}
                className="p-1.5 rounded-full hover:bg-[#dbd3e3] dark:hover:bg-[#252033] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-all border-0 bg-transparent cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 dark:text-zinc-400 text-xs gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary/20 border-t-primary" />
                Đang tải tin nhắn...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-zinc-400 dark:text-zinc-500 text-xs">
                <ChatIcon className="h-10 w-10 opacity-40 mb-3" />
                <p className="font-bold text-zinc-650 dark:text-zinc-350">Bắt đầu cuộc trò chuyện!</p>
                <p className="text-[10px] mt-1 opacity-70">
                  Mọi tin nhắn gửi trong phòng này đều bảo mật và đồng bộ realtime.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-[10px] text-primary shrink-0 overflow-hidden shadow-sm">
                      {msg.senderAvatarUrl ? (
                        <img src={msg.senderAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{msg.senderName ? msg.senderName.charAt(0).toUpperCase() : 'U'}</span>
                      )}
                    </div>

                    {/* Bubble */}
                    <div className="max-w-[70%] flex flex-col gap-0.5">
                      {!isMe && (
                        <span className="text-[9px] font-extrabold px-1 truncate text-zinc-600 dark:text-zinc-400">
                          {msg.senderName}
                        </span>
                      )}
                      <div
                        className={`p-3 rounded-2xl text-xs break-words shadow-sm leading-relaxed border ${
                          isMe
                            ? 'bg-[#dbeafe] border-[#bfdbfe] dark:bg-[#1e293b] dark:border-[#334155] text-blue-900 dark:text-blue-100 rounded-br-none'
                            : 'bg-white border-[#e8e3f2] dark:bg-[#1a1626] dark:border-[#2a243a] text-zinc-900 dark:text-zinc-100 rounded-bl-none'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className={`text-[8px] px-1.5 flex items-center gap-0.5 mt-0.5 text-zinc-500 dark:text-zinc-500 ${isMe ? 'justify-end' : ''}`}>
                        <Clock className="h-2 w-2" />
                        {formatMessageTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-4 bg-[#eae3f0] dark:bg-[#15121f] border-t border-[#e1dbe9] dark:border-[#221c2e] shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                required
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                placeholder="Nhập tin nhắn của bạn..."
                className="ui-input flex-1 px-3.5 py-2 text-xs bg-white dark:bg-[#1a1626] border border-[#cbd3e3] dark:border-[#353043] rounded-xl focus:outline-none text-zinc-900 dark:text-zinc-100"
              />
              <button
                type="submit"
                className="h-8.5 w-8.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground flex items-center justify-center shrink-0 border-0 cursor-pointer shadow-md transition-all active:scale-95"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

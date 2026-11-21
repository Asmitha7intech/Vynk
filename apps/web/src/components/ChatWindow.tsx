import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Shield, GraduationCap, Sparkles } from 'lucide-react';
import { Conversation, User, Message } from '@vynk/types';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { MessageBubble } from './MessageBubble';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

interface ChatWindowProps {
  conversation: Conversation;
  currentUser: User;
}

export function ChatWindow({ conversation, currentUser }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherMember = conversation.members.find((m) => m.id !== currentUser.id) || conversation.members[0];
  const title = conversation.title || otherMember?.displayName || 'Direct Vynk';
  const isOnline = otherMember?.id ? onlineUserIds.has(otherMember.id) : false;

  useEffect(() => {
    api.getMessages(conversation.id).then((data) => {
      setMessages(data || []);
      api.markConversationRead(conversation.id).catch(() => {});
    });

    const socket = getSocket();
    socket.emit('conversation:join', conversation.id);

    const handleNewMessage = (data: { conversationId: string; message: any }) => {
      if (data.conversationId === conversation.id && data.message) {
        setMessages((prev) => {
          // 1. Deduplicate if this exact server ID is already present
          if (prev.some((m) => m.id === data.message.id)) {
            return prev;
          }

          // 2. If sent by currentUser, reconcile with matching optimistic temp message
          if (data.message.senderId === currentUser.id) {
            const tempIdx = prev.findIndex(
              (m) => m.id.startsWith('temp-') && m.senderId === currentUser.id && m.content === data.message.content
            );
            if (tempIdx !== -1) {
              const updated = [...prev];
              updated[tempIdx] = data.message;
              return updated;
            }
          }

          // 3. Otherwise append cleanly
          return [...prev, data.message];
        });
        api.markConversationRead(conversation.id).catch(() => {});
      }
    };

    const handlePresenceInitial = (data: { onlineUserIds?: string[] }) => {
      if (Array.isArray(data?.onlineUserIds)) {
        setOnlineUserIds(new Set(data.onlineUserIds));
      }
    };

    const handleUserOnline = (data: { userId: string }) => {
      if (data?.userId) {
        setOnlineUserIds((prev) => new Set([...prev, data.userId]));
      }
    };

    const handleUserOffline = (data: { userId: string }) => {
      if (data?.userId) {
        setOnlineUserIds((prev) => {
          const next = new Set(prev);
          next.delete(data.userId);
          return next;
        });
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('presence:initial', handlePresenceInitial);
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);

    return () => {
      socket.emit('conversation:leave', conversation.id);
      socket.off('message:new', handleNewMessage);
      socket.off('presence:initial', handlePresenceInitial);
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
    };
  }, [conversation.id, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const optimisticMessage: Message = {
      id: tempId,
      conversationId: conversation.id,
      senderId: currentUser.id,
      content: text,
      attachments: [],
      isDeleted: false,
      createdAt: new Date().toISOString(),
      sender: currentUser,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText('');

    try {
      const saved = await api.sendMessage({
        conversationId: conversation.id,
        content: text,
      });

      if (saved?.id) {
        setMessages((prev) => {
          // If WebSocket already added the real message, remove the temp message
          if (prev.some((m) => m.id === saved.id)) {
            return prev.filter((m) => m.id !== tempId);
          }
          // Otherwise reconcile temp message with real server message
          return prev.map((m) => (m.id === tempId ? saved : m));
        });
      }
      api.markConversationRead(conversation.id).catch(() => {});
    } catch (err) {
      console.error('Message failed to send', err);
      // Revert optimistic message if send failed
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Avatar src={otherMember?.avatarUrl} fallback={title} size="sm" isOnline={isOnline} />
          <div>
            <h3 className="text-sm font-bold text-foreground leading-tight">{title}</h3>
            <span className={`text-[11px] font-medium ${isOnline ? 'text-emerald-400' : 'text-muted-foreground'}`}>
              {isOnline ? 'Active now' : 'Offline'}
            </span>
          </div>
        </div>

        {conversation.type === 'MENTOR' && (
          <Badge variant="accent" className="text-[10px]">
            <GraduationCap className="w-3 h-3 mr-1" /> Mentorship Thread
          </Badge>
        )}
        {conversation.type === 'CREW' && (
          <Badge variant="default" className="text-[10px]">
            <Shield className="w-3 h-3 mr-1" /> Crew Channel
          </Badge>
        )}
      </div>

      {/* Mentor Guidance Banner if Mentor Chat */}
      {conversation.type === 'MENTOR' && (
        <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 flex-shrink-0" />
          <span>
            Goal: Model Quantization & Pipeline Architecture · Guidance session in progress.
          </span>
        </div>
      )}

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} currentUser={currentUser} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <form onSubmit={handleSend} className="p-3 border-t border-surface-border dark:border-white/10 bg-surface dark:bg-[#070a12] flex items-center gap-2">
        <button
          type="button"
          aria-label="Attach file"
          className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <textarea
          rows={1}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!isSending && inputText.trim()) {
                handleSend(e);
              }
            }
          }}
          placeholder={`Message ${title}... (Enter to send, Shift+Enter for new line)`}
          className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-surface-elevated dark:bg-[#0d121f] border border-surface-border dark:border-white/10 hover:border-surface-border/80 text-foreground dark:text-white placeholder:text-muted-foreground caret-indigo-500 dark:caret-cyan-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none max-h-32 leading-relaxed"
        />

        <button
          type="submit"
          aria-label="Send message"
          disabled={!inputText.trim() || isSending}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white disabled:opacity-40 transition-all cursor-pointer shadow-md shadow-indigo-600/30 flex items-center justify-center shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

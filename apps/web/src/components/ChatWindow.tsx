import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Shield, GraduationCap, Sparkles } from 'lucide-react';
import { Conversation, User, Message } from '@vynk/types';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { MessageBubble } from './MessageBubble';
import { api } from '../lib/api';

interface ChatWindowProps {
  conversation: Conversation;
  currentUser: User;
}

export function ChatWindow({ conversation, currentUser }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherMember = conversation.members.find((m) => m.id !== currentUser.id) || conversation.members[0];
  const title = conversation.title || otherMember?.displayName || 'Direct Vynk';

  useEffect(() => {
    api.getMessages(conversation.id).then((data) => {
      setMessages(data);
    });
  }, [conversation.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const optimisticMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: conversation.id,
      senderId: currentUser.id,
      content: inputText,
      attachments: [],
      isDeleted: false,
      createdAt: new Date().toISOString(),
      sender: currentUser,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInputText('');

    try {
      await api.sendMessage({
        conversationId: conversation.id,
        content: optimisticMessage.content,
      });
    } catch (err) {
      console.error('Message failed to send', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Avatar src={otherMember?.avatarUrl} fallback={title} size="sm" isOnline={true} />
          <div>
            <h3 className="text-sm font-bold text-foreground leading-tight">{title}</h3>
            <span className="text-[11px] text-emerald-400 font-medium">Active now</span>
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
      <form onSubmit={handleSend} className="p-3 border-t border-border bg-card/60 flex items-center gap-2">
        <button
          type="button"
          className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors cursor-pointer"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message ${title}...`}
          className="flex-1 px-4 py-2 text-xs rounded-xl bg-muted/60 border border-border focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-foreground"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-all cursor-pointer shadow-md shadow-indigo-600/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

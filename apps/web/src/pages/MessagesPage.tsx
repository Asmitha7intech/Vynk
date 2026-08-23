import React, { useState, useEffect } from 'react';
import { ConversationList } from '../components/ConversationList';
import { ChatWindow } from '../components/ChatWindow';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { Conversation } from '@vynk/types';
import { MessageSquare, Users, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';

export function MessagesPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.getConversations()
      .then((data) => {
        setConversations(data || []);
        if (data && data.length > 0) {
          setActiveId(data[0].id);
        }
      })
      .catch(() => setConversations([]))
      .finally(() => setIsLoading(false));

    api.trackEvent('messages_page_viewed');
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeId);

  if (!user) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-border">
        Please sign in to access your direct Vynk messages, crew channels, and mentor threads.
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4">
      {/* Conversation Sidebar */}
      <div className="w-full md:w-80 flex-shrink-0 bg-card rounded-2xl border border-border overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-card/80 flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span>Messages & Squads</span>
          </h2>
          <span className="text-[10px] font-mono text-muted-foreground">{conversations.length} Active</span>
        </div>

        {conversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground space-y-3">
            <p>Your messenger is empty.</p>
            <p className="text-[11px] text-muted-foreground/70">
              Vynk with peers or join recruiting crews to unlock real-time channels.
            </p>
            <Link to="/explore">
              <Button size="sm" variant="outline" className="text-xs">
                Explore Network
              </Button>
            </Link>
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={(id) => setActiveId(id)}
            currentUser={user}
          />
        )}
      </div>

      {/* Main Chat Window */}
      <div className="flex-1 min-w-0 h-full">
        {activeConversation ? (
          <ChatWindow conversation={activeConversation} currentUser={user} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-border space-y-2">
            <MessageSquare className="w-8 h-8 text-indigo-400 opacity-40" />
            <p className="font-bold text-foreground">Select a conversation or squad channel</p>
            <p className="text-[11px]">Real-time encrypted sockets active.</p>
          </div>
        )}
      </div>
    </div>
  );
}

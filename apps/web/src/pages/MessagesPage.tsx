import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ConversationList } from '../components/ConversationList';
import { ChatWindow } from '../components/ChatWindow';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuthStore } from '../stores/authStore';
import { Conversation } from '@vynk/types';
import { MessageSquare, Users, Sparkles } from 'lucide-react';
import { VynkButton } from '../components/vynk/VynkButton';
import { EmptyState } from '../components/vynk/EmptyState';
import { Pill } from '../components/vynk/Pill';

export function MessagesPage() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const conversationIdParam = searchParams.get('conversationId');
  const userIdParam = searchParams.get('userId');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(conversationIdParam || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.getConversations()
      .then(async (data) => {
        let list = data || [];
        // If a direct target user was passed but no existing conversation in list
        if (userIdParam && !list.some((c) => c.members.some((m) => m.id === userIdParam))) {
          try {
            const directConv = await api.getDirectConversation(userIdParam);
            if (directConv?.id && !list.some((c) => c.id === directConv.id)) {
              list = [directConv, ...list];
            }
          } catch (e) {
            console.error('Failed to resolve direct conversation with user:', e);
          }
        }

        setConversations(list);
        if (conversationIdParam && list.some((c) => c.id === conversationIdParam)) {
          setActiveId(conversationIdParam);
        } else if (userIdParam) {
          const direct = list.find((c) => c.members.some((m) => m.id === userIdParam));
          if (direct) setActiveId(direct.id);
          else if (list.length > 0) setActiveId(list[0].id);
        } else if (list.length > 0 && !activeId) {
          setActiveId(list[0].id);
        }
      })
      .catch(() => setConversations([]))
      .finally(() => setIsLoading(false));

    api.trackEvent('messages_page_viewed');
  }, [conversationIdParam, userIdParam]);

  // Real-time synchronization for conversation list updates
  useEffect(() => {
    const socket = getSocket();

    const handleNewMessage = (payload: { conversationId: string; message: any }) => {
      if (!payload?.conversationId || !payload?.message) return;
      setConversations((prev) => {
        const existingIdx = prev.findIndex((c) => c.id === payload.conversationId);
        if (existingIdx === -1) {
          // If a new conversation was created and first message arrived, refresh list
          api.getConversations().then((refreshed) => setConversations(refreshed || []));
          return prev;
        }

        const updated = [...prev];
        const target = { ...updated[existingIdx] };
        target.lastMessageText = payload.message.content;
        target.lastMessageAt = payload.message.createdAt;
        if (activeId !== payload.conversationId && payload.message.senderId !== user?.id) {
          target.unreadCount = (target.unreadCount || 0) + 1;
        }

        updated.splice(existingIdx, 1);
        return [target, ...updated];
      });
    };

    socket.on('message:new', handleNewMessage);
    return () => {
      socket.off('message:new', handleNewMessage);
    };
  }, [activeId, user?.id]);

  const activeConversation = conversations.find((c) => c.id === activeId);

  if (!user) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Sign in to access your direct Vynk messages"
        description="Direct peer-to-peer chats and squad channels are unlocked once mutual connections are established."
        actionLabel="Sign In"
        onAction={() => window.location.href = '/auth'}
      />
    );
  }

  return (
    <div className="h-[calc(100vh-130px)] flex flex-col md:flex-row gap-4">
      {/* ── Conversation Sidebar ── */}
      <div className="w-full md:w-80 flex-shrink-0 glass-panel rounded-3xl overflow-hidden flex flex-col border border-surface-border">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Direct & Squads
            </h2>
          </div>
          <Pill label={`${conversations.length} Active`} variant="indigo" size="xs" />
        </div>

        {conversations.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground space-y-3 flex-1 flex flex-col items-center justify-center">
            <MessageSquare className="w-8 h-8 text-indigo-400/50 mx-auto mb-1" />
            <p className="font-bold text-foreground">Your messenger is empty.</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Your conversations will appear here when you connect with people.
            </p>
            <Link to="/network">
              <VynkButton size="xs" variant="outline">
                Discover People
              </VynkButton>
            </Link>
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={(id) => {
              setActiveId(id);
              api.markConversationRead(id).catch(() => {});
              setConversations((prev) =>
                prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
              );
            }}
            currentUser={user}
          />
        )}

        {/* Live socket indicator */}
        <div className="p-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Socket.IO Active</span>
          </span>
          <span className="opacity-60">Real-Time Synced</span>
        </div>
      </div>

      {/* ── Main Chat Window ── */}
      <div className="flex-1 min-w-0 h-full">
        {activeConversation ? (
          <ChatWindow conversation={activeConversation} currentUser={user} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center glass-panel rounded-3xl border border-surface-border space-y-2">
            <MessageSquare className="w-10 h-10 text-indigo-400 opacity-40 mx-auto" />
            <p className="font-bold text-sm text-foreground">Select a conversation or squad channel</p>
            <p className="text-xs text-muted-foreground">Your conversations will appear here when you connect with people.</p>
          </div>
        )}
      </div>
    </div>
  );
}

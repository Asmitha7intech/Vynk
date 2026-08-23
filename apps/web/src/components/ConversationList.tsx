import React from 'react';
import { Conversation, User } from '@vynk/types';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Shield, GraduationCap, Users } from 'lucide-react';
import { formatTimeAgo } from '../lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  currentUser: User;
}

export function ConversationList({ conversations, activeId, onSelect, currentUser }: ConversationListProps) {
  return (
    <div className="divide-y divide-border/60 overflow-y-auto">
      {conversations.map((conv) => {
        const isActive = conv.id === activeId;
        const otherMember = conv.members.find((m) => m.id !== currentUser.id) || conv.members[0];
        const title = conv.title || otherMember?.displayName || 'Direct Vynk';

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer ${
              isActive ? 'bg-indigo-600/10 border-l-2 border-indigo-500' : 'hover:bg-muted/40'
            }`}
          >
            <div className="relative">
              <Avatar src={otherMember?.avatarUrl} fallback={title} size="md" isOnline={true} />
              {conv.type === 'CREW' && (
                <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-card border border-border text-indigo-400">
                  <Shield className="w-3 h-3" />
                </div>
              )}
              {conv.type === 'MENTOR' && (
                <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-card border border-border text-amber-400">
                  <GraduationCap className="w-3 h-3" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h4 className={`text-xs font-bold truncate ${isActive ? 'text-indigo-400' : 'text-foreground'}`}>
                  {title}
                </h4>
                {conv.lastMessageAt && (
                  <span className="text-[10px] text-muted-foreground/70 font-mono">
                    {formatTimeAgo(conv.lastMessageAt)}
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground truncate">
                {conv.lastMessageText || 'Start conversation...'}
              </p>
            </div>

            {(conv.unreadCount ?? 0) > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">
                {conv.unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

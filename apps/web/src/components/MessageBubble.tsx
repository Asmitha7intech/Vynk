import React from 'react';
import { Avatar } from './Avatar';
import { Message, User } from '@vynk/types';
import { formatTimeAgo } from '../lib/utils';

export function MessageBubble({ message, currentUser }: { message: any; currentUser: User }) {
  const isMe = message.senderId === currentUser.id;

  return (
    <div className={`flex items-end gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMe && (
        <Avatar src={message.sender?.avatarUrl} fallback={message.sender?.displayName || 'User'} size="xs" />
      )}

      <div className={`max-w-[75%] space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
        {!isMe && (
          <span className="text-[10px] font-semibold text-muted-foreground ml-1">
            {message.sender?.displayName}
          </span>
        )}

        <div
          className={`p-3 rounded-2xl text-xs leading-relaxed ${
            isMe
              ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/10'
              : 'bg-muted text-foreground rounded-bl-none border border-border/70'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        <span className="text-[9px] text-muted-foreground/60 px-1 font-mono">
          {formatTimeAgo(message.createdAt)}
        </span>
      </div>
    </div>
  );
}

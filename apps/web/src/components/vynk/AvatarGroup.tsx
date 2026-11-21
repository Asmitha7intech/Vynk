import React from 'react';
import { Avatar } from '../Avatar';

export interface AvatarGroupUser {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface AvatarGroupProps {
  users: AvatarGroupUser[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
}

export function AvatarGroup({ users = [], max = 4, size = 'sm' }: AvatarGroupProps) {
  const visibleUsers = users.slice(0, max);
  const remainingCount = Math.max(0, users.length - max);

  const sizeClasses = {
    xs: 'w-6 h-6 -ml-1.5 first:ml-0 ring-2 ring-background',
    sm: 'w-8 h-8 -ml-2 first:ml-0 ring-2 ring-background',
    md: 'w-10 h-10 -ml-2.5 first:ml-0 ring-2 ring-background',
  };

  return (
    <div className="flex items-center">
      {visibleUsers.map((user) => (
        <div key={user.id} className={sizeClasses[size]}>
          <Avatar
            src={user.avatarUrl}
            fallback={user.displayName}
            size={size === 'xs' ? 'sm' : size}
            className="w-full h-full object-cover rounded-full"
          />
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className={`${sizeClasses[size]} rounded-full bg-surface-elevated border border-border/80 flex items-center justify-center text-[10px] font-bold text-muted-foreground`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

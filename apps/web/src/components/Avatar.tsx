import React from 'react';
import { cn } from '../lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  className?: string;
}

export function Avatar({ src, alt, fallback, size = 'md', isOnline, className }: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-semibold',
    xl: 'w-20 h-20 text-xl font-bold',
  };

  const badgeSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
  };

  const initials = fallback ? fallback.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2) : 'VK';

  return (
    <div className={cn('relative inline-block flex-shrink-0', className)}>
      <div className={cn('rounded-full overflow-hidden flex items-center justify-center bg-indigo-950/80 border border-indigo-500/30 text-indigo-200 font-medium', sizes[size])}>
        {src ? (
          <img src={src} alt={alt || fallback} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {isOnline !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-card',
            isOnline ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-slate-500',
            badgeSizes[size]
          )}
        />
      )}
    </div>
  );
}

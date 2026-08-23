import React from 'react';
import { getLevelDetails } from '../lib/utils';
import { Shield } from 'lucide-react';

export function LevelBadge({ level, size = 'md' }: { level: number; size?: 'sm' | 'md' | 'lg' }) {
  const details = getLevelDetails(level);

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  };

  return (
    <div className={`inline-flex items-center rounded-full font-semibold bg-indigo-500/10 border border-indigo-500/20 ${details.color} ${sizes[size]}`}>
      <Shield className="w-3.5 h-3.5 fill-current opacity-70" />
      <span>Lvl {level} · {details.title}</span>
    </div>
  );
}

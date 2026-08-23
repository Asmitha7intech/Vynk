import React from 'react';
import { Flame } from 'lucide-react';

export function StreakBadge({ streakDays }: { streakDays: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-sm shadow-amber-500/10">
      <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-500 animate-pulse" />
      <span>{streakDays} Day Streak</span>
    </div>
  );
}

import React from 'react';
import { getNextLevelProgress, getLevelDetails } from '../lib/utils';
import { Sparkles } from 'lucide-react';

interface XPProgressBarProps {
  xp: number;
  level: number;
  showLabels?: boolean;
}

export function XPProgressBar({ xp, level, showLabels = true }: XPProgressBarProps) {
  const { progress, xpToNext, nextLevelTitle } = getNextLevelProgress(xp, level);
  const currentLevelInfo = getLevelDetails(level);

  return (
    <div className="w-full space-y-1.5">
      {showLabels && (
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Level {level} · {currentLevelInfo.title}</span>
          </div>
          <span className="text-muted-foreground font-mono">{xp} XP {xpToNext > 0 ? `(${xpToNext} to ${nextLevelTitle})` : '(Maxed)'}</span>
        </div>
      )}
      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden p-0.5 border border-border/50">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-amber-400 rounded-full transition-all duration-500 shadow-sm"
          style={{ width: `${Math.max(4, progress)}%` }}
        />
      </div>
    </div>
  );
}

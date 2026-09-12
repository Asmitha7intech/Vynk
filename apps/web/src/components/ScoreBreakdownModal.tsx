import React, { useState, useEffect } from 'react';
import { Trophy, Sparkles, X, Flame, Shield, BookOpen, Layers } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { api } from '../lib/api';

interface ScoreBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
}

export function ScoreBreakdownModal({ isOpen, onClose, userId, username }: ScoreBreakdownModalProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      setIsLoading(true);
      api.getRankExplanation(userId)
        .then((res: any) => setData(res))
        .catch(() => setData(null))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md bg-card border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">Score & Rank Breakdown</h3>
              <p className="text-xs text-muted-foreground">@{username} · Transparent XP Ledger</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
            Analyzing growth ledger factors...
          </div>
        ) : !data ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            Rank factors currently compiling from database.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Rank Pill */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-300">Current Position</span>
                <div className="text-2xl font-black text-amber-400 font-mono">#{data.rank} Global</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Growth</span>
                <div className="text-lg font-black text-indigo-400 font-mono">{data.totalXp} XP</div>
              </div>
            </div>

            {/* Contributing Factors */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Contributing XP Pillars
              </h4>
              {data.factors?.map((f: any) => (
                <div key={f.category} className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{f.category}</span>
                    <span className="font-mono font-bold text-indigo-400">+{f.xpContribution} XP ({f.percentageOfTotal}%)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{f.description}</p>
                </div>
              ))}
            </div>

            <Button onClick={onClose} className="w-full text-xs">
              Close Breakdown
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

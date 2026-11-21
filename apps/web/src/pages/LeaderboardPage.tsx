import React, { useState, useEffect } from 'react';
import { Trophy, Globe, School, BookOpen, Sparkles, Target, Zap } from 'lucide-react';
import { LeaderboardTable } from '../components/LeaderboardTable';
import { Pill } from '../components/vynk/Pill';
import { api } from '../lib/api';
import { LeaderboardEntry } from '@vynk/types';

export function LeaderboardPage() {
  const [scope, setScope] = useState<'GLOBAL' | 'COLLEGE' | 'DEPARTMENT' | 'WEEKLY'>('GLOBAL');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.getLeaderboard(scope)
      .then((data) => {
        setEntries(data || []);
      })
      .catch(() => setEntries([]))
      .finally(() => setIsLoading(false));

    api.trackEvent('leaderboard_viewed', { scope });
  }, [scope]);

  return (
    <div className="space-y-6">
      {/* ── Hero Header ── */}
      <div className="p-6 sm:p-7 rounded-3xl glass-card space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Pill label="Campus Build Rankings" variant="amber" size="xs" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Campus Builder Rankings & Podium
            </h1>
            <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
              Rankings reflect verified project milestones shipped, technical quest accuracy, hackathon squad wins, and daily streak consistency.
            </p>
          </div>
        </div>

        {/* Transparent XP Formula Explainer */}
        <div className="pt-2 border-t border-white/5 flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5 font-semibold text-foreground">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> XP Pillars:
          </span>
          <span>🚀 Voyages (35%)</span>
          <span className="opacity-40">•</span>
          <span>⚡ Quests & Arena (25%)</span>
          <span className="opacity-40">•</span>
          <span>🛡️ Hackathon Crews (25%)</span>
          <span className="opacity-40">•</span>
          <span>🔥 Streak Consistency (15%)</span>
        </div>
      </div>

      {/* ── Scope Selector ── */}
      <div className="flex gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        {[
          { id: 'GLOBAL', label: 'Global Frontier', icon: Globe },
          { id: 'COLLEGE', label: 'My College', icon: School },
          { id: 'DEPARTMENT', label: 'Department', icon: BookOpen },
          { id: 'WEEKLY', label: 'Weekly Championship', icon: Trophy },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setScope(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              scope === tab.id
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Leaderboard Table with Podium ── */}
      <LeaderboardTable entries={entries} />
    </div>
  );
}

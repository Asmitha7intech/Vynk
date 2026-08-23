import React, { useState, useEffect } from 'react';
import { Trophy, Sparkles, Flame, Shield, Globe, School, BookOpen } from 'lucide-react';
import { LeaderboardTable } from '../components/LeaderboardTable';
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
      {/* Hero */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/50 via-card to-card border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider">
              Reputation & Build Rankings
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Campus Leaderboards</h1>
          <p className="text-xs text-muted-foreground max-w-lg">
            Rankings reflect verified project milestones, quest precision, hackathon squad achievements, and peer mentoring.
          </p>
        </div>
      </div>

      {/* Scope Selector */}
      <div className="flex gap-2 border-b border-border pb-3 overflow-x-auto">
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
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Leaderboard Table with Podium */}
      <LeaderboardTable entries={entries} />
    </div>
  );
}

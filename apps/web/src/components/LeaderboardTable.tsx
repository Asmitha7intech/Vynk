import React from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Sparkles, Flame } from 'lucide-react';
import { Card, CardHeader, CardContent } from './Card';
import { Avatar } from './Avatar';
import { LevelBadge } from './LevelBadge';
import { LeaderboardEntry } from '@vynk/types';

export function LeaderboardTable({ entries }: { entries: LeaderboardEntry[] }) {
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-6">
      {/* Visual Podium for Top 3 */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 md:gap-4 items-end pt-8 pb-4">
          {/* Rank 2 */}
          <div className="flex flex-col items-center order-1">
            <div className="relative mb-3">
              <Avatar src={top3[1].user.avatarUrl} fallback={top3[1].user.displayName} size="lg" />
              <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center border-2 border-card">
                2
              </div>
            </div>
            <span className="text-xs font-bold truncate max-w-[100px]">{top3[1].user.displayName}</span>
            <span className="text-[11px] font-mono text-muted-foreground">{top3[1].score} XP</span>
            <div className="w-full h-24 mt-2 rounded-t-2xl bg-gradient-to-t from-slate-800/40 to-slate-700/20 border-t border-slate-500/30 flex items-center justify-center font-bold text-slate-400">
              #2
            </div>
          </div>

          {/* Rank 1 (Champion) */}
          <div className="flex flex-col items-center order-2">
            <Crown className="w-6 h-6 text-amber-400 animate-bounce mb-1" />
            <div className="relative mb-3">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 opacity-75 blur-sm animate-pulse" />
              <Avatar src={top3[0].user.avatarUrl} fallback={top3[0].user.displayName} size="xl" className="relative" />
              <div className="absolute -bottom-2 -right-1 w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-sm flex items-center justify-center border-2 border-card shadow-lg">
                1
              </div>
            </div>
            <span className="text-sm font-extrabold truncate max-w-[120px] text-amber-400">{top3[0].user.displayName}</span>
            <span className="text-xs font-mono font-bold text-foreground">{top3[0].score} XP</span>
            <div className="w-full h-32 mt-2 rounded-t-2xl bg-gradient-to-t from-amber-900/40 to-amber-600/20 border-t border-amber-400/40 flex items-center justify-center font-black text-amber-400 text-lg">
              #1
            </div>
          </div>

          {/* Rank 3 */}
          <div className="flex flex-col items-center order-3">
            <div className="relative mb-3">
              <Avatar src={top3[2].user.avatarUrl} fallback={top3[2].user.displayName} size="lg" />
              <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center border-2 border-card">
                3
              </div>
            </div>
            <span className="text-xs font-bold truncate max-w-[100px]">{top3[2].user.displayName}</span>
            <span className="text-[11px] font-mono text-muted-foreground">{top3[2].score} XP</span>
            <div className="w-full h-18 mt-2 rounded-t-2xl bg-gradient-to-t from-amber-950/40 to-amber-800/20 border-t border-amber-700/30 flex items-center justify-center font-bold text-amber-600">
              #3
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table List */}
      <Card>
        <CardContent className="p-0 divide-y divide-border/60">
          {entries.map((entry) => (
            <div
              key={entry.user.id}
              className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-8 text-center font-black text-sm font-mono text-muted-foreground">
                  #{entry.rank}
                </div>
                <Avatar src={entry.user.avatarUrl} fallback={entry.user.displayName} size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-foreground truncate">{entry.user.displayName}</h4>
                    <span className="text-xs text-muted-foreground hidden sm:inline">@{entry.user.username}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {entry.user.college} · {entry.user.department}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
                <div className="hidden md:block">
                  <LevelBadge level={entry.user.level || 1} size="sm" />
                </div>

                <div className="text-right font-mono">
                  <span className="text-sm font-black text-foreground">{entry.score}</span>
                  <span className="text-[10px] text-muted-foreground ml-1">XP</span>
                </div>

                <div className="w-5 text-center">
                  {entry.trend === 'UP' && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                  {entry.trend === 'DOWN' && <TrendingDown className="w-4 h-4 text-rose-400" />}
                  {entry.trend === 'SAME' && <Minus className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

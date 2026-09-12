const fs = require('fs');
const path = require('path');

// 1. apps/web/src/pages/HomePage.tsx
const homePagePath = path.resolve(__dirname, '../apps/web/src/pages/HomePage.tsx');
let homeContent = fs.readFileSync(homePagePath, 'utf8');

if (!homeContent.includes('CrossDepartmentDiscovery')) {
  homeContent = homeContent.replace(
    "import { DailyQuestWidget } from '../components/DailyQuestWidget';",
    "import { DailyQuestWidget } from '../components/DailyQuestWidget';\nimport { CrossDepartmentDiscovery } from '../components/CrossDepartmentDiscovery';"
  );

  homeContent = homeContent.replace(
    "{/* Daily Challenge Widget */}",
    "{/* Cross Department Synergies */}\n      <CrossDepartmentDiscovery />\n\n      {/* Daily Challenge Widget */}"
  );

  fs.writeFileSync(homePagePath, homeContent, 'utf8');
  console.log('Integrated CrossDepartmentDiscovery into HomePage.tsx');
}

// 2. apps/web/src/components/LeaderboardTable.tsx
const lbTablePath = path.resolve(__dirname, '../apps/web/src/components/LeaderboardTable.tsx');
let lbTableContent = `
import React, { useState } from 'react';
import { Trophy, Medal, ArrowUp, ArrowDown, Minus, Sparkles, HelpCircle } from 'lucide-react';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Card } from './Card';
import { LevelBadge } from './LevelBadge';
import { StreakBadge } from './StreakBadge';
import { LeaderboardEntry } from '@vynk/types';
import { Link } from 'react-router-dom';
import { ScoreBreakdownModal } from './ScoreBreakdownModal';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export function LeaderboardTable({ entries }: LeaderboardTableProps) {
  const [selectedUser, setSelectedUser] = useState<{ id: string; username: string } | null>(null);

  if (entries.length === 0) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-border">
        No leaderboard rankings recorded for this scope yet. Ship Voyages & solve daily Quests to rank #1!
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const remaining = entries.slice(3);

  return (
    <div className="space-y-6">
      {/* Animated Top 3 Podium */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        {top3.map((entry, idx) => {
          const podiumOrder = idx === 0 ? 'sm:order-2 border-amber-500/50 bg-gradient-to-b from-amber-500/10 to-card' : idx === 1 ? 'sm:order-1 border-slate-400/40 bg-card' : 'sm:order-3 border-amber-700/40 bg-card';
          const medalColor = idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : 'text-amber-600';
          const medalLabel = idx === 0 ? '1st Place' : idx === 1 ? '2nd Place' : '3rd Place';

          return (
            <Card key={entry.user.id} className={\`p-4 text-center space-y-3 relative overflow-hidden flex flex-col justify-between \${podiumOrder}\`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={\`text-xs font-black \${medalColor} flex items-center gap-1\`}>
                    <Trophy className="w-3.5 h-3.5" />
                    <span>{medalLabel}</span>
                  </span>
                  <button
                    onClick={() => setSelectedUser({ id: entry.user.id, username: entry.user.username })}
                    title="Why this score?"
                    className="text-muted-foreground hover:text-amber-400 text-xs transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="relative inline-block mx-auto pt-1">
                  <Avatar src={entry.user.avatarUrl} fallback={entry.user.displayName} size="lg" className="ring-2 ring-amber-500/30" />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-foreground truncate">{entry.user.displayName}</h4>
                  <p className="text-[11px] text-muted-foreground font-mono">@{entry.user.username}</p>
                  <p className="text-[10px] text-indigo-400 font-semibold">{entry.user.department || entry.user.college}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                <LevelBadge level={entry.user.level || 1} size="sm" />
                <span className="font-mono text-xs font-bold text-amber-400">{entry.score} XP</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Ranks 4+ Table */}
      {remaining.length > 0 && (
        <Card className="overflow-hidden border-border/80">
          <div className="divide-y divide-border/60">
            {remaining.map((entry) => (
              <div
                key={entry.user.id}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 font-mono font-bold text-xs text-muted-foreground">
                    #{entry.rank}
                  </span>
                  <Avatar src={entry.user.avatarUrl} fallback={entry.user.displayName} size="sm" />
                  <div className="min-w-0">
                    <Link to={\`/profile/\${entry.user.username}\`} className="text-xs font-bold text-foreground hover:underline truncate block">
                      {entry.user.displayName}
                    </Link>
                    <span className="text-[11px] text-muted-foreground">{entry.user.department || entry.user.college}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <LevelBadge level={entry.user.level || 1} size="sm" />
                  <span className="font-mono text-xs font-bold text-indigo-400">{entry.score} XP</span>
                  <button
                    onClick={() => setSelectedUser({ id: entry.user.id, username: entry.user.username })}
                    title="View Score Breakdown"
                    className="text-muted-foreground hover:text-foreground text-xs cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Score Breakdown Modal */}
      {selectedUser && (
        <ScoreBreakdownModal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          userId={selectedUser.id}
          username={selectedUser.username}
        />
      )}
    </div>
  );
}
`;

fs.writeFileSync(lbTablePath, lbTableContent.trim() + '\n', 'utf8');
console.log('Updated LeaderboardTable.tsx with ScoreBreakdownModal');

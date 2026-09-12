const fs = require('fs');
const path = require('path');

// 1. Update apps/web/src/lib/api.ts
const apiPath = path.resolve(__dirname, '../apps/web/src/lib/api.ts');
let apiContent = fs.readFileSync(apiPath, 'utf8');

if (!apiContent.includes('getCrossDepartmentMatches')) {
  const extraApiMethods = `
  getCrossDepartmentMatches: async () => {
    return request<any>('/users/cross-department');
  },

  getRankExplanation: async (userId: string, scope = 'GLOBAL') => {
    return request<any>(\`/gamification/rank-explanation/\${userId}?scope=\${scope}\`);
  },

  getCampusSkillHeatmap: async (college?: string) => {
    return request<any>(\`/analytics/bigdata/campus-heatmap\${college ? \`?college=\${encodeURIComponent(college)}\` : ''}\`);
  },

  getDepartmentCollaboration: async () => {
    return request<any>('/analytics/bigdata/dept-collaboration');
  },
`;

  apiContent = apiContent.replace(
    'trackEvent: (eventName: string, metadata?: any) => {',
    extraApiMethods.trim() + '\n\n  trackEvent: (eventName: string, metadata?: any) => {'
  );

  fs.writeFileSync(apiPath, apiContent, 'utf8');
  console.log('Updated apps/web/src/lib/api.ts');
}

// 2. apps/web/src/components/CrossDepartmentDiscovery.tsx
const crossDeptCompPath = path.resolve(__dirname, '../apps/web/src/components/CrossDepartmentDiscovery.tsx');
const crossDeptCompContent = `
import React, { useState, useEffect } from 'react';
import { Sparkles, Users, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { Card } from './Card';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Button } from './Button';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

export function CrossDepartmentDiscovery() {
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getCrossDepartmentMatches()
      .then((data) => setMatches(data || []))
      .catch(() => setMatches([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 rounded-3xl bg-card border border-indigo-500/20 animate-pulse space-y-3">
        <div className="h-4 w-48 bg-muted/60 rounded" />
        <div className="h-20 w-full bg-muted/30 rounded-2xl" />
      </div>
    );
  }

  if (matches.length === 0) return null;

  return (
    <Card className="p-5 border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-card to-card space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">Cross-Department Synergies</h3>
            <p className="text-[11px] text-muted-foreground">Discover complementary builders outside your classroom</p>
          </div>
        </div>
        <Link to="/explore" className="text-xs font-bold text-indigo-400 hover:underline flex items-center gap-1">
          <span>Explore All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {matches.slice(0, 4).map((match) => (
          <div
            key={match.user.id}
            className="p-3.5 rounded-2xl bg-card/60 border border-border/80 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar src={match.user.avatarUrl} fallback={match.user.displayName} size="md" isOnline={true} />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-foreground truncate">{match.user.displayName}</h4>
                  <p className="text-[10px] text-indigo-400 font-semibold">{match.department}</p>
                </div>
              </div>
              <Badge variant="accent" className="text-[9px] font-mono">
                {match.matchScore}% Match
              </Badge>
            </div>

            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
              {match.matchReason}
            </p>

            <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px]">
              <span className="text-muted-foreground truncate max-w-[140px]">
                {match.complementarySkills?.slice(0, 2).join(' • ') || 'Multidisciplinary'}
              </span>
              <Link to={\`/profile/\${match.user.username}\`}>
                <Button size="xs" variant="outline" className="text-[10px]">
                  View Profile
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
`;

// 3. apps/web/src/components/ScoreBreakdownModal.tsx
const scoreModalPath = path.resolve(__dirname, '../apps/web/src/components/ScoreBreakdownModal.tsx');
const scoreModalContent = `
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
        .then((res) => setData(res))
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
`;

fs.writeFileSync(crossDeptCompPath, crossDeptCompContent.trim() + '\n', 'utf8');
fs.writeFileSync(scoreModalPath, scoreModalContent.trim() + '\n', 'utf8');
console.log('Created CrossDepartmentDiscovery and ScoreBreakdownModal components');

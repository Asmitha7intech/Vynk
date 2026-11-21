import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Trophy, Shield, ArrowRight, Brain } from 'lucide-react';
import { Avatar } from './Avatar';
import { Pill } from './vynk/Pill';
import { ProgressRing } from './vynk/ProgressRing';
import { GlassPanel } from './vynk/GlassPanel';
import { api } from '../lib/api';
import { Crew, LeaderboardEntry } from '@vynk/types';

export function RightPanel() {
  const [smartMatches, setSmartMatches] = useState<any[]>([]);
  const [featuredCrew, setFeaturedCrew] = useState<Crew | null>(null);
  const [topRankers, setTopRankers] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    Promise.all([
      api.getCollaboratorsV2(3).catch(() => []),
      api.getCrews().catch(() => []),
      api.getLeaderboard('GLOBAL').catch(() => []),
    ]).then(([matches, crews, leaderboard]) => {
      if (matches && Array.isArray(matches) && matches.length > 0) {
        setSmartMatches(matches.slice(0, 3));
      }
      if (crews && crews.length > 0) setFeaturedCrew(crews[0]);
      if (leaderboard && leaderboard.length > 0) setTopRankers(leaderboard.slice(0, 3));
    });
  }, []);

  return (
    <aside className="hidden xl:block w-80 flex-shrink-0 h-[calc(100vh-61px)] sticky top-[61px] p-4 space-y-4 overflow-y-auto">
      {/* Smart Match AI Collaborators Preview */}
      <GlassPanel level="elevated" className="p-4 space-y-3 border-indigo-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Smart Matches
            </h3>
          </div>
          <Link to="/network" className="text-[11px] font-bold text-indigo-400 hover:underline inline-flex items-center gap-0.5">
            <span>Graph</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {smartMatches.length === 0 ? (
            <p className="text-[11px] text-muted-foreground/80 py-2">
              Analyzing campus skill graphs for matches...
            </p>
          ) : (
            smartMatches.map((match: any) => {
              const u = match.user;
              if (!u) return null;
              return (
                <Link
                  key={u.id}
                  to={`/profile/${u.username}`}
                  className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-indigo-500/30 transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar src={u.avatarUrl} fallback={u.displayName} size="sm" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-foreground truncate group-hover:text-indigo-300 transition-colors">
                        {u.displayName}
                      </h4>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {u.headline || u.department || 'Student Builder'}
                      </p>
                    </div>
                  </div>

                  <ProgressRing
                    value={match.matchScore || 85}
                    size={36}
                    strokeWidth={3}
                    variant={match.matchScore >= 80 ? 'indigo' : 'cyan'}
                  >
                    <span className="text-[9px] font-mono font-black text-foreground">
                      {match.matchScore || 85}
                    </span>
                  </ProgressRing>
                </Link>
              );
            })
          )}
        </div>
      </GlassPanel>

      {/* Featured Recruiting Crew */}
      {featuredCrew && (
        <GlassPanel level="elevated" className="p-4 space-y-2.5 border-sky-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Recruiting Crew
              </h3>
            </div>
            <Link to="/crews" className="text-[11px] font-bold text-sky-400 hover:underline">
              Browse
            </Link>
          </div>

          <div className="space-y-1">
            <div className="font-bold text-xs text-foreground">{featuredCrew.name}</div>
            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
              {featuredCrew.description}
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <Pill label={featuredCrew.category} variant="cyan" size="xs" />
            <span className="text-[10px] text-muted-foreground font-mono">
              {featuredCrew.members?.length || 1}/{featuredCrew.maxMembers} Builders
            </span>
          </div>
        </GlassPanel>
      )}

      {/* Global Podium Preview */}
      {topRankers.length > 0 && (
        <GlassPanel level="elevated" className="p-4 space-y-2.5 border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Campus Top Rankers
              </h3>
            </div>
            <Link to="/leaderboard" className="text-[11px] font-bold text-amber-400 hover:underline">
              Ranks
            </Link>
          </div>

          <div className="space-y-1.5">
            {topRankers.filter((entry) => !!entry?.user).map((entry, index) => (
              <div
                key={entry.user?.id || `rank-${index}`}
                className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-4 font-mono font-black text-amber-400 text-xs text-center shrink-0">
                    #{index + 1}
                  </span>
                  <Avatar src={entry.user?.avatarUrl} fallback={entry.user?.displayName || 'Student'} size="xs" />
                  <span className="text-xs font-semibold text-foreground truncate">
                    {entry.user?.displayName || 'Campus Builder'}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-bold text-indigo-400 shrink-0">
                  {entry.score || 0} XP
                </span>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}
    </aside>
  );
}

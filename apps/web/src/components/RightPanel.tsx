import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Trophy, Users, Shield, ArrowRight, Flame } from 'lucide-react';
import { Card, CardHeader, CardContent } from './Card';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Button } from './Button';
import { api } from '../lib/api';
import { User, Crew, LeaderboardEntry } from '@vynk/types';

interface RightPanelProps {
  onOpenCreatePost?: () => void;
}

export function RightPanel({ onOpenCreatePost }: RightPanelProps = {}) {
  const [suggestedStudents, setSuggestedStudents] = useState<User[]>([]);
  const [featuredCrew, setFeaturedCrew] = useState<Crew | null>(null);
  const [topRankers, setTopRankers] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    Promise.all([
      api.searchUsers('').catch(() => []),
      api.getCrews().catch(() => []),
      api.getLeaderboard('GLOBAL').catch(() => []),
    ]).then(([users, crews, leaderboard]) => {
      if (users && users.length > 0) setSuggestedStudents(users.slice(0, 3));
      if (crews && crews.length > 0) setFeaturedCrew(crews[0]);
      if (leaderboard && leaderboard.length > 0) setTopRankers(leaderboard.slice(0, 3));
    });
  }, []);

  return (
    <aside className="hidden xl:block w-80 flex-shrink-0 h-[calc(100vh-61px)] sticky top-[61px] p-4 space-y-4 overflow-y-auto">
      {/* Complementary Teammates Suggestion */}
      <Card className="bg-card/50 border-indigo-500/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              You Might Vibe With
            </h3>
          </div>
          <Link to="/network" className="text-xs text-indigo-400 hover:underline">View all</Link>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {suggestedStudents.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">Discovering builders on your campus...</p>
          ) : (
            suggestedStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar src={student.avatarUrl} fallback={student.displayName} size="sm" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold truncate">{student.displayName}</h4>
                    <p className="text-[11px] text-muted-foreground truncate">{student.headline || student.department}</p>
                  </div>
                </div>
                <Link to={`/profile/${student.username}`}>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Featured Recruiting Crew */}
      {featuredCrew && (
        <Card className="bg-card/50 border-sky-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-400" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Recruiting Squad
              </h3>
            </div>
            <Link to="/crews" className="text-xs text-sky-400 hover:underline">Browse</Link>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <div className="font-bold text-xs text-foreground">{featuredCrew.name}</div>
            <p className="text-[11px] text-muted-foreground line-clamp-2">{featuredCrew.description}</p>
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="accent" className="text-[9px]">{featuredCrew.category}</Badge>
              <span className="text-[10px] text-muted-foreground font-mono">
                {featuredCrew.members?.length || 1}/{featuredCrew.maxMembers} Builders
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Global Podium Preview */}
      {topRankers.length > 0 && (
        <Card className="bg-card/50 border-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                Campus Top Builders
              </h3>
            </div>
            <Link to="/leaderboard" className="text-xs text-amber-400 hover:underline">Ranks</Link>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {topRankers.map((entry, index) => (
              <div key={entry.user.id} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-4 font-mono font-black text-amber-400 text-[11px]">#{index + 1}</span>
                  <span className="font-bold truncate">{entry.user.displayName}</span>
                </div>
                <span className="font-mono text-[11px] font-bold text-indigo-400">{entry.score} XP</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </aside>
  );
}

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
      .then((data: any) => setMatches(data || []))
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
              <Link to={`/profile/${match.user.username}`}>
                <Button size="sm" variant="outline" className="text-[10px]">
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

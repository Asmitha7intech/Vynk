import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Github,
  Linkedin,
  Globe,
  Sparkles,
  Layers,
  Shield,
  Trophy,
  Flame,
  Award,
  CheckCircle2,
  Calendar,
  Rocket,
  User as UserIcon
} from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card, CardHeader, CardContent } from '../components/Card';
import { XPProgressBar } from '../components/XPProgressBar';
import { LevelBadge } from '../components/LevelBadge';
import { StreakBadge } from '../components/StreakBadge';
import { VoyageCard } from '../components/VoyageCard';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuthStore();
  const [profileData, setProfileData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'VOYAGES' | 'SKILLS' | 'BOUNTIES'>('VOYAGES');
  const [isLoading, setIsLoading] = useState(true);

  const targetUsername = username || currentUser?.username || 'alexchen';

  useEffect(() => {
    setIsLoading(true);
    api.getUserProfile(targetUsername)
      .then((data) => {
        setProfileData(data);
      })
      .catch((err) => {
        console.error('Failed to load profile', err);
      })
      .finally(() => setIsLoading(false));

    api.trackEvent('profile_viewed', { targetUsername });
  }, [targetUsername]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
        Loading builder identity...
      </div>
    );
  }

  if (!profileData?.user) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-border">
        Student profile not found.
      </div>
    );
  }

  const { user, skills, interests, stats, bounties, voyages } = profileData;

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card className="overflow-hidden border-border/80">
        {/* Banner */}
        <div className="h-40 sm:h-48 w-full bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 relative">
          {user.bannerUrl && (
            <img src={user.bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-60" />
          )}
        </div>

        <div className="p-6 pt-0 relative space-y-4">
          {/* Avatar & Action row */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
            <div className="flex items-end gap-4">
              <Avatar
                src={user.avatarUrl}
                fallback={user.displayName}
                size="xl"
                className="ring-4 ring-card shadow-2xl"
                isOnline={true}
              />
              <div className="pb-1">
                <h1 className="text-xl sm:text-2xl font-black text-foreground">{user.displayName}</h1>
                <p className="text-xs text-muted-foreground font-mono">@{user.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LevelBadge level={user.level || 1} size="md" />
              <StreakBadge streakDays={user.streakDays || 1} />
            </div>
          </div>

          {/* Dynamic Profile Signals */}
          {(user.currentlyBuilding || user.lookingFor) && (
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-wrap items-center gap-4 text-xs">
              {user.currentlyBuilding && (
                <div className="flex items-center gap-1.5 text-indigo-300 font-medium">
                  <Rocket className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>Currently building: <strong>{user.currentlyBuilding}</strong></span>
                </div>
              )}
              {user.lookingFor && (
                <div className="flex items-center gap-1.5 text-sky-300 font-medium">
                  <Shield className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <span>Looking for: <strong>{user.lookingFor}</strong></span>
                </div>
              )}
            </div>
          )}

          {/* Bio & Headline */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-indigo-400">{user.headline || 'Student Builder'}</p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">{user.bio || 'Exploring new frontiers, hackathons, and collaborative builds.'}</p>
          </div>

          {/* Metadata & Social links */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="font-semibold text-foreground">{user.college} · {user.department}</span>
            <span>Class of {user.graduationYear || 2026}</span>
            {user.githubUrl && (
              <a href={user.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                <Github className="w-3.5 h-3.5" /> GitHub
              </a>
            )}
            {user.linkedinUrl && (
              <a href={user.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
              </a>
            )}
          </div>

          {/* XP Progression Bar */}
          <div className="pt-2">
            <XPProgressBar xp={user.xp || 0} level={user.level || 1} />
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-border/60 text-center">
            <div className="p-2.5 rounded-xl bg-muted/40">
              <div className="text-base font-black text-foreground">{stats?.vynksCount || 0}</div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Vynks</div>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/40">
              <div className="text-base font-black text-foreground">{stats?.voyagesCount || 0}</div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Voyages</div>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/40">
              <div className="text-base font-black text-foreground">{stats?.bountiesCount || 0}</div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Bounties</div>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/40">
              <div className="text-base font-black text-amber-400 font-mono">{user.reputationScore || 100}</div>
              <div className="text-[10px] uppercase font-bold text-muted-foreground">Reputation</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-3">
        {[
          { id: 'VOYAGES', label: `Voyages (${voyages?.length || 0})` },
          { id: 'SKILLS', label: `Verified Skills (${skills?.length || 0})` },
          { id: 'BOUNTIES', label: `Bounties (${bounties?.length || 0})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Voyages */}
      {activeTab === 'VOYAGES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!voyages || voyages.length === 0 ? (
            <div className="col-span-2 p-8 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-border">
              No voyages showcased yet.
            </div>
          ) : (
            voyages.map((voyage: any) => (
              <VoyageCard key={voyage.id} voyage={voyage} />
            ))
          )}
        </div>
      )}

      {/* Tab 2: Skills with Evidence */}
      {activeTab === 'SKILLS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {!skills || skills.length === 0 ? (
            <div className="col-span-2 p-8 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-border">
              No skills added yet.
            </div>
          ) : (
            skills.map((skill: any) => (
              <Card key={skill.id} className="p-4 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold">{skill.skillName}</h4>
                    {skill.isVerified && (
                      <span title="Verified with project evidence">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{skill.category} · {skill.yearsOfExperience} yrs exp</p>
                  {skill.evidenceUrl && (
                    <a
                      href={skill.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-indigo-400 hover:underline inline-block pt-1"
                    >
                      View Project Proof →
                    </a>
                  )}
                </div>
                <Badge variant="secondary" className="text-[10px]">{skill.proficiency}</Badge>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Bounties & Badges */}
      {activeTab === 'BOUNTIES' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {!bounties || bounties.length === 0 ? (
            <div className="col-span-4 p-8 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-border">
              No bounties unlocked yet. Solve daily quests and ship voyages to earn bounties.
            </div>
          ) : (
            bounties.map((bounty: any) => (
              <Card key={bounty.id} className="p-4 text-center space-y-2 border-indigo-500/20">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                  <Trophy className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold">{bounty.title}</h4>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{bounty.description}</p>
                <Badge variant="accent" className="text-[9px]">UNLOCKED</Badge>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

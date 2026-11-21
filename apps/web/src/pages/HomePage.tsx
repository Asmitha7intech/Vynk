import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  Shield,
  Flame,
  TrendingUp,
  Brain,
  ArrowRight,
  Compass,
  CheckCircle2,
  Users,
  Activity,
} from 'lucide-react';
import { FeedCard } from '../components/FeedCard';
import { DailyQuestWidget } from '../components/DailyQuestWidget';
import { OnboardingWizard } from '../components/OnboardingWizard';
import { VynkButton } from '../components/vynk/VynkButton';
import { Pill } from '../components/vynk/Pill';
import { ProgressRing } from '../components/vynk/ProgressRing';
import { ProgressBar } from '../components/vynk/ProgressBar';
import { AnimatedNumber } from '../components/vynk/AnimatedNumber';
import { Avatar } from '../components/Avatar';
import { GlowingEffect } from '../components/ui/glowing-effect';
import { api } from '../lib/api';
import { Post, DailyChallenge } from '@vynk/types';
import { useAuthStore } from '../stores/authStore';

export function HomePage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [trending, setTrending] = useState<any>(null);
  const [pulse, setPulse] = useState<any>(null);
  const [smartMatches, setSmartMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user && (!user.headline || !user.college)) {
      setShowOnboarding(true);
    }
  }, [user]);

  const loadFeedData = async () => {
    setIsLoading(true);
    try {
      const [feedData, questData, trendData, pulseData, matchData] = await Promise.all([
        api.getFeed().catch(() => []),
        api.getDailyChallenge().catch(() => null),
        api.getTrending().catch(() => null),
        api.getRealtimePulse().catch(() => null),
        api.getCollaboratorsV2(3).catch(() => []),
      ]);
      setPosts(feedData || []);
      if (questData?.challenge) setChallenge(questData.challenge);
      if (trendData) setTrending(trendData);
      if (pulseData) setPulse(pulseData);
      if (matchData && Array.isArray(matchData)) setSmartMatches(matchData.slice(0, 3));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeedData();
    api.trackEvent('home_feed_viewed');

    const handleNewPost = (e: any) => {
      if (e.detail) {
        setPosts((prev) => [e.detail, ...prev.filter((p) => p.id !== e.detail.id)]);
      }
    };
    window.addEventListener('vynk:post-created', handleNewPost);
    return () => window.removeEventListener('vynk:post-created', handleNewPost);
  }, []);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const nextLevelXp = Math.pow((user?.level || 1), 2) * 50;
  const currentLevelBaseXp = Math.pow((user?.level || 1) - 1, 2) * 50;
  const xpInCurrentLevel = (user?.xp || 0) - currentLevelBaseXp;
  const xpNeeded = Math.max(1, nextLevelXp - currentLevelBaseXp);
  const levelProgress = Math.min(100, Math.max(5, (xpInCurrentLevel / xpNeeded) * 100));

  return (
    <div className="space-y-6">
      {showOnboarding && <OnboardingWizard onComplete={() => setShowOnboarding(false)} />}

      {/* ── 1. Personalized Campus Welcome with Pointer-Reactive GlowingEffect ── */}
      <div className="relative rounded-3xl p-0.5">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <div className="p-6 sm:p-7 rounded-3xl bg-card backdrop-blur-2xl border border-border shadow-md relative overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Pill label="Campus Frontier 2026" variant="indigo" size="xs" />
                {user?.streakDays ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400">
                    <Flame className="w-3.5 h-3.5 fill-current" /> {user.streakDays}-day streak
                  </span>
                ) : null}
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-normal text-foreground">
                {getGreeting()}, {user?.displayName || 'Student Builder'}.
              </h1>

              <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
                Your campus network has active builders looking for teammates with complementary skills.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              <Link to="/network">
                <VynkButton size="sm" variant="primary" leftIcon={<Users className="w-3.5 h-3.5" />}>
                  People Sphere
                </VynkButton>
              </Link>
              <Link to="/crews">
                <VynkButton size="sm" variant="secondary" leftIcon={<Shield className="w-3.5 h-3.5" />}>
                  Build Squad
                </VynkButton>
              </Link>
              <Link to="/quests">
                <VynkButton size="sm" variant="glass" leftIcon={<Flame className="w-3.5 h-3.5 text-amber-400" />}>
                  Quests & XP
                </VynkButton>
              </Link>
            </div>
          </div>

          {/* Next Move Callout */}
          <div className="p-3.5 rounded-2xl bg-surface-elevated/80 border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-foreground">
                  Your Next Move: {challenge ? 'Solve Today\'s Quest' : 'Explore Collaborators'}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {challenge
                    ? `Complete "${challenge.title}" to earn +${challenge.xpAward || 25} XP and extend your streak.`
                    : 'Meet students across departments who complement your technical stack.'}
                </p>
              </div>
            </div>

            <Link to={challenge ? '/quests' : '/network'} className="shrink-0">
              <VynkButton size="xs" variant="outline" rightIcon={<ArrowRight className="w-3 h-3" />}>
                Take Action
              </VynkButton>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. VYNK Pulse Telemetry Ticker — Restricted exclusively to Administrator Accounts ── */}
      {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
        <Link to="/pulse" className="block group">
          <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-surface dark:bg-neutral-950/80 hover:bg-surface-elevated dark:hover:bg-neutral-900/90 border border-cyan-500/30 hover:border-cyan-400/60 shadow-sm transition-all">
            <div className="flex items-center gap-3 overflow-x-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
              <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400 whitespace-nowrap font-mono">
                Admin Console · VYNK Pulse Telemetry
              </span>
              <span className="text-[11px] text-foreground/90 font-mono whitespace-nowrap">
                <span className="text-amber-400 font-bold">
                  <AnimatedNumber value={pulse?.totalEvents || 0} />
                </span> events processed ·{' '}
                <span className="text-cyan-300 font-bold">
                  <AnimatedNumber value={pulse?.activeUsers || 0} />
                </span> active students
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 shrink-0 group-hover:translate-x-1 transition-transform">
              <span>Open Pulse Intelligence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </Link>
      )}

      {/* ── 3. Your Momentum (Progress Dashboard) ── */}
      {user && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-3xl glass-card space-y-2 text-center">
            <div className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Level Tier</div>
            <div className="text-2xl font-black text-indigo-400 font-mono">Lvl {user.level || 1}</div>
            <ProgressBar value={levelProgress} variant="indigo" size="sm" />
          </div>

          <div className="p-4 rounded-3xl glass-card space-y-2 text-center">
            <div className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Total XP</div>
            <div className="text-2xl font-black text-amber-400 font-mono">
              <AnimatedNumber value={user.xp || 0} />
            </div>
            <div className="text-[10px] text-muted-foreground">+{xpNeeded - xpInCurrentLevel} to Lvl {(user.level || 1) + 1}</div>
          </div>

          <div className="p-4 rounded-3xl glass-card space-y-2 text-center">
            <div className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Activity Streak</div>
            <div className="text-2xl font-black text-emerald-400 font-mono flex items-center justify-center gap-1">
              <Flame className="w-5 h-5 fill-current text-amber-400" />
              <span>{user.streakDays || 1}d</span>
            </div>
            <div className="text-[10px] text-muted-foreground">Daily Consistency</div>
          </div>

          <div className="p-4 rounded-3xl glass-card space-y-2 text-center">
            <div className="text-[10px] uppercase font-bold text-muted-foreground font-mono">Reputation</div>
            <div className="text-2xl font-black text-sky-400 font-mono">
              {user.reputationScore || 100}
            </div>
            <div className="text-[10px] text-muted-foreground">Verified Standing</div>
          </div>
        </div>
      )}

      {/* ── 4. People You Should Meet (Smart Match AI Collaborators) ── */}
      <div className="p-5 rounded-3xl glass-panel border border-indigo-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              People You Should Meet (AI Smart Match)
            </h2>
          </div>
          <Link to="/network" className="text-xs font-bold text-indigo-400 hover:underline inline-flex items-center gap-1">
            <span>View All Matches</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {smartMatches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {smartMatches.map((match: any) => {
              const u = match.user;
              if (!u) return null;
              return (
                <div key={u.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar src={u.avatarUrl} fallback={u.displayName} size="sm" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-foreground truncate">{u.displayName}</h4>
                        <p className="text-[10px] text-muted-foreground truncate">{u.department || 'Student'}</p>
                      </div>
                    </div>
                    <ProgressRing value={match.matchScore || 85} size={38} strokeWidth={3} variant="indigo">
                      <span className="text-[10px] font-mono font-black">{match.matchScore || 85}</span>
                    </ProgressRing>
                  </div>

                  {match.factors && match.factors.length > 0 && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      💡 {match.factors[0]?.reason || 'High skill complementarity'}
                    </p>
                  )}

                  <Link to={`/profile/${u.username}`}>
                    <VynkButton size="xs" variant="outline" className="w-full">
                      View Profile
                    </VynkButton>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Add technical skills and interests to your profile to discover matching campus collaborators.
            </p>
            <Link to="/profile" className="inline-block">
              <VynkButton size="xs" variant="primary">
                Update Profile Skills
              </VynkButton>
            </Link>
          </div>
        )}
      </div>

      {/* ── 5. Daily Challenge Spotlight ── */}
      {challenge && <DailyQuestWidget challenge={challenge} />}

      {/* ── 6. Trending on Campus (Big Data Intelligence) ── */}
      {trending && (trending.skills?.length > 0 || trending.posts?.length > 0) && (
        <div className="p-5 rounded-3xl glass-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-400" />
              <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Trending on Campus
              </h2>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">Time-Decay Ranked</span>
          </div>

          {trending.skills?.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {trending.skills.slice(0, 8).map((s: any) => (
                <Pill
                  key={s.skillName}
                  label={`${s.skillName} ${s.userCount > 1 ? `×${s.userCount}` : ''}`}
                  variant="indigo"
                  size="sm"
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            {trending.crewCategories?.length > 0 && (
              <span>
                🚀 <strong className="text-foreground">{trending.crewCategories.reduce((sum: number, c: any) => sum + (c.activeCrews || 0), 0)}</strong> active squads forming
              </span>
            )}
            {trending.voyages?.length > 0 && (
              <span>
                📦 <strong className="text-foreground">{trending.voyages.length}</strong> hot voyages
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── 7. Community Feed Stream ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Campus Builder Stream
            </h2>
          </div>
          <span className="text-[11px] text-muted-foreground">Live student code dispatches & launches</span>
        </div>

        {/* ── Feed Post Composer Box ── */}
        <div className="p-4 sm:p-5 rounded-3xl glass-card border border-white/10 hover:border-indigo-500/30 transition-all space-y-3">
          <div className="flex items-center gap-3">
            <Avatar src={user?.avatarUrl} fallback={user?.displayName || 'Me'} size="md" />
            <div
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('vynk:open-create-post'));
                }
              }}
              className="flex-1 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 hover:bg-white/[0.05] text-xs text-muted-foreground transition-all cursor-pointer flex items-center justify-between"
            >
              <span>Share a project dispatch, ask questions, or launch a voyage...</span>
              <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-xl border border-indigo-500/20 shrink-0 ml-2">
                + Create Post
              </span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-3xl glass-card animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-32 h-3 bg-white/5 rounded" />
                    <div className="w-48 h-2.5 bg-white/5 rounded" />
                  </div>
                </div>
                <div className="w-full h-16 bg-white/5 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center glass-card rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">No posts yet. Share your first idea with the campus.</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Share what you are building, launch a voyage, or request hackathon crew teammates.
              </p>
            </div>
            <div>
              <VynkButton
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('vynk:open-create-post'));
                  }
                }}
                variant="primary"
                size="sm"
              >
                + Create First Post
              </VynkButton>
            </div>
          </div>
        ) : (
          posts.map((post) => <FeedCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}

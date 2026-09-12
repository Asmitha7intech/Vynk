import React, { useEffect, useState } from 'react';
import { FeedCard } from '../components/FeedCard';
import { DailyQuestWidget } from '../components/DailyQuestWidget';
import { CrossDepartmentDiscovery } from '../components/CrossDepartmentDiscovery';
import { api } from '../lib/api';
import { Post, DailyChallenge } from '@vynk/types';
import { Sparkles, Layers, Shield, Rocket, Flame, MessageSquare, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { useAuthStore } from '../stores/authStore';
import { OnboardingWizard } from '../components/OnboardingWizard';

export function HomePage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
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
      const [feedData, questData] = await Promise.all([
        api.getFeed().catch(() => []),
        api.getDailyChallenge().catch(() => null),
      ]);
      setPosts(feedData || []);
      if (questData?.challenge) setChallenge(questData.challenge);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeedData();
    api.trackEvent('home_feed_viewed');
  }, []);

  return (
    <div className="space-y-6">
      {showOnboarding && <OnboardingWizard onComplete={() => setShowOnboarding(false)} />}

      {/* Hero Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-card border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-indigo-950/20">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider">
              Campus Frontier • 2026
            </span>
            {user?.streakDays ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400">
                <Flame className="w-3.5 h-3.5 fill-current" /> {user.streakDays}-day streak
              </span>
            ) : null}
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Find your people. Learn. Build. Rise.
          </h1>
          <p className="text-xs text-muted-foreground max-w-lg">
            Stop building in isolation. Discover cracked student builders, assemble complementary hackathon squads, and ship real voyages.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/crews">
            <Button size="sm" variant="secondary" className="text-xs">
              <Shield className="w-3.5 h-3.5" /> Build Your Squad
            </Button>
          </Link>
          <Link to="/voyages">
            <Button size="sm" variant="outline" className="text-xs">
              <Layers className="w-3.5 h-3.5" /> Start Something Dangerous 🚀
            </Button>
          </Link>
        </div>
      </div>

      {/* Daily Challenge Spotlight */}
      {challenge && <DailyQuestWidget challenge={challenge} />}

      {/* Community Feed Stream */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Community Feed</span>
          </h2>
          <span className="text-[11px] text-muted-foreground">Ranked by code velocity & build dispatches</span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 rounded-2xl bg-card border border-border/60 animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted/60" />
                  <div className="space-y-1.5">
                    <div className="w-24 h-3 bg-muted/60 rounded" />
                    <div className="w-36 h-2 bg-muted/40 rounded" />
                  </div>
                </div>
                <div className="w-full h-12 bg-muted/40 rounded-xl" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center bg-card rounded-2xl border border-border/60 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">The ecosystem feed is waiting for your build dispatches</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Share what you are currently coding, post a voyage milestone, or ask for hackathon collaborators.
            </p>
          </div>
        ) : (
          posts.map((post) => <FeedCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}

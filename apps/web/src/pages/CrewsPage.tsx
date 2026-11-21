import React, { useState, useEffect } from 'react';
import { Shield, Plus, Users, Sparkles, Target, Zap } from 'lucide-react';
import { CrewCard } from '../components/CrewCard';
import { CrewBuilderModal } from '../components/CrewBuilderModal';
import { VynkButton } from '../components/vynk/VynkButton';
import { Pill } from '../components/vynk/Pill';
import { EmptyState } from '../components/vynk/EmptyState';
import { api } from '../lib/api';
import { Crew } from '@vynk/types';

export function CrewsPage() {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchCrews = () => {
    setIsLoading(true);
    api.getCrews()
      .then((data) => {
        setCrews(data || []);
      })
      .catch(() => setCrews([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCrews();
    api.trackEvent('crews_page_viewed');
  }, []);

  const filteredCrews = selectedCategory === 'ALL'
    ? crews
    : crews.filter((c) => c.category.toLowerCase().includes(selectedCategory.toLowerCase()));

  const totalOpenSlots = crews.reduce((acc, c) => {
    const filled = c.members?.length || 1;
    return acc + Math.max(0, (c.maxMembers || 4) - filled);
  }, 0);

  return (
    <div className="space-y-6">
      {/* ── Hero Header ── */}
      <div className="p-6 sm:p-7 rounded-3xl glass-card space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Pill label="Hackathon & Startup Squads" variant="indigo" size="xs" />
              <span className="text-[11px] font-mono text-muted-foreground">
                {totalOpenSlots} builder slots open on campus
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-normal text-foreground">
              Hackathon Crews & Startup Squads
            </h1>
            <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
              Form complementary teams based on verified missing skill gaps, signed digital team agreements, and shared hackathon milestones.
            </p>
          </div>

          <VynkButton
            onClick={() => setIsBuilderOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            size="md"
          >
            Assemble New Crew
          </VynkButton>
        </div>

        {/* Squad Formation Protocol Pill Bar */}
        <div className="flex items-center gap-3 pt-2 text-[11px] text-muted-foreground flex-wrap border-t border-white/5">
          <span className="flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-indigo-400" /> Target Hackathon Aligned
          </span>
          <span className="opacity-40">•</span>
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-sky-400" /> Transparent Role Requirements
          </span>
          <span className="opacity-40">•</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Digital Team Agreement
          </span>
        </div>
      </div>

      {/* ── Domain Filters ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['ALL', 'Healthcare', 'AI & ML', 'Systems', 'Fintech', 'Open Source', 'Web3'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-indigo-600/15 border-indigo-500/30 text-indigo-300 font-bold shadow-sm'
                : 'bg-white/5 border-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Crew Cards Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 rounded-3xl glass-card animate-pulse space-y-4">
              <div className="h-4 w-32 bg-white/5 rounded" />
              <div className="h-3 w-full bg-white/5 rounded" />
              <div className="h-12 w-full bg-white/5 rounded-2xl" />
            </div>
          ))}
        </div>
      ) : filteredCrews.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No recruiting squads in this category yet"
          description="Be the first captain! Define your project mission, target hackathon, and list the exact missing roles you need to win."
          actionLabel="Assemble Crew"
          onAction={() => setIsBuilderOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCrews.map((crew) => (
            <CrewCard key={crew.id} crew={crew} />
          ))}
        </div>
      )}

      {/* ── Crew Builder Modal ── */}
      <CrewBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSuccess={fetchCrews}
      />
    </div>
  );
}

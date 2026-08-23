import React, { useState, useEffect } from 'react';
import { Shield, Plus, Sparkles, Filter, Users } from 'lucide-react';
import { CrewCard } from '../components/CrewCard';
import { Button } from '../components/Button';
import { CrewBuilderModal } from '../components/CrewBuilderModal';
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

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-card to-card border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider">
              Hackathon & Startup Squads
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Build Your Squad</h1>
          <p className="text-xs text-muted-foreground max-w-lg">
            Form complementary teams based on verified missing skill gaps, signed Team Agreements, and shared hackathon targets.
          </p>
        </div>

        <Button onClick={() => setIsBuilderOpen(true)} className="shadow-lg shadow-indigo-500/20">
          <Plus className="w-4 h-4" />
          <span>Assemble New Crew</span>
        </Button>
      </div>

      {/* Domain Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['ALL', 'Healthcare', 'AI & ML', 'Systems', 'Fintech', 'Open Source', 'Web3'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 font-bold'
                : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Crew Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-card border border-border/60 animate-pulse space-y-4">
              <div className="h-4 w-32 bg-muted/60 rounded" />
              <div className="h-3 w-full bg-muted/40 rounded" />
              <div className="h-10 w-full bg-muted/30 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredCrews.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-2xl border border-border space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">No recruiting crews in this category yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Be the first captain! Define your project mission, target hackathon, and list the exact missing roles you need.
          </p>
          <Button size="sm" onClick={() => setIsBuilderOpen(true)}>
            <Plus className="w-3.5 h-3.5" /> Assemble Crew
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCrews.map((crew) => (
            <CrewCard key={crew.id} crew={crew} />
          ))}
        </div>
      )}

      {/* Crew Builder Modal */}
      <CrewBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSuccess={fetchCrews}
      />
    </div>
  );
}

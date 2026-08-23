import React, { useState, useEffect } from 'react';
import { Layers, Plus, ExternalLink, Sparkles, Filter } from 'lucide-react';
import { VoyageCard } from '../components/VoyageCard';
import { Button } from '../components/Button';
import { CreateVoyageModal } from '../components/CreateVoyageModal';
import { api } from '../lib/api';
import { Voyage } from '@vynk/types';

export function VoyagesPage() {
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [category, setCategory] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchVoyages = () => {
    setIsLoading(true);
    api.getVoyages(category)
      .then((data) => {
        setVoyages(data || []);
      })
      .catch(() => setVoyages([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchVoyages();
    api.trackEvent('voyages_page_viewed', { category });
  }, [category]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-sky-950/60 via-card to-card border border-sky-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-black uppercase tracking-wider">
              Student Portfolios & Builds
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Voyages Gallery</h1>
          <p className="text-xs text-muted-foreground max-w-lg">
            Real projects built by real students. Inspect architectures, live deployments, code repositories, and milestone roadmaps.
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} variant="secondary" className="shadow-lg shadow-sky-500/20">
          <Plus className="w-4 h-4" />
          <span>Start Something Dangerous 🚀</span>
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['ALL', 'Healthcare', 'Audio', 'AI/ML', 'Security', 'Web3', 'Systems', 'Design'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
              category === cat
                ? 'bg-sky-500/10 border-sky-500 text-sky-400 font-bold'
                : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-card border border-border/60 animate-pulse space-y-3">
              <div className="h-4 w-32 bg-muted/60 rounded" />
              <div className="h-3 w-full bg-muted/40 rounded" />
            </div>
          ))}
        </div>
      ) : voyages.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-2xl border border-border space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 mx-auto flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">No voyages showcased in this category yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Have you built a project, MVP, or hackathon entry? Showcase your living Voyage on VYNK.
          </p>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-3.5 h-3.5" /> Showcase Voyage
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {voyages.map((voyage) => (
            <VoyageCard key={voyage.id} voyage={voyage} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateVoyageModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchVoyages}
      />
    </div>
  );
}

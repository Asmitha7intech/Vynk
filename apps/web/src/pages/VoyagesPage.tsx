import React, { useState, useEffect } from 'react';
import { Layers, Plus, Rocket, Sparkles, CheckCircle2 } from 'lucide-react';
import { VoyageCard } from '../components/VoyageCard';
import { CreateVoyageModal } from '../components/CreateVoyageModal';
import { VynkButton } from '../components/vynk/VynkButton';
import { Pill } from '../components/vynk/Pill';
import { EmptyState } from '../components/vynk/EmptyState';
import { api } from '../lib/api';
import { Voyage } from '@vynk/types';

export function VoyagesPage() {
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [category, setCategory] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVoyages = () => {
    setIsLoading(true);
    setError(null);
    api.getVoyages(category)
      .then((data) => {
        setVoyages(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to load voyages:', err);
        setError(err.message || 'Unable to load project voyages. Please check your connection and retry.');
        setVoyages([]);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchVoyages();
    api.trackEvent('voyages_page_viewed', { category }).catch(() => {});
  }, [category]);

  const VOYAGE_STAGES = [
    { label: 'Idea & Architecture', desc: 'Concept mapped' },
    { label: 'Squad Forming', desc: 'Crew assembled' },
    { label: 'Active Build', desc: 'Commits flowing' },
    { label: 'Testing & Polish', desc: 'Staging live' },
    { label: 'Shipped', desc: 'Public production' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Hero Header ── */}
      <div className="p-6 sm:p-7 rounded-3xl glass-card space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Pill label="Student Portfolios & Builds" variant="cyan" size="xs" />
              <span className="text-[11px] font-mono text-muted-foreground">
                {voyages.length} verified projects live
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Voyages Portfolio Gallery
            </h1>
            <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
              Living project showcases built by students. Inspect architectures, live demo deployments, code repositories, and milestone roadmaps.
            </p>
          </div>

          <VynkButton
            onClick={() => setIsCreateOpen(true)}
            variant="secondary"
            leftIcon={<Plus className="w-4 h-4" />}
            size="md"
          >
            Showcase Voyage (+250 XP)
          </VynkButton>
        </div>

        {/* Project Lifecycle Progression Visualizer */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <div className="text-[10px] font-mono uppercase font-bold text-muted-foreground">
            Voyage Lifecycle Progression
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {VOYAGE_STAGES.map((stage, i) => (
              <div
                key={stage.label}
                className="p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-2"
              >
                <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-foreground truncate">{stage.label}</div>
                  <div className="text-[9px] text-muted-foreground truncate">{stage.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Category Filters ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['ALL', 'Healthcare', 'Audio', 'AI/ML', 'Security', 'Web3', 'Systems', 'Design'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
              category === cat
                ? 'bg-sky-500/15 border-sky-500/30 text-sky-300 font-bold shadow-sm'
                : 'bg-white/5 border-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Grid / Loading / Error / Empty ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 rounded-3xl glass-card animate-pulse space-y-3">
              <div className="h-4 w-32 bg-white/5 rounded" />
              <div className="h-3 w-full bg-white/5 rounded" />
              <div className="h-24 w-full bg-white/5 rounded-2xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded-3xl glass-card border border-rose-500/30 text-center space-y-4 max-w-md mx-auto my-6">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Unable to Load Voyages</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
          </div>
          <VynkButton size="sm" variant="outline" onClick={fetchVoyages}>
            Retry Connection
          </VynkButton>
        </div>
      ) : voyages.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No voyages showcased in this category yet"
          description="Have you built an MVP, hackathon project, or research paper? Showcase your living Voyage on VYNK and earn +250 XP."
          actionLabel="Showcase Voyage"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {voyages.map((voyage) => (
            <VoyageCard key={voyage.id} voyage={voyage} />
          ))}
        </div>
      )}

      {/* ── Create Modal ── */}
      <CreateVoyageModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchVoyages}
      />
    </div>
  );
}

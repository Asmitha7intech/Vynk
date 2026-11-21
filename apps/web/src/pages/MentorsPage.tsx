import React, { useState, useEffect } from 'react';
import { GraduationCap, Sparkles, Users, Award, Shield } from 'lucide-react';
import { MentorCard } from '../components/MentorCard';
import { Pill } from '../components/vynk/Pill';
import { EmptyState } from '../components/vynk/EmptyState';
import { api } from '../lib/api';
import { MentorProfile } from '@vynk/types';

export function MentorsPage() {
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [domain, setDomain] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.getMentors(domain)
      .then((data) => {
        setMentors(data || []);
      })
      .catch(() => setMentors([]))
      .finally(() => setIsLoading(false));

    api.trackEvent('mentors_page_viewed', { domain });
  }, [domain]);

  return (
    <div className="space-y-6">
      {/* ── Hero Header ── */}
      <div className="p-6 sm:p-7 rounded-3xl glass-card space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Pill label="Goal-Driven Guidance" variant="emerald" size="xs" />
              <span className="text-[11px] font-mono text-muted-foreground">
                {mentors.length} verified technical mentors
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-normal text-foreground">
              Verified Technical Mentors
            </h1>
            <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
              Connect with alumni, staff engineers, and startup founders for structured architecture advice, code reviews, and career direction.
            </p>
          </div>
        </div>

        {/* Mentorship Ethos Strip */}
        <div className="pt-2 border-t border-white/5 flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5 font-semibold text-foreground">
            <Award className="w-3.5 h-3.5 text-emerald-400" /> Focus Areas:
          </span>
          <span>🧠 Multimodal & AI Model Quantization</span>
          <span className="opacity-40">•</span>
          <span>⚡ Distributed Systems & High-Throughput APIs</span>
          <span className="opacity-40">•</span>
          <span>🎨 Design Systems & Developer UX</span>
        </div>
      </div>

      {/* ── Domain Filters ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['ALL', 'AI/ML', 'Startups & MVPs', 'Computer Vision', 'Full-Stack Scalability', 'System Design', 'Cybersecurity'].map((d) => (
          <button
            key={d}
            onClick={() => setDomain(d)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
              domain === d
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-bold shadow-sm'
                : 'bg-white/5 border-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* ── Mentor Cards Grid ── */}
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
      ) : mentors.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No mentors in this technical domain yet"
          description="Experienced engineers and startup founders join regularly. Check other domains or apply as a student mentor."
          actionLabel="View All Mentors"
          onAction={() => setDomain('ALL')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mentors.map((mentor) => (
            <MentorCard key={mentor.id} mentor={mentor} />
          ))}
        </div>
      )}
    </div>
  );
}

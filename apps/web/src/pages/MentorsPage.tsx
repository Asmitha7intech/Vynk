import React, { useState, useEffect } from 'react';
import { GraduationCap, Sparkles, Filter, Users } from 'lucide-react';
import { MentorCard } from '../components/MentorCard';
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
      {/* Hero */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-card to-card border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
              Goal-Driven Student Guidance
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Verified Technical Mentors</h1>
          <p className="text-xs text-muted-foreground max-w-lg">
            Connect with verified alumni, staff engineers, and startup founders for concrete technical reviews, architecture advice, and career guidance.
          </p>
        </div>
      </div>

      {/* Domain Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['ALL', 'AI/ML', 'Startups & MVPs', 'Computer Vision', 'Full-Stack Scalability', 'System Design', 'Cybersecurity'].map((d) => (
          <button
            key={d}
            onClick={() => setDomain(d)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
              domain === d
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Mentor Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-card border border-border/60 animate-pulse space-y-3">
              <div className="h-4 w-32 bg-muted/60 rounded" />
              <div className="h-3 w-full bg-muted/40 rounded" />
            </div>
          ))}
        </div>
      ) : mentors.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-2xl border border-border space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">No mentors in this technical domain yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Experienced engineers and researchers join regularly. Check other domains or apply as a student mentor.
          </p>
        </div>
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

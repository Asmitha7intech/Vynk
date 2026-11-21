import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';
import { Pill } from '../components/vynk/Pill';
import { VynkButton } from '../components/vynk/VynkButton';
import { EmptyState } from '../components/vynk/EmptyState';
import { api } from '../lib/api';
import { EventItem } from '@vynk/types';

export function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.getEvents()
      .then((data) => setEvents(data || []))
      .catch(() => setEvents([]))
      .finally(() => setIsLoading(false));

    api.trackEvent('events_page_viewed');
  }, []);

  const handleRegister = async (eventId: string) => {
    try {
      await api.registerForEvent(eventId);
      setEvents(events.map(e => e.id === eventId ? { ...e, isRegisteredByMe: true, registrationsCount: (e.registrationsCount || 0) + 1 } : e));
    } catch (err) {
      console.error('Registration failed', err);
    }
  };

  const filtered = filter === 'ALL'
    ? events
    : events.filter(e => e.category.toUpperCase() === filter);

  return (
    <div className="space-y-6">
      {/* ── Hero Header ── */}
      <div className="p-6 sm:p-7 rounded-3xl glass-card space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Pill label="Hackathons & Summits" variant="rose" size="xs" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-normal text-foreground">
              Campus Opportunities & Hackathons
            </h1>
            <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
              Discover verified hackathons, campus developer summits, engineering workshops, and startup demo days.
            </p>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['ALL', 'HACKATHON', 'WORKSHOP', 'MEETUP', 'COMPETITION'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
              filter === cat
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 font-bold shadow-sm'
                : 'bg-white/5 border-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Events Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 rounded-3xl glass-card animate-pulse space-y-3">
              <div className="h-4 w-32 bg-white/5 rounded" />
              <div className="h-3 w-full bg-white/5 rounded" />
              <div className="h-16 w-full bg-white/5 rounded-2xl" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No events found in this category"
          description="Check other event categories or create an official campus meetup dispatch."
          actionLabel="View All Opportunities"
          onAction={() => setFilter('ALL')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((event) => (
            <div
              key={event.id}
              className="p-5 rounded-3xl glass-card border-white/5 hover:border-rose-500/30 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Pill label={event.category} variant="rose" size="xs" />
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {new Date(event.startsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-base font-bold text-foreground">{event.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{event.description}</p>

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" /> {event.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-sky-400" /> {event.registrationsCount || 0} Registered
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <span className="text-[11px] text-muted-foreground">
                  By <strong>{event.organizer}</strong>
                </span>

                {event.isRegisteredByMe ? (
                  <Pill label="Registered ✓" variant="emerald" size="xs" />
                ) : (
                  <VynkButton
                    size="xs"
                    variant="outline"
                    onClick={() => handleRegister(event.id)}
                  >
                    Register Now
                  </VynkButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

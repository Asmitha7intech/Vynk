import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, ExternalLink, Sparkles, Plus } from 'lucide-react';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
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
      {/* Hero */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-950/50 via-card to-card border border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase tracking-wider">
              Hackathons & Campus Meetups
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Opportunities Arena</h1>
          <p className="text-xs text-muted-foreground max-w-lg">
            Discover verified hackathons, campus developer summits, engineering workshops, and startup demo days.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['ALL', 'HACKATHON', 'WORKSHOP', 'MEETUP', 'COMPETITION'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
              filter === cat
                ? 'bg-rose-500/10 border-rose-500 text-rose-400 font-bold'
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
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-2xl border border-border space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">No events found in this category</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Check other event categories or create an official campus meetup dispatch.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((event) => (
            <Card key={event.id} className="p-5 flex flex-col justify-between space-y-4 border-border/80 hover:border-rose-500/30 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="accent" className="text-[10px]">{event.category}</Badge>
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

              <div className="flex items-center justify-between pt-3 border-t border-border/60">
                <span className="text-[11px] text-muted-foreground">Organizer: <strong>{event.organizer}</strong></span>
                {event.isRegisteredByMe ? (
                  <Badge variant="default" className="text-[10px]">Registered ✓</Badge>
                ) : (
                  <Button size="sm" onClick={() => handleRegister(event.id)} className="text-xs">
                    Register Now
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

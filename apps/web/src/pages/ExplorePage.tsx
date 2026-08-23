import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Users, Layers, Shield, GraduationCap, Calendar, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { VoyageCard } from '../components/VoyageCard';
import { CrewCard } from '../components/CrewCard';
import { MentorCard } from '../components/MentorCard';
import { Voyage, Crew, MentorProfile, User, EventItem } from '@vynk/types';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';

export function ExplorePage() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'ALL' | 'STUDENTS' | 'VOYAGES' | 'CREWS' | 'MENTORS' | 'EVENTS'>('ALL');

  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.getVoyages().catch(() => []),
      api.getCrews().catch(() => []),
      api.getMentors().catch(() => []),
      api.searchUsers(query).catch(() => []),
      api.getEvents().catch(() => []),
    ]).then(([v, c, m, s, e]) => {
      setVoyages(v || []);
      setCrews(c || []);
      setMentors(m || []);
      setStudents(s || []);
      setEvents(e || []);
    }).finally(() => setIsLoading(false));
  }, [query]);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-3">
        <h1 className="text-2xl font-black tracking-tight">Explore the Ecosystem</h1>
        <p className="text-xs text-muted-foreground">
          What is happening across campuses? Find people you might actually vibe with.
        </p>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by student name, tech stack, open crew role, hackathon, or mentor..."
            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-2xl text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-foreground"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'ALL', label: 'All Results' },
          { id: 'STUDENTS', label: 'Students' },
          { id: 'VOYAGES', label: 'Voyages (Projects)' },
          { id: 'CREWS', label: 'Crews (Teams)' },
          { id: 'MENTORS', label: 'Mentors' },
          { id: 'EVENTS', label: 'Hackathons & Events' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-muted/40 border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Results Section */}
      <div className="space-y-8">
        {(activeTab === 'ALL' || activeTab === 'STUDENTS') && (
          <section className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Students & Builders</span>
            </h2>
            {students.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl">
                No students matched the query yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between gap-3 hover:border-indigo-500/40 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={student.avatarUrl} fallback={student.displayName} size="md" />
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold truncate">{student.displayName}</h4>
                        <p className="text-xs text-muted-foreground truncate">{student.headline || 'Student Builder'}</p>
                        <span className="text-[11px] text-indigo-400 font-semibold">{student.college}</span>
                      </div>
                    </div>
                    <Link to={`/profile/${student.username}`}>
                      <Button variant="outline" size="sm" className="text-xs flex-shrink-0">
                        Profile
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {(activeTab === 'ALL' || activeTab === 'VOYAGES') && (
          <section className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Voyages (Projects)</span>
            </h2>
            {voyages.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl">
                No voyages found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {voyages.map((voyage) => (
                  <VoyageCard key={voyage.id} voyage={voyage} />
                ))}
              </div>
            )}
          </section>
        )}

        {(activeTab === 'ALL' || activeTab === 'CREWS') && (
          <section className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Crews (Recruiting Teams)</span>
            </h2>
            {crews.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl">
                No recruiting crews found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {crews.map((crew) => (
                  <CrewCard key={crew.id} crew={crew} />
                ))}
              </div>
            )}
          </section>
        )}

        {(activeTab === 'ALL' || activeTab === 'MENTORS') && (
          <section className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              <span>Verified Mentors</span>
            </h2>
            {mentors.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl">
                No mentors found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mentors.map((mentor) => (
                  <MentorCard key={mentor.id} mentor={mentor} />
                ))}
              </div>
            )}
          </section>
        )}

        {(activeTab === 'ALL' || activeTab === 'EVENTS') && (
          <section className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-400" />
              <span>Hackathons & Campus Events</span>
            </h2>
            {events.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl">
                No upcoming events listed at the moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {events.map((event) => (
                  <div key={event.id} className="p-4 rounded-2xl bg-card border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="accent" className="text-[10px]">{event.category}</Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">{new Date(event.startsAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-sm font-bold">{event.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-[11px] text-muted-foreground">{event.location}</span>
                      <Button size="sm" variant="outline" className="text-xs">Register</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

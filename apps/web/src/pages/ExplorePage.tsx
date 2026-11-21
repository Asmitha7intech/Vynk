import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Compass,
  Users,
  Layers,
  Shield,
  GraduationCap,
  Calendar,
  Sparkles,
  Globe2,
  LayoutGrid,
} from 'lucide-react';
import { api } from '../lib/api';
import { Avatar } from '../components/Avatar';
import { VoyageCard } from '../components/VoyageCard';
import { CrewCard } from '../components/CrewCard';
import { MentorCard } from '../components/MentorCard';
import { SearchInput } from '../components/vynk/SearchInput';
import { Pill } from '../components/vynk/Pill';
import { VynkButton } from '../components/vynk/VynkButton';
import { EmptyState } from '../components/vynk/EmptyState';
import { SphereImageGrid, SphereStudentItem } from '../components/ui/img-sphere';
import { Voyage, Crew, MentorProfile, User, EventItem } from '@vynk/types';
import { Link } from 'react-router-dom';

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'ALL' | 'STUDENTS' | 'VOYAGES' | 'CREWS' | 'MENTORS' | 'EVENTS'>('ALL');
  const [builderViewMode, setBuilderViewMode] = useState<'SPHERE' | 'GRID'>('SPHERE');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Adapt students list for 3D People Sphere
  const sphereStudents: SphereStudentItem[] = React.useMemo(() => {
    return students.map((s) => ({
      id: s.id,
      username: s.username,
      displayName: s.displayName,
      avatarUrl: s.avatarUrl || undefined,
      headline: s.headline,
      college: s.college,
      department: s.department,
      skills: (s as any).skills?.map((sk: any) => typeof sk === 'string' ? sk : sk.name) || [],
      xp: s.xp,
      level: s.level,
      streakDays: s.streakDays,
      raw: s,
    }));
  }, [students]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.getVoyages().catch(() => []),
      api.getCrews().catch(() => []),
      api.getMentors().catch(() => []),
      api.searchUsers(query).catch(() => []),
      api.getEvents().catch(() => []),
    ])
      .then(([v, c, m, s, e]) => {
        setVoyages(v || []);
        setCrews(c || []);
        setMentors(m || []);
        setStudents(s || []);
        setEvents(e || []);
      })
      .finally(() => setIsLoading(false));
  }, [query]);

  const handleSearchChange = (newQuery: string) => {
    setQuery(newQuery);
    if (newQuery) {
      setSearchParams({ q: newQuery });
    } else {
      setSearchParams({});
    }
  };

  const TAGS = ['AI/ML', 'React', 'TypeScript', 'Python', 'Systems', 'Design', 'Distributed'];

  const filteredVoyages = selectedTag
    ? voyages.filter((v) => v.technologies?.some((t) => t.toLowerCase().includes(selectedTag.toLowerCase())))
    : voyages;

  const filteredCrews = selectedTag
    ? crews.filter((c) => c.category?.toLowerCase().includes(selectedTag.toLowerCase()))
    : crews;

  const tabs = [
    { id: 'ALL', label: 'All Results', count: students.length + voyages.length + crews.length + mentors.length + events.length },
    { id: 'STUDENTS', label: 'Builders', count: students.length, icon: Users },
    { id: 'VOYAGES', label: 'Voyages', count: filteredVoyages.length, icon: Layers },
    { id: 'CREWS', label: 'Crews', count: filteredCrews.length, icon: Shield },
    { id: 'MENTORS', label: 'Mentors', count: mentors.length, icon: GraduationCap },
    { id: 'EVENTS', label: 'Hacks & Events', count: events.length, icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      {/* ── Search & Discovery Header ── */}
      <div className="p-6 sm:p-7 rounded-3xl glass-card space-y-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Pill label="Campus Discovery Engine" variant="indigo" size="xs" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Explore the Student Ecosystem
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
            Discover cracked student builders, open hackathon squads, production voyages, and mentors across universities.
          </p>
        </div>

        {/* Global Search Bar */}
        <SearchInput
          value={query}
          onChange={handleSearchChange}
          onClear={() => handleSearchChange('')}
          placeholder="Search by student name, skill, technology stack, crew squad, or hackathon..."
        />

        {/* Quick Filter Tags */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">Filter:</span>
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                selectedTag === tag
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                  : 'bg-white/5 text-muted-foreground border-white/5 hover:border-white/20'
              }`}
            >
              {tag}
            </button>
          ))}
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="text-[11px] font-bold text-indigo-400 hover:underline cursor-pointer whitespace-nowrap"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* ── Category Tabs ── */}
      <div className="flex gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/25 shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            {'icon' in tab && tab.icon && <tab.icon className="w-3.5 h-3.5 shrink-0" />}
            <span>{tab.label}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/5 text-[10px] font-mono opacity-70">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Content Sections ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 rounded-3xl glass-card animate-pulse space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/5" />
              <div className="w-32 h-4 bg-white/5 rounded" />
              <div className="w-48 h-3 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* STUDENTS / BUILDERS */}
          {(activeTab === 'ALL' || activeTab === 'STUDENTS') && students.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Students & Builders ({students.length})
                  </h2>
                </div>

                {/* View Mode Toggle when in Builders tab */}
                {activeTab === 'STUDENTS' && (
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 shrink-0">
                    <button
                      onClick={() => setBuilderViewMode('SPHERE')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        builderViewMode === 'SPHERE'
                          ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                          : 'text-muted-foreground hover:text-white'
                      }`}
                    >
                      <Globe2 className="w-3.5 h-3.5" />
                      <span>3D Sphere</span>
                    </button>
                    <button
                      onClick={() => setBuilderViewMode('GRID')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        builderViewMode === 'GRID'
                          ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                          : 'text-muted-foreground hover:text-white'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Cards Grid</span>
                    </button>
                  </div>
                )}
              </div>

              {activeTab === 'STUDENTS' && builderViewMode === 'SPHERE' ? (
                <div className="p-6 rounded-3xl glass-card border border-white/10 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
                  <SphereImageGrid
                    students={sphereStudents}
                    onConnect={(studentId) => api.sendVynkRequest(studentId)}
                    onSwitchToGrid={() => setBuilderViewMode('GRID')}
                    containerSize={520}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="p-4 rounded-3xl glass-card flex flex-col justify-between space-y-3 border-white/5 hover:border-indigo-500/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar src={student.avatarUrl} fallback={student.displayName} size="md" />
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-foreground truncate">{student.displayName}</h3>
                            <p className="text-xs text-muted-foreground truncate">{student.department || student.college}</p>
                          </div>
                        </div>
                        <Pill label={`${student.xp || 0} XP`} variant="indigo" size="xs" />
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {student.headline || 'Student builder & engineer.'}
                      </p>

                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-muted-foreground">
                          Lvl {student.level || 1} · {student.streakDays || 1}d streak
                        </span>
                        <Link to={`/profile/${student.username}`}>
                          <VynkButton size="xs" variant="outline">
                            View Profile
                          </VynkButton>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VOYAGES */}
          {(activeTab === 'ALL' || activeTab === 'VOYAGES') && filteredVoyages.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Voyages & Projects ({filteredVoyages.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredVoyages.map((v) => (
                  <VoyageCard key={v.id} voyage={v} />
                ))}
              </div>
            </div>
          )}

          {/* CREWS */}
          {(activeTab === 'ALL' || activeTab === 'CREWS') && filteredCrews.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-400" />
                <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Hackathon Crews ({filteredCrews.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredCrews.map((c) => (
                  <CrewCard key={c.id} crew={c} />
                ))}
              </div>
            </div>
          )}

          {/* MENTORS */}
          {(activeTab === 'ALL' || activeTab === 'MENTORS') && mentors.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Verified Mentors ({mentors.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mentors.map((m) => (
                  <MentorCard key={m.id} mentor={m} />
                ))}
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {students.length === 0 && filteredVoyages.length === 0 && filteredCrews.length === 0 && mentors.length === 0 && (
            <EmptyState
              icon={Sparkles}
              title="No results match your search"
              description={`We couldn't find any builders, voyages, or crews matching "${query}". Try searching for skills like React, Python, or AI.`}
              actionLabel="Clear Search"
              onAction={() => handleSearchChange('')}
            />
          )}
        </div>
      )}
    </div>
  );
}

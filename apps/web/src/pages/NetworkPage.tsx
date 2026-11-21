import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Check, 
  X, 
  Sparkles, 
  Brain, 
  Search, 
  Filter, 
  Globe2, 
  LayoutGrid, 
  Clock, 
  MessageSquare, 
  ExternalLink,
  GraduationCap,
  Building,
  Flame,
  ArrowUpDown,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { Pill } from '../components/vynk/Pill';
import { VynkButton } from '../components/vynk/VynkButton';
import { ProgressRing } from '../components/vynk/ProgressRing';
import { EmptyState } from '../components/vynk/EmptyState';
import { VynkNetworkGraph } from '../components/vynk/VynkNetworkGraph';
import { SphereImageGrid, SphereStudentItem } from '../components/ui/img-sphere';
import { VynkPeopleSphere, StudentUser } from '../components/vynk/VynkPeopleSphere';
import { SkillBadge } from '../components/vynk/SkillBadge';
import { api } from '../lib/api';
import { User } from '@vynk/types';

import { useAuthStore } from '../stores/authStore';

const FACTOR_ICONS: Record<string, string> = {
  SKILL_COMPLEMENTARITY: '🧠',
  SHARED_INTERESTS: '🎯',
  ENGAGEMENT: '🔥',
  CROSS_DEPARTMENT: '🌐',
  REPUTATION: '⭐',
};

const DEPARTMENTS = [
  'All Departments',
  'Computer Science',
  'AI & Data Science',
  'Electrical Engineering',
  'Product Design',
  'Mechanical Engineering',
];

const POPULAR_SKILLS = [
  'All Skills',
  'React',
  'TypeScript',
  'Python',
  'Machine Learning',
  'UI/UX',
  'Node.js',
  'Rust',
];

export function NetworkPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'DISCOVER' | 'SUGGESTED' | 'CONNECTIONS' | 'REQUESTS' | 'GRAPH'>('DISCOVER');
  const [viewMode, setViewMode] = useState<'SPHERE' | 'GRID'>('SPHERE');
  
  // Data states
  const [allStudents, setAllStudents] = useState<StudentUser[]>([]);
  const [connections, setConnections] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [smartMatches, setSmartMatches] = useState<any[]>([]);
  
  // Loading & feedback states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [smartLoading, setSmartLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedSkill, setSelectedSkill] = useState('All Skills');
  const [selectedAvailability, setSelectedAvailability] = useState<'ALL' | 'CREWS' | 'MENTORSHIP'>('ALL');
  const [sortBy, setSortBy] = useState<'RELEVANCE' | 'LEVEL' | 'STREAK' | 'NAME'>('RELEVANCE');

  const showToast = (message: string) => {
    setActionNotice(message);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleStartChat = async (studentId: string) => {
    try {
      const conv = await api.getDirectConversation(studentId);
      if (conv?.id) {
        navigate(`/messages?conversationId=${conv.id}`);
      } else {
        navigate('/messages');
      }
    } catch (err: any) {
      showToast(err.message || 'Could not start conversation. Ensure you are connected.');
    }
  };

  const fetchNetworkData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [conn, incoming, outgoing, usersList] = await Promise.all([
        api.getConnections().catch(() => []),
        api.getPendingRequests().catch(() => []),
        api.getOutgoingRequests().catch(() => []),
        api.searchUsers('').catch((err) => {
          console.error('Failed to search users:', err);
          return null;
        }),
      ]);

      if (usersList === null && (!conn || conn.length === 0)) {
        setError('Unable to load network directory. Please check backend connection.');
      }

      const currentUserId = user?.id;
      const normalizedConnections: User[] = (Array.isArray(conn) ? conn : []).map((item: any) => {
        if (item && item.username && item.displayName) return item;
        const targetUser = item?.senderId === currentUserId ? item.receiver : (item?.sender || item?.receiver || item);
        return {
          ...targetUser,
          connectionId: item?.id,
          id: targetUser?.id || item?.id || 'unknown',
          displayName: targetUser?.displayName || 'Campus Builder',
          username: targetUser?.username || 'builder',
          avatarUrl: targetUser?.avatarUrl || null,
          department: targetUser?.department,
          headline: targetUser?.headline,
          streakDays: targetUser?.streakDays || 0,
        };
      });

      setConnections(normalizedConnections);
      setPendingRequests(Array.isArray(incoming) ? incoming : []);
      setOutgoingRequests(Array.isArray(outgoing) ? outgoing : []);
      const rawList = Array.isArray(usersList) ? usersList : [];
      setAllStudents(rawList.filter((s: any) => s.id !== currentUserId));
    } catch (err: any) {
      console.error('Network data initialization error:', err);
      setError(err?.message || 'Failed to initialize campus network.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSmartMatches = async () => {
    setSmartLoading(true);
    try {
      const data = await api.getCollaboratorsV2(12).catch(() => []);
      setSmartMatches(Array.isArray(data) ? data : []);
    } finally {
      setSmartLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkData();
    api.trackEvent('network_page_viewed').catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'SUGGESTED' && smartMatches.length === 0) {
      fetchSmartMatches();
    }
  }, [activeTab]);

  // Derived sets for fast lookup
  const connectedUserIds = useMemo(() => {
    return new Set(connections.map((u) => u.id));
  }, [connections]);

  const pendingUserIds = useMemo(() => {
    const ids = new Set<string>();
    pendingRequests.forEach((req) => {
      if (req.sender?.id) ids.add(req.sender.id);
    });
    outgoingRequests.forEach((req) => {
      if (req.receiver?.id) ids.add(req.receiver.id);
      if (req.receiverId) ids.add(req.receiverId);
    });
    return ids;
  }, [pendingRequests, outgoingRequests]);

  const matchScoresMap = useMemo(() => {
    const map: Record<string, number> = {};
    smartMatches.forEach((m) => {
      if (m.user?.id && m.matchScore) {
        map[m.user.id] = m.matchScore;
      }
    });
    return map;
  }, [smartMatches]);

  // Filtered students for People Discovery (Sphere and Grid)
  const filteredStudents = useMemo(() => {
    return allStudents.filter((student) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = student.displayName?.toLowerCase().includes(q) || false;
        const matchesUsername = student.username?.toLowerCase().includes(q) || false;
        const matchesHeadline = student.headline?.toLowerCase().includes(q) || false;
        const matchesBio = student.bio?.toLowerCase().includes(q) || false;
        const matchesDept = student.department?.toLowerCase().includes(q) || false;
        const matchesCollege = student.college?.toLowerCase().includes(q) || false;
        const matchesSkills = student.skills?.some((s: any) => s.name?.toLowerCase().includes(q)) || false;

        if (!matchesName && !matchesUsername && !matchesHeadline && !matchesBio && !matchesDept && !matchesCollege && !matchesSkills) {
          return false;
        }
      }

      // 2. Department Filter
      if (selectedDept !== 'All Departments') {
        if (!student.department || !student.department.toLowerCase().includes(selectedDept.toLowerCase())) {
          return false;
        }
      }

      // 3. Skill Filter
      if (selectedSkill !== 'All Skills') {
        const hasSkill = student.skills?.some(
          (s: any) => s.name?.toLowerCase().includes(selectedSkill.toLowerCase())
        );
        if (!hasSkill) return false;
      }

      // 4. Availability Filter
      if (selectedAvailability === 'CREWS' && !student.isAvailableForCrews) return false;
      if (selectedAvailability === 'MENTORSHIP' && !student.isAvailableForMentorship) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'LEVEL') return (b.level || 0) - (a.level || 0);
      if (sortBy === 'STREAK') return (b.streakDays || 0) - (a.streakDays || 0);
      if (sortBy === 'NAME') return (a.displayName || '').localeCompare(b.displayName || '');
      // Default: RELEVANCE (score first, then XP)
      const scoreA = matchScoresMap[a.id] || (a.xp || 0);
      const scoreB = matchScoresMap[b.id] || (b.xp || 0);
      return scoreB - scoreA;
    });
  }, [allStudents, searchQuery, selectedDept, selectedSkill, selectedAvailability, sortBy, matchScoresMap]);

  // Adapt filtered students to SphereStudentItem format for 3D Sphere Component
  const sphereStudentItems: SphereStudentItem[] = useMemo(() => {
    return filteredStudents.map((s) => ({
      id: s.id,
      username: s.username,
      displayName: s.displayName,
      avatarUrl: s.avatarUrl || undefined,
      headline: s.headline,
      college: s.college,
      department: s.department,
      skills: s.skills?.map((sk: any) => typeof sk === 'string' ? sk : sk.name) || [],
      xp: s.xp,
      level: s.level,
      streakDays: s.streakDays,
      isConnected: connectedUserIds.has(s.id),
      isPending: pendingUserIds.has(s.id),
      matchScore: matchScoresMap[s.id],
      matchReason: matchScoresMap[s.id] ? `${matchScoresMap[s.id]}% Complementarity Match` : (s.department ? `${s.department} Builder` : undefined),
      raw: s,
    }));
  }, [filteredStudents, connectedUserIds, pendingUserIds, matchScoresMap]);

  // Actions
  const handleConnect = async (targetUserId: string) => {
    try {
      await api.sendVynkRequest(targetUserId);
      showToast('Connection request sent successfully!');
      fetchNetworkData();
    } catch (err: any) {
      showToast(err.message || 'Failed to send connection request');
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await api.acceptVynkRequest(requestId);
      showToast('Connection request accepted! You can now message each other.');
      fetchNetworkData();
    } catch (err: any) {
      showToast(err.message || 'Failed to accept request');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await api.rejectVynkRequest(requestId);
      showToast('Connection request declined.');
      fetchNetworkData();
    } catch (err: any) {
      showToast(err.message || 'Failed to decline request');
    }
  };

  const handleCancelOutgoing = async (requestId: string) => {
    try {
      await api.cancelVynkRequest(requestId);
      showToast('Outgoing connection request canceled.');
      fetchNetworkData();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel request');
    }
  };

  const handleSmartConnect = async (userId: string) => {
    try {
      await Promise.all([
        api.sendVynkRequest(userId).catch(() => {}),
        api.recordMatchFeedback({ targetId: userId, action: 'ACCEPT', recommendationType: 'COLLABORATOR' }).catch(() => {}),
      ]);
      showToast('Connection request sent to suggested builder!');
      setSmartMatches((prev) => prev.filter((m) => m.user?.id !== userId));
      fetchNetworkData();
    } catch (err: any) {
      showToast(err.message || 'Could not connect');
    }
  };

  const handleSmartPass = async (userId: string) => {
    try {
      await api.recordMatchFeedback({ targetId: userId, action: 'DISMISS', recommendationType: 'COLLABORATOR' }).catch(() => {});
      setSmartMatches((prev) => prev.filter((m) => m.user?.id !== userId));
      showToast('Recommendation dismissed. Algorithm updated.');
    } catch (err: any) {
      showToast(err.message || 'Could not dismiss match');
    }
  };

  const TABS = [
    { id: 'DISCOVER', label: `Discover People (${allStudents.length})` },
    { id: 'SUGGESTED', label: '✨ Suggested For You' },
    { id: 'CONNECTIONS', label: `My Vynks (${connections.length})` },
    { id: 'REQUESTS', label: `Requests (${pendingRequests.length + outgoingRequests.length})` },
    { id: 'GRAPH', label: '🌐 3D Graph' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Page Header ── */}
      <div className="p-6 sm:p-8 rounded-3xl glass-card relative overflow-hidden border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative space-y-2">
          <div className="flex items-center gap-2">
            <Pill label="Campus Social Graph" variant="indigo" size="xs" />
            <span className="text-[11px] text-muted-foreground/80 font-mono">
              Find your people. Learn. Build. Rise.
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              People & Collaborative Network
            </h1>
            <Link
              to="/communities"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition-colors shrink-0"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Campus Communities</span>
            </Link>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Discover ambitious students across computer science, engineering, and design. Form project squads, balance technical strengths, and unlock direct messaging once connected.
          </p>
        </div>
      </div>

      {/* ── Action Notice Toast ── */}
      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-200 text-xs flex items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-semibold">{actionNotice}</span>
          </div>
          <button 
            onClick={() => setActionNotice(null)}
            className="text-white/60 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Primary Navigation Tabs ── */}
      <div className="flex gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-md shadow-indigo-500/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════════════════
          TAB 1: DISCOVER PEOPLE (Hero 3D Sphere + Filterable Grid)
      ════════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'DISCOVER' && (
        <div className="space-y-6">
          {/* Controls & Filter Bar */}
          <div className="p-5 rounded-3xl glass-card border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by student name, skills (e.g. React), department, or bio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400/30 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View Switcher Toggle (3D Sphere vs Grid) */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 shrink-0">
                <button
                  onClick={() => setViewMode('SPHERE')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'SPHERE'
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                      : 'text-muted-foreground hover:text-white'
                  }`}
                  aria-label="3D Constellation Sphere View"
                >
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>3D Sphere</span>
                </button>
                <button
                  onClick={() => setViewMode('GRID')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'GRID'
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                      : 'text-muted-foreground hover:text-white'
                  }`}
                  aria-label="Grid Cards View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards Grid</span>
                </button>
              </div>
            </div>

            {/* Quick Filter Selectors */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5 text-xs">
              <span className="text-muted-foreground/60 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3 h-3" /> Filters:
              </span>

              {/* Department Dropdown */}
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-xs text-foreground focus:border-indigo-400 focus:outline-none cursor-pointer"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept} className="bg-surface text-foreground">
                    {dept}
                  </option>
                ))}
              </select>

              {/* Skill Dropdown */}
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-xs text-foreground focus:border-indigo-400 focus:outline-none cursor-pointer"
              >
                {POPULAR_SKILLS.map((sk) => (
                  <option key={sk} value={sk} className="bg-surface text-foreground">
                    {sk}
                  </option>
                ))}
              </select>

              {/* Availability Filter */}
              <div className="flex items-center gap-1 bg-surface-elevated p-0.5 rounded-lg border border-surface-border">
                <button
                  onClick={() => setSelectedAvailability('ALL')}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    selectedAvailability === 'ALL' ? 'bg-indigo-600/20 text-indigo-400 font-bold' : 'text-muted-foreground'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedAvailability('CREWS')}
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    selectedAvailability === 'CREWS' ? 'bg-indigo-600/20 text-indigo-400 font-bold' : 'text-muted-foreground'
                  }`}
                >
                  Crew Ready
                </button>
              </div>

              {/* Sort By Dropdown */}
              <div className="ml-auto flex items-center gap-1.5">
                <ArrowUpDown className="w-3 h-3 text-muted-foreground/60" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-xs text-foreground focus:border-indigo-400 focus:outline-none cursor-pointer"
                >
                  <option value="RELEVANCE" className="bg-surface text-foreground">Sort: Best Match</option>
                  <option value="LEVEL" className="bg-surface text-foreground">Sort: Level / XP</option>
                  <option value="STREAK" className="bg-surface text-foreground">Sort: Builder Streak</option>
                  <option value="NAME" className="bg-surface text-foreground">Sort: Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Filter Result Status */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span>
                Showing <strong className="text-white">{filteredStudents.length}</strong> of {allStudents.length} campus builders
              </span>
              {(searchQuery || selectedDept !== 'All Departments' || selectedSkill !== 'All Skills' || selectedAvailability !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDept('All Departments');
                    setSelectedSkill('All Skills');
                    setSelectedAvailability('ALL');
                  }}
                  className="text-indigo-400 hover:underline cursor-pointer font-semibold"
                >
                  Reset filters ↺
                </button>
              )}
            </div>
          </div>

          {/* ── Loading Skeleton / Error State / Views ── */}
          {isLoading ? (
            <div className="p-8 sm:p-12 rounded-3xl glass-card border border-white/10 flex flex-col items-center justify-center space-y-4 animate-pulse">
              <div className="w-48 h-48 rounded-full bg-white/5 border border-white/5" />
              <div className="h-4 w-48 bg-white/5 rounded" />
              <div className="h-3 w-64 bg-white/5 rounded" />
            </div>
          ) : error ? (
            <div className="p-8 rounded-3xl glass-card border border-rose-500/30 text-center space-y-4 max-w-md mx-auto my-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">Network Directory Offline</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
              </div>
              <VynkButton size="sm" variant="outline" onClick={fetchNetworkData}>
                Retry Loading
              </VynkButton>
            </div>
          ) : viewMode === 'SPHERE' ? (
            <div className="p-6 sm:p-10 rounded-3xl glass-card border border-white/10 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
              <div className="w-full flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Constellation 3D Sphere</span>
                    <Pill label="Interactive" variant="indigo" size="xs" />
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Rotate the sphere to discover builders. Click any profile to view details or connect.
                  </p>
                </div>
                <button
                  onClick={() => setViewMode('GRID')}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Switch to Grid View</span>
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>

              {allStudents.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No students found yet. Invite classmates to join VYNK."
                  description="Be the first to build your campus network."
                  actionLabel="Refresh Directory"
                  onAction={fetchNetworkData}
                />
              ) : filteredStudents.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No matching students found"
                  description="Try adjusting your search query or filters to find other builders."
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setSearchQuery('');
                    setSelectedDept('All Departments');
                    setSelectedSkill('All Skills');
                  }}
                />
              ) : (
                <SphereImageGrid
                  students={sphereStudentItems}
                  onConnect={handleConnect}
                  onSwitchToGrid={() => setViewMode('GRID')}
                  containerSize={520}
                />
              )}
            </div>
          ) : (
            <div>
              {/* ── View 2: Profile Discovery Cards Grid ── */}
              {allStudents.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No students found yet. Invite classmates to join VYNK."
                  description="Be the first to build your campus network."
                  actionLabel="Refresh Directory"
                  onAction={fetchNetworkData}
                />
              ) : filteredStudents.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No matching builders found"
                  description="Try adjusting your filter options or search terms."
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setSearchQuery('');
                    setSelectedDept('All Departments');
                    setSelectedSkill('All Skills');
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredStudents.map((student) => {
                    const isConnected = connectedUserIds.has(student.id);
                    const isPending = pendingUserIds.has(student.id);
                    const matchScore = matchScoresMap[student.id];

                    return (
                      <div
                        key={student.id}
                        className="p-5 rounded-3xl glass-card border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
                      >
                        {/* Match score ribbon */}
                        {matchScore !== undefined && matchScore >= 75 && (
                          <div className="absolute top-3 right-3">
                            <span className="px-2 py-0.5 rounded-full bg-indigo-600/25 border border-indigo-400/30 text-[10px] font-black font-mono text-indigo-300">
                              {matchScore}% Match
                            </span>
                          </div>
                        )}

                        {/* Top: Avatar & Meta */}
                        <div className="flex items-start gap-3.5">
                          <Avatar
                            src={student.avatarUrl}
                            fallback={student.displayName}
                            size="lg"
                            isOnline={isConnected}
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <Link
                              to={`/profile/${student.username}`}
                              className="text-sm font-bold text-foreground hover:text-indigo-400 transition-colors truncate block"
                            >
                              {student.displayName}
                            </Link>
                            <p className="text-xs text-indigo-300 font-medium truncate">
                              @{student.username}
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground pt-0.5">
                              {student.department && (
                                <Pill label={student.department} variant="neutral" size="xs" />
                              )}
                              {student.streakDays > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-amber-400 font-bold">
                                  <Flame className="w-3 h-3 fill-amber-400" />
                                  {student.streakDays}d
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Headline / Bio */}
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {student.headline || student.bio || 'Student builder & engineer on campus.'}
                        </p>

                        {/* Skills */}
                        {student.skills && student.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {student.skills.slice(0, 3).map((sk: any) => (
                              <SkillBadge
                                key={sk.id || sk.name}
                                name={sk.name}
                                proficiency={sk.proficiency || (typeof sk.level === 'string' ? sk.level : undefined)}
                                size="sm"
                              />
                            ))}
                            {student.skills.length > 3 && (
                              <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-white/5">
                                +{student.skills.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Card Actions */}
                        <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                          <Link
                            to={`/profile/${student.username}`}
                            className="flex-1"
                          >
                            <VynkButton size="xs" variant="outline" className="w-full">
                              View Profile
                            </VynkButton>
                          </Link>

                          {isConnected ? (
                            <VynkButton
                              size="xs"
                              variant="secondary"
                              className="flex-1"
                              leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                              onClick={() => handleStartChat(student.id)}
                            >
                              Chat
                            </VynkButton>
                          ) : isPending ? (
                            <button
                              disabled
                              className="flex-1 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-300 flex items-center justify-center gap-1 cursor-default"
                            >
                              <Clock className="w-3 h-3" />
                              Pending
                            </button>
                          ) : (
                            <VynkButton
                              size="xs"
                              variant="primary"
                              onClick={() => handleConnect(student.id)}
                              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                              className="flex-1"
                            >
                              Connect
                            </VynkButton>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════════
          TAB 2: SUGGESTED CONNECTIONS ("People You Should Meet" / AI Smart Match v2)
      ════════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'SUGGESTED' && (
        <div className="space-y-4">
          {/* Header Explanation Banner */}
          <div className="p-6 rounded-3xl glass-card border border-indigo-500/30 space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-black text-foreground">Suggested Connections · Smart Match v2</h2>
              <Pill label="Multi-Factor AI" variant="indigo" size="xs" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
              Calculated using skill complementarity (30%), shared project interests (20%), availability (15%), active streak (15%), and a +15% cross-department diversity bonus. Every Connect or Pass refines your personal recommendations.
            </p>
          </div>

          {smartLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 rounded-3xl glass-card animate-pulse flex gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/5 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="w-36 h-3 bg-white/5 rounded" />
                    <div className="w-48 h-2.5 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : smartMatches.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No smart matches available right now"
              description="Make sure your student profile has verified skills and interests filled out so our complementarity engine can find your optimal teammates."
              actionLabel="Refresh Recommendations"
              onAction={fetchSmartMatches}
            />
          ) : (
            <div className="space-y-3">
              {smartMatches.map((match: any) => {
                const u = match.user;
                if (!u) return null;
                return (
                  <div
                    key={u.id}
                    className="p-5 sm:p-6 rounded-3xl glass-card border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      {/* Match Score Ring */}
                      <ProgressRing
                        value={match.matchScore ?? 80}
                        size={60}
                        strokeWidth={4.5}
                        variant={match.matchScore >= 80 ? 'indigo' : 'cyan'}
                      >
                        <div className="text-center leading-none">
                          <span className="text-sm font-black font-mono text-foreground">{match.matchScore ?? 80}</span>
                          <span className="block text-[8px] font-bold text-muted-foreground uppercase">score</span>
                        </div>
                      </ProgressRing>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link to={`/profile/${u.username}`} className="text-sm font-bold text-foreground hover:underline truncate">
                            {u.displayName}
                          </Link>
                          <span className="text-xs text-muted-foreground">@{u.username}</span>
                          {match.department && (
                            <Pill label={match.department} variant="cyan" size="xs" />
                          )}
                          {u.college && (
                            <span className="text-[11px] text-muted-foreground/70">· {u.college}</span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {u.headline || 'Student builder & software collaborator.'}
                        </p>

                        {/* Factor pills */}
                        {match.factors && match.factors.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {match.factors
                              .filter((f: any) => f.score > 0)
                              .slice(0, 3)
                              .map((f: any) => (
                                <span
                                  key={f.factor}
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] text-muted-foreground"
                                >
                                  <span>{FACTOR_ICONS[f.factor] || '•'}</span>
                                  <span className="truncate max-w-[220px]">{f.reason}</span>
                                </span>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                      <VynkButton
                        size="sm"
                        onClick={() => handleSmartConnect(u.id)}
                        leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                        className="flex-1 sm:flex-initial"
                      >
                        Connect
                      </VynkButton>
                      <VynkButton
                        size="sm"
                        variant="outline"
                        onClick={() => handleSmartPass(u.id)}
                        leftIcon={<X className="w-3.5 h-3.5" />}
                        className="flex-1 sm:flex-initial"
                      >
                        Pass
                      </VynkButton>
                    </div>
                  </div>
                );
              })}

              <div className="pt-2 text-center">
                <button
                  onClick={fetchSmartMatches}
                  className="text-xs font-bold text-muted-foreground hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Refresh match pool ↻
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════════
          TAB 3: MY VYNKS (Accepted Mutual Connections)
      ════════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'CONNECTIONS' && (
        <div>
          {connections.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Your network is waiting for builders"
              description="Your conversations will appear here when you connect with people."
              actionLabel="Discover Builders"
              onAction={() => setActiveTab('DISCOVER')}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {connections.map((student) => (
                <div
                  key={student.id}
                  className="p-5 rounded-3xl glass-card flex items-center justify-between gap-3 border border-white/5 hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar src={student.avatarUrl} fallback={student.displayName} size="md" isOnline={true} />
                    <div className="min-w-0 space-y-0.5">
                      <Link to={`/profile/${student.username}`} className="text-sm font-bold text-foreground hover:underline truncate block">
                        {student.displayName}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">{student.headline || student.department}</p>
                      <span className="text-[11px] text-emerald-400 font-semibold block">● Connected</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <VynkButton
                      size="xs"
                      variant="secondary"
                      leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                      onClick={() => handleStartChat(student.id)}
                    >
                      Chat
                    </VynkButton>
                    <Link to={`/profile/${student.username}`}>
                      <VynkButton size="xs" variant="outline">
                        Profile
                      </VynkButton>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════════
          TAB 4: CONNECTION REQUESTS (Incoming & Outgoing Pending)
      ════════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'REQUESTS' && (
        <div className="space-y-6">
          {/* Section: Incoming Requests */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <span>Incoming Requests</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-600/20 text-indigo-300 text-xs font-mono font-bold">
                {pendingRequests.length}
              </span>
            </h3>

            {pendingRequests.length === 0 ? (
              <div className="p-6 rounded-2xl glass-card border border-white/5 text-center text-xs text-muted-foreground">
                No incoming connection requests at this time.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-3xl glass-card flex items-center justify-between gap-3 border border-white/5"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Avatar src={req.sender?.avatarUrl} fallback={req.sender?.displayName || 'Student'} size="md" />
                      <div className="min-w-0 space-y-0.5">
                        <Link to={`/profile/${req.sender?.username}`} className="text-sm font-bold text-foreground hover:underline truncate block">
                          {req.sender?.displayName}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate">
                          {req.sender?.college} · {req.sender?.department}
                        </p>
                        <span className="text-xs text-indigo-400 font-semibold">{req.sender?.headline}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <VynkButton
                        size="xs"
                        onClick={() => handleAccept(req.id)}
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                      >
                        Accept
                      </VynkButton>
                      <VynkButton
                        size="xs"
                        variant="outline"
                        onClick={() => handleReject(req.id)}
                        leftIcon={<X className="w-3.5 h-3.5" />}
                      >
                        Decline
                      </VynkButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Outgoing Sent Requests */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <span>Sent Pending Requests</span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-xs font-mono font-bold">
                {outgoingRequests.length}
              </span>
            </h3>

            {outgoingRequests.length === 0 ? (
              <div className="p-6 rounded-2xl glass-card border border-white/5 text-center text-xs text-muted-foreground">
                You have no pending outgoing requests.
              </div>
            ) : (
              <div className="space-y-3">
                {outgoingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-3xl glass-card flex items-center justify-between gap-3 border border-white/5"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Avatar src={req.receiver?.avatarUrl} fallback={req.receiver?.displayName || 'Student'} size="md" />
                      <div className="min-w-0 space-y-0.5">
                        <h4 className="text-sm font-bold text-foreground truncate">{req.receiver?.displayName}</h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {req.receiver?.department || req.receiver?.college || 'Student'}
                        </p>
                        <span className="text-[11px] text-amber-400 font-medium">Waiting for response...</span>
                      </div>
                    </div>
                    <VynkButton
                      size="xs"
                      variant="outline"
                      onClick={() => handleCancelOutgoing(req.id)}
                      leftIcon={<X className="w-3.5 h-3.5" />}
                    >
                      Cancel Request
                    </VynkButton>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════════
          TAB 5: 3D NETWORK GRAPH (Original Force-Directed Campus Constellation)
      ════════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'GRAPH' && (
        <VynkNetworkGraph />
      )}
    </div>
  );
}

export default NetworkPage;

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Layers,
  Github,
  ExternalLink,
  Heart,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  MessageSquare,
  AlertCircle,
  ArrowLeft,
  Share2,
  ListTodo,
  Activity,
  Check,
  X,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { Avatar } from '../components/Avatar';
import { Badge } from '../components/Badge';
import { VynkButton } from '../components/vynk/VynkButton';

export function VoyageDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  const [voyage, setVoyage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TEAM' | 'TASKS' | 'DISCUSSIONS' | 'ACTIVITY'>('OVERVIEW');
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  // Join Request Modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinRoleName, setJoinRoleName] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  const [joinSkills, setJoinSkills] = useState('');
  const [isSubmittingJoin, setIsSubmittingJoin] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  // New Task Modal / Form
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Discussion Input
  const [discussionContent, setDiscussionContent] = useState('');
  const [isPostingDiscussion, setIsPostingDiscussion] = useState(false);

  const loadVoyage = async () => {
    if (!id) return;
    try {
      const data = await api.getVoyage(id);
      setVoyage(data);
      setLikesCount(data.likesCount || 0);
    } catch (err) {
      console.error('Failed to load voyage', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVoyage();
  }, [id]);

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground animate-pulse glass-card rounded-3xl">
        Loading Voyage Workspace & Project Intel...
      </div>
    );
  }

  if (!voyage) {
    return (
      <div className="p-12 text-center glass-card rounded-3xl space-y-4">
        <h2 className="text-lg font-bold text-foreground">Voyage Not Found</h2>
        <p className="text-xs text-muted-foreground">The project workspace requested may have been archived or moved.</p>
        <Link to="/voyages">
          <VynkButton size="sm">Back to Voyages</VynkButton>
        </Link>
      </div>
    );
  }

  const isCreator = currentUser?.id === voyage.creatorId;
  const isMember = voyage.members?.some((m: any) => m.userId === currentUser?.id);
  const userJoinRequest = voyage.joinRequests?.find((r: any) => r.userId === currentUser?.id);
  const maxCapacity = voyage.teamCapacity || 6;
  const currentMembersCount = voyage.members?.length || 1;
  const isFull = currentMembersCount >= maxCapacity;

  const handleToggleLike = async () => {
    setIsLiked(!isLiked);
    setLikesCount((prev) => (!isLiked ? prev + 1 : prev - 1));
    await api.toggleVoyageLike(voyage.id).catch(() => {});
  };

  const handleSendJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/auth');
      return;
    }
    setIsSubmittingJoin(true);
    setJoinError('');
    setJoinSuccess('');

    try {
      const skillsArray = joinSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await api.createJoinRequest(voyage.id, {
        roleName: joinRoleName.trim(),
        message: joinMessage.trim(),
        skills: skillsArray,
      });

      setJoinSuccess('Application successfully submitted to the project lead!');
      setTimeout(() => {
        setShowJoinModal(false);
        setJoinSuccess('');
        loadVoyage();
      }, 1500);
    } catch (err: any) {
      setJoinError(err.message || 'Failed to submit application.');
    } finally {
      setIsSubmittingJoin(false);
    }
  };

  const handleReviewJoinRequest = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await api.respondToJoinRequest(voyage.id, requestId, status);
      await loadVoyage();
    } catch (err: any) {
      alert(err.message || 'Failed to update request');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setIsCreatingTask(true);
    try {
      await api.createVoyageTask(voyage.id, {
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        priority: taskPriority,
        dueDate: taskDueDate || null,
      });
      setTaskTitle('');
      setTaskDesc('');
      setShowTaskModal(false);
      await loadVoyage();
    } catch (err: any) {
      alert(err.message || 'Failed to create task');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await api.updateVoyageTask(voyage.id, taskId, { status: newStatus });
      await loadVoyage();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleToggleMilestone = async (milestoneId: string, currentVal: boolean) => {
    try {
      await api.updateVoyageMilestone(voyage.id, milestoneId, { isCompleted: !currentVal });
      await loadVoyage();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handlePostDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discussionContent.trim()) return;
    setIsPostingDiscussion(true);
    try {
      await api.createVoyageDiscussion(voyage.id, discussionContent.trim());
      setDiscussionContent('');
      await loadVoyage();
    } catch (err: any) {
      alert(err.message || 'Failed to post update');
    } finally {
      setIsPostingDiscussion(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/voyages"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Voyage Directory</span>
        </Link>
        <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
          Workspace ID: {voyage.id.slice(0, 8)}
        </span>
      </div>

      {/* Hero Workspace Banner */}
      <div className="rounded-3xl glass-card overflow-hidden border border-surface-border relative">
        {voyage.coverImageUrl ? (
          <div className="w-full h-56 sm:h-72 overflow-hidden relative">
            <img
              src={voyage.coverImageUrl}
              alt={voyage.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>
        ) : (
          <div className="w-full h-32 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-background border-b border-white/5" />
        )}

        <div className="p-6 sm:p-8 relative -mt-16 sm:-mt-20 z-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-mono text-xs font-semibold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  {voyage.category}
                </span>
                <Badge variant="accent" className="font-bold">
                  {voyage.status.replace('_', ' ')}
                </Badge>
                <div className="px-2.5 py-1 rounded-full bg-white/5 text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {currentMembersCount} / {maxCapacity} Team
                  </span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-normal leading-tight">
                {voyage.title}
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {voyage.tagline}
              </p>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleToggleLike}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  isLiked
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-surface-elevated text-muted-foreground hover:text-foreground border-surface-border'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likesCount}</span>
              </button>

              {voyage.githubUrl && (
                <a
                  href={voyage.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-surface-elevated text-muted-foreground hover:text-foreground border border-surface-border text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Github className="w-4 h-4" />
                  <span>Repository</span>
                </a>
              )}

              {voyage.demoUrl && (
                <a
                  href={voyage.demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-indigo-500/10 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Live App</span>
                </a>
              )}

              {!isCreator && !isMember && (
                <VynkButton
                  size="sm"
                  variant="primary"
                  leftIcon={<UserPlus className="w-4 h-4" />}
                  onClick={() => setShowJoinModal(true)}
                  disabled={isFull || userJoinRequest?.status === 'PENDING'}
                >
                  {userJoinRequest?.status === 'PENDING'
                    ? 'Application Pending'
                    : isFull
                    ? 'Team Full'
                    : 'Join Team'}
                </VynkButton>
              )}
            </div>
          </div>

          {/* Lead Builder Info Bar */}
          <div className="pt-4 border-t border-surface-border/50 flex items-center justify-between flex-wrap gap-4 text-xs">
            <Link
              to={`/profile/${voyage.creator.username}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Avatar src={voyage.creator.avatarUrl} fallback={voyage.creator.displayName} size="sm" />
              <div>
                <p className="font-bold text-foreground">{voyage.creator.displayName}</p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  Lead Architect · @{voyage.creator.username}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2 flex-wrap">
              {voyage.technologies.map((tech: string) => (
                <span
                  key={tech}
                  className="px-2.5 py-0.5 rounded-lg bg-surface-elevated border border-surface-border text-[11px] font-mono text-muted-foreground"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-border pb-3 overflow-x-auto">
        {[
          { key: 'OVERVIEW', label: 'Overview', icon: Layers },
          { key: 'TEAM', label: `Team & Requests (${currentMembersCount})`, icon: Users },
          { key: 'TASKS', label: `Tasks & Milestones (${voyage.tasks?.length || 0})`, icon: ListTodo },
          { key: 'DISCUSSIONS', label: `Discussions (${voyage.discussions?.length || 0})`, icon: MessageSquare },
          { key: 'ACTIVITY', label: 'Activity Feed', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-glow-indigo'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-3xl glass-card space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Project Overview
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {voyage.description}
              </p>
            </div>

            {voyage.screenshots && voyage.screenshots.length > 0 && (
              <div className="p-6 rounded-3xl glass-card space-y-4">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Screenshots & Deliverables
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {voyage.screenshots.map((shot: string, idx: number) => (
                    <div key={idx} className="rounded-2xl overflow-hidden border border-surface-border">
                      <img src={shot} alt={`Deliverable ${idx + 1}`} className="w-full h-40 object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-3xl glass-card space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Core Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {voyage.technologies.map((t: string) => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-mono font-semibold"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl glass-card space-y-3">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Collaboration Status
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Capacity:</span>
                  <span className="text-foreground font-semibold">
                    {currentMembersCount} of {maxCapacity} members
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Status:</span>
                  <span className="text-emerald-400 font-semibold">{voyage.status}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Showcase XP:</span>
                  <span className="text-indigo-400 font-semibold">+{voyage.xpRewarded} XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: TEAM & JOIN REQUESTS */}
      {activeTab === 'TEAM' && (
        <div className="space-y-6">
          {/* Creator Review Section for Pending Applications */}
          {isCreator && voyage.joinRequests && voyage.joinRequests.length > 0 && (
            <div className="p-6 rounded-3xl glass-card border border-indigo-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-foreground">
                    Pending Student Applications ({voyage.joinRequests.filter((r: any) => r.status === 'PENDING').length})
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Creator Review Console
                </span>
              </div>

              <div className="space-y-3">
                {voyage.joinRequests.map((req: any) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-surface-elevated/70 border border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar src={req.user?.avatarUrl} fallback={req.user?.displayName || 'Student'} size="md" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-foreground">{req.user?.displayName}</p>
                          <span className="text-[11px] text-muted-foreground font-mono">@{req.user?.username}</span>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 text-[10px] font-semibold">
                            {req.roleName}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{req.message}</p>
                        {req.skills && req.skills.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap pt-1">
                            {req.skills.map((s: string) => (
                              <span key={s} className="px-2 py-0.5 rounded bg-white/5 text-[10px] font-mono text-white/70">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {req.status === 'PENDING' ? (
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleReviewJoinRequest(req.id, 'ACCEPTED')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => handleReviewJoinRequest(req.id, 'REJECTED')}
                          className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                          req.status === 'ACCEPTED'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {req.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Active Team Members */}
          <div className="p-6 rounded-3xl glass-card space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Project Team ({currentMembersCount})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {voyage.members?.map((member: any) => (
                <div
                  key={member.id}
                  className="p-4 rounded-2xl bg-surface-elevated/70 border border-surface-border flex items-center gap-3.5"
                >
                  <Avatar src={member.user?.avatarUrl} fallback={member.user?.displayName || 'User'} size="md" />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/profile/${member.user?.username}`}
                      className="text-xs font-bold text-foreground hover:text-indigo-400 transition-colors truncate block"
                    >
                      {member.user?.displayName}
                    </Link>
                    <p className="text-[11px] text-indigo-400 font-semibold">{member.role}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{member.contributions || 'Team Collaborator'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: TASKS & MILESTONES */}
      {activeTab === 'TASKS' && (
        <div className="space-y-6">
          {/* Milestones Checklist */}
          {voyage.milestones && voyage.milestones.length > 0 && (
            <div className="p-6 rounded-3xl glass-card space-y-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Roadmap Milestones
              </h3>
              <div className="space-y-2.5">
                {voyage.milestones.map((m: any) => (
                  <div
                    key={m.id}
                    onClick={() => (isCreator || isMember) && handleToggleMilestone(m.id, m.isCompleted)}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      isCreator || isMember ? 'cursor-pointer hover:border-indigo-500/40' : ''
                    } ${
                      m.isCompleted
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-surface-elevated/50 border-surface-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                          m.isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-muted-foreground/40'
                        }`}
                      >
                        {m.isCompleted && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <p
                          className={`text-xs font-semibold ${
                            m.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {m.title}
                        </p>
                        {m.description && (
                          <p className="text-[11px] text-muted-foreground">{m.description}</p>
                        )}
                      </div>
                    </div>
                    {m.dueDate && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Due: {new Date(m.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kanban / Task Boards */}
          <div className="p-6 rounded-3xl glass-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Work Tasks
              </h3>
              {(isCreator || isMember) && (
                <VynkButton
                  size="xs"
                  variant="primary"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setShowTaskModal(true)}
                >
                  Create Task
                </VynkButton>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['TODO', 'IN_PROGRESS', 'COMPLETED'].map((statusKey) => {
                const tasksInStatus = (voyage.tasks || []).filter((t: any) => t.status === statusKey);
                return (
                  <div
                    key={statusKey}
                    className="p-4 rounded-2xl bg-surface-elevated/40 border border-surface-border space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <span>{statusKey.replace('_', ' ')}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/5 font-mono text-[10px]">
                        {tasksInStatus.length}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {tasksInStatus.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground/60 italic py-2">No tasks</p>
                      ) : (
                        tasksInStatus.map((t: any) => (
                          <div
                            key={t.id}
                            className="p-3 rounded-xl bg-surface-elevated border border-surface-border/70 space-y-2 text-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-foreground">{t.title}</p>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  t.priority === 'HIGH'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : t.priority === 'MEDIUM'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-zinc-800 text-zinc-400'
                                }`}
                              >
                                {t.priority}
                              </span>
                            </div>

                            {t.description && (
                              <p className="text-[11px] text-muted-foreground line-clamp-2">
                                {t.description}
                              </p>
                            )}

                            {(isCreator || isMember) && (
                              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-white/5 text-[10px]">
                                {statusKey !== 'TODO' && (
                                  <button
                                    onClick={() => handleTaskStatusChange(t.id, 'TODO')}
                                    className="text-muted-foreground hover:text-white cursor-pointer px-1 py-0.5"
                                  >
                                    To Todo
                                  </button>
                                )}
                                {statusKey !== 'IN_PROGRESS' && (
                                  <button
                                    onClick={() => handleTaskStatusChange(t.id, 'IN_PROGRESS')}
                                    className="text-indigo-400 hover:text-indigo-300 cursor-pointer px-1 py-0.5"
                                  >
                                    To Doing
                                  </button>
                                )}
                                {statusKey !== 'COMPLETED' && (
                                  <button
                                    onClick={() => handleTaskStatusChange(t.id, 'COMPLETED')}
                                    className="text-emerald-400 hover:text-emerald-300 cursor-pointer px-1 py-0.5"
                                  >
                                    To Done
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: DISCUSSIONS */}
      {activeTab === 'DISCUSSIONS' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl glass-card space-y-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Project Discussion Board
            </h3>

            {/* Post comment input */}
            <form onSubmit={handlePostDiscussion} className="space-y-2">
              <textarea
                rows={3}
                placeholder="Share a milestone update, architecture note, or question for the team..."
                value={discussionContent}
                onChange={(e) => setDiscussionContent(e.target.value)}
                className="w-full p-3 rounded-2xl bg-surface-elevated/70 border border-surface-border text-xs text-foreground placeholder:text-muted-foreground focus:border-indigo-400 focus:outline-none resize-none"
              />
              <div className="flex justify-end">
                <VynkButton
                  type="submit"
                  size="sm"
                  variant="primary"
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                  isLoading={isPostingDiscussion}
                >
                  Post Message
                </VynkButton>
              </div>
            </form>

            <div className="space-y-3 pt-3 border-t border-surface-border/50">
              {voyage.discussions && voyage.discussions.length > 0 ? (
                voyage.discussions.map((disc: any) => (
                  <div
                    key={disc.id}
                    className="p-4 rounded-2xl bg-surface-elevated/50 border border-surface-border/60 flex items-start gap-3"
                  >
                    <Avatar
                      src={disc.author?.avatarUrl}
                      fallback={disc.author?.displayName || 'User'}
                      size="sm"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          {disc.author?.displayName}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {new Date(disc.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {disc.content}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground/60 italic py-4 text-center">
                  No discussions yet. Post the first project dispatch above!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: ACTIVITY FEED */}
      {activeTab === 'ACTIVITY' && (
        <div className="p-6 rounded-3xl glass-card space-y-4">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Workspace Activity Log
          </h3>

          <div className="space-y-3">
            {voyage.activities && voyage.activities.length > 0 ? (
              voyage.activities.map((act: any) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-2xl bg-surface-elevated/40 border border-surface-border/50 flex items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <p className="text-foreground">
                        <span className="font-bold">{act.userName}</span> {act.details || act.action}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                    {new Date(act.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground/60 italic py-4 text-center">
                Workspace initialization completed.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Join Request Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0d1117] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => setShowJoinModal(false)}
              className="absolute top-5 right-5 text-white/50 hover:text-white p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Apply to Join Team</h3>
                <p className="text-xs text-white/60">Collaborate on {voyage.title}</p>
              </div>
            </div>

            {joinError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            {joinSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{joinSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSendJoinRequest} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-white/70">Role You Wish to Fill</label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Engineer, UI Designer, Backend Dev"
                  value={joinRoleName}
                  onChange={(e) => setJoinRoleName(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-white/70">Your Skills (comma separated)</label>
                <input
                  type="text"
                  placeholder="React, TypeScript, Tailwind, Node.js"
                  value={joinSkills}
                  onChange={(e) => setJoinSkills(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-white/70">Introduction & Why You'd Like to Join</label>
                <textarea
                  rows={3}
                  placeholder="Tell the project lead about your relevant experience and what you can contribute..."
                  value={joinMessage}
                  onChange={(e) => setJoinMessage(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2">
                <VynkButton
                  type="submit"
                  size="sm"
                  variant="primary"
                  className="w-full"
                  isLoading={isSubmittingJoin}
                >
                  Submit Application
                </VynkButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0d1117] border border-white/15 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => setShowTaskModal(false)}
              className="absolute top-5 right-5 text-white/50 hover:text-white p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <ListTodo className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Add Project Task</h3>
                <p className="text-xs text-white/60">Organize and assign project work</p>
              </div>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-white/70">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Design auth wireframes"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-white/70">Description</label>
                <textarea
                  rows={2}
                  placeholder="Task details and deliverables..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/70">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:border-indigo-400 focus:outline-none"
                  >
                    <option value="LOW" className="bg-zinc-900 text-white">Low</option>
                    <option value="MEDIUM" className="bg-zinc-900 text-white">Medium</option>
                    <option value="HIGH" className="bg-zinc-900 text-white">High</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-white/70">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <VynkButton
                  type="submit"
                  size="sm"
                  variant="primary"
                  className="w-full"
                  isLoading={isCreatingTask}
                >
                  Create Task
                </VynkButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VoyageDetailsPage;

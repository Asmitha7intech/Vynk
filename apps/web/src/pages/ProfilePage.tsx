import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Github,
  Linkedin,
  Globe,
  Sparkles,
  Layers,
  Shield,
  Flame,
  Award,
  CheckCircle2,
  Calendar,
  Rocket,
  User as UserIcon,
  MessageSquare,
  UserPlus,
  X,
  Check,
  Clock,
  AlertCircle,
  Camera,
  Upload,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { AvatarUploadModal } from '../components/AvatarUploadModal';
import { Pill } from '../components/vynk/Pill';
import { SkillBadge } from '../components/vynk/SkillBadge';
import { VynkButton } from '../components/vynk/VynkButton';
import { ProgressBar } from '../components/vynk/ProgressBar';
import { EmptyState } from '../components/vynk/EmptyState';
import { VoyageCard } from '../components/VoyageCard';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [profileData, setProfileData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'VOYAGES' | 'SKILLS' | 'BOUNTIES' | 'JOURNEY'>('VOYAGES');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnectSent, setIsConnectSent] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editError, setEditError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const { updateUser } = useAuthStore();

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Avatar image must be under 5MB.');
      return;
    }

    setIsUploadingAvatar(true);
    setAvatarError('');

    try {
      const res = await api.uploadAvatar(file);
      if (res?.avatarUrl) {
        setProfileData((prev: any) => ({
          ...prev,
          user: { ...prev.user, avatarUrl: res.avatarUrl },
        }));
        updateUser({ avatarUrl: res.avatarUrl });
      }
    } catch (err: any) {
      setAvatarError(err.message || 'Failed to upload avatar.');
    } finally {
      setIsUploadingAvatar(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    setAvatarError('');
    try {
      await api.deleteAvatar();
      setProfileData((prev: any) => ({
        ...prev,
        user: { ...prev.user, avatarUrl: null },
      }));
      updateUser({ avatarUrl: null });
    } catch (err: any) {
      setAvatarError(err.message || 'Failed to remove avatar.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // If no param, fallback to authenticated currentUser
  const targetUsername = username || currentUser?.username || currentUser?.id || '';
  const isOwnProfile = Boolean(
    currentUser &&
      (currentUser.username?.toLowerCase() === targetUsername.toLowerCase() ||
        currentUser.id === targetUsername)
  );

  useEffect(() => {
    if (!targetUsername) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    api.getUserProfile(targetUsername)
      .then((data) => {
        setProfileData(data);
        if (data?.user) {
          setEditForm({
            displayName: data.user.displayName || '',
            headline: data.user.headline || '',
            bio: data.user.bio || '',
            college: data.user.college || '',
            department: data.user.department || '',
            graduationYear: data.user.graduationYear || 2026,
            githubUrl: data.user.githubUrl || '',
            linkedinUrl: data.user.linkedinUrl || '',
            portfolioUrl: data.user.portfolioUrl || '',
            currentlyBuilding: data.user.currentlyBuilding || '',
            lookingFor: data.user.lookingFor || '',
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load profile', err);
      })
      .finally(() => setIsLoading(false));

    api.trackEvent('profile_viewed', { targetUsername });
  }, [targetUsername]);

  const handleConnect = async () => {
    if (!profileData?.user?.id) return;
    try {
      await api.sendVynkRequest(profileData.user.id);
      setIsConnectSent(true);
      setNotice('Connection request sent!');
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      setNotice(err.message || 'Failed to send connection request.');
      setTimeout(() => setNotice(null), 3500);
    }
  };

  const handleAcceptRequest = async () => {
    if (!profileData?.connectionId) return;
    try {
      await api.acceptVynkRequest(profileData.connectionId);
      setProfileData((prev: any) => ({
        ...prev,
        connectionStatus: 'CONNECTED',
      }));
      setNotice('Connection request accepted! You can now message each other.');
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      setNotice(err.message || 'Failed to accept request.');
      setTimeout(() => setNotice(null), 3500);
    }
  };

  const handleRejectRequest = async () => {
    if (!profileData?.connectionId) return;
    try {
      await api.rejectVynkRequest(profileData.connectionId);
      setProfileData((prev: any) => ({
        ...prev,
        connectionStatus: 'NONE',
        connectionId: null,
      }));
      setNotice('Connection request declined.');
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      setNotice(err.message || 'Failed to decline request.');
      setTimeout(() => setNotice(null), 3500);
    }
  };

  const handleStartChat = async () => {
    if (!profileData?.user?.id) return;
    try {
      const conv = await api.getDirectConversation(profileData.user.id);
      if (conv?.id) {
        navigate(`/messages?conversationId=${conv.id}`);
      } else {
        navigate('/messages');
      }
    } catch (err: any) {
      setNotice(err.message || 'You must connect with this student before you can message them.');
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setEditError('');
    try {
      const payload = {
        ...editForm,
        graduationYear: editForm.graduationYear ? Number(editForm.graduationYear) : undefined,
      };
      const updated = await api.updateProfile(payload);
      if (updated) {
        updateUser(updated);
        setProfileData((prev: any) => ({
          ...prev,
          user: { ...prev.user, ...updated },
        }));
      }
      setIsEditModalOpen(false);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update profile. Please check inputs.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-muted-foreground animate-pulse glass-card rounded-3xl">
        Loading builder identity & campus credentials...
      </div>
    );
  }

  if (!profileData?.user) {
    return (
      <EmptyState
        icon={UserIcon}
        title="Student Builder Not Found"
        description={`We couldn't locate a builder profile matching @${targetUsername}.`}
        actionLabel="Explore Campus"
        onAction={() => window.location.href = '/explore'}
      />
    );
  }

  const u = profileData.user;
  const stats = profileData.stats || {};
  const skills = profileData.skills || [];
  const bounties = profileData.bounties || [];

  const nextLevelXp = Math.pow((u.level || 1), 2) * 50;
  const currentLevelBaseXp = Math.pow((u.level || 1) - 1, 2) * 50;
  const xpInCurrentLevel = (u.xp || 0) - currentLevelBaseXp;
  const xpNeeded = Math.max(1, nextLevelXp - currentLevelBaseXp);
  const levelProgress = Math.min(100, Math.max(5, (xpInCurrentLevel / xpNeeded) * 100));

  // Visual Student Journey Milestones
  const JOURNEY_STEPS = [
    { title: 'Campus Identity Verified', date: 'Enrolled', icon: CheckCircle2, done: true },
    { title: 'First Voyage Shipped', date: stats.voyagesCount > 0 ? 'Verified' : 'Pending', icon: Rocket, done: stats.voyagesCount > 0 },
    { title: 'Hackathon Squad Formed', date: stats.crewsCount > 0 ? 'Active' : 'Pending', icon: Shield, done: stats.crewsCount > 0 },
    { title: '7-Day Quest Streak', date: (u.streakDays || 0) >= 7 ? 'Achieved' : `${u.streakDays || 1}/7 days`, icon: Flame, done: (u.streakDays || 0) >= 7 },
  ];

  return (
    <div className="space-y-6">
      {notice && (
        <div className="p-3.5 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-200 text-xs flex items-center justify-between gap-3 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-semibold">{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-white/60 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Profile Header Card ── */}
      <div className="p-6 sm:p-8 rounded-3xl glass-card relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <Avatar src={u.avatarUrl} fallback={u.displayName} size="lg" className="w-20 h-20 sm:w-24 sm:h-24 text-2xl" />
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-all cursor-pointer backdrop-blur-[2px]"
                  title="Update Avatar"
                >
                  <Camera className="w-5 h-5 mb-0.5 text-white/90" />
                  <span className="text-[9px] font-bold tracking-wider uppercase">Photo</span>
                </button>
              )}
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 ring-4 ring-card animate-pulse pointer-events-none" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-foreground">{u.displayName}</h1>
                <span className="text-xs text-muted-foreground font-mono">@{u.username}</span>
                {u.isAmbassador && (
                  <Pill label="Campus Ambassador" variant="amber" size="xs" />
                )}
              </div>

              <p className="text-xs font-semibold text-indigo-400">{u.headline || 'Student Builder'}</p>

              <p className="text-xs text-muted-foreground">
                {u.college ? `${u.college}` : ''}
                {u.department ? ` · ${u.department}` : ''}
                {u.graduationYear ? ` ('${String(u.graduationYear).slice(-2)})` : ''}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isOwnProfile ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <VynkButton
                  size="sm"
                  variant="outline"
                  leftIcon={<Camera className="w-3.5 h-3.5" />}
                  onClick={() => setIsAvatarModalOpen(true)}
                >
                  Edit Photo
                </VynkButton>
                <VynkButton
                  size="sm"
                  variant="primary"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  Edit Profile
                </VynkButton>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {profileData?.connectionStatus === 'CONNECTED' ? (
                  <>
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Connected
                    </span>
                    <VynkButton
                      size="sm"
                      variant="primary"
                      leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                      onClick={handleStartChat}
                    >
                      Message
                    </VynkButton>
                  </>
                ) : profileData?.connectionStatus === 'RECEIVED' ? (
                  <>
                    <VynkButton
                      size="sm"
                      variant="primary"
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                      onClick={handleAcceptRequest}
                    >
                      Accept Request
                    </VynkButton>
                    <VynkButton
                      size="sm"
                      variant="outline"
                      leftIcon={<X className="w-3.5 h-3.5" />}
                      onClick={handleRejectRequest}
                    >
                      Decline
                    </VynkButton>
                  </>
                ) : (profileData?.connectionStatus === 'PENDING' || isConnectSent) ? (
                  <button
                    disabled
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-300 flex items-center gap-1.5 cursor-default"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Request Sent
                  </button>
                ) : (
                  <>
                    <VynkButton
                      size="sm"
                      onClick={handleConnect}
                      leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                      className="flex-1 sm:flex-initial"
                    >
                      Connect
                    </VynkButton>
                    <VynkButton
                      size="sm"
                      variant="glass"
                      leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                      onClick={handleStartChat}
                    >
                      Message
                    </VynkButton>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {u.bio && (
          <p className="text-xs text-foreground/90 max-w-2xl leading-relaxed relative z-10">
            {u.bio}
          </p>
        )}

        {/* Social / External Links */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-white/5 relative z-10 flex-wrap">
          {u.githubUrl && (
            <a href={u.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Github className="w-3.5 h-3.5" /> GitHub
            </a>
          )}
          {u.linkedinUrl && (
            <a href={u.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Linkedin className="w-3.5 h-3.5" /> LinkedIn
            </a>
          )}
          {u.portfolioUrl && (
            <a href={u.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Globe className="w-3.5 h-3.5" /> Portfolio
            </a>
          )}
        </div>

        {/* Level & Momentum Strip */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 relative z-10">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground font-mono">
              Level {u.level || 1} • {u.xp || 0} XP
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              +{xpNeeded - xpInCurrentLevel} XP to Level {(u.level || 1) + 1}
            </span>
          </div>
          <ProgressBar value={levelProgress} variant="indigo" size="sm" />
        </div>
      </div>

      {/* ── Stats Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl glass-card text-center space-y-1">
          <div className="text-[10px] font-mono uppercase text-muted-foreground font-bold">Vynk Network</div>
          <div className="text-xl font-black text-indigo-400 font-mono">{stats.vynksCount || 0}</div>
          <div className="text-[10px] text-muted-foreground">Mutual Builders</div>
        </div>

        <div className="p-4 rounded-3xl glass-card text-center space-y-1">
          <div className="text-[10px] font-mono uppercase text-muted-foreground font-bold">Voyages</div>
          <div className="text-xl font-black text-sky-400 font-mono">{stats.voyagesCount || 0}</div>
          <div className="text-[10px] text-muted-foreground">Shipped Projects</div>
        </div>

        <div className="p-4 rounded-3xl glass-card text-center space-y-1">
          <div className="text-[10px] font-mono uppercase text-muted-foreground font-bold">Squads</div>
          <div className="text-xl font-black text-amber-400 font-mono">{stats.crewsCount || 0}</div>
          <div className="text-[10px] text-muted-foreground">Hackathon Crews</div>
        </div>

        <div className="p-4 rounded-3xl glass-card text-center space-y-1">
          <div className="text-[10px] font-mono uppercase text-muted-foreground font-bold">Quests</div>
          <div className="text-xl font-black text-emerald-400 font-mono">{stats.questsCompleted || 0}</div>
          <div className="text-[10px] text-muted-foreground">Solved Challenges</div>
        </div>
      </div>

      {/* ── Profile Tabs ── */}
      <div className="flex gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        {[
          { id: 'VOYAGES', label: `Voyages (${stats.voyagesCount || 0})` },
          { id: 'SKILLS', label: `Verified Skills (${skills.length})` },
          { id: 'JOURNEY', label: 'Student Journey' },
          { id: 'BOUNTIES', label: `Badges (${bounties.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/25 shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 1. VOYAGES TAB ── */}
      {activeTab === 'VOYAGES' && (
        <div>
          {profileData.voyages?.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No voyages published yet"
              description={`${u.displayName} hasn't launched any public project voyages yet.`}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profileData.voyages?.map((v: any) => (
                <VoyageCard key={v.id} voyage={v} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 2. SKILLS TAB ── */}
      {activeTab === 'SKILLS' && (
        <div className="p-6 rounded-3xl glass-card space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Technical Stack & Verified Evidence
          </h3>

          {skills.length === 0 ? (
            <p className="text-xs text-muted-foreground">No technical skills added yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {skills.map((s: any) => (
                <SkillBadge
                  key={s.id || s.skillName}
                  name={s.skillName}
                  category={s.category}
                  proficiency={s.proficiency}
                  isVerified={s.isVerified}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 3. STUDENT JOURNEY TIMELINE TAB ── */}
      {activeTab === 'JOURNEY' && (
        <div className="p-6 rounded-3xl glass-card space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Student Builder Journey
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {JOURNEY_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className={`p-4 rounded-2xl border transition-all space-y-2 ${
                    step.done
                      ? 'bg-indigo-600/10 border-indigo-500/25 text-foreground'
                      : 'bg-white/[0.02] border-white/5 opacity-60'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${step.done ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-muted-foreground'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">{step.title}</h4>
                    <span className="text-[10px] font-mono text-muted-foreground">{step.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. BOUNTIES & BADGES TAB ── */}
      {activeTab === 'BOUNTIES' && (
        <div className="p-6 rounded-3xl glass-card space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Earned Bounties & Campus Honors
          </h3>

          {bounties.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No badges earned yet"
              description="Solve daily quests, ship voyages, and form hackathon crews to unlock rare campus badges."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {bounties.map((b: any) => (
                <div key={b.id || b.title} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{b.title}</h4>
                    <p className="text-[10px] text-muted-foreground">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Edit Profile Modal ── */}
      {isEditModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div 
            className="bg-card border border-border text-foreground rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-black text-foreground">Edit Student Profile</h3>
                <p className="text-xs text-muted-foreground">Update your campus builder credentials & social links</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{editError}</span>
              </div>
            )}

            {avatarError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{avatarError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar Upload Section */}
              <div className="p-3.5 rounded-2xl bg-surface-elevated border border-surface-border flex items-center gap-4">
                <div className="relative">
                  <Avatar src={u.avatarUrl} fallback={u.displayName} size="lg" className="w-16 h-16" />
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 rounded-full bg-black/70 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-xs font-bold text-foreground">Profile Picture</p>
                    <p className="text-[11px] text-muted-foreground">JPEG, PNG, or WebP up to 5MB</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAvatarModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{u.avatarUrl ? 'Manage Photo' : 'Upload Photo'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Display Name</label>
                <input
                  type="text"
                  value={editForm.displayName || ''}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  required
                  className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-surface-border text-xs text-foreground focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Full-Stack Engineer & AI Enthusiast"
                  value={editForm.headline || ''}
                  onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-surface-border text-xs text-foreground focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Bio</label>
                <textarea
                  rows={3}
                  placeholder="Tell campus builders about your technical focus, projects, and goals..."
                  value={editForm.bio || ''}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full p-3 rounded-xl bg-surface-elevated border border-surface-border text-xs text-foreground focus:border-indigo-400 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">College</label>
                  <input
                    type="text"
                    value={editForm.college || ''}
                    onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-surface-border text-xs text-foreground focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Department</label>
                  <input
                    type="text"
                    value={editForm.department || ''}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-surface-border text-xs text-foreground focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Graduation Year</label>
                <input
                  type="number"
                  value={editForm.graduationYear || 2026}
                  onChange={(e) => setEditForm({ ...editForm, graduationYear: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-xl bg-surface-elevated border border-surface-border text-xs text-foreground focus:border-indigo-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">GitHub URL</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={editForm.githubUrl || ''}
                    onChange={(e) => setEditForm({ ...editForm, githubUrl: e.target.value })}
                    className="w-full h-9 px-2 rounded-lg bg-surface-elevated border border-surface-border text-[11px] text-foreground focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">LinkedIn URL</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={editForm.linkedinUrl || ''}
                    onChange={(e) => setEditForm({ ...editForm, linkedinUrl: e.target.value })}
                    className="w-full h-9 px-2 rounded-lg bg-surface-elevated border border-surface-border text-[11px] text-foreground focus:border-indigo-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Portfolio URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={editForm.portfolioUrl || ''}
                    onChange={(e) => setEditForm({ ...editForm, portfolioUrl: e.target.value })}
                    className="w-full h-9 px-2 rounded-lg bg-surface-elevated border border-surface-border text-[11px] text-foreground focus:border-indigo-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <VynkButton
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </VynkButton>
                <VynkButton
                  type="submit"
                  size="sm"
                  variant="primary"
                  isLoading={isSavingProfile}
                >
                  Save Profile Changes
                </VynkButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Avatar Upload & Preview Modal */}
      <AvatarUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        currentAvatarUrl={u.avatarUrl}
        displayName={u.displayName}
        onAvatarUpdated={(newUrl) => {
          setProfileData((prev: any) => ({
            ...prev,
            user: { ...prev.user, avatarUrl: newUrl },
          }));
          setNotice(newUrl ? 'Profile photo updated successfully!' : 'Profile photo removed.');
          setTimeout(() => setNotice(null), 3000);
        }}
      />
    </div>
  );
}

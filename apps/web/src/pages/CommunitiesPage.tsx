import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Sparkles, 
  Hash, 
  Lock, 
  Globe, 
  Shield, 
  MessageSquare, 
  Check, 
  X, 
  ArrowRight, 
  BookOpen,
  Send,
  UserCheck
} from 'lucide-react';
import { VynkButton } from '../components/vynk/VynkButton';
import { Pill } from '../components/vynk/Pill';
import { EmptyState } from '../components/vynk/EmptyState';
import { Avatar } from '../components/Avatar';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

const CATEGORIES = [
  'ALL',
  'AI & Machine Learning',
  'Web Development & Cloud',
  'Cybersecurity & Systems',
  'Product Design & UX',
  'Competitive Programming',
  'Robotics & Hardware',
  'Startups & Innovation',
];

export function CommunitiesPage() {
  const { user } = useAuthStore();
  const [communities, setCommunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'posts' | 'members'>('posts');
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [communityMembers, setCommunityMembers] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // Form state for creating a new community
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'AI & Machine Learning',
    tags: '',
    isPrivate: false,
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCommunities = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCommunities({
        search: search || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
      });
      setCommunities(res?.items || []);
    } catch {
      setCommunities([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
    api.trackEvent('communities_page_viewed');
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCommunities();
  };

  const handleJoin = async (communityId: string, isMember: boolean) => {
    if (!user) return;
    setJoiningId(communityId);
    try {
      if (isMember) {
        await api.leaveCommunity(communityId);
      } else {
        await api.joinCommunity(communityId);
      }
      await fetchCommunities();
      if (selectedCommunity && selectedCommunity.id === communityId) {
        openCommunityDetail(communityId);
      }
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setJoiningId(null);
    }
  };

  const openCommunityDetail = async (idOrSlug: string) => {
    try {
      const comm = await api.getCommunity(idOrSlug);
      setSelectedCommunity(comm);
      setActiveTab('posts');
      // Load posts and members in parallel
      const [posts, members] = await Promise.all([
        api.getCommunityPosts(comm.id).catch(() => []),
        api.getCommunityMembers(comm.id).catch(() => []),
      ]);
      setCommunityPosts(posts || []);
      setCommunityMembers(members || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || formData.name.length < 3) {
      setFormError('Community name must be at least 3 characters');
      return;
    }
    if (!formData.description.trim() || formData.description.length < 10) {
      setFormError('Description must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const tagList = formData.tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const created = await api.createCommunity({
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        tags: tagList,
        isPrivate: formData.isPrivate,
      });

      setIsCreateOpen(false);
      setFormData({
        name: '',
        description: '',
        category: 'AI & Machine Learning',
        tags: '',
        isPrivate: false,
      });
      await fetchCommunities();
      openCommunityDetail(created.id);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create community');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommunity || !newPostContent.trim() || isPosting) return;

    setIsPosting(true);
    try {
      await api.createPost({
        content: newPostContent.trim(),
        communityId: selectedCommunity.id,
        type: 'TEXT',
      });
      setNewPostContent('');
      const updatedPosts = await api.getCommunityPosts(selectedCommunity.id);
      setCommunityPosts(updatedPosts || []);
    } catch (err: any) {
      alert(err.message || 'Failed to post in community');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Hero Header ── */}
      <div className="p-6 sm:p-7 rounded-3xl glass-card space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Pill label="Campus Collaboration Hubs" variant="indigo" size="xs" />
              <span className="text-[11px] font-mono text-muted-foreground">
                Verified Student Organizations & Technical Guilds
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-normal text-foreground">
              Campus Communities
            </h1>
            <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
              Find your tribe on campus. Connect with student builders, share project updates, collaborate across departments, and participate in technical guilds.
            </p>
          </div>

          <VynkButton
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shrink-0"
          >
            Create Community
          </VynkButton>
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="pt-2 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by community name, topic, or keyword..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-card border border-border focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </form>

          {/* Category Dropdown on Mobile / Pills on Desktop */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Community Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-card/40 border border-border animate-pulse" />
          ))}
        </div>
      ) : communities.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No communities found"
          description={
            search || selectedCategory !== 'ALL'
              ? 'Try adjusting your search criteria or category filter.'
              : 'Be the first student leader to launch a community or technical guild on campus!'
          }
          actionLabel="Start First Community"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {communities.map((comm) => {
            const isMember = user && comm.members?.some((m: any) => m.userId === user.id && m.status === 'APPROVED');
            const isPending = user && comm.members?.some((m: any) => m.userId === user.id && m.status === 'PENDING');
            const isCreator = user && comm.creatorId === user.id;

            return (
              <div
                key={comm.id}
                className="group p-5 rounded-2xl glass-card flex flex-col justify-between hover:border-indigo-500/40 transition-all duration-300 relative overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                      {comm.avatarUrl ? (
                        <img src={comm.avatarUrl} alt={comm.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-indigo-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-card border border-border font-medium text-muted-foreground">
                        {comm.category}
                      </span>
                      {comm.isPrivate ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Private
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" /> Public
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 
                      onClick={() => openCommunityDetail(comm.id)}
                      className="text-base font-bold text-foreground group-hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      {comm.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {comm.description}
                    </p>
                  </div>

                  {/* Tags */}
                  {comm.tags && comm.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {comm.tags.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                      {comm.tags.length > 3 && (
                        <span className="text-[10px] text-muted-foreground self-center">
                          +{comm.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer / Stats & Action */}
                <div className="pt-4 mt-4 border-t border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      {comm._count?.members || comm.members?.length || 1} members
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                      {comm._count?.posts || 0} posts
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openCommunityDetail(comm.id)}
                      className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs text-foreground hover:bg-secondary transition-colors"
                    >
                      View
                    </button>
                    <VynkButton
                      variant={isMember ? 'ghost' : isPending ? 'secondary' : 'primary'}
                      size="xs"
                      disabled={joiningId === comm.id || isPending}
                      onClick={() => handleJoin(comm.id, !!isMember)}
                    >
                      {isCreator ? (
                        'Owner'
                      ) : isMember ? (
                        'Leave'
                      ) : isPending ? (
                        'Requested'
                      ) : comm.isPrivate ? (
                        'Request'
                      ) : (
                        'Join'
                      )}
                    </VynkButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Community Detail Modal ── */}
      {selectedCommunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="bg-card border border-border rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-start justify-between relative bg-gradient-to-r from-indigo-950/30 to-purple-950/20">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <BookOpen className="w-7 h-7 text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-foreground">{selectedCommunity.name}</h2>
                    {selectedCommunity.isPrivate ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Private
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5" /> Public
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedCommunity.category}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCommunity(null)}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-border px-6">
              <button
                onClick={() => setActiveTab('posts')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'posts'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Discussions ({communityPosts.length})
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'members'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Members ({communityMembers.length})
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'about'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                About
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {activeTab === 'posts' && (
                <div className="space-y-4">
                  {/* Create Post in Community */}
                  {user && (
                    <form onSubmit={handleCreatePost} className="p-4 rounded-2xl bg-secondary/50 border border-border space-y-3">
                      <textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder={`Share an update, link, or idea with ${selectedCommunity.name}...`}
                        rows={2}
                        className="w-full bg-card border border-border rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500 resize-none"
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-muted-foreground">Markdown supported</span>
                        <VynkButton
                          variant="primary"
                          size="xs"
                          type="submit"
                          disabled={!newPostContent.trim() || isPosting}
                          leftIcon={<Send className="w-3 h-3" />}
                        >
                          {isPosting ? 'Posting...' : 'Post to Community'}
                        </VynkButton>
                      </div>
                    </form>
                  )}

                  {/* Posts List */}
                  {communityPosts.length === 0 ? (
                    <EmptyState
                      icon={MessageSquare}
                      title="No community posts yet"
                      description="Start the conversation! Post questions, announcements, or resources."
                    />
                  ) : (
                    <div className="space-y-3">
                      {communityPosts.map((post: any) => (
                        <div key={post.id} className="p-4 rounded-xl bg-card border border-border/80 space-y-2">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              src={post.author?.profile?.avatarUrl}
                              fallback={post.author?.name || 'Student'}
                              size="sm"
                            />
                            <div>
                              <p className="text-xs font-bold text-foreground">
                                {post.author?.name || post.author?.username}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(post.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                            {post.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'members' && (
                <div className="space-y-2">
                  {communityMembers.map((m: any) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-secondary/40 border border-border flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={m.user?.profile?.avatarUrl}
                          fallback={m.user?.name || 'User'}
                          size="sm"
                        />
                        <div>
                          <p className="text-xs font-bold text-foreground">{m.user?.name || m.user?.username}</p>
                          <p className="text-[10px] text-muted-foreground">{m.user?.profile?.department || 'Student'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          m.role === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-secondary text-muted-foreground'
                        }`}>
                          {m.role}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          m.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {m.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
                  <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-2">
                    <h4 className="font-bold text-foreground">Overview</h4>
                    <p>{selectedCommunity.description}</p>
                  </div>
                  {selectedCommunity.tags && (
                    <div className="space-y-1">
                      <h4 className="font-bold text-foreground">Focus Tags</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCommunity.tags.map((t: string) => (
                          <span key={t} className="px-2.5 py-1 rounded-lg bg-card border border-border text-[11px] font-mono">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Create Community Modal ── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Launch a Campus Community
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCommunity} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Community Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Distributed Systems Lab, AI Builders Guild"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-secondary/50 border border-border focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-secondary/50 border border-border focus:border-indigo-500 focus:outline-none"
                >
                  {CATEGORIES.filter((c) => c !== 'ALL').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is the mission of this community? Who should join?"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-secondary/50 border border-border focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Focus Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g. rust, kafka, architecture, papers"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-secondary/50 border border-border focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                  className="rounded border-border text-indigo-500 focus:ring-indigo-500"
                />
                <label htmlFor="isPrivate" className="text-xs text-foreground cursor-pointer">
                  Private community (requires approval from leader to join)
                </label>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl bg-secondary text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <VynkButton
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Community'}
                </VynkButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

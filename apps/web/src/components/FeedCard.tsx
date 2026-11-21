import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Layers,
  ExternalLink,
  Github,
  Check,
  Trash2,
  Send,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { Pill } from './vynk/Pill';
import { VynkButton } from './vynk/VynkButton';
import { Post } from '@vynk/types';
import { formatTimeAgo } from '../lib/utils';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

interface FeedCardProps {
  post: Post;
  initialShowComments?: boolean;
}

export function FeedCard({ post, initialShowComments = false }: FeedCardProps) {
  const { user } = useAuthStore();
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [isLiked, setIsLiked] = useState(post.isLikedByMe || false);
  const [isSaved, setIsSaved] = useState(post.isSavedByMe || false);
  const [showComments, setShowComments] = useState(initialShowComments);
  const [comments, setComments] = useState<any[]>(post.comments || []);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);

  // Sync state if post prop changes
  useEffect(() => {
    setLikesCount(post.likesCount || 0);
    setIsLiked(post.isLikedByMe || false);
  }, [post.id, post.likesCount, post.isLikedByMe]);

  // Load real comments when comments section is expanded
  useEffect(() => {
    if (showComments && comments.length === 0) {
      setIsLoadingComments(true);
      api.getComments(post.id)
        .then((data) => {
          if (Array.isArray(data)) setComments(data);
        })
        .catch(() => {})
        .finally(() => setIsLoadingComments(false));
    }
  }, [showComments, post.id]);

  const handleLike = async () => {
    if (!user) {
      setActionError('Please sign in to like this post.');
      setTimeout(() => setActionError(null), 3000);
      return;
    }

    const previousLiked = isLiked;
    const previousCount = likesCount;

    // Optimistic UI update
    const nextLiked = !previousLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    if (nextLiked) {
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 800);
    }

    try {
      const res = await api.reactToPost(post.id);
      if (res && typeof res.likesCount === 'number') {
        setLikesCount(res.likesCount);
      }
      if (res && typeof res.reacted === 'boolean') {
        setIsLiked(res.reacted);
      }
    } catch (err: any) {
      // Revert on failure
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      setActionError(err.message || 'Failed to like post.');
      setTimeout(() => setActionError(null), 3000);
    }
  };

  const handleDoubleTap = () => {
    if (!isLiked) {
      handleLike();
    } else {
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 800);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    if (!user) {
      setActionError('Please sign in to join the conversation.');
      setTimeout(() => setActionError(null), 3000);
      return;
    }

    setIsSubmittingComment(true);
    setActionError(null);
    const content = commentText.trim();

    try {
      const savedComment = await api.addComment(post.id, { content });
      setCommentText('');
      setComments((prev) => [...prev, savedComment]);
    } catch (err: any) {
      setActionError(err.message || 'Unable to post comment.');
      setTimeout(() => setActionError(null), 4000);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.deleteComment(post.id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      setActionError(err.message || 'Failed to remove comment.');
      setTimeout(() => setActionError(null), 3000);
    }
  };

  const handleShare = async () => {
    const permalink = `${window.location.origin}/posts/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title || 'VYNK Post',
          text: post.content.slice(0, 100),
          url: permalink,
        });
        setShareNotice('Shared successfully!');
        setTimeout(() => setShareNotice(null), 3000);
        return;
      } catch (err: any) {
        // Fallback to clipboard if user dismissed native share
      }
    }

    try {
      await navigator.clipboard.writeText(permalink);
      setShareNotice('Permalink copied to clipboard!');
    } catch {
      setShareNotice(`Post URL: ${permalink}`);
    }
    setTimeout(() => setShareNotice(null), 3000);
  };

  const postTypeLabels: Record<string, { label: string; variant: 'indigo' | 'cyan' | 'amber' | 'emerald' | 'rose' }> = {
    VOYAGE_LAUNCH: { label: '🚀 Voyage Launch', variant: 'cyan' },
    HACKATHON_DISPATCH: { label: '⚡ Hackathon Dispatch', variant: 'amber' },
    LEARNING_NOTE: { label: '📝 Note', variant: 'indigo' },
    QUESTION: { label: '❓ Question', variant: 'rose' },
    OPPORTUNITY: { label: '💡 Opportunity', variant: 'emerald' },
  };

  const postTypeInfo = postTypeLabels[post.type];

  return (
    <div
      onDoubleClick={handleDoubleTap}
      className="glass-card rounded-3xl p-5 sm:p-6 space-y-4 hover:border-indigo-500/30 transition-all relative select-none"
    >
      {/* Floating Heart Pop Animation on Double-Tap */}
      {showLikeAnimation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Heart className="w-24 h-24 text-rose-500 fill-rose-500 animate-ping opacity-90 drop-shadow-[0_0_20px_rgba(244,63,94,0.8)]" />
        </div>
      )}

      {/* Action Error / Notice Banner */}
      {actionError && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}
      {shareNotice && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs animate-in fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{shareNotice}</span>
        </div>
      )}

      {/* Author Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to={`/profile/${post.author.username}`} className="shrink-0">
            <Avatar src={post.author.avatarUrl} fallback={post.author.displayName} size="md" isOnline={true} />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link to={`/profile/${post.author.username}`} className="text-sm font-bold text-foreground hover:text-indigo-400 hover:underline truncate">
                {post.author.displayName}
              </Link>
              <span className="text-xs text-muted-foreground truncate font-mono">@{post.author.username}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {post.author.department ? `${post.author.department} · ` : ''}
              <Link to={`/posts/${post.id}`} className="hover:underline">
                {formatTimeAgo(post.createdAt)}
              </Link>
            </p>
          </div>
        </div>

        {postTypeInfo && (
          <Pill label={postTypeInfo.label} variant={postTypeInfo.variant} size="xs" />
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-3">
        {post.title && (
          <h3 className="text-base font-bold tracking-tight text-foreground leading-snug">
            <Link to={`/posts/${post.id}`} className="hover:text-indigo-400 transition-colors">
              {post.title}
            </Link>
          </h3>
        )}
        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line select-text">
          {post.content}
        </p>

        {/* Voyage Embedded Showcase */}
        {post.voyage && (
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-surface to-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
                <h4 className="text-sm font-bold text-foreground">{post.voyage.title}</h4>
              </div>
              <Pill label={post.voyage.status} variant="indigo" size="xs" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{post.voyage.tagline}</p>
            <div className="flex flex-wrap gap-1.5">
              {post.voyage.technologies.map((tech) => (
                <span key={tech} className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-muted-foreground">
                  {tech}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 pt-1">
              {post.voyage.githubUrl && (
                <a
                  href={post.voyage.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <Github className="w-3.5 h-3.5" /> Code Repo
                </a>
              )}
              {post.voyage.demoUrl && (
                <a
                  href={post.voyage.demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                </a>
              )}
            </div>
          </div>
        )}

        {/* Media (Image, GIF, Video) preview */}
        {Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0 && (
          <div className="rounded-2xl overflow-hidden border border-white/10 max-h-[480px] bg-black/60 flex items-center justify-center">
            {/\.(mp4|webm|ogg|mov)$/i.test(post.mediaUrls[0]) ? (
              <video
                src={post.mediaUrls[0]}
                controls
                playsInline
                preload="metadata"
                className="w-full max-h-[480px] object-contain rounded-2xl bg-black"
              />
            ) : (
              <img
                src={post.mediaUrls[0]}
                alt="Post media"
                loading="lazy"
                className="w-full max-h-[480px] object-contain rounded-2xl"
              />
            )}
          </div>
        )}

        {/* Tags */}
        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions (Like, Comment, Share, Bookmark) */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-muted-foreground text-xs">
        <div className="flex items-center gap-5">
          <button
            onClick={handleLike}
            aria-label="Like post"
            className={`flex items-center gap-1.5 transition-all active:scale-125 cursor-pointer ${
              isLiked ? 'text-rose-500 font-bold' : 'hover:text-foreground'
            }`}
          >
            <Heart className={`w-4 h-4 transition-transform ${isLiked ? 'fill-current text-rose-500 scale-110' : ''}`} />
            <span>{likesCount}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            aria-label="View comments"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{comments.length > 0 ? comments.length : (post.commentsCount || 0)}</span>
          </button>

          <button
            onClick={handleShare}
            aria-label="Share post permalink"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
          >
            {shareNotice ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>Share</span>
          </button>
        </div>

        <button
          onClick={() => setIsSaved(!isSaved)}
          aria-label="Bookmark"
          className={`p-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer ${
            isSaved ? 'text-indigo-400' : 'hover:text-foreground'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Instagram-Style Comments Section */}
      {showComments && (
        <div className="pt-3 border-t border-white/5 space-y-3 animate-in fade-in">
          {/* Comment Composer */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2 items-center">
            <Avatar src={user?.avatarUrl} fallback={user?.displayName || 'Me'} size="sm" />
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a constructive thought or question..."
              className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-surface-elevated dark:bg-[#0d121f] border border-surface-border dark:border-white/10 hover:border-surface-border/80 text-foreground dark:text-white font-normal placeholder:text-zinc-500 dark:placeholder:text-zinc-500 caret-indigo-500 dark:caret-cyan-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
            <VynkButton
              size="xs"
              type="submit"
              disabled={!commentText.trim() || isSubmittingComment}
              isLoading={isSubmittingComment}
              leftIcon={<Send className="w-3 h-3" />}
              className="font-bold shadow-md shadow-indigo-600/30"
            >
              Post
            </VynkButton>
          </form>

          {/* Comment Thread */}
          {isLoadingComments ? (
            <div className="text-center py-4 text-xs text-muted-foreground animate-pulse">
              Loading peer comments...
            </div>
          ) : comments.length === 0 ? (
            <p className="text-[11px] text-muted-foreground text-center py-2">
              No comments yet. Start the conversation!
            </p>
          ) : (
            <div className="space-y-2 pt-1 max-h-72 overflow-y-auto pr-1">
              {comments.map((c) => (
                <div key={c.id} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs space-y-1.5 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link to={`/profile/${c.author?.username}`}>
                        <Avatar src={c.author?.avatarUrl} fallback={c.author?.displayName} size="xs" />
                      </Link>
                      <Link to={`/profile/${c.author?.username}`} className="font-bold text-foreground hover:underline">
                        {c.author?.displayName || 'Builder'}
                      </Link>
                      <span className="text-[10px] text-muted-foreground">
                        {formatTimeAgo(c.createdAt)}
                      </span>
                    </div>

                    {user && (user.id === c.authorId || user.id === c.author?.id) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-rose-400 transition-opacity"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-foreground/90 pl-6 leading-relaxed select-text">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

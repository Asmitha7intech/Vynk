import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare, Share2, Bookmark, Layers, ExternalLink, Github } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from './Card';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Post } from '@vynk/types';
import { formatTimeAgo } from '../lib/utils';
import { api } from '../lib/api';

export function FeedCard({ post }: { post: Post }) {
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isLiked, setIsLiked] = useState(post.isLikedByMe || false);
  const [isSaved, setIsSaved] = useState(post.isSavedByMe || false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);

  const handleLike = async () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));
    await api.reactToPost(post.id);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const newComment = {
      id: `c-${Date.now()}`,
      content: commentText,
      createdAt: new Date().toISOString(),
      author: { displayName: 'Alex Chen', username: 'alexchen' },
    };
    setComments([...comments, newComment]);
    setCommentText('');
  };

  return (
    <Card className="hover:border-border transition-all">
      <CardHeader className="pb-3 flex flex-row items-start justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.author.username}`}>
            <Avatar src={post.author.avatarUrl} fallback={post.author.displayName} size="md" isOnline={true} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link to={`/profile/${post.author.username}`} className="text-sm font-bold hover:underline">
                {post.author.displayName}
              </Link>
              <span className="text-xs text-muted-foreground">@{post.author.username}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {post.author.department} · {formatTimeAgo(post.createdAt)}
            </p>
          </div>
        </div>

        {post.type === 'VOYAGE_LAUNCH' && (
          <Badge variant="default" className="text-[10px] uppercase font-bold tracking-wider">
            <Layers className="w-3 h-3 mr-1" /> Voyage Launch
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        {post.title && <h3 className="text-base font-bold tracking-tight text-foreground">{post.title}</h3>}
        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">{post.content}</p>

        {/* Voyage Embedded Showcase */}
        {post.voyage && (
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/20 via-card to-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold">{post.voyage.title}</h4>
              </div>
              <Badge variant="accent" className="text-[10px]">{post.voyage.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{post.voyage.tagline}</p>
            <div className="flex flex-wrap gap-1.5">
              {post.voyage.technologies.map((tech) => (
                <span key={tech} className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-mono text-muted-foreground">
                  {tech}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-1">
              {post.voyage.githubUrl && (
                <a
                  href={post.voyage.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <Github className="w-3.5 h-3.5" /> Code Repository
                </a>
              )}
              {post.voyage.demoUrl && (
                <a
                  href={post.voyage.demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                </a>
              )}
            </div>
          </div>
        )}

        {/* Media images if present */}
        {post.mediaUrls.length > 0 && (
          <div className="rounded-2xl overflow-hidden border border-border/80 max-h-96">
            <img src={post.mediaUrls[0]} alt="Post media" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {post.tags.map((tag) => (
              <span key={tag} className="text-xs text-indigo-400 hover:underline cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2 border-t border-border/50 justify-between text-muted-foreground text-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              isLiked ? 'text-rose-500 font-semibold' : 'hover:text-foreground'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-rose-500' : ''}`} />
            <span>{likesCount}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{post.commentsCount + comments.length}</span>
          </button>

          <button className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>

        <button
          onClick={() => setIsSaved(!isSaved)}
          className={`p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer ${
            isSaved ? 'text-indigo-400' : 'hover:text-foreground'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </CardFooter>

      {/* Inline Comments Section */}
      {showComments && (
        <div className="px-5 pb-5 pt-2 border-t border-border/50 space-y-3 bg-muted/20">
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add your constructive thought or question..."
              className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-card border border-border focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
            >
              Reply
            </button>
          </form>

          {comments.map((c) => (
            <div key={c.id} className="p-2 rounded-xl bg-card border border-border/50 text-xs space-y-1">
              <span className="font-bold text-foreground">{c.author.displayName}</span>
              <p className="text-muted-foreground">{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

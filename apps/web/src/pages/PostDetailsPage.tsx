import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, AlertCircle } from 'lucide-react';
import { FeedCard } from '../components/FeedCard';
import { VynkButton } from '../components/vynk/VynkButton';
import { api } from '../lib/api';
import { Post } from '@vynk/types';

export function PostDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    api.getPost(id)
      .then((data) => {
        if (!data || !(data as any).id) {
          setError('Post not found or has been removed.');
        } else {
          setPost(data);
        }
      })
      .catch((err: any) => {
        setError(err.message || 'Unable to load post.');
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 py-8 animate-pulse">
        <div className="h-6 w-32 bg-white/5 rounded-xl" />
        <div className="p-6 rounded-3xl glass-card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/5" />
            <div className="space-y-2 flex-1">
              <div className="w-40 h-3 bg-white/5 rounded" />
              <div className="w-24 h-2.5 bg-white/5 rounded" />
            </div>
          </div>
          <div className="w-full h-24 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Post Unavailable</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {error || 'This post may be private, deleted, or the shared link is invalid.'}
        </p>
        <Link to="/" className="inline-block pt-2">
          <VynkButton size="sm" variant="outline" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to Campus Stream
          </VynkButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </Link>
        <span className="text-[11px] font-mono text-muted-foreground">
          Permalink · VYNK Post #{post.id.slice(-8)}
        </span>
      </div>

      <FeedCard post={post} initialShowComments={true} />
    </div>
  );
}
export default PostDetailsPage;

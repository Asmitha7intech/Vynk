import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Image, Video, Film, Smile, X, AlertCircle, Sparkles, Loader2, LogIn } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_EMOJIS = ['🔥', '🚀', '💻', '🧠', '⚡', '🎉', '💡', '🛡️', '🌐', '✨'];

const PRESET_GIFS = [
  { label: '🚀 Launch', url: 'https://media.giphy.com/media/13HgwGsXF0aiGY/giphy.gif' },
  { label: '💻 Coding', url: 'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif' },
  { label: '🤯 Mind Blown', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
  { label: '🐛 Debugging', url: 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif' },
];

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'TEXT' | 'VOYAGE_LAUNCH' | 'LEARNING_NOTE'>('TEXT');
  const [tags, setTags] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'gif' | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [customGifUrl, setCustomGifUrl] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  const handleEmojiClick = (emoji: string) => {
    setContent((prev) => prev + emoji);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    if (file.size > 50 * 1024 * 1024) {
      setError('Selected file exceeds the 50MB size limit.');
      return;
    }

    setIsUploadingMedia(true);
    try {
      const res = await api.uploadMedia(file);
      setMediaUrl(res.url);
      if (file.type.startsWith('video/')) {
        setMediaType('video');
      } else if (file.type === 'image/gif') {
        setMediaType('gif');
      } else {
        setMediaType('image');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to upload media file.');
    } finally {
      setIsUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectGif = (url: string) => {
    setMediaUrl(url);
    setMediaType('gif');
    setShowGifPicker(false);
    setCustomGifUrl('');
  };

  const removeMedia = () => {
    setMediaUrl('');
    setMediaType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setError(null);
    setIsLoading(true);
    try {
      const newPost = await api.createPost({
        title: title || undefined,
        content,
        type,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        mediaUrls: mediaUrl ? [mediaUrl] : [],
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vynk:post-created', { detail: newPost }));
      }
      setContent('');
      setTitle('');
      setTags('');
      setMediaUrl('');
      setMediaType(null);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to publish post. Please check backend status.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Share with the VYNK Ecosystem' : 'Join the VYNK Ecosystem'}>
      {!user ? (
        <div className="py-6 px-2 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Sign in to Publish to the Campus Feed</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Create an account or log in with your student credentials to share discussions, post voyage milestones, and collaborate across departments.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Link to="/auth" onClick={onClose}>
              <Button variant="accent" className="flex items-center gap-2">
                <LogIn className="w-4 h-4" /> Sign In / Register
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

        {/* Post Type Selector */}
        <div className="flex gap-2">
          {[
            { id: 'TEXT', label: 'Discussion / Thought' },
            { id: 'VOYAGE_LAUNCH', label: '🚀 Launch Voyage' },
            { id: 'LEARNING_NOTE', label: '💡 Technical Note' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                type === t.id
                  ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 font-bold'
                  : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {type !== 'TEXT' && (
          <Input
            label="Post Headline / Title"
            placeholder="e.g., Sub-15ms edge inference with WebAssembly"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Content
          </label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What are you building, learning, or searching for teammates about?"
            className="w-full px-4 py-3 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            required
          />
        </div>

        {/* Quick Emoji Bar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1 flex items-center gap-1">
            <Smile className="w-3.5 h-3.5 text-amber-400" /> Emojis:
          </span>
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              className="px-2 py-0.5 rounded-lg bg-card border border-border/80 hover:border-indigo-500/40 hover:bg-muted text-xs transition-colors cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Media Upload & GIF Controls */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingMedia || !!mediaUrl}
          >
            {isUploadingMedia ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            ) : (
              <Image className="w-3.5 h-3.5 text-indigo-400" />
            )}
            Attach Photo / Video
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowGifPicker((prev) => !prev)}
            disabled={!!mediaUrl}
          >
            <Film className="w-3.5 h-3.5 text-pink-400" />
            Add GIF
          </Button>
        </div>

        {/* GIF Picker Popover */}
        {showGifPicker && (
          <div className="p-3 rounded-2xl bg-muted/60 border border-border space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Select a GIF</span>
              <button
                type="button"
                onClick={() => setShowGifPicker(false)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_GIFS.map((g) => (
                <button
                  key={g.url}
                  type="button"
                  onClick={() => handleSelectGif(g.url)}
                  className="rounded-xl border border-border overflow-hidden hover:border-indigo-500 transition-all text-left bg-card cursor-pointer group"
                >
                  <img src={g.url} alt={g.label} className="w-full h-16 object-cover" />
                  <span className="block text-[10px] font-bold p-1 truncate text-foreground group-hover:text-indigo-400">
                    {g.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="url"
                placeholder="Or paste external GIF link (https://...)"
                value={customGifUrl}
                onChange={(e) => setCustomGifUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <Button
                type="button"
                size="sm"
                disabled={!customGifUrl.trim()}
                onClick={() => handleSelectGif(customGifUrl.trim())}
              >
                Apply
              </Button>
            </div>
          </div>
        )}

        {/* Media Preview Box */}
        {mediaUrl && (
          <div className="relative rounded-2xl overflow-hidden border border-border bg-black/40 p-2 max-h-56 flex items-center justify-center">
            <button
              type="button"
              onClick={removeMedia}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors cursor-pointer z-10"
              title="Remove media"
            >
              <X className="w-4 h-4" />
            </button>

            {mediaType === 'video' || /\.(mp4|webm|ogg|mov)$/i.test(mediaUrl) ? (
              <video src={mediaUrl} controls className="max-h-48 rounded-xl object-contain" />
            ) : (
              <img src={mediaUrl} alt="Preview" className="max-h-48 rounded-xl object-contain" />
            )}
          </div>
        )}

        <Input
          label="Tags (Comma separated)"
          placeholder="e.g. PyTorch, WebAssembly, Hackathon, Frontend"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={!content.trim() || isUploadingMedia}
          >
            Post to Feed
          </Button>
        </div>
      </form>
      )}
    </Modal>
  );
}

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Image, Layers, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'TEXT' | 'VOYAGE_LAUNCH' | 'LEARNING_NOTE'>('TEXT');
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsLoading(true);
    try {
      await api.createPost({
        title: title || undefined,
        content,
        type,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setContent('');
      setTitle('');
      setTags('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share with the VYNK Ecosystem">
      <form onSubmit={handleSubmit} className="space-y-4">
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
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What are you building, learning, or searching for teammates about?"
            className="w-full px-4 py-3 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            required
          />
        </div>

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
          <Button type="submit" isLoading={isLoading} disabled={!content.trim()}>
            Post to Feed
          </Button>
        </div>
      </form>
    </Modal>
  );
}

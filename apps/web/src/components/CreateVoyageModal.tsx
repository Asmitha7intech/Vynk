import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Layers, Github, ExternalLink, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { useGamificationStore } from '../stores/gamificationStore';

interface CreateVoyageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateVoyageModal({ isOpen, onClose, onSuccess }: CreateVoyageModalProps) {
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [category, setCategory] = useState('Full-Stack');
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { awardXPFeedback } = useGamificationStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setIsLoading(true);
    try {
      await api.createVoyage({
        title,
        tagline,
        description,
        category,
        technologies: technologies.split(',').map((t) => t.trim()).filter(Boolean),
        githubUrl: githubUrl || null,
        demoUrl: demoUrl || null,
        coverImageUrl: coverImageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000',
      });
      awardXPFeedback(250, `Published Voyage: ${title}`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Showcase a New Voyage (Project Portfolio)" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project Title"
          placeholder="e.g. NeuroVision: Edge Video Analytics"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Input
          label="Tagline (Quick pitch)"
          placeholder="e.g. Sub-15ms edge inference pipeline for clinical surgery assistance"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Tech Stack (Comma separated)"
            placeholder="e.g. PyTorch, WebAssembly, React, Fastify"
            value={technologies}
            onChange={(e) => setTechnologies(e.target.value)}
            required
          />
          <Input
            label="Category"
            placeholder="e.g. AI/ML, Systems, Frontend, Security"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="GitHub URL (Optional)"
            placeholder="https://github.com/..."
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />
          <Input
            label="Live Demo URL (Optional)"
            placeholder="https://demo..."
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
          />
        </div>

        <Input
          label="Cover Image URL (Optional)"
          placeholder="https://images.unsplash.com/..."
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Detailed Architecture & Build Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain how you designed the system, the engineering challenges you overcame, and key results."
            className="w-full px-4 py-2.5 rounded-2xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            <Layers className="w-4 h-4" />
            <span>Publish Voyage (+250 XP)</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}

import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Plus, Trash2, Shield, Sparkles } from 'lucide-react';
import { api } from '../lib/api';

interface CrewBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CrewBuilderModal({ isOpen, onClose, onSuccess }: CrewBuilderModalProps) {
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('AI & Healthcare');
  const [targetHackathon, setTargetHackathon] = useState('');
  const [commitmentHours, setCommitmentHours] = useState(12);
  const [requirements, setRequirements] = useState([
    { roleName: 'UI/UX & Design Systems Lead', requiredSkills: 'Figma, Tailwind CSS, Framer Motion', description: 'Design frontend UI & user journey' },
    { roleName: 'Backend & Infrastructure Specialist', requiredSkills: 'Node.js, Postgres, Redis, WebSockets', description: 'Real-time sync and data pipeline' },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddRole = () => {
    setRequirements([
      ...requirements,
      { roleName: '', requiredSkills: '', description: '' },
    ]);
  };

  const handleRemoveRole = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const handleRoleChange = (index: number, field: string, val: string) => {
    const updated = [...requirements];
    (updated[index] as any)[field] = val;
    setRequirements(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !tagline.trim()) return;
    setIsLoading(true);
    try {
      await api.createCrew({
        name,
        tagline,
        description,
        category,
        targetHackathon: targetHackathon || null,
        commitmentHoursPerWeek: Number(commitmentHours),
        requirements: requirements.map((r) => ({
          roleName: r.roleName,
          requiredSkills: r.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
          description: r.description || 'Contribute to core feature development',
          priority: 'HIGH',
        })),
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assemble a New Collaborative Crew" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Crew Name"
          placeholder="e.g. NeuroVision Hack Squad"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Crew Tagline (1-liner pitch)"
          placeholder="e.g. Building sub-15ms edge medical video analytics for MIT Grand Hack"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Domain / Category"
            placeholder="e.g. AI & Healthcare, Fintech, Web3"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
          <Input
            label="Target Hackathon / Event (Optional)"
            placeholder="e.g. MIT Grand Hack 2026, YC Demo Day"
            value={targetHackathon}
            onChange={(e) => setTargetHackathon(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Crew Objective & Project Vision
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the architecture, product scope, and what your team will accomplish."
            className="w-full px-4 py-2.5 rounded-2xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            required
          />
        </div>

        {/* Dynamic Open Roles Needed */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              Define Missing Role Requirements (For AI Matchmaking):
            </label>
            <Button type="button" variant="outline" size="sm" onClick={handleAddRole}>
              <Plus className="w-3.5 h-3.5" /> Add Role
            </Button>
          </div>

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {requirements.map((req, index) => (
              <div key={index} className="p-3.5 rounded-2xl bg-muted/40 border border-border/80 space-y-2.5 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400">Role #{index + 1}</span>
                  {requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(index)}
                      className="text-muted-foreground hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    placeholder="Role Title (e.g. UI/UX Designer)"
                    value={req.roleName}
                    onChange={(e) => handleRoleChange(index, 'roleName', e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl bg-card border border-border"
                    required
                  />
                  <input
                    placeholder="Required Skills (Comma separated)"
                    value={req.requiredSkills}
                    onChange={(e) => handleRoleChange(index, 'requiredSkills', e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl bg-card border border-border"
                    required
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            <Shield className="w-4 h-4" />
            <span>Publish Crew & Launch Matchmaker</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}

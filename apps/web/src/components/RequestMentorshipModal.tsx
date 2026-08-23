import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { GraduationCap, CheckCircle } from 'lucide-react';
import { MentorProfile } from '@vynk/types';
import { api } from '../lib/api';

interface RequestMentorshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentor: MentorProfile;
}

export function RequestMentorshipModal({ isOpen, onClose, mentor }: RequestMentorshipModalProps) {
  const [topic, setTopic] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [currentChallenge, setCurrentChallenge] = useState('');
  const [proposedTimes, setProposedTimes] = useState('Tuesdays or Thursdays 6:00 PM EST');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.requestMentorship({
        mentorId: mentor.id,
        topic,
        goalDescription,
        currentChallenge,
        proposedMeetingTimes: proposedTimes,
      });
      setIsSent(true);
      setTimeout(() => {
        setIsSent(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Request Mentorship with ${mentor.user.displayName}`} maxWidth="lg">
      {!isSent ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
            <strong>Mentor Focus:</strong> {mentor.expertiseCategories.join(' • ')}
          </div>

          <Input
            label="Specific Mentorship Topic"
            placeholder="e.g. Model Quantization and Edge Pipeline Review"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Your Concrete Learning Goal
            </label>
            <textarea
              rows={3}
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              placeholder="What specific project or milestone do you want to achieve through this mentorship?"
              className="w-full px-4 py-2.5 rounded-2xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Current Technical Blocker
            </label>
            <textarea
              rows={3}
              value={currentChallenge}
              onChange={(e) => setCurrentChallenge(e.target.value)}
              placeholder="Describe the exact bottleneck or architectural decision you are struggling with."
              className="w-full px-4 py-2.5 rounded-2xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              required
            />
          </div>

          <Input
            label="Proposed Meeting Times"
            value={proposedTimes}
            onChange={(e) => setProposedTimes(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              <GraduationCap className="w-4 h-4" />
              <span>Send Mentorship Proposal</span>
            </Button>
          </div>
        </form>
      ) : (
        <div className="py-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold">Mentorship Request Dispatched!</h3>
          <p className="text-xs text-muted-foreground">
            {mentor.user.displayName} has received your goal specifications. You will receive a direct notification once reviewed.
          </p>
        </div>
      )}
    </Modal>
  );
}

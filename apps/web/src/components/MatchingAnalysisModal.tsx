import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Sparkles, CheckCircle2, UserPlus, Shield, ArrowRight } from 'lucide-react';
import { Crew, CrewMatchRecommendation } from '@vynk/types';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { api } from '../lib/api';

interface MatchingAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  crew: Crew;
}

export function MatchingAnalysisModal({ isOpen, onClose, crew }: MatchingAnalysisModalProps) {
  const [recommendations, setRecommendations] = useState<CrewMatchRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    api.getCrewRecommendations(crew.id)
      .then((data) => setRecommendations(data))
      .finally(() => setIsLoading(false));
  }, [isOpen, crew.id]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Crew Complementarity Engine" maxWidth="2xl">
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-1.5">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
            <Sparkles className="w-4 h-4" />
            <span>VYNK Complementarity Optimization</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Our multi-factor matching evaluates <strong>30% Skill Complementarity</strong>, <strong>20% Interest Similarity</strong>, <strong>15% Role Compatibility</strong>, <strong>15% Availability</strong>, <strong>10% Experience</strong>, and <strong>10% Working Style</strong> to discover students whose skills complete your missing squad gaps.
          </p>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
            Scanning student graph for complementary skills...
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {recommendations.map((rec) => (
              <div
                key={rec.user.id}
                className="p-4 rounded-2xl bg-muted/40 border border-border hover:border-indigo-500/40 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={rec.user.avatarUrl} fallback={rec.user.displayName} size="md" isOnline={true} />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold">{rec.user.displayName}</h4>
                        <span className="text-xs text-muted-foreground">@{rec.user.username}</span>
                      </div>
                      <p className="text-xs text-indigo-400 font-semibold">{rec.user.department} · {rec.user.college}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black text-xs font-mono">
                      <Sparkles className="w-3.5 h-3.5 fill-current" />
                      <span>{rec.matchScore}% Match</span>
                    </div>
                  </div>
                </div>

                {/* Plain-English Explanation */}
                <div className="p-2.5 rounded-xl bg-card border border-border/60 text-xs text-muted-foreground space-y-1">
                  <strong className="text-foreground block font-bold">Why Recommended:</strong>
                  <p>{rec.explanation}</p>
                </div>

                {/* Matching Skills Breakdown */}
                <div className="flex flex-wrap gap-1.5">
                  {rec.missingSkillsCovered.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Covers: {skill}
                    </span>
                  ))}
                  {rec.matchingSkills.slice(0, 3).map((skill) => (
                    <span key={skill} className="px-2 py-0.5 rounded-md bg-muted text-[11px] text-muted-foreground">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex justify-end pt-1">
                  <Button size="sm" className="text-xs">
                    <UserPlus className="w-3.5 h-3.5" /> Invite to Crew
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}

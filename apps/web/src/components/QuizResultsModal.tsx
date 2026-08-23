import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Trophy, Sparkles, AlertCircle, BookOpen, CheckCircle } from 'lucide-react';
import { Badge } from './Badge';

interface QuizResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: any;
  quizTitle: string;
}

export function QuizResultsModal({ isOpen, onClose, results, quizTitle }: QuizResultsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quest Complete — Results & Skill Breakdown" maxWidth="lg">
      <div className="space-y-6 text-center">
        {/* Score & Celebration Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-card to-card border border-indigo-500/30 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/10">
            <Trophy className="w-7 h-7" />
          </div>

          <h3 className="text-xl font-extrabold">{results.percentage}% Score Achieved</h3>
          <p className="text-xs text-muted-foreground">
            You scored {results.score} out of {results.maxScore} correct on <span className="text-foreground font-semibold">{quizTitle}</span>
          </p>

          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono font-bold text-sm">
            <Sparkles className="w-4 h-4 fill-current" />
            <span>+{results.xpEarned} XP Earned</span>
          </div>
        </div>

        {/* Weak Topics Analysis */}
        {results.weakTopics?.length > 0 ? (
          <div className="text-left space-y-2 p-4 rounded-2xl bg-muted/40 border border-border">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <AlertCircle className="w-4 h-4" />
              <span>Areas Identified for Revision:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {results.weakTopics.map((topic: string) => (
                <Badge key={topic} variant="danger" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold justify-center">
            <CheckCircle className="w-4 h-4" />
            <span>Flawless Execution! Zero weak areas detected.</span>
          </div>
        )}

        {/* Recommended Learning Topics */}
        {results.recommendedTopics?.length > 0 && (
          <div className="text-left space-y-2 p-4 rounded-2xl bg-muted/40 border border-border">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
              <BookOpen className="w-4 h-4" />
              <span>Next Recommended Learning Focus:</span>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground list-disc list-inside">
              {results.recommendedTopics.map((topic: string, i: number) => (
                <li key={i} className="font-medium text-foreground/90">{topic}</li>
              ))}
            </ul>
          </div>
        )}

        <Button onClick={onClose} className="w-full">
          Return to Arena
        </Button>
      </div>
    </Modal>
  );
}

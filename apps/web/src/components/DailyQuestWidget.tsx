import React, { useState } from 'react';
import { Sparkles, CheckCircle2, XCircle, ChevronRight, HelpCircle } from 'lucide-react';
import { Card, CardHeader, CardContent } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { DailyChallenge } from '@vynk/types';
import { api } from '../lib/api';
import { useGamificationStore } from '../stores/gamificationStore';

export function DailyQuestWidget({ challenge }: { challenge: DailyChallenge }) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { awardXPFeedback } = useGamificationStore();

  const handleOptionSelect = (index: number) => {
    if (isSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmit = async () => {
    if (selectedOption === null || isSubmitted) return;
    setIsSubmitting(true);
    try {
      const res = await api.submitDailyChallenge(challenge.id, selectedOption);
      setResult(res);
      setIsSubmitted(true);
      awardXPFeedback(res.xpEarned, `Daily Challenge: ${challenge.title}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-indigo-500/30 bg-gradient-to-br from-indigo-950/30 via-card to-card overflow-hidden shadow-lg shadow-indigo-500/5">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight">Today's Technical Quest</h3>
              <p className="text-xs text-muted-foreground">{challenge.category} · {challenge.difficulty}</p>
            </div>
          </div>
          <Badge variant="accent" className="font-mono">+{challenge.xpAward} XP</Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Code Snippet if present */}
        {challenge.snippet && (
          <div className="rounded-xl bg-[#090d16] border border-border/80 p-3.5 overflow-x-auto text-xs font-mono text-indigo-200">
            <pre>{challenge.snippet}</pre>
          </div>
        )}

        <p className="text-sm font-semibold text-foreground/90">{challenge.question}</p>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {challenge.options.map((option, index) => {
            let optionStyles = 'border-border/80 bg-muted/30 hover:bg-muted/60 text-foreground';

            if (selectedOption === index) {
              optionStyles = 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-semibold ring-2 ring-indigo-500/30';
            }

            if (isSubmitted) {
              if (index === result?.correctOptionIndex) {
                optionStyles = 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-bold';
              } else if (selectedOption === index && !result?.isCorrect) {
                optionStyles = 'border-rose-500 bg-rose-500/10 text-rose-300';
              } else {
                optionStyles = 'opacity-50 border-border bg-muted/20 text-muted-foreground';
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                disabled={isSubmitted}
                className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${optionStyles}`}
              >
                <span>{option}</span>
                {isSubmitted && index === result?.correctOptionIndex && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                )}
                {isSubmitted && selectedOption === index && !result?.isCorrect && (
                  <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Action / Result explanation */}
        {!isSubmitted ? (
          <div className="flex justify-end pt-1">
            <Button
              size="sm"
              disabled={selectedOption === null || isSubmitting}
              isLoading={isSubmitting}
              onClick={handleSubmit}
            >
              <span>Submit Quest</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 text-xs space-y-1.5 animate-in fade-in">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Explanation & Insight:</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">{result?.explanation || challenge.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

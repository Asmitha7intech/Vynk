import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, Clock, Play, HelpCircle, CheckCircle, Flame, Target } from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { DailyQuestWidget } from '../components/DailyQuestWidget';
import { QuizRunnerModal } from '../components/QuizRunnerModal';
import { api } from '../lib/api';
import { Quiz, DailyChallenge } from '@vynk/types';

export function QuestsPage() {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.getDailyChallenge().catch(() => null),
      api.getQuizzes().catch(() => []),
    ]).then(([chalRes, quizRes]) => {
      if (chalRes?.challenge) setChallenge(chalRes.challenge);
      setQuizzes(quizRes || []);
    }).finally(() => setIsLoading(false));

    api.trackEvent('quests_page_viewed');
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/50 via-card to-card border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider">
              Technical Arena & Progression
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Quests & Timed Championships</h1>
          <p className="text-xs text-muted-foreground max-w-lg">
            Sharpen algorithmic thinking, earn verifiable XP, claim Bounties, and rise on the global campus leaderboards.
          </p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <Flame className="w-5 h-5 fill-current" />
          <div>
            <div className="text-xs font-black">Daily Streak Multiplier</div>
            <div className="text-[10px] text-muted-foreground">Solve today to keep streak alive</div>
          </div>
        </div>
      </div>

      {/* Daily Quest Widget */}
      {challenge && (
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Daily Technical Challenge</span>
          </h2>
          <DailyQuestWidget challenge={challenge} />
        </div>
      )}

      {/* Weekly Timed Quizzes Section */}
      <div className="space-y-3 pt-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Trophy className="w-4 h-4 text-indigo-400" />
          <span>Weekly Technical Arena</span>
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-6 rounded-2xl bg-card border border-border/60 animate-pulse space-y-3">
                <div className="h-4 w-28 bg-muted/60 rounded" />
                <div className="h-3 w-full bg-muted/40 rounded" />
              </div>
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground bg-card rounded-2xl border border-border">
            New weekly championships are released every Monday.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:border-indigo-500/40 transition-all flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-indigo-400">{quiz.category}</span>
                      <Badge variant={quiz.isWeeklySpecial ? 'accent' : 'secondary'} className="text-[10px]">
                        {quiz.isWeeklySpecial ? 'Weekly Special' : 'Standard Arena'}
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-foreground mt-1">{quiz.title}</h3>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">{quiz.description}</p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{quiz.timeLimitMinutes} mins</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>+{quiz.xpReward} XP</span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="pt-3 border-t border-border/50">
                  <Button size="sm" onClick={() => setActiveQuiz(quiz)} className="w-full text-xs">
                    <Play className="w-3.5 h-3.5" /> Enter Timed Arena
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Timed Quiz Runner Modal */}
      {activeQuiz && (
        <QuizRunnerModal
          isOpen={!!activeQuiz}
          onClose={() => setActiveQuiz(null)}
          quiz={activeQuiz}
        />
      )}
    </div>
  );
}

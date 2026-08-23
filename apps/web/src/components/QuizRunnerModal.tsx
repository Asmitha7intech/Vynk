import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Clock, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';
import { Quiz } from '@vynk/types';
import { api } from '../lib/api';
import { QuizResultsModal } from './QuizResultsModal';

interface QuizRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz;
}

export function QuizRunnerModal({ isOpen, onClose, quiz }: QuizRunnerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(quiz.timeLimitMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  const questions = quiz.questions || [];
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (!isOpen) return;
    setSecondsRemaining(quiz.timeLimitMinutes * 60);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowResults(false);

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, quiz]);

  const handleSelectOption = (optionIndex: number) => {
    if (!currentQuestion) return;
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: optionIndex,
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const answersPayload = questions.map((q) => ({
        questionId: q.id,
        selectedOptionIndex: selectedAnswers[q.id] ?? -1,
      }));

      const res = await api.submitQuiz(
        quiz.id,
        quiz.timeLimitMinutes * 60 - secondsRemaining,
        answersPayload
      );
      setResults(res);
      setShowResults(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal isOpen={isOpen && !showResults} onClose={onClose} title={quiz.title} maxWidth="2xl">
        <div className="space-y-6">
          {/* Header Bar: Progress & Timer */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/80 text-xs">
            <span className="font-bold text-indigo-400 font-mono">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <div className="flex items-center gap-1.5 font-bold font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(secondsRemaining)}</span>
            </div>
          </div>

          {/* Question Body */}
          {currentQuestion && (
            <div className="space-y-4 animate-in fade-in">
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Topic: {currentQuestion.topic}
                </span>
                <h3 className="text-base font-bold leading-relaxed text-foreground">
                  {currentQuestion.question}
                </h3>
              </div>

              {currentQuestion.codeSnippet && (
                <div className="rounded-2xl bg-[#090d16] border border-border/80 p-4 overflow-x-auto text-xs font-mono text-indigo-200">
                  <pre>{currentQuestion.codeSnippet}</pre>
                </div>
              )}

              {/* Options */}
              <div className="space-y-2.5 pt-2">
                {currentQuestion.options.map((opt, i) => {
                  const isSelected = selectedAnswers[currentQuestion.id] === i;
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelectOption(i)}
                      className={`w-full p-3.5 rounded-2xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-semibold ring-2 ring-indigo-500/30'
                          : 'border-border/80 bg-card hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>

            {currentIndex < questions.length - 1 ? (
              <Button
                size="sm"
                onClick={() => setCurrentIndex((prev) => prev + 1)}
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="accent"
                size="sm"
                isLoading={isSubmitting}
                onClick={handleSubmit}
              >
                Submit Quiz <CheckCircle2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {showResults && results && (
        <QuizResultsModal
          isOpen={showResults}
          onClose={() => {
            setShowResults(false);
            onClose();
          }}
          results={results}
          quizTitle={quiz.title}
        />
      )}
    </>
  );
}

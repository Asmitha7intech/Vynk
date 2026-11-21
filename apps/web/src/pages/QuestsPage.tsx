import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Trophy,
  Clock,
  Play,
  Flame,
  Target,
  ArrowRight,
  Code,
  Brain,
  Shield,
  Layers,
  Search,
  BookOpen,
} from 'lucide-react';
import { DailyQuestWidget } from '../components/DailyQuestWidget';
import { QuizRunnerModal } from '../components/QuizRunnerModal';
import { VynkButton } from '../components/vynk/VynkButton';
import { Pill } from '../components/vynk/Pill';
import { ProgressBar } from '../components/vynk/ProgressBar';
import { api } from '../lib/api';
import { Quiz, DailyChallenge } from '@vynk/types';
import { useAuthStore } from '../stores/authStore';
import { Link } from 'react-router-dom';

export function QuestsPage() {
  const { user } = useAuthStore();
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTrack, setActiveTrack] = useState<'FULLSTACK' | 'AI' | 'SYSTEMS'>('FULLSTACK');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadingQuizId, setLoadingQuizId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.getDailyChallenge().catch(() => null),
      api.getQuizzes().catch(() => []),
    ])
      .then(([chalRes, quizRes]) => {
        if (chalRes?.challenge) setChallenge(chalRes.challenge);
        setQuizzes(quizRes || []);
      })
      .finally(() => setIsLoading(false));

    api.trackEvent('quests_page_viewed');
  }, []);

  const handleStartQuiz = async (quiz: Quiz) => {
    try {
      setLoadingQuizId(quiz.id);
      const fullQuiz = await api.getQuiz(quiz.id);
      setActiveQuiz(fullQuiz || quiz);
    } catch (err) {
      console.error('Failed to load quiz questions', err);
      setActiveQuiz(quiz);
    } finally {
      setLoadingQuizId(null);
    }
  };

  // Career Tracks Definition for "VYNK Path"
  const CAREER_TRACKS = {
    FULLSTACK: {
      title: 'Full-Stack Systems Engineer',
      icon: Code,
      color: 'indigo',
      overallProgress: 72,
      skills: [
        { name: 'TypeScript & React', progress: 85 },
        { name: 'Node.js & Fastify API', progress: 78 },
        { name: 'Prisma & Data Modeling', progress: 65 },
        { name: 'Realtime WebSockets', progress: 60 },
      ],
      nextAction: {
        title: 'Ship a Voyage Milestone',
        description: 'Complete the WebAssembly pipeline milestone on NeuroVision to gain +100 XP.',
        link: '/voyages',
        linkText: 'View Voyages',
      },
    },
    AI: {
      title: 'AI & Multimodal Intelligence',
      icon: Brain,
      color: 'cyan',
      overallProgress: 60,
      skills: [
        { name: 'Python Slicing & Vectors', progress: 85 },
        { name: 'Edge Model Inference', progress: 60 },
        { name: 'Quantization & TensorRT', progress: 45 },
        { name: 'Multimodal Video Pipelines', progress: 50 },
      ],
      nextAction: {
        title: "Solve Today's Python Quest",
        description: 'Demonstrate memory reference and array slicing mastery for +20 XP.',
        link: '#daily-challenge',
        linkText: 'Jump to Challenge',
      },
    },
    SYSTEMS: {
      title: 'Distributed Infrastructure & Big Data',
      icon: Layers,
      color: 'amber',
      overallProgress: 55,
      skills: [
        { name: 'Medallion Data Lake', progress: 75 },
        { name: 'Kafka Event Outbox', progress: 60 },
        { name: 'Spark Batch Analytics', progress: 50 },
        { name: 'Resilient LocalStore Proxy', progress: 80 },
      ],
      nextAction: {
        title: 'Join Hackathon Squad',
        description: 'Assemble with a team needing distributed systems & backend talent.',
        link: '/crews',
        linkText: 'Explore Squads',
      },
    },
  };

  const CATEGORIES = [
    'ALL',
    'DSA & Algorithms',
    'Python',
    'Web Development',
    'Backend Architecture',
    'Databases & SQL',
    'AI & Machine Learning',
    'Cybersecurity',
    'Distributed Systems',
    'Big Data & Pipelines',
    'UI/UX Design',
    'Aptitude & Reasoning',
    'DevOps & Systems',
  ];

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      quiz.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      selectedCategory.toLowerCase().includes(quiz.category.toLowerCase());
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      quiz.title.toLowerCase().includes(query) ||
      quiz.description.toLowerCase().includes(query) ||
      quiz.category.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const currentTrackData = CAREER_TRACKS[activeTrack];

  return (
    <div className="space-y-6">
      {/* ── Hero Header ── */}
      <div className="p-6 sm:p-7 rounded-3xl glass-card space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Pill label="Technical Arena & VYNK Path" variant="amber" size="xs" />
              <span className="text-[11px] font-mono text-muted-foreground">
                Earn verified skill badges & XP
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-normal text-foreground">
              Technical Arena & Career Quests
            </h1>
            <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
              Sharpen algorithmic thinking, test system architecture concepts, and follow the VYNK Path to build real-world career readiness.
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 shrink-0">
            <Flame className="w-6 h-6 fill-current text-amber-400" />
            <div>
              <div className="text-xs font-black">Streak Multiplier: Active</div>
              <div className="text-[10px] text-muted-foreground">
                {user?.streakDays || 1}-day active consistency
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── VYNK Path: Career Progression Engine ── */}
      <div className="p-6 rounded-3xl glass-panel border border-indigo-500/25 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-sm font-black text-foreground">VYNK Path • Skill Development</h2>
              <p className="text-[11px] text-muted-foreground">
                Progress beyond raw XP. Connect verifiable skills to projects, quests, and opportunities.
              </p>
            </div>
          </div>

          {/* Track selector tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'FULLSTACK', label: 'Full-Stack', icon: Code },
              { id: 'AI', label: 'AI & ML', icon: Brain },
              { id: 'SYSTEMS', label: 'Distributed', icon: Layers },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTrack(t.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTrack === t.id
                    ? 'bg-indigo-600/15 border-indigo-500/30 text-indigo-300 shadow-sm'
                    : 'bg-white/5 border-white/5 text-muted-foreground hover:text-foreground'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Current Track Skills Breakdown */}
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">{currentTrackData.title}</span>
            <span className="font-mono text-xs font-bold text-indigo-400">
              {currentTrackData.overallProgress}% Complete
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentTrackData.skills.map((skill) => (
              <div key={skill.name} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground/90">{skill.name}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">{skill.progress}%</span>
                </div>
                <ProgressBar value={skill.progress} variant="indigo" size="sm" />
              </div>
            ))}
          </div>

          {/* Next Recommended Move */}
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-indigo-300">
                Next Recommended Step
              </span>
              <h4 className="text-xs font-bold text-foreground mt-0.5">{currentTrackData.nextAction.title}</h4>
              <p className="text-[11px] text-muted-foreground">{currentTrackData.nextAction.description}</p>
            </div>
            <Link to={currentTrackData.nextAction.link} className="shrink-0">
              <VynkButton size="xs" variant="primary" rightIcon={<ArrowRight className="w-3 h-3" />}>
                {currentTrackData.nextAction.linkText}
              </VynkButton>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Daily Quest Spotlight ── */}
      {challenge && (
        <div id="daily-challenge" className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Today&apos;s Daily Challenge</span>
          </h2>
          <DailyQuestWidget challenge={challenge} />
        </div>
      )}

      {/* ── Championship Quizzes & Arena Library ── */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Trophy className="w-4 h-4 text-indigo-400" />
              <span>Championship Arena & Skill Quests</span>
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Timed technical challenges across 12 disciplines. Verified XP credited to your builder profile.
            </p>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search challenges, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 shadow-sm'
                  : 'bg-white/5 border-white/5 text-muted-foreground hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 rounded-3xl glass-card animate-pulse space-y-3">
                <div className="h-4 w-28 bg-white/5 rounded" />
                <div className="h-3 w-full bg-white/5 rounded" />
              </div>
            ))}
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="p-8 text-center glass-card rounded-3xl border border-white/5 space-y-2">
            <BookOpen className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-xs font-semibold text-foreground">No challenges match your filter.</p>
            <p className="text-[11px] text-muted-foreground">Try clearing your search query or selecting a different category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="p-5 rounded-3xl glass-card border-white/5 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-indigo-400">{quiz.category}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-muted-foreground uppercase border border-white/5">
                        {quiz.difficulty}
                      </span>
                      <Pill
                        label={quiz.isWeeklySpecial ? 'Weekly Special' : 'Standard Arena'}
                        variant={quiz.isWeeklySpecial ? 'amber' : 'indigo'}
                        size="xs"
                      />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{quiz.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{quiz.description}</p>
                </div>

                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{quiz.timeLimitMinutes} mins</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>+{quiz.xpReward} XP</span>
                    </div>
                    {quiz.questions && quiz.questions.length > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        {quiz.questions.length} questions
                      </span>
                    )}
                  </div>

                  <VynkButton
                    size="sm"
                    onClick={() => handleStartQuiz(quiz)}
                    isLoading={loadingQuizId === quiz.id}
                    leftIcon={<Play className="w-3.5 h-3.5" />}
                    className="w-full text-xs"
                  >
                    Enter Timed Arena
                  </VynkButton>
                </div>
              </div>
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

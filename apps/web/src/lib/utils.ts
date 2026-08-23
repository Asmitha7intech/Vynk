import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const LEVEL_TIERS: Record<number, { title: string; minXP: number; color: string }> = {
  1: { title: 'Newcomer', minXP: 0, color: 'text-slate-400' },
  2: { title: 'Explorer', minXP: 50, color: 'text-emerald-400' },
  3: { title: 'Learner', minXP: 200, color: 'text-cyan-400' },
  4: { title: 'Builder', minXP: 450, color: 'text-blue-400' },
  5: { title: 'Skilled Builder', minXP: 800, color: 'text-indigo-400' },
  6: { title: 'Specialist', minXP: 1250, color: 'text-purple-400' },
  7: { title: 'Expert', minXP: 1800, color: 'text-pink-400' },
  8: { title: 'Mentor', minXP: 2450, color: 'text-amber-400' },
  9: { title: 'Community Leader', minXP: 3200, color: 'text-rose-400' },
  10: { title: 'Legend', minXP: 4050, color: 'text-yellow-300' },
};

export function getLevelDetails(level: number) {
  return LEVEL_TIERS[level] || LEVEL_TIERS[1];
}

export function getNextLevelProgress(xp: number, currentLevel: number) {
  const currentLevelMinXP = LEVEL_TIERS[currentLevel]?.minXP ?? 0;
  const nextLevel = Math.min(10, currentLevel + 1);
  const nextLevelMinXP = LEVEL_TIERS[nextLevel]?.minXP ?? 4050;

  if (currentLevel >= 10) return { progress: 100, xpToNext: 0, nextLevelTitle: 'Max Level' };

  const totalNeeded = nextLevelMinXP - currentLevelMinXP;
  const currentProgress = Math.max(0, xp - currentLevelMinXP);
  const progressPercent = Math.min(100, Math.round((currentProgress / totalNeeded) * 100));

  return {
    progress: progressPercent,
    xpToNext: Math.max(0, nextLevelMinXP - xp),
    nextLevelTitle: LEVEL_TIERS[nextLevel].title,
  };
}

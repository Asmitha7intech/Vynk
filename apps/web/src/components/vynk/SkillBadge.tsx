import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SkillBadgeProps {
  name: string;
  category?: string;
  proficiency?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  isVerified?: boolean;
  size?: 'sm' | 'md';
  onClick?: () => void;
  className?: string;
}

export function SkillBadge({
  name,
  category = 'Engineering',
  proficiency,
  isVerified = false,
  size = 'md',
  onClick,
  className,
}: SkillBadgeProps) {
  const categoryStyles: Record<string, string> = {
    Frontend: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25 hover:border-indigo-400/40',
    Backend: 'bg-sky-500/10 text-sky-300 border-sky-500/25 hover:border-sky-400/40',
    'AI/ML': 'bg-purple-500/10 text-purple-300 border-purple-500/25 hover:border-purple-400/40',
    Design: 'bg-rose-500/10 text-rose-300 border-rose-500/25 hover:border-rose-400/40',
    Security: 'bg-amber-500/10 text-amber-300 border-amber-500/25 hover:border-amber-400/40',
    Systems: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25 hover:border-emerald-400/40',
    default: 'bg-white/5 text-foreground/90 border-white/10 hover:border-white/20',
  };

  const currentCategoryStyle = categoryStyles[category] || categoryStyles.default;

  const proficiencyDots: Record<string, number> = {
    BEGINNER: 1,
    INTERMEDIATE: 2,
    ADVANCED: 3,
    EXPERT: 4,
  };

  const dotsCount = proficiency ? proficiencyDots[proficiency] || 1 : 0;

  return (
    <div
      onClick={onClick}
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-full border transition-all select-none',
          size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
          currentCategoryStyle,
          onClick && 'cursor-pointer active:scale-95',
          className
        )
      )}
    >
      <span className="font-semibold">{name}</span>

      {isVerified && (
        <span title="Verified Skill" className="inline-flex items-center">
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
        </span>
      )}

      {dotsCount > 0 && (
        <div className="flex items-center gap-0.5 ml-0.5 opacity-60">
          {[1, 2, 3, 4].map((dot) => (
            <span
              key={dot}
              className={clsx(
                'w-1 h-1 rounded-full',
                dot <= dotsCount ? 'bg-current' : 'bg-current/20'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

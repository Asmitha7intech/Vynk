import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface PillProps {
  label: string;
  variant?: 'indigo' | 'cyan' | 'amber' | 'emerald' | 'rose' | 'neutral';
  icon?: React.ReactNode;
  pulseDot?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function Pill({
  label,
  variant = 'indigo',
  icon,
  pulseDot = false,
  size = 'sm',
  className,
}: PillProps) {
  const variants = {
    indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25',
    cyan: 'bg-sky-500/10 text-sky-300 border-sky-500/25',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
    rose: 'bg-rose-500/10 text-rose-300 border-rose-500/25',
    neutral: 'bg-white/5 text-muted-foreground border-white/10',
  };

  const dotColors = {
    indigo: 'bg-indigo-400',
    cyan: 'bg-sky-400',
    amber: 'bg-amber-400',
    emerald: 'bg-emerald-400',
    rose: 'bg-rose-400',
    neutral: 'bg-slate-400',
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-xs',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-full border font-semibold select-none shrink-0',
          variants[variant],
          sizes[size],
          className
        )
      )}
    >
      {pulseDot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full animate-pulse shrink-0', dotColors[variant])} />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{label}</span>
    </span>
  );
}

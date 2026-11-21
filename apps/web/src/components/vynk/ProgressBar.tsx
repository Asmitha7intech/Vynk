import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  variant?: 'indigo' | 'cyan' | 'amber' | 'emerald';
  showLabel?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'indigo',
  showLabel = false,
  label,
  size = 'md',
  className,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const heights = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const gradients = {
    indigo: 'bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-glow-indigo',
    cyan: 'bg-gradient-to-r from-sky-600 to-sky-400 shadow-glow-cyan',
    amber: 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-glow-amber',
    emerald: 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-glow-emerald',
  };

  return (
    <div className={twMerge(clsx('w-full space-y-1.5', className))}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-xs font-semibold">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showLabel && (
            <span className="font-mono text-foreground/80">{Math.round(percentage)}%</span>
          )}
        </div>
      )}

      <div className={twMerge(clsx('w-full bg-white/5 border border-white/5 rounded-full overflow-hidden relative', heights[size]))}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={twMerge(clsx('h-full rounded-full relative', gradients[variant]))}
        />
      </div>
    </div>
  );
}

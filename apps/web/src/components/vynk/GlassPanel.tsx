import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: 'base' | 'elevated' | 'floating';
  glow?: 'indigo' | 'cyan' | 'amber' | 'none';
  children: React.ReactNode;
}

export function GlassPanel({
  level = 'base',
  glow = 'none',
  className,
  children,
  ...props
}: GlassPanelProps) {
  const levelStyles = {
    base: 'bg-surface/70 backdrop-blur-md border border-surface-border shadow-elevation-low',
    elevated: 'bg-surface-elevated/80 backdrop-blur-xl border border-white/10 shadow-elevation-mid',
    floating: 'bg-surface-floating/90 backdrop-blur-2xl border border-white/15 shadow-elevation-high',
  };

  const glowStyles = {
    none: '',
    indigo: 'shadow-glow-indigo border-indigo-500/30',
    cyan: 'shadow-glow-cyan border-sky-500/30',
    amber: 'shadow-glow-amber border-amber-500/30',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'rounded-3xl transition-all duration-300 relative overflow-hidden',
          levelStyles[level],
          glowStyles[glow],
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}

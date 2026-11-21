import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { VynkButton } from './VynkButton';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={`p-10 sm:p-14 text-center rounded-3xl glass-panel space-y-4 max-w-md mx-auto my-6 ${className || ''}`}>
      <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-glow-indigo">
        <Icon className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-foreground tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
          {description}
        </p>
      </div>

      {actionLabel && onAction && (
        <div className="pt-2">
          <VynkButton size="sm" onClick={onAction}>
            {actionLabel}
          </VynkButton>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { cn } from '../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>}
        <input
          type={type}
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl bg-surface-elevated dark:bg-[#0d121f] border border-surface-border dark:border-white/10 hover:border-surface-border/80 text-foreground dark:text-white placeholder:text-muted-foreground text-sm caret-indigo-500 dark:caret-cyan-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-150',
            error && 'border-red-500 focus:ring-red-500/50',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>
    );
  }
);

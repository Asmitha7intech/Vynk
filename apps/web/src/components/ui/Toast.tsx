import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id?: string;
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  className?: string;
}

export function Toast({
  type = 'info',
  title,
  message,
  duration = 4000,
  onClose,
  className,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-secondary" />,
    error: <AlertCircle className="w-4 h-4 text-highlight" />,
    info: <Info className="w-4 h-4 text-primary" />,
  };

  const borders = {
    success: 'border-secondary/20 bg-secondary/5',
    error: 'border-highlight/20 bg-highlight/5',
    info: 'border-primary/20 bg-primary/5',
  };

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-start gap-3 p-4 rounded-2xl bg-surface-elevated/95 backdrop-blur-md border shadow-xl max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-200',
        borders[type],
        className
      )}
    >
      <div className="shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-foreground">{title}</h4>
        {message && <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

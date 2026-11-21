import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { VynkButton } from './VynkButton';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something didn\'t load quite right',
  message = 'We encountered an unexpected network bump. Your data is safe.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={`p-8 sm:p-12 text-center rounded-3xl glass-panel border-rose-500/20 space-y-4 max-w-md mx-auto my-6 ${className || ''}`}>
      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">{message}</p>
      </div>

      {onRetry && (
        <div className="pt-2">
          <VynkButton
            size="sm"
            variant="outline"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={onRetry}
          >
            Retry
          </VynkButton>
        </div>
      )}
    </div>
  );
}

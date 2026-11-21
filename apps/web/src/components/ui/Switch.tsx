import React from 'react';
import { cn } from '../../lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function Switch({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  size = 'md',
  className,
}: SwitchProps) {
  const isSm = size === 'sm';

  return (
    <label
      className={cn(
        'inline-flex items-center gap-3 select-none',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex shrink-0 transition-colors duration-200 ease-in-out rounded-full border-2 border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          isSm ? 'h-5 w-9' : 'h-6 w-11',
          checked ? 'bg-primary' : 'bg-surface-border'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow-md transform ring-0 transition duration-200 ease-in-out',
            isSm ? 'h-4 w-4' : 'h-5 w-5',
            checked ? (isSm ? 'translate-x-4' : 'translate-x-5') : 'translate-x-0'
          )}
        />
      </button>

      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-xs font-semibold text-foreground">{label}</span>}
          {description && <span className="text-[11px] text-muted-foreground">{description}</span>}
        </div>
      )}
    </label>
  );
}

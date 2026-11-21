import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  showShortcut?: boolean;
}

export function SearchInput({
  value,
  onChange,
  onClear,
  showShortcut = true,
  placeholder = 'Search students, skills, crews, voyages...',
  className,
  ...props
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showShortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcut]);

  return (
    <div className={twMerge(clsx('relative flex items-center w-full', className))}>
      <Search className="absolute left-3.5 w-4 h-4 text-muted-foreground/70 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-16 py-2 bg-surface/80 hover:bg-surface border border-surface-border rounded-xl text-sm placeholder:text-muted-foreground/60 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all backdrop-blur-md"
        {...props}
      />

      <div className="absolute right-2.5 flex items-center gap-1">
        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange('');
              onClear?.();
              inputRef.current?.focus();
            }}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : showShortcut ? (
          <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/70 bg-white/5 border border-white/10 rounded-md">
            /
          </kbd>
        ) : null}
      </div>
    </div>
  );
}

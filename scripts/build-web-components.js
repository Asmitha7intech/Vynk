const fs = require('fs');
const path = require('path');

const webComponentsDir = path.resolve(__dirname, '../apps/web/src/components');

function writeFile(filename, content) {
  const filePath = path.join(webComponentsDir, filename);
  fs.writeFileSync(filePath, content.trim() + '\n', 'utf8');
  console.log('Created component:', filename);
}

// 1. Avatar.tsx
writeFile('Avatar.tsx', `
import React from 'react';
import { cn } from '../lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  className?: string;
}

export function Avatar({ src, alt, fallback, size = 'md', isOnline, className }: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-semibold',
    xl: 'w-20 h-20 text-xl font-bold',
  };

  const badgeSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
  };

  const initials = fallback ? fallback.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2) : 'VK';

  return (
    <div className={cn('relative inline-block flex-shrink-0', className)}>
      <div className={cn('rounded-full overflow-hidden flex items-center justify-center bg-indigo-950/80 border border-indigo-500/30 text-indigo-200 font-medium', sizes[size])}>
        {src ? (
          <img src={src} alt={alt || fallback} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {isOnline !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-card',
            isOnline ? 'bg-emerald-500 ring-2 ring-emerald-500/20' : 'bg-slate-500',
            badgeSizes[size]
          )}
        />
      )}
    </div>
  );
}
`);

// 2. Input.tsx
writeFile('Input.tsx', `
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
            'w-full px-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-150',
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
`);

// 3. Modal.tsx
writeFile('Modal.tsx', `
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'lg' }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={cn(
          'bg-card text-card-foreground rounded-3xl border border-border w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200',
          maxWidths[maxWidth]
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80">
          {title ? <h2 className="text-lg font-bold tracking-tight">{title}</h2> : <div />}
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
`);

// 4. XPProgressBar.tsx
writeFile('XPProgressBar.tsx', `
import React from 'react';
import { getNextLevelProgress, getLevelDetails } from '../lib/utils';
import { Sparkles } from 'lucide-react';

interface XPProgressBarProps {
  xp: number;
  level: number;
  showLabels?: boolean;
}

export function XPProgressBar({ xp, level, showLabels = true }: XPProgressBarProps) {
  const { progress, xpToNext, nextLevelTitle } = getNextLevelProgress(xp, level);
  const currentLevelInfo = getLevelDetails(level);

  return (
    <div className="w-full space-y-1.5">
      {showLabels && (
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Level {level} · {currentLevelInfo.title}</span>
          </div>
          <span className="text-muted-foreground font-mono">{xp} XP {xpToNext > 0 ? `(${xpToNext} to ${nextLevelTitle})` : '(Maxed)'}</span>
        </div>
      )}
      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden p-0.5 border border-border/50">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-amber-400 rounded-full transition-all duration-500 shadow-sm"
          style={{ width: \`\${Math.max(4, progress)}%\` }}
        />
      </div>
    </div>
  );
}
`);

// 5. LevelBadge.tsx
writeFile('LevelBadge.tsx', `
import React from 'react';
import { getLevelDetails } from '../lib/utils';
import { Shield } from 'lucide-react';

export function LevelBadge({ level, size = 'md' }: { level: number; size?: 'sm' | 'md' | 'lg' }) {
  const details = getLevelDetails(level);

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  };

  return (
    <div className={\`inline-flex items-center rounded-full font-semibold bg-indigo-500/10 border border-indigo-500/20 \${details.color} \${sizes[size]}\`}>
      <Shield className="w-3.5 h-3.5 fill-current opacity-70" />
      <span>Lvl {level} · {details.title}</span>
    </div>
  );
}
`);

// 6. StreakBadge.tsx
writeFile('StreakBadge.tsx', `
import React from 'react';
import { Flame } from 'lucide-react';

export function StreakBadge({ streakDays }: { streakDays: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-sm shadow-amber-500/10">
      <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-500 animate-pulse" />
      <span>{streakDays} Day Streak</span>
    </div>
  );
}
`);

console.log('Core UI primitives created!');

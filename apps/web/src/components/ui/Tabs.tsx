import React from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'underline' | 'pills' | 'segmented';
}

export function Tabs({ tabs, activeTab, onChange, className, variant = 'segmented' }: TabsProps) {
  if (variant === 'segmented') {
    return (
      <div
        className={cn(
          'flex items-center p-1 rounded-xl bg-surface-elevated border border-surface-border gap-1',
          className
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              {tab.icon && <span className="w-3.5 h-3.5">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-mono',
                    isActive ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Underline variant
  return (
    <div className={cn('flex items-center border-b border-surface-border gap-6', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 py-3 text-sm font-semibold border-b-2 -mb-px transition-all cursor-pointer',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-surface-border'
            )}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/10 text-primary font-mono">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

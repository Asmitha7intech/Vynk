import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ProgressRingProps {
  value: number; // 0 to 100
  size?: number; // width & height in px
  strokeWidth?: number;
  variant?: 'indigo' | 'cyan' | 'amber' | 'emerald';
  children?: React.ReactNode;
  className?: string;
}

export function ProgressRing({
  value,
  size = 56,
  strokeWidth = 4,
  variant = 'indigo',
  children,
  className,
}: ProgressRingProps) {
  const percentage = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const strokeColors = {
    indigo: '#6366f1',
    cyan: '#0ea5e9',
    amber: '#f59e0b',
    emerald: '#10b981',
  };

  return (
    <div
      className={twMerge(clsx('relative inline-flex items-center justify-center shrink-0', className))}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Animated Progress Arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColors[variant]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>

      {/* Center Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (
          <span className="font-mono font-extrabold text-xs text-foreground">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    </div>
  );
}

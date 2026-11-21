import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'rounded';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = 'rounded',
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  const variantStyles = {
    rectangular: 'rounded-none',
    rounded: 'rounded-2xl',
    circular: 'rounded-full',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'bg-white/5 relative overflow-hidden',
          variantStyles[variant],
          className
        )
      )}
      style={{ width, height, ...style }}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}

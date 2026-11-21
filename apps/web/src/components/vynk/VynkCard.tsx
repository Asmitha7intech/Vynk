import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface VynkCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  glowOnHover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function VynkCard({
  interactive = false,
  glowOnHover = false,
  padding = 'md',
  className,
  children,
  onClick,
  ...props
}: VynkCardProps) {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-7',
  };

  const cardContent = (
    <div
      className={twMerge(
        clsx(
          'glass-card rounded-3xl relative overflow-hidden',
          paddingStyles[padding],
          interactive && 'cursor-pointer',
          glowOnHover && 'hover:shadow-glow-indigo hover:border-indigo-500/40',
          className
        )
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );

  if (interactive) {
    return (
      <motion.div
        whileHover={{ y: -3, scale: 1.008 }}
        whileTap={{ scale: 0.992 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
}

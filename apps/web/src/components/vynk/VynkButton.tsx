import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface VynkButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'glass' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export function VynkButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: VynkButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-bold tracking-tight rounded-xl transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50';

  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/20 hover:shadow-indigo-500/40',
    secondary: 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/25 border border-sky-400/20 hover:shadow-sky-500/40',
    glass: 'bg-white/5 hover:bg-white/10 text-foreground border border-white/10 backdrop-blur-md hover:border-white/20',
    outline: 'bg-transparent hover:bg-white/5 text-foreground border border-border/80 hover:border-indigo-500/40',
    ghost: 'bg-transparent hover:bg-white/5 text-muted-foreground hover:text-foreground',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 border border-rose-400/20 hover:shadow-rose-500/40',
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-[11px] gap-1.5 rounded-lg',
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-xl',
    md: 'px-4 py-2 text-xs gap-2 rounded-xl',
    lg: 'px-5 py-2.5 text-sm gap-2.5 rounded-2xl',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </motion.button>
  );
}

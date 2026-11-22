import React from 'react';
import { Link } from 'react-router-dom';

export interface VynkLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  tagline?: string;
  linkToHome?: boolean;
  className?: string;
  compactOnMobile?: boolean;
  animateHover?: boolean;
}

const SIZE_MAP = {
  xs: {
    icon: 'w-6 h-6',
    text: 'text-sm',
    tagline: 'text-[8px]',
    gap: 'gap-1.5',
  },
  sm: {
    icon: 'w-7 h-7',
    text: 'text-base',
    tagline: 'text-[9px]',
    gap: 'gap-2',
  },
  md: {
    icon: 'w-9 h-9',
    text: 'text-xl',
    tagline: 'text-[9px]',
    gap: 'gap-2.5',
  },
  lg: {
    icon: 'w-12 h-12',
    text: 'text-2xl',
    tagline: 'text-[10px]',
    gap: 'gap-3',
  },
  xl: {
    icon: 'w-16 h-16',
    text: 'text-3xl',
    tagline: 'text-xs',
    gap: 'gap-3.5',
  },
};

/**
 * Standardized VYNK Official Brand Lockup Component
 * Renders the three-interlocking-hands artwork (Green, Yellow, Red) on the left
 * alongside the bold VYNK wordmark on the right with strict aspect ratio preservation.
 */
export function VynkLogo({
  size = 'md',
  showWordmark = true,
  tagline,
  linkToHome = false,
  className = '',
  compactOnMobile = false,
  animateHover = true,
}: VynkLogoProps) {
  const current = SIZE_MAP[size] || SIZE_MAP.md;

  const content = (
    <div
      className={`inline-flex items-center ${current.gap} select-none transition-transform ${
        animateHover ? 'group hover:opacity-95' : ''
      } ${className}`}
    >
      {/* Official Three-Interlocking-Hands Symbol */}
      <div className={`relative ${current.icon} shrink-0 flex items-center justify-center`}>
        <img
          src="/vynk-logo.png"
          alt="VYNK — Student Social & Collaboration Platform"
          className={`w-full h-full object-contain ${
            animateHover ? 'transition-transform duration-200 group-hover:scale-105' : ''
          }`}
          loading="eager"
        />
      </div>

      {/* VYNK Wordmark */}
      {showWordmark && (
        <div
          className={`flex flex-col justify-center leading-none ${
            compactOnMobile ? 'hidden sm:flex' : 'flex'
          }`}
        >
          <span
            className={`font-black tracking-normal text-white font-sans ${current.text} leading-none`}
          >
            VYNK
          </span>
          {tagline && (
            <span
              className={`font-mono uppercase tracking-wider text-muted-foreground font-semibold mt-0.5 ${current.tagline}`}
            >
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="inline-flex items-center focus:outline-none" aria-label="VYNK Home">
        {content}
      </Link>
    );
  }

  return content;
}

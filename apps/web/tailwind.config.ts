/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: {
          DEFAULT: 'var(--surface)',
          elevated: 'var(--surface-elevated)',
          floating: 'var(--surface-floating)',
          border: 'var(--surface-border)',
        },
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        primary: {
          DEFAULT: '#6366f1', // Electric Indigo
          foreground: '#ffffff',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          glow: 'rgba(99, 102, 241, 0.4)',
        },
        secondary: {
          DEFAULT: '#0ea5e9', // Cyber Cyan
          foreground: '#ffffff',
          50: '#f0f9ff',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          glow: 'rgba(14, 165, 233, 0.4)',
        },
        accent: {
          DEFAULT: '#f59e0b', // Amber Gold (XP/Bounties)
          foreground: '#000000',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          glow: 'rgba(245, 158, 11, 0.4)',
        },
        success: {
          DEFAULT: '#10b981', // Emerald Green
          foreground: '#ffffff',
          500: '#10b981',
          600: '#059669',
        },
        danger: {
          DEFAULT: '#f43f5e', // Rose Red
          foreground: '#ffffff',
          500: '#f43f5e',
          600: '#e11d48',
        },
        neon: {
          cyan: '#00F0FF',
          violet: '#8B5CF6',
          magenta: '#FF2E93',
          emerald: '#10B981',
        },
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        border: 'var(--border)',
      },
      borderRadius: {
        xs: '0.375rem',
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        pill: '9999px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-hover': '0 12px 40px 0 rgba(0, 0, 0, 0.5)',
        'glow-indigo': '0 0 25px -4px rgba(99, 102, 241, 0.35)',
        'glow-cyan': '0 0 25px -4px rgba(14, 165, 233, 0.35)',
        'glow-amber': '0 0 25px -4px rgba(245, 158, 11, 0.35)',
        'glow-emerald': '0 0 25px -4px rgba(16, 185, 129, 0.35)',
        'glow-neon-cyan': '0 0 30px -4px rgba(0, 240, 255, 0.45)',
        'glow-neon-violet': '0 0 30px -4px rgba(139, 92, 246, 0.45)',
        'glow-neon-magenta': '0 0 30px -4px rgba(255, 46, 147, 0.45)',
        'elevation-low': '0 2px 8px -2px rgba(0, 0, 0, 0.3)',
        'elevation-mid': '0 8px 24px -4px rgba(0, 0, 0, 0.4)',
        'elevation-high': '0 16px 48px -8px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s infinite ease-in-out',
        'shimmer': 'shimmer 2.5s infinite linear',
        'float': 'float 4s infinite ease-in-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};

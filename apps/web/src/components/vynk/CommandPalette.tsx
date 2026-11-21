import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Compass,
  Sparkles,
  Users,
  Shield,
  Layers,
  MessageSquare,
  Trophy,
  User,
  PlusCircle,
  ArrowRight,
  Flame,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreatePost?: () => void;
}

export function CommandPalette({ isOpen, onClose, onOpenCreatePost }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const navigationItems = [
    { label: 'Campus Feed', href: '/', icon: Compass, category: 'Navigation' },
    { label: 'Explore Builders & Projects', href: '/explore', icon: Sparkles, category: 'Navigation' },
    { label: 'My Vynks & Graph', href: '/network', icon: Users, category: 'Navigation' },
    { label: 'Hackathon Crews', href: '/crews', icon: Shield, category: 'Navigation' },
    { label: 'Voyages Showcase', href: '/voyages', icon: Layers, category: 'Navigation' },
    { label: 'Daily Quests & Arena', href: '/quests', icon: Flame, category: 'Navigation' },
    { label: 'Direct Messages', href: '/messages', icon: MessageSquare, category: 'Navigation' },
    { label: 'Leaderboard Rankings', href: '/leaderboard', icon: Trophy, category: 'Navigation' },
    { label: 'My Builder Profile', href: user ? `/profile/${user.username}` : '/auth', icon: User, category: 'Navigation' },
  ];

  const actionItems = [
    {
      label: 'Create Post Dispatch',
      action: () => {
        onClose();
        onOpenCreatePost?.();
      },
      icon: PlusCircle,
      category: 'Quick Actions',
    },
    {
      label: 'Start Today\'s Daily Challenge',
      action: () => {
        onClose();
        navigate('/quests');
      },
      icon: Flame,
      category: 'Quick Actions',
    },
    {
      label: 'Find Teammates with Smart Match',
      action: () => {
        onClose();
        navigate('/network');
      },
      icon: Sparkles,
      category: 'Quick Actions',
    },
  ];

  const allItems = [...actionItems, ...navigationItems];

  const filteredItems = query.trim()
    ? allItems.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle palette on Ctrl+K, Cmd+K, or slash when not typing in form inputs
      if (
        (e.key === 'k' && (e.metaKey || e.ctrlKey)) ||
        (e.key === '/' && !isOpen && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')
      ) {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // reset and open handled by parent
      }

      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          if ('action' in selected && selected.action) {
            selected.action();
          } else if ('href' in selected && selected.href) {
            onClose();
            navigate(selected.href);
          }
        } else if (query.trim()) {
          onClose();
          navigate(`/explore?q=${encodeURIComponent(query.trim())}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, query, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 bg-background/80 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl glass-elevated rounded-3xl border border-white/10 shadow-2xl relative z-10 overflow-hidden flex flex-col"
        >
          {/* Header & Search Bar */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
            <Search className="w-5 h-5 text-indigo-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search or jump to anywhere in VYNK..."
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/70 text-sm focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-white/5 border border-white/10 rounded-md">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  No direct commands for &quot;{query}&quot;
                </p>
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/explore?q=${encodeURIComponent(query)}`);
                  }}
                  className="text-xs font-bold text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Search entire campus on Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    onClick={() => {
                      if ('action' in item && item.action) {
                        item.action();
                      } else if ('href' in item && item.href) {
                        onClose();
                        navigate(item.href);
                      }
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/25 shadow-sm'
                        : 'text-foreground/80 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-muted-foreground'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-semibold">{item.label}</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-muted-foreground uppercase opacity-70">
                      {item.category}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="px-4 py-2 border-t border-white/5 bg-white/[0.02] flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>Navigate <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded">↑</kbd> <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded">↓</kbd></span>
              <span>Select <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded">↵</kbd></span>
            </div>
            <span>Press <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded">/</kbd> anywhere to open</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon, Sparkles, Plus } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { StreakBadge } from './StreakBadge';

interface NavbarProps {
  onOpenCreatePost?: () => void;
}

export function Navbar({ onOpenCreatePost }: NavbarProps) {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-card/80 backdrop-blur-md border-b border-border/80 px-4 lg:px-8 py-2.5 flex items-center justify-between">
      {/* Brand & Search */}
      <div className="flex items-center gap-6 flex-1 max-w-xl">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            V
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-foreground via-foreground to-indigo-400 bg-clip-text text-transparent">
            VYNK
          </span>
        </Link>

        <form onSubmit={handleSearchSubmit} className="relative flex-1 hidden md:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students, skills, crews, voyages..."
            className="w-full pl-10 pr-4 py-2 bg-muted/60 hover:bg-muted border border-border/60 rounded-xl text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
          />
        </form>
      </div>

      {/* Action shortcuts */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden sm:flex items-center gap-2.5">
            <StreakBadge streakDays={user.streakDays || 1} />
            <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-bold text-indigo-400 flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 fill-current" />
              <span>{user.xp} XP</span>
            </div>
          </div>
        )}

        {onOpenCreatePost && (
          <Button size="sm" onClick={onOpenCreatePost} className="hidden sm:inline-flex">
            <Plus className="w-4 h-4" />
            <span>Create</span>
          </Button>
        )}

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button
          aria-label="Notifications"
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        </button>

        {user ? (
          <Link to={`/profile/${user.username}`} className="flex items-center gap-2 pl-2">
            <Avatar src={user.avatarUrl} fallback={user.displayName} size="sm" />
          </Link>
        ) : (
          <Link to="/auth">
            <Button size="sm">Sign In</Button>
          </Link>
        )}
      </div>
    </header>
  );
}

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, Sparkles, PlusCircle, MessageSquare, User, Users } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface MobileNavProps {
  onOpenCreate?: () => void;
}

export function MobileNav({ onOpenCreate }: MobileNavProps) {
  const { user } = useAuthStore();

  const profileHref = user ? `/profile/${user.username}` : '/auth';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-surface/90 backdrop-blur-xl border-t border-surface-border px-3 py-1.5 flex items-center justify-around shadow-2xl safe-bottom">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `min-w-[44px] min-h-[44px] flex flex-col items-center justify-center gap-1 p-1 text-[10px] font-bold transition-colors ${
            isActive ? 'text-indigo-400' : 'text-muted-foreground hover:text-foreground'
          }`
        }
      >
        <Compass className="w-5 h-5" />
        <span>Feed</span>
      </NavLink>

      <NavLink
        to="/explore"
        className={({ isActive }) =>
          `min-w-[44px] min-h-[44px] flex flex-col items-center justify-center gap-1 p-1 text-[10px] font-bold transition-colors ${
            isActive ? 'text-indigo-400' : 'text-muted-foreground hover:text-foreground'
          }`
        }
      >
        <Sparkles className="w-5 h-5" />
        <span>Explore</span>
      </NavLink>

      {/* Floating Quick Action Button */}
      <button
        onClick={onOpenCreate}
        aria-label="Create Dispatch"
        className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center -mt-5 shadow-glow-indigo transition-transform active:scale-95 cursor-pointer border border-indigo-400/30"
      >
        <PlusCircle className="w-6 h-6" />
      </button>

      <NavLink
        to="/network"
        className={({ isActive }) =>
          `min-w-[44px] min-h-[44px] flex flex-col items-center justify-center gap-1 p-1 text-[10px] font-bold transition-colors ${
            isActive ? 'text-indigo-400' : 'text-muted-foreground hover:text-foreground'
          }`
        }
      >
        <Users className="w-5 h-5" />
        <span>Vynks</span>
      </NavLink>

      <NavLink
        to={profileHref}
        className={({ isActive }) =>
          `min-w-[44px] min-h-[44px] flex flex-col items-center justify-center gap-1 p-1 text-[10px] font-bold transition-colors ${
            isActive ? 'text-indigo-400' : 'text-muted-foreground hover:text-foreground'
          }`
        }
      >
        <User className="w-5 h-5" />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}

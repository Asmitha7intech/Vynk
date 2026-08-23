import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, Sparkles, PlusCircle, MessageSquare, User, Shield } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface MobileNavProps {
  onOpenCreate?: () => void;
}

export function MobileNav({ onOpenCreate }: MobileNavProps) {
  const { user } = useAuthStore();

  const profileHref = user ? `/profile/${user.username}` : '/auth';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/95 backdrop-blur-lg border-t border-border px-4 py-2 flex items-center justify-around shadow-2xl">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-1 text-[10px] font-bold ${
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
          `flex flex-col items-center gap-1 p-1 text-[10px] font-bold ${
            isActive ? 'text-indigo-400' : 'text-muted-foreground hover:text-foreground'
          }`
        }
      >
        <Sparkles className="w-5 h-5" />
        <span>Explore</span>
      </NavLink>

      {/* Floating Quick Action */}
      <button
        onClick={onOpenCreate}
        className="w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center -mt-5 shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 cursor-pointer"
      >
        <PlusCircle className="w-6 h-6" />
      </button>

      <NavLink
        to="/messages"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-1 text-[10px] font-bold ${
            isActive ? 'text-indigo-400' : 'text-muted-foreground hover:text-foreground'
          }`
        }
      >
        <MessageSquare className="w-5 h-5" />
        <span>Chat</span>
      </NavLink>

      <NavLink
        to={profileHref}
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 p-1 text-[10px] font-bold ${
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

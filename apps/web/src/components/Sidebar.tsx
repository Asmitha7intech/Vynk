import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  Users,
  Shield,
  Layers,
  Sparkles,
  GraduationCap,
  MessageSquare,
  Trophy,
  Calendar,
  ShieldAlert,
  PlusCircle,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Button } from './Button';

interface SidebarProps {
  onOpenCreatePost?: () => void;
}

export function Sidebar({ onOpenCreatePost }: SidebarProps = {}) {
  const { user } = useAuthStore();

  const navItems = [
    { label: 'Campus Feed', href: '/', icon: Compass },
    { label: 'Explore', href: '/explore', icon: Sparkles },
    { label: 'My Vynks', href: '/network', icon: Users },
    { label: 'Crews (Teams)', href: '/crews', icon: Shield },
    { label: 'Voyages (Projects)', href: '/voyages', icon: Layers },
    { label: 'Quests & Arena', href: '/quests', icon: Sparkles },
    { label: 'Verified Mentors', href: '/mentors', icon: GraduationCap },
    { label: 'Events & Hacks', href: '/events', icon: Calendar },
    { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { label: 'Messenger', href: '/messages', icon: MessageSquare },
  ];

  if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
    navItems.push({ label: 'Safety & Moderation', href: '/admin', icon: ShieldAlert });
  }

  return (
    <aside className="w-64 flex-shrink-0 hidden md:block">
      <div className="sticky top-20 space-y-4">
        {onOpenCreatePost && (
          <Button
            onClick={onOpenCreatePost}
            className="w-full shadow-lg shadow-indigo-500/20 py-2.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Dispatch</span>
          </Button>
        )}

        <nav className="p-3 bg-card rounded-3xl border border-border space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Dynamic VYNK Quote Card */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-card to-card border border-indigo-500/20 space-y-2">
          <div className="text-[10px] font-black tracking-wider text-indigo-400 uppercase">
            Product Ethos
          </div>
          <p className="text-xs font-semibold text-foreground leading-relaxed">
            "Your campus is full of people you haven't met yet."
          </p>
          <div className="text-[10px] text-muted-foreground">Find your people. Build together.</div>
        </div>
      </div>
    </aside>
  );
}

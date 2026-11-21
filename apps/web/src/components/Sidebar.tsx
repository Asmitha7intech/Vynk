import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  Users,
  Shield,
  Layers,
  Flame,
  GraduationCap,
  Calendar,
  Trophy,
  MessageSquare,
  ShieldAlert,
  PlusCircle,
  Activity,
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { VynkButton } from './vynk/VynkButton';

interface SidebarProps {
  onOpenCreatePost?: () => void;
}

export function Sidebar({ onOpenCreatePost }: SidebarProps = {}) {
  const { user } = useAuthStore();

  const navCategories = [
    {
      title: 'Campus Life',
      items: [
        { label: 'Campus Feed', href: '/', icon: Compass },
        { label: 'Explore', href: '/explore', icon: Sparkles },
        { label: 'People & Vynks', href: '/network', icon: Users, badge: '3D Sphere' },
        { label: 'Communities', href: '/communities', icon: BookOpen, badge: 'Hubs' },
        { label: 'Messenger', href: '/messages', icon: MessageSquare },
      ],
    },
    {
      title: 'Build & Compete',
      items: [
        { label: 'Hackathon Crews', href: '/crews', icon: Shield },
        { label: 'Voyages Showcase', href: '/voyages', icon: Layers },
        { label: 'Quests & Arena', href: '/quests', icon: Flame, isHot: true },
        { label: 'Campus Leaderboard', href: '/leaderboard', icon: Trophy },
      ],
    },
    {
      title: 'Career & Growth',
      items: [
        { label: 'Verified Mentors', href: '/mentors', icon: GraduationCap },
        { label: 'Events & Hacks', href: '/events', icon: Calendar },
      ],
    },
  ];

  if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
    navCategories.push({
      title: 'Administrator Operations',
      items: [
        { label: 'VYNK Pulse (Intelligence)', href: '/pulse', icon: Activity, badge: 'Admin' },
        { label: 'Safety & System Console', href: '/admin', icon: ShieldAlert },
      ],
    });
  }

  return (
    <aside className="w-64 flex-shrink-0 hidden md:block">
      <div className="sticky top-20 space-y-4">
        {onOpenCreatePost && (
          <VynkButton
            onClick={onOpenCreatePost}
            leftIcon={<PlusCircle className="w-4 h-4" />}
            size="md"
            className="w-full shadow-lg shadow-indigo-600/25 py-2.5"
          >
            Create Dispatch
          </VynkButton>
        )}

        <nav className="p-3 glass-panel rounded-3xl space-y-4 border border-surface-border">
          {navCategories.map((cat) => (
            <div key={cat.title} className="space-y-1">
              <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 font-bold">
                {cat.title}
              </div>
              <div className="space-y-0.5">
                {cat.items.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-bold transition-all relative group ${
                        isActive
                          ? 'bg-indigo-500/15 text-indigo-600 dark:text-cyan-300 border border-indigo-500/30 dark:border-cyan-500/30 shadow-sm'
                          : 'text-muted-foreground hover:bg-muted dark:hover:bg-white/5 hover:text-foreground'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <item.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {'badge' in item && item.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30 shrink-0">
                        {item.badge}
                      </span>
                    )}

                    {'isHot' in item && item.isHot && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Dynamic VYNK Ethos Card */}
        <div className="p-4 rounded-3xl glass-card border border-indigo-500/20 space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="text-[10px] font-black tracking-wider text-indigo-400 uppercase font-mono">
            VYNK Ethos
          </div>
          <p className="text-xs font-semibold text-foreground/90 leading-relaxed">
            &ldquo;Find your people. Learn. Build. Rise.&rdquo;
          </p>
          <div className="text-[10px] text-muted-foreground">The living digital campus.</div>
        </div>
      </div>
    </aside>
  );
}

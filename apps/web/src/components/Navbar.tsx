import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Sparkles,
  Plus,
  Command,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Rocket,
  Users,
  CheckCheck,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { Avatar } from './Avatar';
import { VynkButton } from './vynk/VynkButton';
import { StreakBadge } from './StreakBadge';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import { formatTimeAgo } from '../lib/utils';

interface NavbarProps {
  onOpenCreatePost?: () => void;
  onOpenCommandPalette?: () => void;
}

export function Navbar({ onOpenCreatePost, onOpenCommandPalette }: NavbarProps) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    api.getNotifications().then((list) => {
      setNotifications(Array.isArray(list) ? list : []);
    }).catch(() => {});

    const socket = getSocket();
    const handleNewNotif = (notif: any) => {
      if (notif) {
        setNotifications((prev) => [notif, ...prev]);
      }
    };

    socket.on('notification:new', handleNewNotif);
    return () => {
      socket.off('notification:new', handleNewNotif);
    };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      api.markNotificationRead(notif.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }
    setIsNotifOpen(false);
    if (notif.data?.link) {
      navigate(notif.data.link);
    } else if (notif.type === 'CONNECTION_REQUEST' || notif.type === 'CONNECTION_ACCEPTED') {
      navigate('/network');
    } else if (notif.type === 'NEW_MESSAGE') {
      navigate('/messages');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    } else if (onOpenCommandPalette) {
      onOpenCommandPalette();
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/75 backdrop-blur-xl border-b border-surface-border px-4 lg:px-8 py-2.5 flex items-center justify-between transition-all">
      {/* Brand & Search */}
      <div className="flex items-center gap-6 flex-1 max-w-xl">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <img
              src="/vynk-logo.png"
              alt="VYNK"
              className="w-9 h-9 object-contain rounded-2xl shadow-glow-indigo group-hover:scale-105 transition-transform"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-background animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-foreground via-foreground to-indigo-400 bg-clip-text text-transparent leading-none">
              VYNK
            </span>
            <span className="text-[9px] font-mono tracking-wider uppercase text-muted-foreground font-bold mt-0.5">
              Campus OS
            </span>
          </div>
        </Link>

        {/* Global Search & Command trigger */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 hidden md:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={() => {
              if (onOpenCommandPalette && !searchQuery) onOpenCommandPalette();
            }}
            placeholder="Search students, skills, crews, voyages... (Press /)"
            className="w-full pl-10 pr-16 py-2 bg-surface-elevated/70 hover:bg-surface-elevated border border-surface-border rounded-xl text-xs placeholder:text-muted-foreground/60 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all backdrop-blur-md cursor-pointer"
          />
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-white/5 border border-white/10 rounded-md hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
            title="Open Command Palette"
          >
            <Command className="w-2.5 h-2.5" />
            <span>/</span>
          </button>
        </form>
      </div>

      {/* Action shortcuts */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden sm:flex items-center gap-2.5">
            <StreakBadge streakDays={user.streakDays || 1} />
            <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-bold text-indigo-300 flex items-center gap-1.5 font-mono shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 fill-current" />
              <span>{user.xp} XP</span>
            </div>
          </div>
        )}

        {onOpenCreatePost && (
          <VynkButton
            size="sm"
            onClick={onOpenCreatePost}
            leftIcon={<Plus className="w-4 h-4" />}
            className="hidden sm:inline-flex"
          >
            Create
          </VynkButton>
        )}

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Real-time Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            aria-label="Notifications"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-indigo-600 text-[9px] font-black font-mono text-white flex items-center justify-center ring-2 ring-background">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-surface-elevated/95 backdrop-blur-2xl border border-surface-border shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-surface-border/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-indigo-600/20 text-indigo-400 text-[10px] font-mono font-bold">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    <Bell className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                    <span>No notifications yet.</span>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-1.5 scrollbar-thin">
                    {notifications.slice(0, 15).map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-2.5 rounded-xl text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                          notif.isRead
                            ? 'bg-transparent hover:bg-white/5 opacity-70'
                            : 'bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/15'
                        }`}
                      >
                        <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" style={{ visibility: notif.isRead ? 'hidden' : 'visible' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-foreground leading-snug">{notif.title}</p>
                          <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 mt-0.5">{notif.message}</p>
                          <span className="text-[9px] text-muted-foreground/60 font-mono mt-1 block">
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {user ? (
          <div className="relative pl-1.5">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 group p-1 rounded-full hover:bg-white/5 transition-all cursor-pointer focus:outline-none"
              aria-label="User menu"
            >
              <div className="relative">
                <Avatar src={user.avatarUrl} fallback={user.displayName} size="sm" />
                <div className="absolute inset-0 rounded-full ring-2 ring-indigo-500/30 group-hover:ring-indigo-500 transition-all pointer-events-none" />
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-transform" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface-elevated/95 backdrop-blur-2xl border border-surface-border shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User Header */}
                  <div className="p-3 border-b border-surface-border/50">
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatarUrl} fallback={user.displayName} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">@{user.username}</p>
                      </div>
                    </div>
                    {user.college && (
                      <p className="text-[11px] text-muted-foreground/75 truncate mt-2">
                        {user.college} {user.department ? `· ${user.department}` : ''}
                      </p>
                    )}
                    <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                      <span className="text-indigo-400 font-semibold">{user.role}</span>
                      <span className="text-muted-foreground">{user.xp} XP (Lvl {user.level || 1})</span>
                    </div>
                  </div>

                  {/* Menu Links */}
                  <div className="py-1">
                    <Link
                      to={`/profile/${user.username}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-white/5 rounded-xl transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-indigo-400" />
                      <span>Student Profile</span>
                    </Link>
                    <Link
                      to="/voyages"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-white/5 rounded-xl transition-colors"
                    >
                      <Rocket className="w-4 h-4 text-emerald-400" />
                      <span>Voyage Workspaces</span>
                    </Link>
                    <Link
                      to="/network"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-white/5 rounded-xl transition-colors"
                    >
                      <Users className="w-4 h-4 text-cyan-400" />
                      <span>Network & Connections</span>
                    </Link>
                  </div>

                  {/* Sign Out */}
                  <div className="pt-1 border-t border-surface-border/50">
                    <button
                      onClick={async () => {
                        setIsMenuOpen(false);
                        await logout();
                        navigate('/auth');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link to="/auth">
            <VynkButton size="sm">Sign In</VynkButton>
          </Link>
        )}
      </div>
    </header>
  );
}

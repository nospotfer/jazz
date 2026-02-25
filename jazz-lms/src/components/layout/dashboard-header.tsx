'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, FileText, CreditCard, LogOut, X } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useDashboardPreferences } from '@/components/providers/dashboard-preferences-provider';

// ── Notification types & mock data ──────────────────────────────────
interface Notification {
  id: string;
  title: string;
  preview: string;
  body: string;
  date: string;
  read: boolean;
}

const initialNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Course Available',
    preview: 'Advanced Harmony & Composition is now live!',
    body: 'We are excited to announce our newest course: Advanced Harmony & Composition. Dive deep into jazz harmony, chord voicings, and composition techniques with Enric Vazquez. Enroll now and take your musicianship to the next level!',
    date: '2 hours ago',
    read: false,
  },
  {
    id: '2',
    title: 'Progress Reminder',
    preview: "You're almost halfway through Jazz Fundamentals.",
    body: "Great work! You've completed 45% of Jazz Fundamentals: History & Theory. Keep going — consistency is the key to mastering jazz. Log in today and continue your learning journey.",
    date: '1 day ago',
    read: false,
  },
  {
    id: '3',
    title: 'Welcome to Jazz Culture',
    preview: "Thanks for joining. Here's how to get started.",
    body: "Welcome to Jazz Culture! We're thrilled to have you. Start by exploring the Lobby to discover courses, visit your Profile to customize your account, and check out Settings to personalize your experience. Happy learning!",
    date: '3 days ago',
    read: true,
  },
];

// ── Component ───────────────────────────────────────────────────────
interface DashboardHeaderProps {
  user: {
    id: string;
    email: string;
    user_metadata: {
      full_name?: string;
      avatar_url?: string;
    };
  };
  role?: string | null;
  isAdmin?: boolean;
}

export function DashboardHeader({ user, role, isAdmin = false }: DashboardHeaderProps) {
  const { t } = useDashboardPreferences();
  const router = useRouter();
  const displayName =
    user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const avatarUrl = user.user_metadata?.avatar_url;
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // ── Notifications state ─────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [activeNotif, setActiveNotif] = useState<Notification | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const openNotification = (notif: Notification) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    setShowNotifDropdown(false);
    setActiveNotif(notif);
  };

  // ── User menu state ─────────────────────────────────────────────
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setShowUserMenu(false);
    router.push('/');
  };

  // ── Click outside to close ──────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between h-16 px-3 sm:px-6 lg:px-8">
          {/* Spacer for hamburger on mobile */}
          <div className="w-10 lg:hidden" />

          {/* Search bar */}
          <div className="hidden sm:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('courses', 'Courses') + '...'}
                className="w-full pl-10 pr-4 py-2 bg-background border border-primary/40 hover:border-primary/70 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/70 transition-colors"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {/* ── Notifications bell ── */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setShowNotifDropdown((v) => !v);
                  setShowUserMenu(false);
                }}
                className="relative p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <Bell className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full ring-2 ring-card" />
                )}
              </button>

              {/* Dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-1rem)] max-w-96 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">{t('notifications', 'Notifications')}</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-yellow-400/20 text-yellow-500 font-medium px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground text-sm">
                        {t('noNotifications', 'No notifications')}
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => openNotification(notif)}
                          className={`w-full text-left px-4 py-3 border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors ${
                            notif.read ? 'bg-muted/30' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {!notif.read && (
                              <span className="mt-1.5 w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                            )}
                            {notif.read && <span className="mt-1.5 w-2 h-2 shrink-0" />}
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-medium truncate ${notif.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {notif.preview}
                              </p>
                              <p className="text-[10px] text-muted-foreground/60 mt-1">
                                {notif.date}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── User avatar + menu ── */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => {
                  setShowUserMenu((v) => !v);
                  setShowNotifDropdown(false);
                }}
                className="flex items-center gap-2 pl-2 border-l border-border cursor-pointer hover:opacity-80 transition-opacity"
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary text-xs font-bold">{initials}</span>
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-foreground leading-none">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {user.email}
                  </p>
                </div>
              </button>

              {/* Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-[min(14rem,calc(100vw-1rem))] bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    {isAdmin && (
                      <p className="text-xs font-semibold text-yellow-500 mt-1">
                        🔑 {role || 'ADMIN'}
                      </p>
                    )}
                  </div>

                  <div className="py-1">
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-yellow-500 hover:bg-accent transition-colors"
                      >
                        🔐 Admin Intranet
                      </Link>
                    )}
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      Profile
                    </Link>
                    <Link
                      href="/dashboard/personal-data"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Personal Data
                    </Link>
                    <Link
                      href="/dashboard/payment"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      Payment Methods
                    </Link>
                  </div>

                  <div className="border-t border-border py-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Notification popup modal ── */}
      {activeNotif && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveNotif(null)}
        >
          <div
            className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground flex-1">
                {activeNotif.title}
              </h2>
              <button
                onClick={() => setActiveNotif(null)}
                className="p-1 hover:bg-accent rounded-md transition"
                aria-label="Close"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5">
              <p className="text-sm text-foreground leading-relaxed">
                {activeNotif.body}
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                {activeNotif.date}
              </p>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-5 pb-4 sm:pb-5">
              <button
                onClick={() => setActiveNotif(null)}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

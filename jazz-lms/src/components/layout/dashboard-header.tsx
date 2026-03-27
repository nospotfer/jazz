"use client";

import {
    JazzMedalIcon,
    JazzSupremeMedal,
} from "@/components/course/lesson-quiz-medal";
import { useDashboardPreferences } from "@/components/providers/dashboard-preferences-provider";
import { useUserCourseCompletionRecognition } from "@/hooks/use-user-course-completion-recognition";
import { useUserJazzMedalProgress } from "@/hooks/use-user-jazz-medal-progress";
import type { UserJazzMedalProgress } from "@/lib/lesson-quiz";
import { resolveProfileAvatar } from "@/lib/profile-avatars";
import { createClient } from "@/utils/supabase/client";
import type { AuthChangeEvent } from "@supabase/supabase-js";
import {
    Bell,
    LogOut,
    ScrollText,
    Search,
    Settings,
    User,
    Wallet,
    X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then((mod) => mod.ThemeToggle),
  {
    ssr: false,
  },
);

const LanguageSelector = dynamic(
  () =>
    import("@/components/language-selector").then(
      (mod) => mod.LanguageSelector,
    ),
  {
    ssr: false,
  },
);

// ── Notification types & mock data ──────────────────────────────────
interface Notification {
  id: string;
  title: string;
  preview: string;
  body: string;
  date: string;
  read: boolean;
}

// ── Component ───────────────────────────────────────────────────────
interface DashboardHeaderProps {
  user: {
    id: string;
    email: string;
    user_metadata: {
      full_name?: string;
      avatar_mode?: "random" | "fixed";
      avatar_url?: string;
    };
  };
  role?: string | null;
  isAdmin?: boolean;
  initialMedalProgress?: UserJazzMedalProgress | null;
}

export function DashboardHeader({
  user,
  role,
  isAdmin = false,
  initialMedalProgress = null,
}: DashboardHeaderProps) {
  const { t, language } = useDashboardPreferences();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { progress: medalProgress } =
    useUserJazzMedalProgress(initialMedalProgress);
  const { recognition } = useUserCourseCompletionRecognition();
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(
    resolveProfileAvatar(user.id, user.user_metadata?.avatar_url),
  );
  const displayName =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    t("userFallback", "Usuario");
  const avatarUrl = currentAvatarUrl;
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // ── Notifications state ─────────────────────────────────────────
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [activeNotif, setActiveNotif] = useState<Notification | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const notifications: Notification[] =
    unreadMessages > 0
      ? [
          {
            id: "inbox-unread",
            title: t("inboxNewMessageTitle", "Nuevo mensaje en la bandeja"),
            preview: t(
              "inboxNewMessagePreview",
              "Tienes mensajes sin leer en tu bandeja.",
            ),
            body: t("inboxNewMessageTitle", "Nuevo mensaje en la bandeja"),
            date: t("now", "Ahora"),
            read: false,
          },
        ]
      : [];

  const unreadCount = notifications.filter((n) => !n.read).length;

  const openNotification = (notif: Notification) => {
    setShowNotifDropdown(false);
    if (notif.id === "inbox-unread") {
      router.push("/dashboard/messages");
      return;
    }
    setActiveNotif(notif);
  };

  // ── User menu state ─────────────────────────────────────────────
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setShowUserMenu(false);
    router.push("/");
  };

  // ── Click outside to close ──────────────────────────────────────
  useEffect(() => {
    const syncAvatarFromSession = async () => {
      const {
        data: { user: latestUser },
      } = await supabase.auth.getUser();

      if (latestUser) {
        setCurrentAvatarUrl(
          resolveProfileAvatar(
            latestUser.id,
            latestUser.user_metadata?.avatar_url,
          ),
        );
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      syncAvatarFromSession();
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [supabase]);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;
    let intervalId: number | null = null;
    let timeoutId: number | null = null;
    let idleCallbackId: number | null = null;
    let requestController: AbortController | null = null;

    const stopPolling = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const hasSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return Boolean(session);
    };

    const loadUnreadMessages = async () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      if (!(await hasSession())) {
        stopPolling();
        if (isMounted) setUnreadMessages(0);
        return;
      }

      requestController?.abort();
      requestController = new AbortController();

      try {
        const response = await fetch("/api/messages/unread-count", {
          signal: requestController.signal,
        });

        if (!isMounted) return;

        if (response.status === 401) {
          setUnreadMessages(0);
          stopPolling();
          return;
        }

        const data = await response.json();
        setUnreadMessages(typeof data.count === "number" ? data.count : 0);
      } catch (error) {
        if (!isMounted) return;
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setUnreadMessages(0);
      }
    };

    const startPolling = () => {
      stopPolling();

      intervalId = window.setInterval(() => {
        void loadUnreadMessages();
      }, 180000);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadUnreadMessages();
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT") {
        requestController?.abort();
        stopPolling();
        setUnreadMessages(0);
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void loadUnreadMessages();
        startPolling();
      }
    });

    if (typeof window.requestIdleCallback === "function") {
      idleCallbackId = window.requestIdleCallback(
        () => {
          void loadUnreadMessages();
          startPolling();
        },
        { timeout: 1500 },
      );
    } else {
      timeoutId = window.setTimeout(() => {
        void loadUnreadMessages();
        startPolling();
      }, 900);
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      requestController?.abort();
      stopPolling();
      if (idleCallbackId !== null) {
        window.cancelIdleCallback?.(idleCallbackId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="relative flex items-center justify-between h-16 px-3 sm:px-6 lg:px-8">
          {/* Spacer for hamburger on mobile */}
          <div className="w-10 lg:hidden" />

          {/* Search bar */}
          <div className="hidden sm:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                id="dashboard-course-search"
                name="courseSearch"
                autoComplete="off"
                placeholder={t("courses", "Cursos") + "..."}
                className="w-full pl-10 pr-4 py-2 bg-background border border-primary/40 hover:border-primary/70 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/70 transition-colors"
              />
            </div>
          </div>

          {pathname === "/dashboard" && (
            <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-white/95 tracking-wide whitespace-nowrap pointer-events-none">
              {t("welcomeShort", "Bienvenido,")} {displayName.split(" ")[0]}.
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            {medalProgress?.hasSupremeMedal ? (
              <Link
                href="/dashboard/jazz-specialist"
                aria-label={t("supremeMedalPage", "Jazz specialist medal")}
                title={t("supremeMedalPage", "Jazz specialist medal")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-yellow-300/40 bg-gradient-to-br from-yellow-300/90 via-amber-300 to-yellow-500 text-black shadow-[0_0_24px_rgba(250,204,21,0.35)] transition-transform hover:scale-[1.04]"
              >
                <JazzMedalIcon medal="GOLD" size="sm" />
              </Link>
            ) : null}
            {recognition.isEligible ? (
              <Link
                href="/dashboard/course-completion-recognition"
                aria-label={t(
                  "courseRecognitionPage",
                  "Course completion recognition",
                )}
                title={t(
                  "courseRecognitionPage",
                  "Course completion recognition",
                )}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-400/35 bg-gradient-to-br from-slate-200 via-stone-200 to-slate-300 text-slate-900 shadow-[0_0_20px_rgba(71,85,105,0.28)] transition-transform hover:scale-[1.04]"
              >
                <ScrollText className="h-5 w-5" />
              </Link>
            ) : null}
            <Link
              href="/dashboard/settings"
              aria-label={t("settings", "Settings")}
              title={t("settings", "Settings")}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <Settings className="h-5 w-5 text-muted-foreground" />
            </Link>
            <LanguageSelector />

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
                    <h3 className="text-sm font-semibold text-foreground">
                      {t("notifications", "Notificaciones")}
                    </h3>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-yellow-400/20 text-yellow-500 font-medium px-2 py-0.5 rounded-full">
                        {unreadCount} {t("newItems", "nuevas")}
                      </span>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground text-sm">
                        {t("noNotifications", "Sin notificaciones")}
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => openNotification(notif)}
                          className={`w-full text-left px-4 py-3 border-b border-border last:border-b-0 hover:bg-accent/50 transition-colors ${
                            notif.read ? "bg-muted/30" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {!notif.read && (
                              <span className="mt-1.5 w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                            )}
                            {notif.read && (
                              <span className="mt-1.5 w-2 h-2 shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-sm font-medium truncate ${notif.read ? "text-muted-foreground" : "text-foreground"}`}
                              >
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
                <div className="flex shrink-0 flex-col items-center justify-center gap-1">
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
                      <span className="text-primary text-xs font-bold">
                        {initials}
                      </span>
                    </div>
                  )}
                </div>
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
                    <p className="text-sm font-medium text-foreground truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                    {medalProgress ? (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        {medalProgress.activeProfileMedal === "SUPREME" ? (
                          <JazzSupremeMedal language={language} size="sm" />
                        ) : (
                          <JazzMedalIcon
                            medal={medalProgress.activeProfileMedal}
                            size="sm"
                          />
                        )}
                        <span>
                          {medalProgress.platinumMedalCount}/
                          {medalProgress.totalRequiredPlatinumMedals}{" "}
                          {t("platinumMedals", "platinum medals")}
                        </span>
                      </div>
                    ) : null}
                    {isAdmin && (
                      <p className="text-xs font-semibold text-yellow-500 mt-1">
                        🔑 {role || t("adminPanel", "Admin")}
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
                        🔐 {t("adminPanel", "Panel de administración")}
                      </Link>
                    )}
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      {t("profile", "Perfil")}
                    </Link>
                    <Link
                      href="/dashboard/payment"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      {t("paymentHistory", "Historial de pagos")}
                    </Link>
                  </div>

                  <div className="border-t border-border py-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      {t("logOut", "Cerrar sesión")}
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
                aria-label={t("close", "Cerrar")}
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
                {t("close", "Cerrar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useDashboardPreferences } from "@/components/providers/dashboard-preferences-provider";
import { createClient } from "@/utils/supabase/client";
import type { AuthChangeEvent } from "@supabase/supabase-js";
import {
    BookOpen,
    ChevronDown,
    FileText,
    Home,
    Library,
    LogOut,
    Menu,
    MessageSquare,
    X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const DashboardNotesNavPanel = dynamic(
  () =>
    import("@/components/layout/dashboard-notes-nav-panel").then(
      (mod) => mod.DashboardNotesNavPanel,
    ),
  {
    ssr: false,
  },
);

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfCount, setPdfCount] = useState<number | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<number | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;
    let intervalId: number | null = null;
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

    const loadPdfCount = async () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      if (!(await hasSession())) {
        stopPolling();
        if (isMounted) setPdfCount(0);
        return;
      }

      requestController?.abort();
      requestController = new AbortController();

      try {
        const response = await fetch("/api/dashboard/pdf-count", {
          signal: requestController.signal,
        });

        if (!isMounted) return;

        if (response.status === 401) {
          setPdfCount(0);
          stopPolling();
          return;
        }

        const data = await response.json();
        setPdfCount(typeof data.count === "number" ? data.count : 0);
      } catch (error) {
        if (!isMounted) return;
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setPdfCount(0);
      }
    };

    const startPolling = () => {
      stopPolling();

      intervalId = window.setInterval(() => {
        void loadPdfCount();
      }, 60000);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadPdfCount();
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT") {
        stopPolling();
        requestController?.abort();
        setPdfCount(0);
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void loadPdfCount();
        startPolling();
      }
    });

    const idleCallback = window.requestIdleCallback?.(
      () => {
        void loadPdfCount();
        startPolling();
      },
      { timeout: 1200 },
    );

    if (idleCallback !== undefined) {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        isMounted = false;
        subscription.unsubscribe();
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
        window.cancelIdleCallback?.(idleCallback);
        requestController?.abort();
        stopPolling();
      };
    }

    void loadPdfCount();
    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      requestController?.abort();
      stopPolling();
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;
    let intervalId: number | null = null;
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
      }, 60000);
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
        stopPolling();
        requestController?.abort();
        setUnreadMessages(0);
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void loadUnreadMessages();
        startPolling();
      }
    });

    const idleCallback = window.requestIdleCallback?.(
      () => {
        void loadUnreadMessages();
        startPolling();
      },
      { timeout: 1200 },
    );

    if (idleCallback !== undefined) {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        isMounted = false;
        subscription.unsubscribe();
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
        window.cancelIdleCallback?.(idleCallback);
        requestController?.abort();
        stopPolling();
      };
    }

    void loadUnreadMessages();
    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      requestController?.abort();
      stopPolling();
    };
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsOpen(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-3 left-3 z-50 p-2 rounded-lg bg-card border border-border shadow-lg hover:bg-accent transition-colors lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6 text-foreground" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Mobile (slide in) */}
      <aside
        className={`fixed top-0 left-0 h-full w-[90vw] max-w-72 bg-card border-r border-border z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          pathname={pathname}
          pdfCount={pdfCount}
          unreadMessages={unreadMessages}
          onClose={() => setIsOpen(false)}
          onLogout={handleLogout}
        />
      </aside>

      {/* Sidebar - Desktop (always visible) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-56 lg:fixed lg:top-0 lg:left-0 lg:h-[100dvh] bg-card border-r border-border z-40">
        <SidebarContent
          pathname={pathname}
          pdfCount={pdfCount}
          unreadMessages={unreadMessages}
          onLogout={handleLogout}
        />
      </aside>
    </>
  );
}

function SidebarContent({
  pathname,
  pdfCount,
  unreadMessages,
  onClose,
  onLogout,
}: {
  pathname: string;
  pdfCount: number | null;
  unreadMessages: number | null;
  onClose?: () => void;
  onLogout: () => void;
}) {
  const { t } = useDashboardPreferences();
  const [isNotesSectionOpen, setIsNotesSectionOpen] = useState(false);

  const menuItems = [
    {
      label: t("lobby", "Lobby"),
      href: "/dashboard",
      icon: Home,
    },
    {
      label: t("myCourses", "My Courses"),
      href: "/dashboard/courses",
      icon: BookOpen,
    },
    {
      label: t("messages", "Messages"),
      href: "/dashboard/messages",
      icon: MessageSquare,
    },
    {
      label: t("courseNotes", "Course Notes"),
      href: "/dashboard/pdf-view",
      icon: FileText,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-primary/40">
            <Image
              src="/images/logo-mark.png"
              alt="Jazz Culture logo"
              fill
              className="object-cover"
              sizes="36px"
              quality={100}
            />
          </div>
          <span className="font-serif font-bold text-foreground text-lg">
            Jazz Culture
          </span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-accent transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 px-4 pt-4 pb-1 space-y-1 flex flex-col">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
              <span className="flex-1">{item.label}</span>
              {item.href === "/dashboard/pdf-view" && pdfCount !== null && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    isActive
                      ? "border-primary/40 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {pdfCount}
                </span>
              )}
              {item.href === "/dashboard/messages" &&
                unreadMessages !== null &&
                unreadMessages > 0 && (
                  <span
                    className="h-2.5 w-2.5 rounded-full bg-yellow-400"
                    aria-label="Unread messages"
                    title="New message in inbox"
                  />
                )}
            </Link>
          );
        })}
        <div className="flex-1 min-h-0">
          <div className="mt-1 flex h-full min-h-0 flex-col">
            <button
              type="button"
              onClick={() => setIsNotesSectionOpen((current) => !current)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors w-full"
            >
              <Library className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1 text-left">
                {t("myNotes", "My Notes")}
              </span>
              <ChevronDown
                className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${isNotesSectionOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isNotesSectionOpen ? <DashboardNotesNavPanel /> : null}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors w-full"
        >
          <LogOut className="h-5 w-5" />
          {t("logOut", "Log out")}
        </button>
      </div>
    </div>
  );
}

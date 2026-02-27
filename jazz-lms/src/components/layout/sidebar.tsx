'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Home,
  BookOpen,
  MessageSquare,
  LogOut,
  Settings,
  Library,
  ChevronDown,
  FileText,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useDashboardPreferences } from '@/components/providers/dashboard-preferences-provider';

interface CourseProgressVideo {
  lessonId: string;
  title: string;
  progressPercent: number;
  courseId: string;
  position?: number;
}

interface CourseProgressItem {
  id: string;
  title: string;
  videos: CourseProgressVideo[];
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [pdfCount, setPdfCount] = useState<number | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<number | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const loadPdfCount = () => {
      fetch('/api/dashboard/pdf-count')
        .then((response) => response.json())
        .then((data) => {
          if (!isMounted) return;
          setPdfCount(typeof data.count === 'number' ? data.count : 0);
        })
        .catch(() => {
          if (!isMounted) return;
          setPdfCount(0);
        });
    };

    loadPdfCount();
    const intervalId = window.setInterval(loadPdfCount, 20000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadUnreadMessages = () => {
      fetch('/api/messages/unread-count')
        .then((response) => response.json())
        .then((data) => {
          if (!isMounted) return;
          setUnreadMessages(typeof data.count === 'number' ? data.count : 0);
        })
        .catch(() => {
          if (!isMounted) return;
          setUnreadMessages(0);
        });
    };

    loadUnreadMessages();
    const intervalId = window.setInterval(loadUnreadMessages, 20000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
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
          isOpen ? 'translate-x-0' : '-translate-x-full'
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
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:top-0 lg:left-0 lg:h-[100dvh] bg-card border-r border-border z-40">
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

  const menuItems = [
    {
      label: t('lobby', 'Lobby'),
      href: '/dashboard',
      icon: Home,
    },
    {
      label: t('myCourses', 'My Courses'),
      href: '/dashboard/courses',
      icon: BookOpen,
    },
    {
      label: 'Messages',
      href: '/dashboard/messages',
      icon: MessageSquare,
    },
    {
      label: 'Course Notes',
      href: '/dashboard/pdf-view',
      icon: FileText,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-primary/40">
            <Image
              src="/images/Logo.jpeg"
              alt="Jazz Culture logo"
              fill
              className="object-cover"
              sizes="32px"
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
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
              <span className="flex-1">{item.label}</span>
              {item.href === '/dashboard/pdf-view' && pdfCount !== null && (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  isActive
                    ? 'border-primary/40 text-primary'
                    : 'border-border text-muted-foreground'
                }`}>
                  {pdfCount}
                </span>
              )}
              {item.href === '/dashboard/messages' && unreadMessages !== null && unreadMessages > 0 && (
                <span
                  className="h-2.5 w-2.5 rounded-full bg-yellow-400"
                  aria-label="Unread messages"
                  title="New message in inbox"
                />
              )}
            </Link>
          );
        })}
        <div className="min-h-0">
          <CoursesNavSection />
        </div>
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/dashboard/settings'
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <Settings className={`h-5 w-5 ${pathname === '/dashboard/settings' ? 'text-primary' : ''}`} />
          {t('settings', 'Settings')}
        </Link>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors w-full"
        >
          <LogOut className="h-5 w-5" />
          {t('logOut', 'Log out')}
        </button>
      </div>
    </div>
  );
}

function CoursesNavSection() {
  const { t } = useDashboardPreferences();
  const [open, setOpen] = useState(false);
  const [videos, setVideos] = useState<CourseProgressVideo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/dashboard/courses-progress')
      .then((r) => r.json())
      .then((data) => {
        const nextCourses: CourseProgressItem[] = data.courses ?? [];
        const flattened = nextCourses.flatMap((course) =>
          course.videos.map((video) => ({ ...video, courseId: course.id }))
        );
        setVideos(flattened);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const primaryCourseId = videos[0]?.courseId;
  const notesVideos = videos
    .filter((video) => video.courseId === primaryCourseId)
    .map((video, index) => ({
      lessonId: video.lessonId,
      courseId: video.courseId,
      classLabel: `Class ${index + 1}`,
      subtitle: video.title,
      classNumber: index + 1,
    }));

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors w-full"
      >
        <Library className="h-5 w-5 flex-shrink-0" />
        <span className="flex-1 text-left">{t('myNotes', 'My Notes')}</span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-1 ml-2 rounded-lg border border-primary/40 hover:border-primary/70 transition-colors overflow-hidden bg-card/60 flex flex-col max-h-[52dvh] lg:max-h-[58dvh]">
          {loading && (
            <p className="px-2.5 py-1.5 text-[11px] text-muted-foreground">{t('loading', 'Loading…')}</p>
          )}

          {!loading && (
            <>
              <div className="px-2.5 py-1.5 bg-primary/10 border-b border-primary/40">
                <span className="text-xs font-semibold text-primary tracking-wide uppercase">
                  {t('introductionToJazzMusic', 'Introduction to Jazz Music')}
                </span>
              </div>
              {notesVideos.length === 0 && (
                <p className="px-2.5 py-1.5 text-xs text-muted-foreground border-b border-border/60">
                  {t('noPurchasedCoursesYet', 'No purchased courses yet.')}
                </p>
              )}
              <div className="courses-scroll flex-1 min-h-0 overflow-y-auto pr-1">
                {notesVideos.map((video, index) => {
                  const isClickable = Boolean(video.courseId && video.lessonId);
                  const content = (
                    <div
                      className={`px-2.5 py-2.5 transition-colors ${
                        index < notesVideos.length - 1 ? 'border-b border-border/60' : ''
                      } ${isClickable ? 'hover:bg-accent/40' : 'opacity-90'}`}
                    >
                      <p className="text-sm font-semibold text-foreground leading-tight">
                        {video.classLabel}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-tight mt-0.5">
                        {video.subtitle}
                      </p>
                    </div>
                  );

                  if (!isClickable) {
                    return <div key={video.lessonId}>{content}</div>;
                  }

                  return (
                    <Link
                      key={video.lessonId}
                      href={`/dashboard/notes/${video.courseId}/${video.lessonId}`}
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

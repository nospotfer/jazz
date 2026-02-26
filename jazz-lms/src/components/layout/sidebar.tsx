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
  LogOut,
  Settings,
  Library,
  ChevronDown,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { CANONICAL_JAZZ_CLASSES } from '@/lib/course-lessons';
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
  const pathname = usePathname();
  const router = useRouter();

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
          onClose={() => setIsOpen(false)}
          onLogout={handleLogout}
        />
      </aside>

      {/* Sidebar - Desktop (always visible) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:top-0 lg:left-0 lg:h-[100dvh] bg-card border-r border-border z-40">
        <SidebarContent
          pathname={pathname}
          onLogout={handleLogout}
        />
      </aside>
    </>
  );
}

function SidebarContent({
  pathname,
  onClose,
  onLogout,
}: {
  pathname: string;
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
      label: t('settings', 'Settings'),
      href: '/dashboard/settings',
      icon: Settings,
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
              {item.label}
            </Link>
          );
        })}
        <div className="min-h-0">
          <CoursesNavSection />
        </div>
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

  const canonicalVideos = CANONICAL_JAZZ_CLASSES.map((item) => {
    const found = videos.find(
      (video) => video.title.toLowerCase() === item.subtitle.toLowerCase()
    );

    return {
      lessonId: found?.lessonId ?? `canonical-${item.classNumber}`,
      courseId: found?.courseId,
      progressPercent: found?.progressPercent ?? 0,
      classLabel: item.classLabel,
      subtitle: item.subtitle,
      classNumber: item.classNumber,
    };
  }).sort((a, b) => {
    if (b.progressPercent !== a.progressPercent) {
      return b.progressPercent - a.progressPercent;
    }
    return a.classNumber - b.classNumber;
  });

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors w-full"
      >
        <Library className="h-5 w-5 flex-shrink-0" />
        <span className="flex-1 text-left">{t('courses', 'Courses')}</span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-1 ml-2 rounded-lg border border-primary/40 hover:border-primary/70 transition-colors overflow-hidden bg-card/60 flex flex-col max-h-[48dvh] lg:max-h-[54dvh]">
          {loading && (
            <p className="px-2.5 py-1.5 text-[11px] text-muted-foreground">{t('loading', 'Loading…')}</p>
          )}

          {!loading && (
            <>
              <div className="px-2.5 py-1.5 bg-primary/10 border-b border-primary/40">
                <span className="text-[10px] font-semibold text-primary tracking-wide uppercase">
                  {t('introductionToJazzMusic', 'Introduction to Jazz Music')}
                </span>
              </div>
              {videos.length === 0 && (
                <p className="px-2.5 py-1.5 text-[10px] text-muted-foreground border-b border-border/60">
                  {t('noPurchasedCoursesYet', 'No purchased courses yet.')}
                </p>
              )}
              <div className="courses-scroll flex-1 min-h-0 overflow-y-auto pr-1">
                {canonicalVideos.map((video, index) => {
                  const isClickable = Boolean(video.courseId) && !video.lessonId.startsWith('canonical-');
                  const content = (
                    <div
                      className={`px-2.5 py-1.5 transition-colors ${
                        index < canonicalVideos.length - 1 ? 'border-b border-border/60' : ''
                      } ${isClickable ? 'hover:bg-accent/40' : 'opacity-90'}`}
                    >
                      <p className="text-[10px] font-semibold text-foreground leading-tight">
                        {video.classLabel}
                      </p>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 leading-tight">
                        {video.subtitle}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <div className="flex-1 bg-muted rounded-full h-1">
                          <div
                            className="bg-primary h-1 rounded-full transition-all duration-500"
                            style={{ width: `${video.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-muted-foreground tabular-nums min-w-7 text-right">
                          {video.progressPercent}%
                        </span>
                      </div>
                    </div>
                  );

                  if (!isClickable) {
                    return <div key={video.lessonId}>{content}</div>;
                  }

                  return (
                    <Link
                      key={video.lessonId}
                      href={`/courses/${video.courseId}/lessons/${video.lessonId}`}
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

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

interface CourseProgressVideo {
  lessonId: string;
  title: string;
  progressPercent: number;
  courseId: string;
}

interface CourseProgressItem {
  id: string;
  title: string;
  videos: CourseProgressVideo[];
}

const menuItems = [
  {
    label: 'Lobby',
    href: '/dashboard',
    icon: Home,
  },
  {
    label: 'My Courses',
    href: '/dashboard/courses',
    icon: BookOpen,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

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
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border shadow-lg hover:bg-accent transition-colors lg:hidden"
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
        className={`fixed top-0 left-0 h-full w-72 bg-card border-r border-border z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
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
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:top-0 lg:left-0 lg:h-full bg-card border-r border-border z-40">
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
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">JC</span>
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
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
        <CoursesNavSection />
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors w-full"
        >
          <LogOut className="h-5 w-5" />
          Log out
        </button>
      </div>
    </div>
  );
}

function CoursesNavSection() {
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<CourseProgressItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/dashboard/courses-progress')
      .then((r) => r.json())
      .then((data) => {
        setCourses(data.courses ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open]);

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors w-full"
      >
        <Library className="h-5 w-5 flex-shrink-0" />
        <span className="flex-1 text-left">Courses</span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-1 ml-2 rounded-lg border border-border overflow-hidden">
          {loading && (
            <p className="px-3 py-2 text-xs text-muted-foreground">Loading…</p>
          )}

          {!loading && courses.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              No purchased courses yet.
            </p>
          )}

          {!loading &&
            courses.map((course, ci) => (
              <div key={course.id}>
                {/* Course title row */}
                <div
                  className={`px-3 py-2 bg-muted/60 ${
                    ci < courses.length - 1 || course.videos.length > 0
                      ? 'border-b border-black/70'
                      : ''
                  }`}
                >
                  <span className="text-xs font-semibold text-foreground tracking-wide uppercase">
                    {course.title}
                  </span>
                </div>

                {/* Video rows */}
                {course.videos.map((video, vi) => (
                  <Link
                    key={video.lessonId}
                    href={`/courses/${video.courseId}/lessons/${video.lessonId}`}
                    className={`block px-3 py-2 hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${
                      vi < course.videos.length - 1 || ci < courses.length - 1
                        ? 'border-b border-black/70'
                        : ''
                    }`}
                  >
                    <p className="text-xs text-foreground line-clamp-2 leading-snug">
                      {video.title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-1.5">
                        <div
                          className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${video.progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {video.progressPercent}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

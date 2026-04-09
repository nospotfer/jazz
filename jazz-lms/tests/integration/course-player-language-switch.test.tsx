// @vitest-environment jsdom

import { CoursePlayer } from "@/components/course/course-player";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentLanguage: "es",
  axiosGet: vi.fn(),
  axiosPost: vi.fn(),
  setLanguage: vi.fn(),
  routerRefresh: vi.fn(),
  confettiOpen: vi.fn(),
  warmPaymentMethodModal: vi.fn(),
}));

vi.mock("next/dynamic", async () => {
  const react = await vi.importActual<typeof import("react")>("react");

  return {
    __esModule: true,
    default: () =>
      react.forwardRef(function DynamicStub() {
        return null;
      }),
  };
});

vi.mock("axios", () => ({
  __esModule: true,
  default: {
    get: mocks.axiosGet,
    post: mocks.axiosPost,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mocks.routerRefresh,
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("@/components/providers/language-provider", () => ({
  useLanguage: () => ({
    language: mocks.currentLanguage,
    setLanguage: mocks.setLanguage,
  }),
}));

vi.mock("@/components/providers/dashboard-preferences-provider", () => ({
  DashboardPreferencesProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

vi.mock("@/components/layout/sidebar", () => ({
  Sidebar: () => null,
}));

vi.mock("@/components/music/spotify-playlist-footer", () => ({
  SpotifyPlaylistFooter: () => null,
}));

vi.mock("@/components/course/lesson-quiz-medal", () => ({
  LessonQuizMedalBadge: () => null,
}));

vi.mock("@/hooks/use-confetti-store", () => ({
  useConfettiStore: () => ({
    onOpen: mocks.confettiOpen,
  }),
}));

vi.mock("@/lib/course-lessons", () => ({
  getCanonicalJazzClass: () => undefined,
}));

vi.mock("@/lib/payment-modal-loader", () => ({
  loadPaymentMethodModal: vi.fn(),
  warmPaymentMethodModal: mocks.warmPaymentMethodModal,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const lesson = {
  id: "lesson-1",
  title: "Introducao",
  videoUrl: "https://stream.mux.com/abc123xyz.m3u8",
  attachments: [
    {
      id: "att-1",
      name: "Apunte 1.pdf",
      url: "https://files.example.com/att-1.pdf",
    },
  ],
} as any;

const course = {
  id: "course-1",
  title: "Jazz Fundamentals",
  chapters: [
    {
      id: "chapter-1",
      title: "Chapter 1",
      lessons: [lesson],
    },
  ],
} as any;

const baseProps = {
  course,
  lesson,
  lessonId: "lesson-1",
  initialIsCompleted: false,
  initialProgressPercent: 0,
  initialQuizSummary: null,
  hasQuizAvailable: false,
  canAccessLesson: true,
  canAccessAttachments: true,
};

function muxPlaybackCalls() {
  return mocks.axiosGet.mock.calls.filter(([url]) =>
    String(url).includes("/mux-playback"),
  );
}

function attachmentCalls() {
  return mocks.axiosGet.mock.calls.filter(([url]) =>
    String(url).includes("/attachments/"),
  );
}

describe("CoursePlayer language switch behavior", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    mocks.currentLanguage = "es";

    Object.defineProperty(window, "requestIdleCallback", {
      writable: true,
      configurable: true,
      value: (callback: IdleRequestCallback) => {
        callback({ didTimeout: false, timeRemaining: () => 50 });
        return 0;
      },
    });

    Object.defineProperty(window, "cancelIdleCallback", {
      writable: true,
      configurable: true,
      value: () => undefined,
    });

    mocks.axiosPost.mockResolvedValue({ data: {} });
    mocks.axiosGet.mockImplementation((url: string) => {
      if (url.includes("/mux-playback")) {
        return Promise.resolve({
          data: {
            playbackId: "abc123xyz",
            playbackToken: "token-playback",
            thumbnailToken: "token-thumb",
            storyboardToken: "token-story",
          },
        });
      }

      if (url.includes("/attachments/")) {
        return Promise.resolve({
          data: {
            signedUrl: "https://signed.example.com/translated.pdf",
            name: "apunte.pdf",
            storagePath: "translated/apunte.pdf",
          },
        });
      }

      return Promise.resolve({ data: {} });
    });
  });

  test("does not refetch mux playback when language changes, but refreshes PDF language", async () => {
    const view = render(<CoursePlayer {...baseProps} />);

    await waitFor(
      () => {
        expect(muxPlaybackCalls()).toHaveLength(1);
        expect(attachmentCalls()).toHaveLength(1);
      },
      { timeout: 2500 },
    );

    expect(attachmentCalls()[0]?.[1]?.params?.language).toBe("es");

    mocks.currentLanguage = "pt";
    view.rerender(<CoursePlayer {...baseProps} />);

    await waitFor(() => {
      expect(attachmentCalls()).toHaveLength(2);
    });

    expect(attachmentCalls()[1]?.[1]?.params?.language).toBe("pt");
    expect(muxPlaybackCalls()).toHaveLength(1);
  });

  test("keeps generic playback error translated after language switch without new mux call", async () => {
    mocks.axiosGet.mockImplementation((url: string) => {
      if (url.includes("/mux-playback")) {
        return Promise.reject(new Error("network-error"));
      }

      if (url.includes("/attachments/")) {
        return Promise.resolve({
          data: {
            signedUrl: "https://signed.example.com/translated.pdf",
            name: "apunte.pdf",
            storagePath: "translated/apunte.pdf",
          },
        });
      }

      return Promise.resolve({ data: {} });
    });

    const view = render(<CoursePlayer {...baseProps} />);

    expect(await screen.findByText(/playback firmado/i)).toBeTruthy();
    expect(muxPlaybackCalls()).toHaveLength(1);

    mocks.currentLanguage = "pt";
    view.rerender(<CoursePlayer {...baseProps} />);

    expect(await screen.findByText(/playback assinado/i)).toBeTruthy();
    expect(muxPlaybackCalls()).toHaveLength(1);
  });

  test("loads the first PDF attachment when non-PDF files exist", async () => {
    const lessonWithMixedAttachments = {
      ...lesson,
      id: "lesson-2",
      attachments: [
        {
          id: "att-video",
          name: "intro.mp4",
          url: "https://files.example.com/intro.mp4",
        },
        {
          id: "att-note",
          name: "Apunte principal.pdf",
          url: "https://files.example.com/apunte-principal.pdf",
        },
      ],
    } as any;

    const courseWithMixedAttachments = {
      ...course,
      chapters: [
        {
          ...course.chapters[0],
          lessons: [lessonWithMixedAttachments],
        },
      ],
    } as any;

    render(
      <CoursePlayer
        {...baseProps}
        course={courseWithMixedAttachments}
        lesson={lessonWithMixedAttachments}
        lessonId="lesson-2"
      />,
    );

    await waitFor(() => {
      expect(attachmentCalls()).toHaveLength(1);
    });

    expect(String(attachmentCalls()[0]?.[0])).toContain("/attachments/att-note");
  });
});

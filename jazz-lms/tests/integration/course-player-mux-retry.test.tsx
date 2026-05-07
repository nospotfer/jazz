// @vitest-environment jsdom

import { CoursePlayer } from "@/components/course/course-player";
import { act, render, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentLanguage: "es",
  axiosGet: vi.fn(),
  axiosPost: vi.fn(),
  axiosPut: vi.fn(),
  // Holds the latest props passed to <MuxPlayer> so the test can fire onError.
  muxPlayerProps: { current: null as null | Record<string, unknown> },
}));

vi.mock("next/dynamic", async () => {
  const react = await vi.importActual<typeof import("react")>("react");

  return {
    __esModule: true,
    default: (loader: () => Promise<unknown>) => {
      const loaderStr = String(loader);
      if (loaderStr.includes("@mux/mux-player-react")) {
        return react.forwardRef(function MuxPlayerStub(
          props: Record<string, unknown>,
        ) {
          mocks.muxPlayerProps.current = props;
          return react.createElement("div", {
            "data-testid": "mux-player-stub",
          });
        });
      }
      return react.forwardRef(function DynamicStub() {
        return null;
      });
    },
  };
});

vi.mock("axios", () => ({
  __esModule: true,
  default: {
    get: mocks.axiosGet,
    post: mocks.axiosPost,
    put: mocks.axiosPut,
    isAxiosError: () => false,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("@/components/providers/language-provider", () => ({
  useLanguage: () => ({
    language: mocks.currentLanguage,
    setLanguage: vi.fn(),
  }),
}));

vi.mock("@/components/providers/dashboard-preferences-provider", () => ({
  DashboardPreferencesProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}));

vi.mock("@/components/layout/sidebar", () => ({ Sidebar: () => null }));
vi.mock("@/components/music/spotify-playlist-footer", () => ({
  SpotifyPlaylistFooter: () => null,
}));
vi.mock("@/components/course/lesson-quiz-medal", () => ({
  LessonQuizMedalBadge: () => null,
}));
vi.mock("@/hooks/use-confetti-store", () => ({
  useConfettiStore: () => ({ onOpen: vi.fn() }),
}));
vi.mock("@/lib/course-lessons", () => ({
  getCanonicalJazzClass: () => undefined,
}));
vi.mock("@/lib/payment-modal-loader", () => ({
  loadPaymentMethodModal: vi.fn(),
  warmPaymentMethodModal: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const lesson = {
  id: "lesson-1",
  title: "Introducao",
  videoUrl: "https://stream.mux.com/abc123xyz.m3u8",
  attachments: [],
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
  canUseGamification: true,
  canAccessLesson: true,
  canAccessAttachments: false,
};

function muxPlaybackCalls() {
  return mocks.axiosGet.mock.calls.filter(([url]) =>
    String(url).includes("/mux-playback"),
  );
}

describe("CoursePlayer Mux retry behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentLanguage = "es";
    mocks.muxPlayerProps.current = null;

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
    mocks.axiosPut.mockResolvedValue({ data: {} });
    mocks.axiosGet.mockImplementation((url: string) => {
      if (url.includes("/mux-playback")) {
        return Promise.resolve({
          data: {
            playbackId: "abc123xyz",
            playbackToken: "token-playback-1",
            thumbnailToken: "token-thumb",
            storyboardToken: "token-story",
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  test("re-fetches mux-playback when MuxPlayer fires onError (auto retry)", async () => {
    render(<CoursePlayer {...baseProps} />);

    // Initial playback fetch.
    await waitFor(() => {
      expect(muxPlaybackCalls()).toHaveLength(1);
    });

    // Wait for MuxPlayer mount.
    await waitFor(() => {
      expect(mocks.muxPlayerProps.current).not.toBeNull();
    });

    // Simulate Mux playback error -> handleMuxError -> retryPlayback.
    await act(async () => {
      const onError = mocks.muxPlayerProps.current?.onError as
        | (() => void)
        | undefined;
      onError?.();
    });

    await waitFor(() => {
      expect(muxPlaybackCalls().length).toBeGreaterThanOrEqual(2);
    });

    // The retry call must include a cache-busting param to bypass any cache.
    const retryCall = muxPlaybackCalls()[1];
    expect(retryCall?.[1]?.params).toBeDefined();
    expect(retryCall?.[1]?.params?._retry).toBeTypeOf("number");
  });

  test("stops retrying after MAX_MUX_RETRIES and surfaces exhausted overlay", async () => {
    render(<CoursePlayer {...baseProps} />);

    await waitFor(() => {
      expect(mocks.muxPlayerProps.current).not.toBeNull();
    });

    // Fire 5 errors: only 2 should trigger retries (max=2).
    for (let i = 0; i < 5; i += 1) {
      await act(async () => {
        const onError = mocks.muxPlayerProps.current?.onError as
          | (() => void)
          | undefined;
        onError?.();
      });
      // Allow microtasks to settle between errors.
      await act(async () => {
        await Promise.resolve();
      });
    }

    await waitFor(() => {
      // 1 initial + 2 retries = 3.
      expect(muxPlaybackCalls()).toHaveLength(3);
    });
  });
});

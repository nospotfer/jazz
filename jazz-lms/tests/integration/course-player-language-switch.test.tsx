// @vitest-environment jsdom

import { CoursePlayer } from "@/components/course/course-player";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentLanguage: "es",
  realQuiz: false,
  axiosGet: vi.fn(),
  axiosPost: vi.fn(),
  axiosPut: vi.fn(),
  setLanguage: vi.fn(),
  routerRefresh: vi.fn(),
  confettiOpen: vi.fn(),
  warmPaymentMethodModal: vi.fn(),
  toastSuccess: vi.fn(), toastError: vi.fn(),
  ownerId: 'user-1' as string | null,
  authListeners: new Set<(event: string, session: unknown) => void>(),
}));

vi.mock("next/dynamic", async () => {
  const react = await vi.importActual<typeof import("react")>("react");

  const { LessonQuizOverlay } = await vi.importActual<typeof import("@/components/course/lesson-quiz-overlay")>("@/components/course/lesson-quiz-overlay");
  return {
    __esModule: true,
    default: (loader: () => Promise<unknown>) => {
      if (String(loader).includes("lesson-quiz-overlay")) {
        return function Quiz(props: React.ComponentProps<typeof LessonQuizOverlay>) {
          return mocks.realQuiz ? react.createElement(LessonQuizOverlay, props) : null;
        };
      }
      return react.forwardRef(function DynamicStub() { return null; });
    },
  };
});

vi.mock("@/utils/supabase/client", () => ({
  createClient: () => ({ auth: {
    onAuthStateChange: (listener: (event: string, session: unknown) => void) => {
      mocks.authListeners.add(listener);
      listener("INITIAL_SESSION", mocks.ownerId ? { user: { id: mocks.ownerId } } : null);
      return { data: { subscription: { unsubscribe: () => mocks.authListeners.delete(listener) } } };
    },
  } }),
}));

vi.mock("axios", () => ({
  __esModule: true,
  default: {
    get: mocks.axiosGet,
    post: mocks.axiosPost,
    put: mocks.axiosPut,
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
    success: mocks.toastSuccess,
    error: mocks.toastError,
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
  currentUserId: 'user-1',
  course,
  lesson,
  lessonId: "lesson-1",
  initialIsCompleted: false,
  initialProgressPercent: 0,
  initialQuizSummary: null,
  hasQuizAvailable: false,
  canUseGamification: true,
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

function getCompleteButton(name = "Concluir") {
  return screen.getByRole("button", { name }) as HTMLButtonElement;
}

function getGamificationButton() {
  const button = screen
    .getAllByRole("button")
    .find((candidate) =>
      (candidate.textContent || "").trim().startsWith("Gamificacion"),
    );

  if (!button) {
    throw new Error("Gamification button not found");
  }

  return button as HTMLButtonElement;
}

describe("CoursePlayer language switch behavior", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    mocks.currentLanguage = "es";
    mocks.realQuiz = false;
    mocks.ownerId = "user-1";
    mocks.authListeners.clear();

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

  test("a real quiz launch summary may update the player without issuing another quiz launch", async () => {
    mocks.realQuiz = true;
    const summary = { bestScorePercent: 100, bestCorrectCount: 12, bestMedal: "PLATINUM", totalAttempts: 1, lastAttemptAt: null };
    mocks.axiosPost.mockResolvedValue({ data: { summary, attempt: {
      attemptId: "synthetic-issued-attempt", questionCount: 1, answeredCount: 0,
      questions: [{ questionId: "synthetic-question", orderIndex: 0, prompt: "Synthetic issued question", sourceLabel: null,
        selectedOptionId: null, isAnswered: false, isCorrect: null, correctOptionId: null,
        options: [{ id: "synthetic-option", label: "A", text: "Synthetic first option", position: 0 }] }],
    } } });
    const view = render(<CoursePlayer {...baseProps} initialIsCompleted initialProgressPercent={100} hasQuizAvailable />);
    fireEvent.click(getGamificationButton());
    expect(await screen.findByText(/Synthetic issued question/)).toBeTruthy();
    await act(async () => { await Promise.resolve(); });
    expect(mocks.axiosPost).toHaveBeenCalledExactlyOnceWith("/api/courses/course-1/lessons/lesson-1/quiz", { restart: false, language: "es" });
    // A parent render with unchanged lesson/auth must preserve the actual open quiz.
    view.rerender(<CoursePlayer {...baseProps} initialIsCompleted initialProgressPercent={100} hasQuizAvailable />);
    await act(async () => { await Promise.resolve(); });
    expect(mocks.axiosPost).toHaveBeenCalledOnce();
    mocks.realQuiz = false;
  });

  test("updates the accessible completion name and PDF language without refetching mux playback", async () => {
    const view = render(<CoursePlayer {...baseProps} />);

    await waitFor(
      () => {
        expect(muxPlaybackCalls()).toHaveLength(1);
        expect(attachmentCalls()).toHaveLength(1);
      },
      { timeout: 2500 },
    );

    expect(attachmentCalls()[0]?.[1]?.params?.language).toBe("es");
    const completeButton = getCompleteButton();
    expect(completeButton).toHaveProperty("disabled", true);

    for (const [language, completionName] of [
      ["en", "Complete"],
      ["fr", "Valider"],
      ["pt", "Concluir"],
    ]) {
      mocks.currentLanguage = language;
      view.rerender(<CoursePlayer {...baseProps} />);

      await waitFor(() => {
        expect(attachmentCalls().at(-1)?.[1]?.params?.language).toBe(language);
      });

      expect(getCompleteButton(completionName)).toBe(completeButton);
      expect(completeButton.querySelector("span")?.textContent?.trim()).toBe(
        completionName,
      );
      expect(completeButton).toHaveProperty("disabled", true);
    }

    expect(attachmentCalls()).toHaveLength(4);
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

    expect(await screen.findByText(/playback firmado/i)).toBeTruthy();
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

  test("opens confirmation modal at 80% and completes lesson only after confirm", async () => {
    let resolveCompletion!: () => void;
    mocks.axiosPut.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveCompletion = () => resolve({ data: {} });
      }),
    );
    render(
      <CoursePlayer
        {...baseProps}
        hasQuizAvailable
        initialProgressPercent={80}
      />,
    );

    const completeButton = getCompleteButton();
    const gamificationButton = getGamificationButton();
    expect(completeButton.title).toBe("Ir a gamificacion");
    expect(gamificationButton).toHaveProperty("disabled", true);

    fireEvent.click(completeButton);

    expect(
      screen.getByText(/confirmar finalizacion de la clase/i),
    ).toBeTruthy();
    expect(mocks.axiosPut).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: /si, completar e ir al quiz/i }),
    );

    await waitFor(() => {
      expect(mocks.axiosPut).toHaveBeenCalledTimes(1);
    });

    expect(getCompleteButton()).toBe(completeButton);
    expect(completeButton).toHaveProperty("disabled", true);
    expect(completeButton.title).toBe("Guardando...");
    expect(gamificationButton).toHaveProperty("disabled", true);

    await act(async () => {
      resolveCompletion();
    });

    await waitFor(() => {
      expect(gamificationButton).toHaveProperty("disabled", false);
      expect(gamificationButton.className).toContain("from-yellow-400");
    });
    expect(getCompleteButton()).toBe(completeButton);
    expect(completeButton.title).toBe("Concluida");
  });

  test("keeps complete button disabled, gray and without icon below watch threshold", async () => {
    render(<CoursePlayer {...baseProps} initialProgressPercent={0} />);

    const completeButton = getCompleteButton();

    expect(completeButton).toHaveProperty("disabled", true);
    expect(completeButton.className).toContain("text-slate-400");
    expect(completeButton.querySelector("svg")).toBeNull();
  });

  test("keeps complete button enabled at 80% but icon appears only after completion", async () => {
    render(<CoursePlayer {...baseProps} initialProgressPercent={80} />);

    const completeButton = getCompleteButton();

    expect(completeButton).toHaveProperty("disabled", false);
    expect(completeButton.querySelector(".lucide-circle-check-big")).toBeNull();
  });

  test("keeps completed button green and clickable on revisit", async () => {
    render(
      <CoursePlayer
        {...baseProps}
        initialIsCompleted
        initialProgressPercent={100}
      />, 
    );

    const completeButton = getCompleteButton();

    expect(completeButton).toHaveProperty("disabled", false);
    expect(completeButton.className).toContain("text-emerald-400");
    expect(completeButton.title).toBe("Concluida");
    expect(completeButton.querySelector(".lucide-circle-check-big")).not.toBeNull();

    fireEvent.click(completeButton);

    expect(
      screen.getByText(/confirmar finalizacion de la clase/i),
    ).toBeTruthy();
    expect(mocks.axiosPut).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: /si, completar e ir al quiz/i }),
    );

    await waitFor(() => {
      expect(mocks.axiosPut).toHaveBeenCalledTimes(1);
    });
  });
});


describe('CoursePlayer completion belongs to the active owner and mounted frame', () => {
  function retire(event: string) {
    mocks.ownerId = event === 'SIGNED_OUT' ? null : 'user-2';
    for (const listener of [...mocks.authListeners]) listener(event, mocks.ownerId ? { user: { id: mocks.ownerId } } : null);
  }
  async function startCompletion() {
    mocks.currentLanguage = 'es';
    const view = render(<CoursePlayer {...baseProps} initialProgressPercent={80} hasQuizAvailable />);
    fireEvent.click(getCompleteButton());
    fireEvent.click(screen.getByRole('button', { name: /si, completar e ir al quiz/i }));
    await waitFor(() => expect(mocks.axiosPut).toHaveBeenCalledOnce());
    const request = new URL(String(mocks.axiosPut.mock.calls[0][0]), 'https://synthetic.example');
    expect(request.searchParams.getAll('expectedUserId')).toEqual(['user-1']);
    expect(mocks.axiosPut.mock.calls[0][1]).toEqual({ isCompleted: true, progressPercent: 100, minutesRemaining: 0 });
    return view;
  }
  test.each([
    ['SIGNED_IN', true], ['SIGNED_IN', false], ['SIGNED_OUT', true], ['SIGNED_OUT', false],
  ])('late completion after %s (success=%s) cannot refresh, toast or celebrate', async (event, success) => {
    vi.clearAllMocks();
    mocks.ownerId = 'user-1';
    let resolve!: (value: unknown) => void;
    let reject!: (error: Error) => void;
    mocks.axiosPut.mockReturnValueOnce(new Promise((yes, no) => { resolve = yes; reject = no; }));
    await startCompletion();
    await act(async () => retire(String(event)));
    expect(screen.queryByRole('button', { name: 'Concluir' })).toBeNull();
    await act(async () => { if (success) resolve({ data: {} }); else reject(new Error('synthetic request failure')); });
    expect(mocks.routerRefresh).not.toHaveBeenCalled();
    expect(mocks.confettiOpen).not.toHaveBeenCalled();
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
    expect(mocks.toastError).not.toHaveBeenCalled();
  });
  test('late successful completion after unmount cannot navigate or notify', async () => {
    vi.clearAllMocks();
    mocks.ownerId = 'user-1';
    let resolve!: (value: unknown) => void;
    mocks.axiosPut.mockReturnValueOnce(new Promise((yes) => { resolve = yes; }));
    const view = await startCompletion();
    view.unmount();
    await act(async () => resolve({ data: {} }));
    expect(mocks.routerRefresh).not.toHaveBeenCalled();
    expect(mocks.confettiOpen).not.toHaveBeenCalled();
    expect(mocks.toastSuccess).not.toHaveBeenCalled();
  });
  test('same-owner token refresh permits legitimate pending completion exactly once', async () => {
    vi.clearAllMocks();
    mocks.ownerId = 'user-1';
    let resolve!: (value: unknown) => void;
    mocks.axiosPut.mockReturnValueOnce(new Promise((yes) => { resolve = yes; }));
    await startCompletion();
    await act(async () => { for (const listener of [...mocks.authListeners]) listener('TOKEN_REFRESHED', { user: { id: 'user-1' } }); });
    await act(async () => resolve({ data: {} }));
    expect(mocks.routerRefresh).toHaveBeenCalledOnce();
    expect(mocks.confettiOpen).toHaveBeenCalledOnce();
    expect(mocks.toastSuccess).toHaveBeenCalledOnce();
  });
});

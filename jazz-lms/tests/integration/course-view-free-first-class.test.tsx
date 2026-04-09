// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { CourseViewClient } from "@/components/course/course-view-client";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  searchParams: {} as Record<string, string>,
}));

vi.mock("next/dynamic", async () => {
  return {
    __esModule: true,
    default: () =>
      function DynamicStub(props: Record<string, unknown>) {
        if ("onComplete" in props) {
          return (
            <div
              data-testid="unlock-animation-stub"
              data-visible={String(Boolean(props.isVisible))}
            >
              <span data-testid="unlock-animation-message">
                {typeof props.message === "string" ? props.message : ""}
              </span>
            </div>
          );
        }

        return null;
      },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
    replace: mocks.replace,
  }),
  useSearchParams: () => ({
    get: (key: string) => mocks.searchParams[key] ?? null,
    toString: () => new URLSearchParams(mocks.searchParams).toString(),
  }),
}));

vi.mock("@/components/providers/dashboard-preferences-provider", () => ({
  useDashboardPreferences: () => ({
    language: "es",
    setLanguage: vi.fn(),
    t: (_key: string, fallback: string) => fallback,
    notifications: {
      emailNotifications: true,
      courseUpdates: true,
      progressReminders: true,
    },
    setNotifications: vi.fn(),
    updateNotification: vi.fn(),
  }),
}));

vi.mock("@/lib/payment-modal-loader", () => ({
  loadPaymentMethodModal: vi.fn(),
  warmPaymentMethodModal: vi.fn(),
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: (
    props: React.ImgHTMLAttributes<HTMLImageElement> & {
      fill?: boolean;
      priority?: boolean;
    },
  ) => {
    const { alt, ...rest } = props;
    const sanitized = {
      ...rest,
    } as React.ImgHTMLAttributes<HTMLImageElement> & {
      fill?: boolean;
      priority?: boolean;
    };

    delete sanitized.fill;
    delete sanitized.priority;

    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...sanitized} />;
  },
}));

describe("CourseViewClient free first class behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.searchParams = {};

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
  });

  function renderView() {
    const lessonRoutesInOrder = Array.from(
      { length: 15 },
      (_, index) => `/courses/course-1/lessons/l${index + 1}`,
    );

    const lessonIdsInOrder = Array.from(
      { length: 15 },
      (_, index) => `l${index + 1}`,
    );

    const lessonTitlesInOrder = Array.from(
      { length: 15 },
      (_, index) => `Clase ${index + 1}`,
    );

    render(
      <CourseViewClient
        userName="Student"
        hasPurchased={false}
        courseId="course-1"
        lessonRoutesByTitle={{}}
        lessonRoutesInOrder={lessonRoutesInOrder}
        lessonIdsInOrder={lessonIdsInOrder}
        lessonTitlesInOrder={lessonTitlesInOrder}
      />,
    );
  }

  test("opens first class route without requiring purchase", () => {
    renderView();

    const firstClassHeading = screen.getAllByText(/^clase 1$/i)[0];
    const firstClassCard = firstClassHeading.closest("button");

    expect(firstClassCard).toBeTruthy();
    fireEvent.click(firstClassCard as HTMLButtonElement);

    expect(mocks.push).toHaveBeenCalledWith("/courses/course-1/lessons/l1");
  });

  test("keeps second class locked and shows premium modal", () => {
    renderView();

    const secondClassHeading = screen.getAllByText(/^clase 2$/i)[0];
    const secondClassCard = secondClassHeading.closest("button");

    expect(secondClassCard).toBeTruthy();
    fireEvent.click(secondClassCard as HTMLButtonElement);

    expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.getByText(/contenido premium/i)).toBeTruthy();
  });

  test("shows registration unlock animation when welcome query is present", async () => {
    mocks.searchParams = {
      welcome: "registration-free-first-class",
    };

    renderView();

    await waitFor(() => {
      expect(
        screen.getByTestId("unlock-animation-stub").getAttribute("data-visible"),
      ).toBe("true");
    });

    expect(screen.getByTestId("unlock-animation-message").textContent).toMatch(
      /gracias por registrarte/i,
    );
  });
});

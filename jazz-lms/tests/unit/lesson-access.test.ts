import { describe, expect, test } from "vitest";

import { resolveLessonAccessPolicy } from "@/lib/lesson-access";

describe("resolveLessonAccessPolicy", () => {
  test("grants full access and gamification when course is purchased", () => {
    const policy = resolveLessonAccessPolicy({
      isAdminOwner: false,
      hasFullPurchase: true,
      hasLessonPurchase: false,
      isFreePreviewLesson: false,
    });

    expect(policy.canAccessLesson).toBe(true);
    expect(policy.canAccessAttachments).toBe(true);
    expect(policy.canUseGamification).toBe(true);
  });

  test("grants full access and gamification when single lesson is purchased", () => {
    const policy = resolveLessonAccessPolicy({
      isAdminOwner: false,
      hasFullPurchase: false,
      hasLessonPurchase: true,
      isFreePreviewLesson: false,
    });

    expect(policy.canAccessLesson).toBe(true);
    expect(policy.canAccessAttachments).toBe(true);
    expect(policy.canUseGamification).toBe(true);
  });

  test("grants free first lesson access but keeps gamification disabled", () => {
    const policy = resolveLessonAccessPolicy({
      isAdminOwner: false,
      hasFullPurchase: false,
      hasLessonPurchase: false,
      isFreePreviewLesson: true,
    });

    expect(policy.canAccessLesson).toBe(true);
    expect(policy.canAccessAttachments).toBe(true);
    expect(policy.canUseGamification).toBe(false);
  });

  test("denies access when user has no purchase and lesson is not free preview", () => {
    const policy = resolveLessonAccessPolicy({
      isAdminOwner: false,
      hasFullPurchase: false,
      hasLessonPurchase: false,
      isFreePreviewLesson: false,
    });

    expect(policy.canAccessLesson).toBe(false);
    expect(policy.canAccessAttachments).toBe(false);
    expect(policy.canUseGamification).toBe(false);
  });

  test("admin owner has full access including gamification", () => {
    const policy = resolveLessonAccessPolicy({
      isAdminOwner: true,
      hasFullPurchase: false,
      hasLessonPurchase: false,
      isFreePreviewLesson: false,
    });

    expect(policy.canAccessLesson).toBe(true);
    expect(policy.canAccessAttachments).toBe(true);
    expect(policy.canUseGamification).toBe(true);
  });
});
export type LessonAccessPolicy = {
  canAccessLesson: boolean;
  canAccessAttachments: boolean;
  canUseGamification: boolean;
};

export function resolveLessonAccessPolicy(params: {
  isAdminOwner: boolean;
  hasFullPurchase: boolean;
  hasLessonPurchase: boolean;
  isFreePreviewLesson: boolean;
}): LessonAccessPolicy {
  const hasPaidAccess = Boolean(
    params.isAdminOwner || params.hasFullPurchase || params.hasLessonPurchase,
  );

  const canAccessLesson = hasPaidAccess || params.isFreePreviewLesson;

  return {
    canAccessLesson,
    canAccessAttachments: canAccessLesson,
    // Gamification is intentionally restricted to paid/admin access.
    canUseGamification: hasPaidAccess,
  };
}
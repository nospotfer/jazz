import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

const auth = vi.hoisted(() => ({ user: null as null | { id: string; email: string } }));
vi.mock('@/utils/supabase/server', () => ({ createClient: () => ({ auth: { getUser: async () => ({ data: { user: auth.user }, error: null }) } }) }));

// Opt-in only: this suite creates and removes its own rows in an isolated DB.
const testDatabaseUrl = process.env.MAINTENANCE_DATABASE_URL;
const prefix = `maintenance-quiz-${randomUUID()}`;
const userId = `${prefix}-student`;
const otherUserId = `${prefix}-other`;
const courseId = `${prefix}-course`;
const chapterId = `${prefix}-chapter`;
const lessonId = `${prefix}-lesson-paid`;
const freeLessonId = `${prefix}-lesson-free`;
let database: typeof import('@/lib/db')['db'];
let quiz: typeof import('@/lib/lesson-quiz-server');
let progress: typeof import('@/app/api/courses/[courseId]/lessons/[lessonId]/progress/route');
let answerRoute: typeof import('@/app/api/courses/[courseId]/lessons/[lessonId]/quiz/[attemptId]/answer/route');

describe.skipIf(!testDatabaseUrl)('quiz/progress authority against isolated PostgreSQL', () => {
  beforeAll(async () => {
    const url = new URL(testDatabaseUrl!);
    if (url.hostname !== '127.0.0.1' || url.port !== '55432' || url.pathname !== '/jazz_maintenance') {
      throw new Error('Refusing database writes outside isolated loopback jazz_maintenance:55432');
    }
    vi.stubEnv('DATABASE_URL', testDatabaseUrl!);
    vi.stubEnv('ADMIN_OWNER_EMAIL', 'maintenance-owner@example.test');
    database = (await import('@/lib/db')).db;
    quiz = await import('@/lib/lesson-quiz-server');
    progress = await import('@/app/api/courses/[courseId]/lessons/[lessonId]/progress/route');
    answerRoute = await import('@/app/api/courses/[courseId]/lessons/[lessonId]/quiz/[attemptId]/answer/route');
    await database.user.createMany({ data: [
      { id: userId, email: `${prefix}@example.test`, role: 'USER' },
      { id: otherUserId, email: `${prefix}-other@example.test`, role: 'USER' },
    ] });
    await database.course.create({ data: {
      id: courseId, title: 'Isolated maintenance course', isPublished: true,
      chapters: { create: { id: chapterId, title: 'Test chapter', position: 1, isPublished: true,
        lessons: { create: [
          { id: freeLessonId, title: 'Free first lesson', position: 1, isPublished: true },
          { id: lessonId, title: 'Paid lesson', position: 2, isPublished: true },
        ] },
      } },
      purchases: { create: { userId } },
    } });
    // Thirteen questions let the membership test choose a valid bank question
    // that was not included in the randomly issued twelve-question attempt.
    for (let index = 0; index < 13; index += 1) {
      await database.lessonQuizQuestion.create({ data: {
        id: `${prefix}-q${index}`, lessonId, prompt: `Question ${index}`,
        options: { create: Array.from({ length: 5 }, (_, option) => ({
          id: `${prefix}-q${index}-o${option}`, label: String(option), text: `Choice ${option}`, position: option, isCorrect: option === 0,
        })) },
      } });
    }
  });

  beforeEach(async () => {
    auth.user = { id: userId, email: `${prefix}@example.test` };
    await database.lessonQuizSummary.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
    await database.lessonQuizAttempt.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
    await database.userProgress.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
    await database.user.update({ where: { id: otherUserId }, data: { role: 'USER' } });
    await database.course.update({ where: { id: courseId }, data: { isPublished: true } });
  });

  afterAll(async () => {
    if (database) {
      await database.course.deleteMany({ where: { id: courseId } });
      await database.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
      await database.$disconnect();
    }
    vi.unstubAllEnvs();
  });

  const launch = (restart = false) => quiz.createOrResumeLessonQuizAttempt({ userId, lessonId, restart, language: 'pt' });
  const submit = (attemptId: string, questionId: string, optionId: string, student = userId) =>
    quiz.submitLessonQuizAnswer({ userId: student, lessonId, attemptId, questionId, optionId });
  const correctOption = (questionId: string) => `${questionId}-o0`;

  test('persists question membership and hides all correct answers before submission', async () => {
    const payload = await launch();
    expect(payload.attempt.questionCount).toBe(12);
    expect(payload.attempt.questions).toHaveLength(12);
    expect(await database.lessonQuizAttemptAnswer.count({ where: { attemptId: payload.attempt.attemptId } })).toBe(12);
    for (const question of payload.attempt.questions) {
      expect(question).not.toHaveProperty('answerId');
      expect(question.correctOptionId).toBeNull();
      expect(question.isCorrect).toBeNull();
      expect(question.options.some((option) => 'isCorrect' in option)).toBe(false);
    }
  });

  test('concurrent launches resume the same pending persisted attempt', async () => {
    const launches = await Promise.all(Array.from({ length: 5 }, () => launch()));
    expect(new Set(launches.map((payload) => payload.attempt.attemptId)).size).toBe(1);
    expect(await database.lessonQuizAttempt.count({ where: { userId, lessonId } })).toBe(1);
  });

  test('rejects a never-issued id, another user, another lesson and unissued question/option membership', async () => {
    const { attempt } = await launch();
    const question = attempt.questions[0];
    await expect(submit('never-issued', question.questionId, correctOption(question.questionId))).rejects.toMatchObject({ code: 'QUIZ_ATTEMPT_NOT_FOUND' });
    await expect(submit(attempt.attemptId, question.questionId, correctOption(question.questionId), otherUserId)).rejects.toMatchObject({ code: 'QUIZ_ATTEMPT_NOT_FOUND' });
    await expect(quiz.submitLessonQuizAnswer({ userId, lessonId: freeLessonId, attemptId: attempt.attemptId, questionId: question.questionId, optionId: correctOption(question.questionId) })).rejects.toMatchObject({ code: 'QUIZ_ATTEMPT_NOT_FOUND' });
    const unissued = Array.from({ length: 13 }, (_, index) => `${prefix}-q${index}`).find((id) => !attempt.questions.some((item) => item.questionId === id))!;
    await expect(submit(attempt.attemptId, unissued, correctOption(unissued))).rejects.toMatchObject({ code: 'QUIZ_QUESTION_NOT_IN_ATTEMPT' });
    await expect(submit(attempt.attemptId, question.questionId, correctOption(attempt.questions[1].questionId))).rejects.toMatchObject({ code: 'QUIZ_OPTION_NOT_IN_QUESTION' });
    expect(await database.lessonQuizAttemptAnswer.count({ where: { attemptId: attempt.attemptId, answeredAt: { not: null } } })).toBe(0);
  });

  test('ignores forged client answer lists and preserves a wrong accepted answer after revealing feedback', async () => {
    const { attempt } = await launch();
    const question = attempt.questions[0];
    const wrongOption = `${question.questionId}-o1`;
    const response = await answerRoute.POST(new Request('http://127.0.0.1/api/quiz/answer', { method: 'POST', body: JSON.stringify({
      questionId: question.questionId, optionId: wrongOption,
      answers: attempt.questions.map((item) => ({ questionId: item.questionId, selectedOptionId: correctOption(item.questionId) })),
    }) }), { params: Promise.resolve({ courseId, lessonId, attemptId: attempt.attemptId }) });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ answeredCount: 1, isComplete: false, isCorrect: false, result: null, correctOptionId: correctOption(question.questionId) });
    await expect(submit(attempt.attemptId, question.questionId, correctOption(question.questionId))).rejects.toMatchObject({ code: 'QUIZ_ANSWER_LOCKED' });
    const retry = await submit(attempt.attemptId, question.questionId, wrongOption);
    expect(retry.answeredCount).toBe(1);
    expect(retry.isCorrect).toBe(false);
    expect(await database.lessonQuizSummary.count({ where: { userId, lessonId } })).toBe(0);
  });

  test('resumes immutable answered choices and restarts with a different issued attempt', async () => {
    const { attempt } = await launch();
    const question = attempt.questions[0];
    await submit(attempt.attemptId, question.questionId, correctOption(question.questionId));
    const resumed = await launch();
    expect(resumed.attempt.attemptId).toBe(attempt.attemptId);
    expect(resumed.attempt.answeredCount).toBe(1);
    expect(resumed.attempt.questions[0]).toMatchObject({ isAnswered: true, selectedOptionId: correctOption(question.questionId), isCorrect: true });
    const restarted = await launch(true);
    expect(restarted.attempt.attemptId).not.toBe(attempt.attemptId);
    for (const item of restarted.attempt.questions) await submit(restarted.attempt.attemptId, item.questionId, correctOption(item.questionId));
    const reopened = await launch();
    expect(reopened.attempt.attemptId).not.toBe(attempt.attemptId);
    expect(reopened.attempt.attemptId).not.toBe(restarted.attempt.attemptId);
    expect(reopened.attempt.answeredCount).toBe(0);
  });

  test('concurrent conflicting answers record exactly one immutable choice', async () => {
    const { attempt } = await launch();
    const question = attempt.questions[0];
    const responses = await Promise.allSettled([
      submit(attempt.attemptId, question.questionId, correctOption(question.questionId)),
      submit(attempt.attemptId, question.questionId, `${question.questionId}-o1`),
    ]);
    expect(responses.filter((response) => response.status === 'fulfilled')).toHaveLength(1);
    expect(responses.find((response) => response.status === 'rejected')).toMatchObject({ reason: { code: 'QUIZ_ANSWER_LOCKED' } });
    expect(await database.lessonQuizAttemptAnswer.count({ where: { attemptId: attempt.attemptId, answeredAt: { not: null } } })).toBe(1);
  });

  test('concurrent final retries award one platinum result and increment totalAttempts once', async () => {
    const { attempt } = await launch();
    for (const question of attempt.questions.slice(0, -1)) await submit(attempt.attemptId, question.questionId, correctOption(question.questionId));
    const last = attempt.questions.at(-1)!;
    const responses = await Promise.all(Array.from({ length: 5 }, () => submit(attempt.attemptId, last.questionId, correctOption(last.questionId))));
    for (const response of responses) expect(response.result).toMatchObject({ attemptId: attempt.attemptId, scorePercent: 100, medal: 'PLATINUM' });
    const summary = await database.lessonQuizSummary.findUnique({ where: { userId_lessonId: { userId, lessonId } } });
    expect(summary).toMatchObject({ totalAttempts: 1, bestMedal: 'PLATINUM', bestCorrectCount: 12 });
  });

  test('scores accepted database choices and retains the original 11-of-12 GOLD tier', async () => {
    const { attempt } = await launch();
    let result;
    for (const [index, question] of attempt.questions.entries()) result = await submit(attempt.attemptId, question.questionId, index === 0 ? `${question.questionId}-o1` : correctOption(question.questionId));
    expect(result?.result).toMatchObject({ correctCount: 11, scorePercent: 92, medal: 'GOLD' });
    expect(result?.result?.incorrectQuestionNumbers).toEqual([1]);
  });

  test('allows free first-lesson progress, denies its quiz, and denies unpurchased paid progress/wrong-course paths', async () => {
    auth.user = { id: otherUserId, email: `${prefix}-other@example.test` };
    const writeProgress = (targetLesson: string, targetCourse = courseId) => progress.PUT(new Request('http://127.0.0.1/api/progress', { method: 'PUT', body: JSON.stringify({ isCompleted: true, progressPercent: 100 }) }), { params: Promise.resolve({ courseId: targetCourse, lessonId: targetLesson }) });
    expect((await writeProgress(freeLessonId)).status).toBe(200);
    await expect(quiz.assertLessonQuizAccess({ userId: otherUserId, userEmail: auth.user.email, courseId, lessonId: freeLessonId })).rejects.toMatchObject({ statusCode: 403 });
    expect((await writeProgress(lessonId)).status).toBe(403);
    expect((await writeProgress(freeLessonId, 'wrong-course')).status).toBe(404);
    expect(await database.userProgress.count({ where: { userId: otherUserId } })).toBe(1);
    await database.course.update({ where: { id: courseId }, data: { isPublished: false } });
    expect((await writeProgress(freeLessonId)).status).toBe(404);
  });

  test('allows role-based admins and single-lesson buyers without requiring owner email', async () => {
    await database.user.update({ where: { id: otherUserId }, data: { role: 'COURSE_ADMIN' } });
    await expect(quiz.assertLessonQuizAccess({ userId: otherUserId, courseId, lessonId, userEmail: `${prefix}-other@example.test` })).resolves.toMatchObject({ id: lessonId });
    await database.user.update({ where: { id: otherUserId }, data: { role: 'USER' } });
    await database.lessonPurchase.create({ data: { userId: otherUserId, lessonId } });
    await expect(quiz.assertLessonQuizAccess({ userId: otherUserId, courseId, lessonId, userEmail: `${prefix}-other@example.test` })).resolves.toMatchObject({ id: lessonId });
  });
});

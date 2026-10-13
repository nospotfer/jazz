// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { LessonQuizAnswerResponse, LessonQuizAttemptPayload } from '@/lib/lesson-quiz';

const mocks = vi.hoisted(() => ({ post: vi.fn(), confetti: vi.fn(), toastError: vi.fn() }));
vi.mock('axios', () => ({ default: { post: mocks.post, isAxiosError: () => false } }));
vi.mock('@/components/providers/language-provider', () => ({ useLanguage: () => ({ language: 'en' }) }));
vi.mock('@/hooks/use-confetti-store', () => ({ useConfettiStore: () => ({ onOpen: mocks.confetti }) }));
vi.mock('sonner', () => ({ toast: { error: mocks.toastError } }));

import { LessonQuizOverlay } from '@/components/course/lesson-quiz-overlay';

function pendingAttempt(): LessonQuizAttemptPayload {
  return {
    attemptId: 'issued-attempt', questionCount: 2, answeredCount: 0,
    questions: [0, 1].map((index) => ({
      questionId: `question-${index}`, orderIndex: index, prompt: `Question prompt ${index + 1}`,
      sourceLabel: null, selectedOptionId: null, isAnswered: false, isCorrect: null, correctOptionId: null,
      options: [
        { id: `q${index}-a`, label: 'A', text: `First option ${index + 1}`, position: 0 },
        { id: `q${index}-b`, label: 'B', text: `Second option ${index + 1}`, position: 1 },
      ],
    })),
  };
}

const mount = () => render(<LessonQuizOverlay courseId="course-1" lessonId="lesson-1" isOpen initialSummary={null} onClose={() => {}} />);

describe('quiz UI uses server-authoritative accepted answers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.post.mockResolvedValueOnce({ data: { attempt: pendingAttempt(), summary: null } });
  });
  afterEach(cleanup);

  test('waits for the first server answer and uses its wrong-answer verdict without local grading', async () => {
    const user = userEvent.setup();
    let accept!: (response: { data: LessonQuizAnswerResponse }) => void;
    mocks.post.mockReturnValueOnce(new Promise((resolve) => { accept = resolve; }));
    mount();
    await user.click(await screen.findByRole('button', { name: /First option 1/ }));
    const confirm = screen.getByRole('button', { name: /confirm answer/i });
    expect(confirm.hasAttribute('disabled')).toBe(false);
    await user.click(confirm);

    expect(mocks.post).toHaveBeenLastCalledWith('/api/courses/course-1/lessons/lesson-1/quiz/issued-attempt/answer', { questionId: 'question-0', optionId: 'q0-a' });
    expect(mocks.confetti).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /confirming/i }).hasAttribute('disabled')).toBe(true);
    await act(async () => {
      accept({ data: { attemptId: 'issued-attempt', questionId: 'question-0', isCorrect: false, correctOptionId: 'q0-b', answeredCount: 1, isComplete: false, result: null, summary: null } });
    });

    await waitFor(() => expect(screen.getByText('First option 1').closest('button')?.className).toContain('border-rose-400'));
    expect(screen.getByText('Second option 1').closest('button')?.className).toContain('border-emerald-400');
    expect(mocks.confetti).not.toHaveBeenCalled();
  });

  test('celebrates only a successful verdict returned by the server', async () => {
    mocks.post.mockResolvedValueOnce({ data: { attemptId: 'issued-attempt', questionId: 'question-0', isCorrect: true, correctOptionId: 'q0-a', answeredCount: 1, isComplete: false, result: null, summary: null } });
    mount();
    fireEvent.click(await screen.findByText('First option 1'));
    fireEvent.click(screen.getByRole('button', { name: /confirm answer/i }));

    await waitFor(() => expect(mocks.confetti).toHaveBeenCalledOnce());
    expect(screen.getByText('First option 1').closest('button')?.hasAttribute('disabled')).toBe(true);
  });

  test('leaves the question editable when recording an answer fails', async () => {
    mocks.post.mockRejectedValueOnce(new Error('Offline'));
    mount();
    fireEvent.click(await screen.findByText('First option 1'));
    fireEvent.click(screen.getByRole('button', { name: /confirm answer/i }));

    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledOnce());
    expect(screen.getByText('Second option 1').closest('button')?.hasAttribute('disabled')).toBe(false);
    expect(mocks.confetti).not.toHaveBeenCalled();
  });

  test('continues a persisted partial attempt at its first unanswered question', async () => {
    const attempt = pendingAttempt();
    attempt.answeredCount = 1;
    attempt.questions[0] = { ...attempt.questions[0], isAnswered: true, selectedOptionId: 'q0-a', isCorrect: true, correctOptionId: 'q0-a' };
    mocks.post.mockReset().mockResolvedValueOnce({ data: { attempt, summary: null } });
    mount();

    expect(await screen.findByText('Question 2 - Question prompt 2')).toBeTruthy();
    expect(screen.queryByText('First option 1')).toBeNull();
    expect(mocks.confetti).not.toHaveBeenCalled();
  });

  test('an older duplicate launch cannot replace the current question or clear a selected answer', async () => {
    let older!: (response: unknown) => void;
    let newer!: (response: unknown) => void;
    mocks.post.mockReset()
      .mockReturnValueOnce(new Promise((resolve) => { older = resolve; }))
      .mockReturnValueOnce(new Promise((resolve) => { newer = resolve; }));
    render(<StrictMode><LessonQuizOverlay courseId="course-1" lessonId="lesson-1" isOpen initialSummary={null} onClose={() => {}} /></StrictMode>);
    await waitFor(() => expect(mocks.post).toHaveBeenCalledTimes(2));
    const active = pendingAttempt();
    active.questions[0].prompt = 'Current session question';
    await act(async () => { newer({ data: { attempt: active, summary: null } }); });
    fireEvent.click(await screen.findByText('First option 1'));
    expect(screen.getByRole('button', { name: /confirm answer/i }).hasAttribute('disabled')).toBe(false);
    const stale = pendingAttempt();
    stale.questions[0].prompt = 'Outdated session question';
    await act(async () => { older({ data: { attempt: stale, summary: null } }); });
    expect(screen.getByText('Question 1 - Current session question')).toBeTruthy();
    expect(screen.queryByText('Question 1 - Outdated session question')).toBeNull();
    expect(screen.getByRole('button', { name: /confirm answer/i }).hasAttribute('disabled')).toBe(false);
  });

  test('a launch response received after closing cannot update the parent summary', async () => {
    let accept!: (response: unknown) => void;
    mocks.post.mockReset().mockReturnValueOnce(new Promise((resolve) => { accept = resolve; }));
    const onSummaryChange = vi.fn();
    const view = render(<LessonQuizOverlay courseId="course-1" lessonId="lesson-1" isOpen initialSummary={null} onClose={() => {}} onSummaryChange={onSummaryChange} />);
    await waitFor(() => expect(mocks.post).toHaveBeenCalledOnce());
    view.rerender(<LessonQuizOverlay courseId="course-1" lessonId="lesson-1" isOpen={false} initialSummary={null} onClose={() => {}} onSummaryChange={onSummaryChange} />);
    await act(async () => { accept({ data: { attempt: pendingAttempt(), summary: null } }); });
    expect(onSummaryChange).not.toHaveBeenCalled();
    expect(screen.queryByTestId('lesson-quiz-overlay')).toBeNull();
  });

  test('an answer from a closed session cannot lock or advance a reopened quiz', async () => {
    let accept!: (response: unknown) => void;
    mocks.post.mockReturnValueOnce(new Promise((resolve) => { accept = resolve; }))
      .mockResolvedValueOnce({ data: { attempt: pendingAttempt(), summary: null } });
    const onSummaryChange = vi.fn();
    const props = { courseId: 'course-1', lessonId: 'lesson-1', initialSummary: null, onClose: () => {}, onSummaryChange };
    const view = render(<LessonQuizOverlay {...props} isOpen />);
    fireEvent.click(await screen.findByText('First option 1'));
    fireEvent.click(screen.getByRole('button', { name: /confirm answer/i }));
    view.rerender(<LessonQuizOverlay {...props} isOpen={false} />);
    view.rerender(<LessonQuizOverlay {...props} isOpen />);
    await screen.findByText('First option 1');
    onSummaryChange.mockClear();
    await act(async () => { accept({ data: {
      attemptId: 'issued-attempt', questionId: 'question-0', isCorrect: true, correctOptionId: 'q0-a',
      answeredCount: 1, isComplete: false, result: null,
      summary: { bestMedal: 'PLATINUM', bestScorePercent: 100, bestCorrectCount: 12, totalAttempts: 1, lastAttemptAt: null },
    } }); });
    expect(onSummaryChange).not.toHaveBeenCalled();
    expect(mocks.confetti).not.toHaveBeenCalled();
    expect(screen.getByText('First option 1').closest('button')?.hasAttribute('disabled')).toBe(false);
  });
});

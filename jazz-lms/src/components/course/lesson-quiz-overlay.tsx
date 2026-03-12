'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  Loader2,
  Music2,
  RefreshCw,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';
import { useConfettiStore } from '@/hooks/use-confetti-store';
import {
  LESSON_QUIZ_AUTO_ADVANCE_MS,
  LESSON_QUIZ_QUESTION_COUNT,
  type LessonQuizAnswerResponse,
  type LessonQuizAttemptPayload,
  type LessonQuizLaunchResponse,
  type LessonQuizResultPayload,
  type LessonQuizSummarySnapshot,
} from '@/lib/lesson-quiz';
import { cn } from '@/lib/utils';
import {
  LessonQuizMedalBadge,
  getLessonQuizResultMessage,
} from '@/components/course/lesson-quiz-medal';

interface LessonQuizOverlayProps {
  courseId: string;
  lessonId: string;
  isOpen: boolean;
  hasQuizAvailable: boolean;
  initialSummary: LessonQuizSummarySnapshot | null;
  onClose: () => void;
  onSummaryChange?: (summary: LessonQuizSummarySnapshot | null) => void;
}

type FeedbackState = {
  questionId: string;
  verdict: 'correct' | 'incorrect';
} | null;

type ConfettiPiece = {
  id: string;
  left: string;
  delay: string;
  duration: string;
  drift: string;
  color: string;
  top: string;
};

const CONFETTI_COLORS = ['#f2b705', '#f59e0b', '#22c55e', '#fb7185', '#7dd3fc'];

function buildConfettiBurst() {
  return Array.from({ length: 24 }, (_, index) => ({
    id: `${Date.now()}-${index}`,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 14}%`,
    delay: `${Math.random() * 0.18}s`,
    duration: `${1.9 + Math.random() * 1.4}s`,
    drift: `${-60 + Math.random() * 120}px`,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  }));
}

function QuizSideDecor() {
  return (
    <>
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-44 flex-col justify-center gap-5 px-5 lg:flex">
        <div className="quiz-pixel-panel animate-quiz-side-bob">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.24em] text-amber-100/85">
            <span>Jazz</span>
            <Music2 className="h-4 w-4" />
          </div>
          <div className="mt-3 flex items-end gap-1.5">
            {[0, 1, 2, 3, 4].map((item) => (
              <span
                key={item}
                className="animate-quiz-equalizer inline-block w-3 rounded-t-sm bg-gradient-to-t from-amber-600 to-yellow-300"
                style={{
                  height: `${20 + item * 7}px`,
                  animationDelay: `${item * 0.12}s`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="quiz-pixel-panel animate-quiz-side-bob" style={{ animationDelay: '0.5s' }}>
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-amber-200/25 bg-black/30 shadow-[inset_0_0_0_6px_rgba(245,158,11,0.12)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-100/20 bg-gradient-to-br from-amber-300/15 to-transparent">
              <div className="h-3 w-3 rounded-full bg-amber-100/90" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-amber-100/75">
            <Sparkles className="h-4 w-4" />
            <Star className="h-4 w-4" />
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-44 flex-col justify-center gap-5 px-5 lg:flex">
        <div className="quiz-pixel-panel animate-quiz-side-bob" style={{ animationDelay: '0.25s' }}>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-100/80">Arcade swing</p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }, (_, index) => (
              <span
                key={index}
                className="h-6 rounded-sm border border-cyan-100/10 bg-gradient-to-br from-cyan-200/20 to-transparent"
              />
            ))}
          </div>
        </div>

        <div className="quiz-pixel-panel animate-quiz-side-bob" style={{ animationDelay: '0.8s' }}>
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.22em] text-amber-100/75">
            <span>8-bit groove</span>
            <span>12/12</span>
          </div>
          <div className="mt-3 space-y-2">
            {['Solo', 'Rhythm', 'Pulse'].map((label, index) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-12 text-[10px] uppercase tracking-[0.18em] text-amber-50/70">{label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-200 animate-pulse"
                    style={{ width: `${58 + index * 14}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function LessonQuizOverlay({
  courseId,
  lessonId,
  isOpen,
  hasQuizAvailable,
  initialSummary,
  onClose,
  onSummaryChange,
}: LessonQuizOverlayProps) {
  const { language } = useLanguage();
  const confetti = useConfettiStore();
  const [summary, setSummary] = useState<LessonQuizSummarySnapshot | null>(initialSummary);
  const [attempt, setAttempt] = useState<LessonQuizAttemptPayload | null>(null);
  const [result, setResult] = useState<LessonQuizResultPayload | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const advanceTimerRef = useRef<number | null>(null);

  const copy = {
    es: {
      loading: 'Preparando tu quiz...',
      instruction: 'Selecciona la respuesta correcta',
      questionLabel: 'Pregunta',
      of: 'de',
      confirm: 'Confirmar respuesta',
      confirming: 'Confirmando...',
      close: 'Cerrar',
      retry: 'Repetir quiz',
      resultTitle: 'Felicidades por completar este quiz',
      resultScore: 'Precisión final',
      resultCorrect: 'Aciertos',
      resultWrong: 'Errores',
      currentBest: 'Mejor marca',
      yourProgress: 'Tu progreso en esta sesión',
      startError: 'No se pudo abrir el quiz en este momento.',
      answerError: 'No se pudo registrar tu respuesta.',
      noOption: 'Selecciona una alternativa antes de confirmar.',
      quizNotReadyTitle: 'Este quiz aún no está listo',
      quizNotReadyBody: 'Faltan preguntas validadas para esta lección. La estructura ya está preparada, pero todavía no hay un banco completo para lanzar las 12 cuestiones.',
      resumeTitle: 'Modo jazz arcade',
      bestResultEmpty: 'Tu mejor medalla aparecerá aquí cuando cierres una ronda completa.',
      closeQuiz: 'Cerrar quiz',
    },
    en: {
      loading: 'Preparing your quiz...',
      instruction: 'Select the correct answer',
      questionLabel: 'Question',
      of: 'of',
      confirm: 'Confirm answer',
      confirming: 'Confirming...',
      close: 'Close',
      retry: 'Retry quiz',
      resultTitle: 'Congratulations on completing this quiz',
      resultScore: 'Final accuracy',
      resultCorrect: 'Correct answers',
      resultWrong: 'Incorrect answers',
      currentBest: 'Best run',
      yourProgress: 'Your progress in this session',
      startError: 'Unable to open the quiz right now.',
      answerError: 'Unable to save your answer.',
      noOption: 'Select one option before confirming.',
      quizNotReadyTitle: 'This quiz is not ready yet',
      quizNotReadyBody: 'This lesson still needs a validated question bank. The feature is wired in, but the full 12-question set is not available yet.',
      resumeTitle: 'Jazz arcade mode',
      bestResultEmpty: 'Your best medal will appear here after your first full run.',
      closeQuiz: 'Close quiz',
    },
    fr: {
      loading: 'Préparation de votre quiz...',
      instruction: 'Sélectionnez la bonne réponse',
      questionLabel: 'Question',
      of: 'sur',
      confirm: 'Confirmer la réponse',
      confirming: 'Confirmation...',
      close: 'Fermer',
      retry: 'Rejouer le quiz',
      resultTitle: 'Bravo pour avoir terminé ce quiz',
      resultScore: 'Précision finale',
      resultCorrect: 'Bonnes réponses',
      resultWrong: 'Erreurs',
      currentBest: 'Meilleur résultat',
      yourProgress: 'Votre progression sur cette session',
      startError: 'Impossible d’ouvrir le quiz pour le moment.',
      answerError: 'Impossible d’enregistrer votre réponse.',
      noOption: 'Sélectionnez une option avant de confirmer.',
      quizNotReadyTitle: 'Ce quiz n’est pas encore prêt',
      quizNotReadyBody: 'Cette leçon a encore besoin d’un lot complet de questions validées. L’interface est prête, mais le set de 12 questions n’est pas encore disponible.',
      resumeTitle: 'Mode jazz arcade',
      bestResultEmpty: 'Votre meilleure médaille apparaîtra ici après une première tentative complète.',
      closeQuiz: 'Fermer le quiz',
    },
    pt: {
      loading: 'Preparando seu quiz...',
      instruction: 'Selecione a resposta correta',
      questionLabel: 'Questão',
      of: 'de',
      confirm: 'Confirmar resposta',
      confirming: 'Confirmando...',
      close: 'Fechar',
      retry: 'Refazer quiz',
      resultTitle: 'Parabéns por concluir este quiz',
      resultScore: 'Precisão final',
      resultCorrect: 'Questões certas',
      resultWrong: 'Questões erradas',
      currentBest: 'Melhor resultado',
      yourProgress: 'Seu progresso nesta sessão',
      startError: 'Não foi possível abrir o quiz agora.',
      answerError: 'Não foi possível registrar sua resposta.',
      noOption: 'Selecione uma alternativa antes de confirmar.',
      quizNotReadyTitle: 'Este quiz ainda não está pronto',
      quizNotReadyBody: 'Esta aula ainda precisa de um banco validado de perguntas. A interface já está conectada, mas o conjunto completo de 12 questões ainda não está disponível.',
      resumeTitle: 'Modo jazz arcade',
      bestResultEmpty: 'Sua melhor medalha vai aparecer aqui depois da primeira rodada completa.',
      closeQuiz: 'Fechar quiz',
    },
  }[language];

  useEffect(() => {
    setSummary(initialSummary);
  }, [initialSummary]);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  const currentQuestion = attempt?.questions[currentQuestionIndex] ?? null;

  const sessionProgressPercent = useMemo(() => {
    if (!attempt) {
      return 0;
    }

    return Math.round((attempt.answeredCount / attempt.questionCount) * 100);
  }, [attempt]);

  const openQuiz = async (restart = false) => {
    if (!hasQuizAvailable) {
      return;
    }

    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }

    setIsLoading(true);
    setError('');
    setFeedback(null);
    setResult(null);
    setSelectedOptionId(null);

    try {
      const response = await axios.post<LessonQuizLaunchResponse>(
        `/api/courses/${courseId}/lessons/${lessonId}/quiz`,
        { restart }
      );

      setAttempt(response.data.attempt);
      setSummary(response.data.summary);
      onSummaryChange?.(response.data.summary);
      setCurrentQuestionIndex(0);
      setSelectedOptionId(null);
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || copy.startError
        : copy.startError;
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setAttempt(null);
      setResult(null);
      setError('');
      setFeedback(null);
      setSelectedOptionId(null);
      setConfettiPieces([]);
      return;
    }

    void openQuiz(false);
  }, [isOpen]);

  useEffect(() => {
    if (!currentQuestion) {
      return;
    }

    setSelectedOptionId(currentQuestion.selectedOptionId ?? null);
  }, [currentQuestion?.questionId]);

  const handleAnswerSubmit = async () => {
    if (!attempt || !currentQuestion) {
      return;
    }

    if (!selectedOptionId) {
      toast.error(copy.noOption);
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedAnswers = attempt.questions
        .map((question) => ({
          questionId: question.questionId,
          selectedOptionId:
            question.questionId === currentQuestion.questionId
              ? selectedOptionId
              : question.selectedOptionId,
        }))
        .filter((question): question is { questionId: string; selectedOptionId: string } => Boolean(question.selectedOptionId));

      const response = await axios.post<LessonQuizAnswerResponse>(
        `/api/courses/${courseId}/lessons/${lessonId}/quiz/${attempt.attemptId}/answer`,
        {
          questionId: currentQuestion.questionId,
          optionId: selectedOptionId,
          answers: selectedAnswers,
        }
      );

      setAttempt((currentAttempt) => {
        if (!currentAttempt) {
          return currentAttempt;
        }

        const nextQuestions = currentAttempt.questions.map((question) =>
          question.questionId === currentQuestion.questionId
            ? {
                ...question,
                isAnswered: true,
                selectedOptionId,
              }
            : question
        );

        return {
          ...currentAttempt,
          answeredCount: response.data.answeredCount,
          questions: nextQuestions,
        };
      });

      setFeedback({
        questionId: currentQuestion.questionId,
        verdict: response.data.isCorrect ? 'correct' : 'incorrect',
      });

      if (response.data.isCorrect) {
        confetti.onOpen();
        setConfettiPieces(buildConfettiBurst());
        window.setTimeout(() => setConfettiPieces([]), 2100);
      }

      if (response.data.summary) {
        setSummary(response.data.summary);
        onSummaryChange?.(response.data.summary);
      }

      advanceTimerRef.current = window.setTimeout(() => {
        setFeedback(null);

        if (response.data.isComplete && response.data.result) {
          setResult(response.data.result);
          return;
        }

        setCurrentQuestionIndex((currentIndex) => Math.min(currentIndex + 1, LESSON_QUIZ_QUESTION_COUNT - 1));
      }, LESSON_QUIZ_AUTO_ADVANCE_MS);
    } catch (error: unknown) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || copy.answerError
        : copy.answerError;
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const questionCardTone =
    feedback?.questionId === currentQuestion?.questionId
      ? feedback?.verdict === 'correct'
        ? 'border-emerald-400/70 bg-emerald-500/12 shadow-[0_0_35px_rgba(34,197,94,0.18)]'
        : 'border-rose-400/70 bg-rose-500/12 shadow-[0_0_35px_rgba(244,63,94,0.18)]'
      : 'border-primary/35 bg-black/20';

  return (
    <div className="fixed inset-0 z-[120] overflow-hidden bg-black/78 backdrop-blur-md">
      <div className="quiz-scanlines absolute inset-0 opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.18),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(56,189,248,0.12),_transparent_28%)]" />

      <QuizSideDecor />

      {confettiPieces.map((piece) => (
        <span
          key={piece.id}
          className="pointer-events-none absolute animate-confetti-fall rounded-sm"
          style={{
            left: piece.left,
            top: piece.top,
            width: 8,
            height: 18,
            backgroundColor: piece.color,
            ['--delay' as string]: piece.delay,
            ['--duration' as string]: piece.duration,
            ['--drift' as string]: piece.drift,
          }}
        />
      ))}

      <div className="relative flex h-full flex-col p-4 sm:p-6 lg:px-20 lg:py-8">
        <div className="flex items-center justify-between">
          <div className="hidden sm:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary/75">{copy.resumeTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{copy.yourProgress}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
            aria-label={copy.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mx-auto flex w-full max-w-4xl flex-1 items-center justify-center">
          {!hasQuizAvailable ? (
            <div className="animate-fade-scale-in w-full max-w-2xl rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(17,24,39,0.96),rgba(24,24,27,0.95),rgba(51,65,85,0.92))] p-8 text-center shadow-2xl">
              <div className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-3xl border border-primary/25 bg-primary/10 text-primary">
                <Sparkles className="h-8 w-8" />
              </div>
              <h2 className="mt-6 text-3xl font-serif font-bold text-white">{copy.quizNotReadyTitle}</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/70">{copy.quizNotReadyBody}</p>
              <Button onClick={onClose} className="mt-8 min-w-40">
                {copy.closeQuiz}
              </Button>
            </div>
          ) : isLoading || !attempt ? (
            <div className="animate-fade-scale-in rounded-[28px] border border-white/10 bg-card/80 px-8 py-10 text-center shadow-2xl backdrop-blur-sm">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">{error || copy.loading}</p>
            </div>
          ) : (
            <div className="w-full animate-fade-scale-in">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-stretch lg:justify-between">
                <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm lg:min-w-[320px]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary/80">{copy.yourProgress}</p>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-2xl font-serif font-bold text-white">
                        {copy.questionLabel} {currentQuestionIndex + 1} {copy.of} {attempt.questionCount}
                      </p>
                      <p className="text-sm text-white/65">{sessionProgressPercent}%</p>
                    </div>
                    <div className="w-28 overflow-hidden rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-cyan-200" style={{ width: `${sessionProgressPercent}%` }} />
                    </div>
                  </div>
                </div>

                {summary && summary.totalAttempts > 0 ? (
                  <LessonQuizMedalBadge
                    medal={summary.bestMedal}
                    language={language}
                    scorePercent={summary.bestScorePercent}
                    compact
                    className="self-start"
                  />
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-5 py-4 text-sm text-white/60 lg:min-w-[280px]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary/80">{copy.currentBest}</p>
                    <p className="mt-3 leading-6">{copy.bestResultEmpty}</p>
                  </div>
                )}
              </div>

              {currentQuestion ? (
                <div className={cn('relative overflow-hidden rounded-[32px] border p-6 shadow-2xl backdrop-blur-sm sm:p-8', questionCardTone)}>
                  <div className="absolute inset-x-10 top-0 h-20 bg-[radial-gradient(circle,_rgba(212,175,55,0.2),_transparent_55%)] blur-2xl" />

                  <div className="relative">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary/75">
                      {copy.questionLabel} {currentQuestionIndex + 1}
                    </p>
                    <h2 className="mt-4 text-2xl font-bold leading-tight text-white sm:text-3xl">
                      {copy.questionLabel} {currentQuestionIndex + 1} - {currentQuestion.prompt}
                    </h2>
                    <p className="mt-3 text-sm text-white/65">{copy.instruction}</p>

                    <div className="mt-8 grid gap-3">
                      {currentQuestion.options.map((option) => {
                        const isSelected = selectedOptionId === option.id;
                        const isLocked = currentQuestion.isAnswered;
                        const isFeedbackTarget = feedback?.questionId === currentQuestion.questionId;
                        const optionTone = isLocked && isSelected && isFeedbackTarget
                          ? feedback?.verdict === 'correct'
                            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-50'
                            : 'border-rose-400 bg-rose-500/20 text-rose-50'
                          : isSelected
                          ? 'border-primary bg-primary/15 text-white'
                          : 'border-white/10 bg-white/5 text-white/85 hover:border-primary/45 hover:bg-white/10';

                        return (
                          <button
                            key={option.id}
                            type="button"
                            disabled={isLocked || isSubmitting}
                            onClick={() => setSelectedOptionId(option.id)}
                            className={cn(
                              'flex w-full items-start gap-4 rounded-2xl border px-4 py-4 text-left transition-all duration-150 disabled:cursor-default disabled:opacity-90',
                              optionTone
                            )}
                          >
                            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-current/20 bg-black/10 text-xs font-bold">
                              {option.label}
                            </span>
                            <span className="text-sm leading-6 sm:text-[15px]">{option.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/45">
                        <Music2 className="h-4 w-4 text-primary/65" />
                        <span>Jazz arcade • 5 choices • 12 rounds</span>
                      </div>

                      <Button
                        onClick={handleAnswerSubmit}
                        disabled={!selectedOptionId || isSubmitting || currentQuestion.isAnswered}
                        className="min-w-48 rounded-xl bg-gradient-to-r from-yellow-500 via-yellow-400 to-amber-500 text-black shadow-[0_10px_30px_rgba(245,158,11,0.25)] hover:from-yellow-400 hover:to-amber-400"
                      >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {isSubmitting ? copy.confirming : copy.confirm}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {result ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-sm p-4">
              <div className="animate-fade-scale-in w-full max-w-2xl rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,rgba(10,10,10,0.96),rgba(24,24,27,0.98),rgba(17,24,39,0.96))] p-6 shadow-2xl sm:p-8">
                <div className="mx-auto max-w-lg text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary/75">{copy.currentBest}</p>
                  <h2 className="mt-4 text-3xl font-serif font-bold text-white sm:text-4xl">{copy.resultTitle}</h2>
                  <p className="mt-4 text-sm leading-7 text-white/70">
                    {getLessonQuizResultMessage(language, result.medal)}
                  </p>
                </div>

                <div className="mt-8 flex justify-center">
                  <LessonQuizMedalBadge medal={result.medal} language={language} scorePercent={result.scorePercent} />
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center">
                    <p className="text-[11px] uppercase tracking-[0.26em] text-white/45">{copy.resultScore}</p>
                    <p className="mt-3 text-3xl font-bold text-white">{result.scorePercent}%</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 text-center">
                    <p className="text-[11px] uppercase tracking-[0.26em] text-emerald-100/70">{copy.resultCorrect}</p>
                    <p className="mt-3 text-3xl font-bold text-emerald-100">{result.correctCount}</p>
                  </div>
                  <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-4 text-center">
                    <p className="text-[11px] uppercase tracking-[0.26em] text-rose-100/70">{copy.resultWrong}</p>
                    <p className="mt-3 text-3xl font-bold text-rose-100">{result.incorrectQuestionNumbers.length}</p>
                  </div>
                </div>

                <div className="mt-8 grid gap-5 sm:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                    <p className="text-sm font-semibold text-emerald-100">{copy.resultCorrect}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.correctQuestionNumbers.map((number) => (
                        <span key={number} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-300 text-sm font-bold text-black">
                          {number}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4">
                    <p className="text-sm font-semibold text-rose-100">{copy.resultWrong}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {result.incorrectQuestionNumbers.map((number) => (
                        <span key={number} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-300 text-sm font-bold text-black">
                          {number}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void openQuiz(true)}
                    className="min-w-44 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {copy.retry}
                  </Button>
                  <Button type="button" onClick={onClose} className="min-w-44 rounded-xl">
                    {copy.closeQuiz}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  Loader2,
  Music2,
  RefreshCw,
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

function isLocalQuizQaMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

interface LessonQuizOverlayProps {
  courseId: string;
  lessonId: string;
  currentLessonClassNumber?: number | null;
  isOpen: boolean;
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

function QuizSideDecor({
  language,
}: {
  language: 'es' | 'en' | 'fr' | 'pt';
}) {
  const copy = {
    es: {
      arcadeSwing: 'Arcade swing',
      groove: '8-bit groove',
      solo: 'Solo',
      rhythm: 'Ritmo',
      pulse: 'Pulso',
    },
    en: {
      arcadeSwing: 'Arcade swing',
      groove: '8-bit groove',
      solo: 'Solo',
      rhythm: 'Rhythm',
      pulse: 'Pulse',
    },
    fr: {
      arcadeSwing: 'Arcade swing',
      groove: 'Groove 8-bit',
      solo: 'Solo',
      rhythm: 'Rythme',
      pulse: 'Pulsation',
    },
    pt: {
      arcadeSwing: 'Arcade swing',
      groove: 'Groove 8-bit',
      solo: 'Solo',
      rhythm: 'Ritmo',
      pulse: 'Pulso',
    },
  }[language];

  return (
    <>
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-44 flex-col justify-center gap-5 px-5 lg:flex">
        <div className="quiz-pixel-panel animate-quiz-side-bob" style={{ animationDelay: '0.25s' }}>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-100/80">{copy.arcadeSwing}</p>
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
            <span>{copy.groove}</span>
            <span>12/12</span>
          </div>
          <div className="mt-3 space-y-2">
            {[copy.solo, copy.rhythm, copy.pulse].map((label, index) => (
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

function QuizPlaylistPanel({
  language,
}: {
  language: 'es' | 'en' | 'fr' | 'pt';
}) {
  const SPOTIFY_PLAYLIST_WEBPLAYER_URL = 'https://open.spotify.com/playlist/2SL42Fq3AgVvnJb7RixOvp';
  const SPOTIFY_PLAYLIST_EMBED_URL =
    'https://open.spotify.com/embed/playlist/2SL42Fq3AgVvnJb7RixOvp?utm_source=generator&theme=0';
  const [embedFailed, setEmbedFailed] = useState(false);

  const copy = {
    es: {
      title: 'Playlist del curso',
      subtitle: 'Controla la escucha mientras respondes el jazz arcade.',
      nowPlaying: 'Sonando ahora',
      currentTrack: 'After You\'ve Gone — Benny Goodman Trio',
      fullPlaylist: 'Playlist completa no player Spotify',
      openSpotify: 'Abrir en Spotify',
      player: 'Player Spotify',
    },
    en: {
      title: 'Course playlist',
      subtitle: 'Control the listening flow while you answer the jazz arcade quiz.',
      nowPlaying: 'Now playing',
      currentTrack: "After You've Gone — Benny Goodman Trio",
      fullPlaylist: 'Full playlist inside Spotify player',
      openSpotify: 'Open in Spotify',
      player: 'Playlist player',
    },
    fr: {
      title: 'Playlist du cours',
      subtitle: 'Pilotez l ecoute pendant que vous repondez au quiz jazz arcade.',
      nowPlaying: 'En lecture',
      currentTrack: 'After You\'ve Gone — Benny Goodman Trio',
      fullPlaylist: 'Playlist complete dans le player Spotify',
      openSpotify: 'Ouvrir dans Spotify',
      player: 'Player Spotify',
    },
    pt: {
      title: 'Playlist do curso',
      subtitle: 'Controle a escuta enquanto responde o quiz jazz arcade.',
      nowPlaying: 'Tocando agora',
      currentTrack: 'After You\'ve Gone — Benny Goodman Trio',
      fullPlaylist: 'Playlist completa no player do Spotify',
      openSpotify: 'Abrir no Spotify',
      player: 'Player Spotify',
    },
  }[language];

  return (
    <aside className="hidden self-stretch xl:mt-[5.5rem] xl:flex xl:w-[340px] xl:shrink-0 xl:-ml-4 xl:flex-col 2xl:w-[360px] 2xl:-ml-8">
      <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-primary/20 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_34%),radial-gradient(circle_at_bottom,_rgba(34,211,238,0.12),_transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(17,24,39,0.95),rgba(30,41,59,0.92))] p-3.5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-primary/90">{copy.title}</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">{copy.subtitle}</p>
          </div>
          <a
            href={SPOTIFY_PLAYLIST_WEBPLAYER_URL}
            target="_blank"
            rel="noreferrer"
            aria-label={copy.openSpotify}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/20"
          >
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#1DB954] text-[9px] font-black text-black">S</span>
            Spotify
          </a>
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/8 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[18px] bg-primary/20 shadow-inner">
            <Image src="/images/clase1.jpg" alt={copy.currentTrack} fill sizes="64px" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-primary/80">{copy.nowPlaying}</p>
            <p className="truncate text-sm font-bold text-white">{copy.currentTrack}</p>
            <p className="truncate text-xs text-slate-300">{copy.fullPlaylist}</p>
          </div>
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-[16px] border border-white/10 bg-black/45 p-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-300">{copy.player}</p>
          <div className="mt-2 h-[320px] w-full self-center overflow-hidden rounded-[14px] border border-white/10 bg-[#0b1220] 2xl:h-[352px]">
            {embedFailed ? (
              <div className="flex h-full items-center justify-center px-4">
                <a
                  href={SPOTIFY_PLAYLIST_WEBPLAYER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-white/20"
                >
                  {copy.openSpotify}
                </a>
              </div>
            ) : (
              <iframe
                title="Quiz Spotify playlist"
                src={SPOTIFY_PLAYLIST_EMBED_URL}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="block h-full w-full bg-[#0b1220]"
                onError={() => setEmbedFailed(true)}
              />
            )}
          </div>
        </div>

      </div>
    </aside>
  );
}

export function LessonQuizOverlay({
  courseId,
  lessonId,
  isOpen,
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
  const [showQaAnswer, setShowQaAnswer] = useState(false);
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
      resumeTitle: 'Modo jazz arcade',
      bestResultEmpty: 'Tu mejor medalla aparecerá aquí cuando cierres una ronda completa.',
      closeQuiz: 'Cerrar quiz',
      quizMeta: 'Jazz arcade • 5 opciones • 12 rondas',
      qaLabel: 'QA local: respuesta correcta es',
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
      resumeTitle: 'Jazz arcade mode',
      bestResultEmpty: 'Your best medal will appear here after your first full run.',
      closeQuiz: 'Close quiz',
      quizMeta: 'Jazz arcade • 5 choices • 12 rounds',
      qaLabel: 'Local QA: correct answer is',
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
      resumeTitle: 'Mode jazz arcade',
      bestResultEmpty: 'Votre meilleure médaille apparaîtra ici après une première tentative complète.',
      closeQuiz: 'Fermer le quiz',
      quizMeta: 'Jazz arcade • 5 choix • 12 tours',
      qaLabel: 'QA local: la bonne réponse est',
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
      resumeTitle: 'Modo jazz arcade',
      bestResultEmpty: 'Sua melhor medalha vai aparecer aqui depois da primeira rodada completa.',
      closeQuiz: 'Fechar quiz',
      quizMeta: 'Jazz arcade • 5 opções • 12 rodadas',
      qaLabel: 'QA local: resposta correta é',
    },
  }[language];

  useEffect(() => {
    setSummary(initialSummary);
  }, [initialSummary]);

  useEffect(() => {
    setShowQaAnswer(isLocalQuizQaMode());
  }, []);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  const currentQuestion = attempt?.questions[currentQuestionIndex] ?? null;
  const currentCorrectOption = currentQuestion?.options.find((option) => option.id === currentQuestion.answerId) ?? null;

  const sessionProgressPercent = useMemo(() => {
    if (!attempt) {
      return 0;
    }

    return Math.round((attempt.answeredCount / attempt.questionCount) * 100);
  }, [attempt]);

  const openQuiz = useCallback(async (restart = false) => {
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
        { restart, language }
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
  }, [copy.startError, courseId, language, lessonId, onSummaryChange]);

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
  }, [isOpen, openQuiz]);

  useEffect(() => {
    if (!currentQuestion) {
      return;
    }

    setSelectedOptionId(currentQuestion.selectedOptionId ?? null);
  }, [currentQuestion]);

  const handleAnswerSubmit = async () => {
    if (!attempt || !currentQuestion) {
      return;
    }

    if (!selectedOptionId) {
      toast.error(copy.noOption);
      return;
    }

    const selectedAnswers = attempt.questions
      .map((question) => ({
        questionId: question.questionId,
        selectedOptionId:
          question.questionId === currentQuestion.questionId
            ? selectedOptionId
            : question.selectedOptionId,
      }))
      .filter((question): question is { questionId: string; selectedOptionId: string } => Boolean(question.selectedOptionId));

    const answeredCount = selectedAnswers.length;
    const isCorrect = currentQuestion.answerId === selectedOptionId;
    const isFinalAnswer = answeredCount >= attempt.questionCount;

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
        answeredCount,
        questions: nextQuestions,
      };
    });

    setFeedback({
      questionId: currentQuestion.questionId,
      verdict: isCorrect ? 'correct' : 'incorrect',
    });

    if (isCorrect) {
      confetti.onOpen();
      setConfettiPieces(buildConfettiBurst());
      window.setTimeout(() => setConfettiPieces([]), 2100);
    }

    if (!isFinalAnswer) {
      advanceTimerRef.current = window.setTimeout(() => {
        setFeedback(null);
        setCurrentQuestionIndex((currentIndex) => Math.min(currentIndex + 1, LESSON_QUIZ_QUESTION_COUNT - 1));
      }, LESSON_QUIZ_AUTO_ADVANCE_MS);

      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post<LessonQuizAnswerResponse>(
        `/api/courses/${courseId}/lessons/${lessonId}/quiz/${attempt.attemptId}/answer`,
        {
          questionId: currentQuestion.questionId,
          optionId: selectedOptionId,
          answers: selectedAnswers,
        }
      );

      if (response.data.summary) {
        setSummary(response.data.summary);
        onSummaryChange?.(response.data.summary);
      }

      advanceTimerRef.current = window.setTimeout(() => {
        setFeedback(null);

        if (response.data.result) {
          setResult(response.data.result);
        }
      }, LESSON_QUIZ_AUTO_ADVANCE_MS);
    } catch (error: unknown) {
      setAttempt((currentAttempt) => {
        if (!currentAttempt) {
          return currentAttempt;
        }

        const restoredQuestions = currentAttempt.questions.map((question) =>
          question.questionId === currentQuestion.questionId
            ? {
                ...question,
                isAnswered: false,
                selectedOptionId: null,
              }
            : question
        );

        return {
          ...currentAttempt,
          answeredCount: Math.max(0, currentAttempt.answeredCount - 1),
          questions: restoredQuestions,
        };
      });
      setFeedback(null);
      setSelectedOptionId(null);

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

      <QuizSideDecor language={language} />

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

      <div className="relative flex h-[100dvh] flex-col p-3 sm:p-4 lg:px-16 lg:py-4">
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

        <div className="relative mx-auto flex w-full max-w-[1460px] flex-1 items-start justify-start py-1.5">
          {isLoading || !attempt ? (
            <div className="animate-fade-scale-in rounded-[28px] border border-white/10 bg-card/80 px-8 py-10 text-center shadow-2xl backdrop-blur-sm">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">{error || copy.loading}</p>
            </div>
          ) : (
            <div className="flex w-full animate-fade-scale-in items-stretch gap-4 xl:gap-6">
              <QuizPlaylistPanel language={language} />

              <div className="min-w-0 flex-1">
                <div className="mb-3.5 flex flex-col gap-2.5 lg:flex-row lg:items-stretch lg:justify-between">
                  <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm lg:min-w-[300px]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary/80">{copy.yourProgress}</p>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xl font-serif font-bold text-white">
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
                    <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60 lg:min-w-[260px]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary/80">{copy.currentBest}</p>
                      <p className="mt-2 leading-5">{copy.bestResultEmpty}</p>
                    </div>
                  )}
                </div>

                {currentQuestion ? (
                  <div className={cn('relative overflow-hidden rounded-[28px] border p-5 shadow-2xl backdrop-blur-sm sm:p-6', questionCardTone)}>
                    <div className="absolute inset-x-10 top-0 h-20 bg-[radial-gradient(circle,_rgba(212,175,55,0.2),_transparent_55%)] blur-2xl" />

                    <div className="relative">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-primary/75">
                        {copy.questionLabel} {currentQuestionIndex + 1}
                      </p>
                      <h2 className="mt-3 text-xl font-bold leading-tight text-white sm:text-2xl">
                        {copy.questionLabel} {currentQuestionIndex + 1} - {currentQuestion.prompt}
                      </h2>
                      <p className="mt-2 text-sm text-white/65">{copy.instruction}</p>

                      {showQaAnswer && currentCorrectOption ? (
                        <div className="mt-4 inline-flex max-w-full items-center gap-3 rounded-2xl border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-left shadow-[0_0_24px_rgba(34,211,238,0.12)]">
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-200/30 bg-cyan-300/20 text-xs font-bold text-cyan-100">
                            {currentCorrectOption.label}
                          </span>
                          <span className="min-w-0 text-sm font-medium text-cyan-50">
                            {copy.qaLabel} {currentCorrectOption.text}
                          </span>
                        </div>
                      ) : null}

                      <div className="mt-5 grid gap-2.5">
                        {currentQuestion.options.map((option) => {
                          const isSelected = selectedOptionId === option.id;
                          const isCorrectOption = option.id === currentQuestion.answerId;
                          const isLocked = currentQuestion.isAnswered;
                          const isFeedbackTarget = feedback?.questionId === currentQuestion.questionId;
                          const optionTone = isLocked && isFeedbackTarget
                            ? isCorrectOption
                              ? 'border-emerald-400 bg-emerald-500/20 text-emerald-50'
                              : isSelected
                              ? 'border-rose-400 bg-rose-500/20 text-rose-50'
                              : 'border-white/10 bg-white/5 text-white/85'
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
                                'flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-all duration-150 disabled:cursor-default disabled:opacity-90',
                                optionTone
                              )}
                            >
                              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-current/20 bg-black/10 text-xs font-bold">
                                {option.label}
                              </span>
                              <span className="text-sm leading-5 sm:text-[15px]">{option.text}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/45">
                          <Music2 className="h-4 w-4 text-primary/65" />
                          <span>{copy.quizMeta}</span>
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
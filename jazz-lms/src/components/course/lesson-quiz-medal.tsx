import { Award, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { SupportedLanguage } from '@/lib/language';
import type { QuizMedalTierValue } from '@/lib/lesson-quiz';

type MedalPresentation = {
  label: string;
  eyebrow: string;
  cardClassName: string;
  iconClassName: string;
  haloClassName: string;
  dotClassName: string;
};

const medalIconSurfaceByTier: Record<QuizMedalTierValue, string> = {
  NONE: 'border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.95),rgba(39,39,42,0.92),rgba(24,24,27,0.96))] text-amber-200 shadow-[0_0_18px_rgba(15,23,42,0.28)]',
  BRONZE: 'border-amber-500/50 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.25),_transparent_48%),linear-gradient(145deg,rgba(120,53,15,0.95),rgba(180,83,9,0.84),rgba(251,191,36,0.55))] text-amber-100 shadow-[0_0_22px_rgba(180,83,9,0.28)]',
  SILVER: 'border-slate-300/60 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.55),_transparent_42%),linear-gradient(150deg,rgba(71,85,105,0.98),rgba(203,213,225,0.88),rgba(148,163,184,0.92))] text-slate-950 shadow-[0_0_22px_rgba(226,232,240,0.22)]',
  GOLD: 'border-yellow-300/70 bg-[radial-gradient(circle_at_top,_rgba(254,240,138,0.6),_transparent_40%),linear-gradient(140deg,rgba(161,98,7,0.96),rgba(250,204,21,0.95),rgba(202,138,4,0.96))] text-black shadow-[0_0_24px_rgba(250,204,21,0.32)]',
  PLATINUM: 'border-cyan-200/80 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.7),_transparent_36%),linear-gradient(145deg,rgba(8,47,73,0.96),rgba(224,242,254,0.92),rgba(125,211,252,0.96))] text-slate-950 shadow-[0_0_26px_rgba(125,211,252,0.32)]',
};

const supremeTitles: Record<SupportedLanguage, string> = {
  es: 'Especialista en jazz',
  en: 'Jazz specialist',
  fr: 'Specialiste du jazz',
  pt: 'Especialista em jazz',
};

const medalLabels: Record<SupportedLanguage, Record<QuizMedalTierValue, string>> = {
  es: {
    NONE: 'Sin medalla',
    BRONZE: 'Bronce',
    SILVER: 'Plata',
    GOLD: 'Oro',
    PLATINUM: 'Platino',
  },
  en: {
    NONE: 'No medal',
    BRONZE: 'Bronze',
    SILVER: 'Silver',
    GOLD: 'Gold',
    PLATINUM: 'Platinum',
  },
  fr: {
    NONE: 'Sans médaille',
    BRONZE: 'Bronze',
    SILVER: 'Argent',
    GOLD: 'Or',
    PLATINUM: 'Platine',
  },
  pt: {
    NONE: 'Sem medalha',
    BRONZE: 'Bronze',
    SILVER: 'Prata',
    GOLD: 'Ouro',
    PLATINUM: 'Platina',
  },
};

const medalEyebrows: Record<SupportedLanguage, Record<QuizMedalTierValue, string>> = {
  es: {
    NONE: 'Vuelve al compás',
    BRONZE: 'Base sólida',
    SILVER: 'Buen swing',
    GOLD: 'Nivel destacado',
    PLATINUM: 'Maestría total',
  },
  en: {
    NONE: 'Find the groove again',
    BRONZE: 'Solid foundation',
    SILVER: 'Strong swing',
    GOLD: 'Standout level',
    PLATINUM: 'Full mastery',
  },
  fr: {
    NONE: 'Retrouve le groove',
    BRONZE: 'Base solide',
    SILVER: 'Bon swing',
    GOLD: 'Niveau remarquable',
    PLATINUM: 'Maîtrise totale',
  },
  pt: {
    NONE: 'Volte para o groove',
    BRONZE: 'Base consistente',
    SILVER: 'Bom swing',
    GOLD: 'Nível de destaque',
    PLATINUM: 'Domínio absoluto',
  },
};

export function getLessonQuizResultMessage(language: SupportedLanguage, medal: QuizMedalTierValue) {
  const messages: Record<SupportedLanguage, Record<QuizMedalTierValue, string>> = {
    es: {
      NONE: 'Tu oído ya entró en la sala, pero este contenido merece otra vuelta con más atención. Repite el quiz y vuelve más fuerte.',
      BRONZE: 'Terminaste el recorrido con una base real. Ya entiendes el pulso; ahora toca refinar los detalles para subir de nivel.',
      SILVER: 'Vas por el camino correcto. Tu lectura del contenido ya tiene swing, y con una práctica más precisa puedes romper la siguiente barrera.',
      GOLD: 'Estás jugando entre los mejores de esta lección. Con un poco más de entrenamiento, conviertes ese gran nivel en dominio total.',
      PLATINUM: 'Absorbiste el contenido con precisión total. Ritmo, memoria y atención alineados: esta lección ya es tuya.',
    },
    en: {
      NONE: 'You are in the room, but this lesson still deserves another focused pass. Run it again and come back sharper.',
      BRONZE: 'You finished with a real foundation. The groove is there; now it is time to tighten the details and push higher.',
      SILVER: 'You are on the right path. Your understanding already swings, and a bit more deliberate practice can break the next ceiling.',
      GOLD: 'You are operating near the top of this lesson. One more round of training and that strong result turns into full command.',
      PLATINUM: 'You absorbed the lesson completely. Rhythm, memory, and focus landed together here.',
    },
    fr: {
      NONE: 'Tu es déjà dans l’univers du cours, mais cette leçon mérite une nouvelle écoute plus attentive. Relance le quiz et reviens plus précis.',
      BRONZE: 'Tu termines avec une vraie base. Le groove est là; il faut maintenant affiner les détails pour monter encore.',
      SILVER: 'Tu es sur la bonne voie. Ta compréhension commence à vraiment swinguer, et un peu plus de pratique ciblée peut te faire franchir un cap.',
      GOLD: 'Tu fais déjà partie des meilleurs sur cette leçon. Encore un peu d’entraînement, et ce très bon résultat devient une maîtrise complète.',
      PLATINUM: 'Tu as absorbé la leçon à 100 %. Rythme, mémoire et attention sont parfaitement alignés.',
    },
    pt: {
      NONE: 'Você já entrou no clima da aula, mas esse conteúdo pede mais uma passada com foco total. Refaça o quiz e volte mais afiado.',
      BRONZE: 'Você concluiu com uma base real. O groove apareceu; agora é hora de lapidar os detalhes para subir de nível.',
      SILVER: 'O caminho é esse. Sua leitura da aula já tem swing, e com mais prática direcionada você rompe a próxima barreira.',
      GOLD: 'Você já está entre os melhores desta aula. Com mais um pouco de treino, esse resultado forte vira domínio completo.',
      PLATINUM: 'Você absorveu 100% do conteúdo. Ritmo, memória e atenção tocaram juntos do início ao fim.',
    },
  };

  return messages[language][medal];
}

export function getLessonQuizMedalPresentation(language: SupportedLanguage, medal: QuizMedalTierValue): MedalPresentation {
  const label = medalLabels[language][medal];
  const eyebrow = medalEyebrows[language][medal];

  if (medal === 'BRONZE') {
    return {
      label,
      eyebrow,
      cardClassName: 'border-amber-500/50 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.22),_transparent_48%),linear-gradient(145deg,rgba(120,53,15,0.95),rgba(180,83,9,0.84),rgba(251,191,36,0.55))] text-amber-50 shadow-[0_0_35px_rgba(180,83,9,0.28)]',
      iconClassName: 'text-amber-100',
      haloClassName: 'bg-amber-300/20',
      dotClassName: 'bg-amber-300',
    };
  }

  if (medal === 'SILVER') {
    return {
      label,
      eyebrow,
      cardClassName: 'border-slate-300/60 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.55),_transparent_42%),linear-gradient(150deg,rgba(71,85,105,0.98),rgba(203,213,225,0.88),rgba(148,163,184,0.92))] text-slate-950 shadow-[0_0_35px_rgba(226,232,240,0.22)]',
      iconClassName: 'text-slate-950',
      haloClassName: 'bg-white/30',
      dotClassName: 'bg-slate-100',
    };
  }

  if (medal === 'GOLD') {
    return {
      label,
      eyebrow,
      cardClassName: 'border-yellow-300/70 bg-[radial-gradient(circle_at_top,_rgba(254,240,138,0.6),_transparent_40%),linear-gradient(140deg,rgba(161,98,7,0.96),rgba(250,204,21,0.95),rgba(202,138,4,0.96))] text-black shadow-[0_0_42px_rgba(250,204,21,0.32)]',
      iconClassName: 'text-black',
      haloClassName: 'bg-yellow-100/35',
      dotClassName: 'bg-yellow-100',
    };
  }

  if (medal === 'PLATINUM') {
    return {
      label,
      eyebrow,
      cardClassName: 'border-cyan-200/80 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.7),_transparent_36%),linear-gradient(145deg,rgba(8,47,73,0.96),rgba(224,242,254,0.92),rgba(125,211,252,0.96))] text-slate-950 shadow-[0_0_46px_rgba(125,211,252,0.32)]',
      iconClassName: 'text-slate-950',
      haloClassName: 'bg-cyan-100/40',
      dotClassName: 'bg-cyan-100',
    };
  }

  return {
    label,
    eyebrow,
    cardClassName: 'border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.95),rgba(39,39,42,0.92),rgba(24,24,27,0.96))] text-white shadow-[0_0_28px_rgba(15,23,42,0.28)]',
    iconClassName: 'text-amber-200',
    haloClassName: 'bg-white/10',
    dotClassName: 'bg-rose-400',
  };
}

export function getSupremeJazzTitle(language: SupportedLanguage) {
  return supremeTitles[language];
}

interface JazzMedalIconProps {
  medal: QuizMedalTierValue;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function JazzMedalIcon({ medal, className, size = 'md' }: JazzMedalIconProps) {
  const sizeClassName = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-16 w-16' : 'h-11 w-11';
  const ribbonClassName = size === 'sm' ? 'h-3 w-2.5 -bottom-1.5' : size === 'lg' ? 'h-6 w-4 -bottom-3' : 'h-4 w-3 -bottom-2';
  const sparkleClassName = size === 'sm' ? 'h-3 w-3 -right-1 -top-1' : size === 'lg' ? 'h-5 w-5 -right-2 -top-2' : 'h-4 w-4 -right-1.5 -top-1.5';

  return (
    <span className={cn('relative inline-flex items-center justify-center', className)}>
      <span className={cn('absolute left-1/2 -translate-x-[85%] rounded-b-full bg-gradient-to-b from-rose-400 to-rose-600', ribbonClassName)} />
      <span className={cn('absolute left-1/2 -translate-x-[10%] rounded-b-full bg-gradient-to-b from-sky-300 to-cyan-500', ribbonClassName)} />
      <span className={cn('relative inline-flex items-center justify-center rounded-full border', sizeClassName, medalIconSurfaceByTier[medal])}>
        <span className="absolute inset-[16%] rounded-full border border-white/15 bg-black/10" />
        <Award className={cn('relative z-[1]', size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-5 w-5')} />
      </span>
      {medal === 'PLATINUM' ? (
        <Sparkles className={cn('absolute text-cyan-100 drop-shadow-[0_0_8px_rgba(186,230,253,0.85)]', sparkleClassName)} />
      ) : null}
    </span>
  );
}

interface JazzSupremeMedalProps {
  language: SupportedLanguage;
  interactive?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function JazzSupremeMedal({ language, interactive = false, className, size = 'md' }: JazzSupremeMedalProps) {
  const title = getSupremeJazzTitle(language);
  const shellClassName = size === 'sm' ? 'h-12 w-12' : 'h-24 w-24';
  const innerInsetClassName = size === 'sm' ? 'inset-1.5' : 'inset-3';
  const iconSize = size === 'sm' ? 'md' : 'lg';
  const topSparkleClassName = size === 'sm' ? '-right-0.5 -top-0.5 h-3.5 w-3.5' : '-right-1 -top-1 h-5 w-5';
  const bottomSparkleClassName = size === 'sm' ? '-bottom-0.5 -left-0.5 h-3 w-3' : '-bottom-1 -left-1 h-4 w-4';

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <div className="absolute inset-0 rounded-full bg-yellow-300/25 blur-2xl" />
      <div className="absolute inset-3 rounded-full bg-amber-300/30 blur-xl" />
      <div className={cn('relative flex items-center justify-center rounded-full border border-yellow-200/70 bg-[radial-gradient(circle_at_top,_rgba(254,240,138,0.8),_transparent_45%),linear-gradient(145deg,rgba(146,64,14,0.95),rgba(250,204,21,0.98),rgba(245,158,11,0.96))] shadow-[0_0_48px_rgba(250,204,21,0.35)]', shellClassName)}>
        <div className={cn('absolute rounded-full border border-white/25 bg-black/10', innerInsetClassName)} />
        <JazzMedalIcon medal="GOLD" size={iconSize} className={cn(size === 'sm' ? 'scale-90' : 'scale-[1.1]')} />
        <Sparkles className={cn('absolute text-yellow-100 drop-shadow-[0_0_10px_rgba(254,240,138,0.95)]', topSparkleClassName)} />
        <Sparkles className={cn('absolute text-amber-100 drop-shadow-[0_0_10px_rgba(254,215,170,0.95)]', bottomSparkleClassName)} />
      </div>

      {interactive ? (
        <div className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 rounded-full border border-yellow-300/40 bg-black/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-yellow-100 opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 data-[open=true]:opacity-100">
          {title}
        </div>
      ) : null}
    </div>
  );
}

interface LessonQuizMedalBadgeProps {
  medal: QuizMedalTierValue;
  language: SupportedLanguage;
  scorePercent?: number;
  compact?: boolean;
  className?: string;
}

export function LessonQuizMedalBadge({
  medal,
  language,
  scorePercent,
  compact = false,
  className,
}: LessonQuizMedalBadgeProps) {
  const presentation = getLessonQuizMedalPresentation(language, medal);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border px-3 py-2',
        compact ? 'min-w-[148px]' : 'min-w-[220px] p-4',
        presentation.cardClassName,
        className
      )}
    >
      <div className={cn('absolute inset-x-4 top-2 h-10 rounded-full blur-2xl', presentation.haloClassName)} />
      <div className="relative flex items-center gap-3">
        <div className={cn('relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-black/15', compact && 'h-9 w-9')}>
          <div className={cn('absolute inset-1 rounded-xl blur-md', presentation.haloClassName)} />
          <JazzMedalIcon medal={medal} size={compact ? 'sm' : 'md'} className={presentation.iconClassName} />
        </div>

        <div className="min-w-0">
          <p className={cn('text-[10px] font-semibold uppercase tracking-[0.28em] opacity-80', compact && 'tracking-[0.22em]')}>
            {presentation.eyebrow}
          </p>
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-bold', compact ? 'text-sm' : 'text-lg font-serif')}>
              {presentation.label}
            </span>
            {typeof scorePercent === 'number' ? (
              <span className="rounded-full bg-black/15 px-2 py-0.5 text-[11px] font-semibold">
                {scorePercent}%
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {!compact ? (
        <div className="relative mt-3 flex items-center gap-1.5">
          <span className={cn('h-2 w-2 rounded-full', presentation.dotClassName)} />
          <span className="text-[11px] font-medium opacity-80">Jazz arcade performance</span>
        </div>
      ) : null}
    </div>
  );
}
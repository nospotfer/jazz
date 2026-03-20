import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { CourseCompletionCertificate } from '@/components/dashboard/course-completion-certificate';
import { getUserCourseCompletionRecognition } from '@/lib/jazz-medal-progress';
import {
  LANGUAGE_COOKIE_KEY,
  normalizeLanguage,
  type SupportedLanguage,
} from '@/lib/language';
import type { QuizMedalTierValue } from '@/lib/lesson-quiz';
import { getServerUser } from '@/lib/server-user';

type CompletionCopy = {
  eyebrow: string;
  subtitle: string;
  certificateTitle: string;
  completionLabel: (completed: number, total: number) => string;
  scoreLabel: (score: number) => string;
  medalLabel: (medal: string) => string;
  signatureLabel: string;
  buttonLabel: string;
  gratitudeLines: (name: string) => string[];
};

function getMedalLabel(language: SupportedLanguage, medal: QuizMedalTierValue) {
  const labels: Record<SupportedLanguage, Record<QuizMedalTierValue, string>> = {
    en: {
      NONE: 'No medal',
      BRONZE: 'Bronze medal',
      SILVER: 'Silver medal',
      GOLD: 'Gold medal',
      PLATINUM: 'Platinum medal',
    },
    es: {
      NONE: 'Sin medalla',
      BRONZE: 'Medalla de bronce',
      SILVER: 'Medalla de plata',
      GOLD: 'Medalla de oro',
      PLATINUM: 'Medalla de platino',
    },
    fr: {
      NONE: 'Sans medaille',
      BRONZE: 'Medaille de bronze',
      SILVER: 'Medaille d argent',
      GOLD: 'Medaille d or',
      PLATINUM: 'Medaille de platine',
    },
    pt: {
      NONE: 'Sem medalha',
      BRONZE: 'Medalha de bronze',
      SILVER: 'Medalha de prata',
      GOLD: 'Medalha de ouro',
      PLATINUM: 'Medalha de platina',
    },
  };

  return labels[language][medal];
}

function getCompletionCopy(language: SupportedLanguage): CompletionCopy {
  const copy: Record<SupportedLanguage, CompletionCopy> = {
    en: {
      eyebrow: 'Course recognition',
      subtitle: 'A special thank-you for completing your full learning journey.',
      certificateTitle: 'Congratulations',
      completionLabel: (completed, total) => `Completed lessons: ${completed}/${total}`,
      scoreLabel: (score) => `Final quiz score: ${score}%`,
      medalLabel: (medal) => `Final ranking: ${medal}`,
      signatureLabel: 'Professor Signature',
      buttonLabel: 'Convert to PDF',
      gratitudeLines: (name) => [
        `Thank you ${name} for your commitment and dedication throughout this course.`,
        'You attended every class, completed every quiz, and built consistent progress from start to finish.',
        'We are proud of your achievement and happy to celebrate this milestone with you.',
      ],
    },
    es: {
      eyebrow: 'Reconocimiento del curso',
      subtitle: 'Un agradecimiento especial por completar todo tu recorrido de aprendizaje.',
      certificateTitle: 'Felicitaciones',
      completionLabel: (completed, total) => `Clases completadas: ${completed}/${total}`,
      scoreLabel: (score) => `Puntuacion final de quizzes: ${score}%`,
      medalLabel: (medal) => `Ranking final: ${medal}`,
      signatureLabel: 'Firma del Profesor',
      buttonLabel: 'Convertir a PDF',
      gratitudeLines: (name) => [
        `Gracias ${name} por tu compromiso y dedicacion durante todo este curso.`,
        'Asististe a cada clase, completaste cada quiz y construiste progreso constante de principio a fin.',
        'Nos enorgullece tu logro y celebramos contigo este paso importante.',
      ],
    },
    fr: {
      eyebrow: 'Reconnaissance du cours',
      subtitle: 'Un remerciement special pour avoir complete tout votre parcours d apprentissage.',
      certificateTitle: 'Felicitations',
      completionLabel: (completed, total) => `Cours completes: ${completed}/${total}`,
      scoreLabel: (score) => `Score final des quiz: ${score}%`,
      medalLabel: (medal) => `Classement final: ${medal}`,
      signatureLabel: 'Signature du Professeur',
      buttonLabel: 'Convertir en PDF',
      gratitudeLines: (name) => [
        `Merci ${name} pour votre engagement et votre implication tout au long de ce cours.`,
        'Vous avez suivi chaque cours, termine chaque quiz et construit une progression reguliere du debut a la fin.',
        'Nous sommes fiers de votre resultat et heureux de celebrer cette etape avec vous.',
      ],
    },
    pt: {
      eyebrow: 'Reconhecimento do curso',
      subtitle: 'Um agradecimento especial por concluir toda a sua jornada de aprendizado.',
      certificateTitle: 'Parabens',
      completionLabel: (completed, total) => `Aulas concluidas: ${completed}/${total}`,
      scoreLabel: (score) => `Pontuacao final dos quizzes: ${score}%`,
      medalLabel: (medal) => `Ranking final: ${medal}`,
      signatureLabel: 'Assinatura do Professor',
      buttonLabel: 'Converter em PDF',
      gratitudeLines: (name) => [
        `Obrigado ${name} por sua dedicacao e constancia durante todo o curso.`,
        'Voce assistiu todas as aulas, concluiu todos os quizzes e manteve evolucao continua ate o final.',
        'Temos orgulho da sua conquista e celebramos este momento junto com voce.',
      ],
    },
  };

  return copy[language];
}

export default async function CourseCompletionRecognitionPage() {
  const user = await getServerUser();

  if (!user) {
    redirect('/auth');
  }

  const cookieStore = await cookies();
  const language = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE_KEY)?.value);
  const recognition = await getUserCourseCompletionRecognition(user.id);

  if (!recognition.isEligible) {
    redirect('/dashboard/profile');
  }

  const studentName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Jazz Student';
  const copy = getCompletionCopy(language);
  const medalLabel = getMedalLabel(language, recognition.medal);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-primary/80">{copy.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-serif font-bold text-foreground sm:text-4xl">
          {copy.subtitle}
        </h1>
      </div>

      <CourseCompletionCertificate
        language={language}
        studentName={studentName}
        certificateTitle={copy.certificateTitle}
        completionLabel={copy.completionLabel(recognition.completedLessons, recognition.totalLessons)}
        scoreLabel={copy.scoreLabel(recognition.scorePercent)}
        medalLabel={copy.medalLabel(medalLabel)}
        gratitudeLines={copy.gratitudeLines(studentName)}
        signatureLabel={copy.signatureLabel}
        buttonLabel={copy.buttonLabel}
        medal={recognition.medal}
      />
    </div>
  );
}

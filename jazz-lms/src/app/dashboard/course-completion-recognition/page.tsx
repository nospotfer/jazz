import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { CourseCompletionCertificate } from '@/components/dashboard/course-completion-certificate';
import { getUserCourseCompletionRecognition } from '@/lib/jazz-medal-progress';
import {
  LANGUAGE_COOKIE_KEY,
  normalizeLanguage,
  type SupportedLanguage,
} from '@/lib/language';
import { getServerUser } from '@/lib/server-user';

type CompletionCopy = {
  eyebrow: string;
  subtitle: string;
  certificateTitle: string;
  certificateSubtitle: string;
  completionLabel: (completed: number, total: number) => string;
  scoreLabel: (score: number) => string;
  teacherName: string;
  buttonLabel: string;
  gratitudeLines: (name: string) => string[];
};

function getCompletionCopy(language: SupportedLanguage): CompletionCopy {
  const copy: Record<SupportedLanguage, CompletionCopy> = {
    en: {
      eyebrow: 'Official certificate',
      subtitle: 'Formal record of completion and academic achievement.',
      certificateTitle: 'Certificate of Completion',
      certificateSubtitle: 'This document certifies that',
      completionLabel: (completed, total) => `Program completed in full: ${completed} of ${total} classes`,
      scoreLabel: (score) => `Personal learning milestone validated at ${score}%`,
      teacherName: 'Enric Vázquez Ramonich',
      buttonLabel: 'Download PDF Certificate',
      gratitudeLines: (name) => [
        `${name} has successfully fulfilled the academic and practical requirements of this training program.`,
        'The participant has completed all course sessions, finished the required assessments, and demonstrated consistent engagement throughout the full curriculum.',
        'This certification is issued in recognition of individual commitment, continuous discipline, and verified learning progress.',
      ],
    },
    es: {
      eyebrow: 'Certificado oficial',
      subtitle: 'Registro formal de finalización y logro académico.',
      certificateTitle: 'Certificado de Finalización',
      certificateSubtitle: 'Por medio del presente se certifica que',
      completionLabel: (completed, total) => `Programa completado integralmente: ${completed} de ${total} clases`,
      scoreLabel: (score) => `Conquista personal de aprendizaje validada en ${score}%`,
      teacherName: 'Enric Vázquez Ramonich',
      buttonLabel: 'Descargar Certificado en PDF',
      gratitudeLines: (name) => [
        `${name} ha cumplido satisfactoriamente los requisitos académicos y prácticos establecidos para este programa de formación.`,
        'El participante completó la totalidad de las clases, finalizó las evaluaciones requeridas y mantuvo un progreso constante durante todo el proceso.',
        'Este certificado se emite como constancia formal de dedicación individual, disciplina sostenida y aprendizaje verificado.',
      ],
    },
    fr: {
      eyebrow: 'Certificat officiel',
      subtitle: 'Attestation formelle de réussite et de progression académique.',
      certificateTitle: 'Certificat de Réussite',
      certificateSubtitle: 'Par le présent document, il est certifié que',
      completionLabel: (completed, total) => `Programme intégralement complété : ${completed} sur ${total} cours`,
      scoreLabel: (score) => `Accomplissement personnel validé à ${score}%`,
      teacherName: 'Enric Vázquez Ramonich',
      buttonLabel: 'Télécharger le Certificat PDF',
      gratitudeLines: (name) => [
        `${name} a rempli avec succès les exigences académiques et pratiques de ce programme de formation.`,
        'Le participant a suivi l’ensemble des cours, terminé les évaluations requises et maintenu une progression régulière tout au long du parcours.',
        'Ce certificat est délivré en reconnaissance officielle de l’engagement personnel, de la discipline et de l’apprentissage confirmé.',
      ],
    },
    pt: {
      eyebrow: 'Certificado oficial',
      subtitle: 'Registro formal de conclusão e aproveitamento acadêmico.',
      certificateTitle: 'Certificado de Conclusão',
      certificateSubtitle: 'Certificamos, para os devidos fins, que',
      completionLabel: (completed, total) => `Programa concluído integralmente: ${completed} de ${total} aulas`,
      scoreLabel: (score) => `Conquista individual de aprendizagem validada em ${score}%`,
      teacherName: 'Enric Vázquez Ramonich',
      buttonLabel: 'Baixar Certificado em PDF',
      gratitudeLines: (name) => [
        `${name} cumpriu com êxito os requisitos acadêmicos e práticos estabelecidos para este programa de formação.`,
        'O participante concluiu todas as aulas previstas, finalizou as avaliações obrigatórias e demonstrou evolução consistente ao longo de todo o percurso.',
        'Este certificado é emitido como comprovação formal de dedicação pessoal, disciplina contínua e progresso de aprendizagem verificado.',
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
  const recognition = await getUserCourseCompletionRecognition(user.id, user.email);

  if (!recognition.isEligible) {
    redirect('/dashboard/profile');
  }

  const studentName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Jazz Student';
  const copy = getCompletionCopy(language);
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
        certificateSubtitle={copy.certificateSubtitle}
        completionLabel={copy.completionLabel(recognition.completedLessons, recognition.totalLessons)}
        scoreLabel={copy.scoreLabel(recognition.scorePercent)}
        gratitudeLines={copy.gratitudeLines(studentName)}
        teacherName={copy.teacherName}
        signatureSrc="/images/enric_signature.png"
        buttonLabel={copy.buttonLabel}
        medal={recognition.medal}
      />
    </div>
  );
}

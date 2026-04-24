import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import { JazzSpecialistCertificate } from '@/components/dashboard/jazz-specialist-certificate';
import { getUserJazzMedalProgress } from '@/lib/jazz-medal-progress';
import { LANGUAGE_COOKIE_KEY, normalizeLanguage, type SupportedLanguage } from '@/lib/language';
import { getServerUser } from '@/lib/server-user';

function getCertificateCopy(language: SupportedLanguage, studentName: string) {
  const safeName = studentName.trim() || 'Jazz Student';

  const content = {
    es: {
      title: 'Reconocimiento supremo',
      subtitle: 'Has completado con 100 % las 15 experiencias de quiz del sitio.',
      buttonLabel: 'Descargar reconocimiento en PDF',
      lines: [
        `Gracias ${safeName}, completaste todo el recorrido de quizzes con una precisión perfecta del 100 %.`,
        'Escuchaste cada detalle, mantuviste el pulso y respondiste con el mismo cuidado con el que se construye un gran solo.',
        'Tu resultado demuestra dominio real del contenido, memoria musical y atención constante a la historia y al lenguaje del jazz.',
        'Nos alegra saber que hoy conoces el jazz con más profundidad, más criterio y más confianza que cuando comenzaste este viaje.',
        `${safeName}, vuelve a revisar tu perfil porque una medalla especial ya te está esperando allí.`,
      ],
    },
    en: {
      title: 'Supreme recognition',
      subtitle: 'You completed all 15 quiz experiences on the site with a perfect 100% score.',
      buttonLabel: 'Download recognition as PDF',
      lines: [
        `Thank you ${safeName}, you completed the entire quiz path with perfect 100% accuracy.`,
        'You heard the details, held the pulse, and answered with the same care that shapes a great jazz solo.',
        'Your result shows real command of the material, musical memory, and steady attention to the history and language of jazz.',
        'We are glad to know that you now carry more depth, more confidence, and more musical insight than when you started.',
        `${safeName}, take another look at your profile because a special medal is waiting for you there.`,
      ],
    },
    fr: {
      title: 'Reconnaissance supreme',
      subtitle: 'Vous avez termine les 15 quiz du site avec une precision parfaite de 100 %.',
      buttonLabel: 'Telecharger la reconnaissance en PDF',
      lines: [
        `Merci ${safeName}, vous avez accompli tout le parcours des quiz avec une precision parfaite de 100 %.`,
        'Vous avez ecoute chaque detail, garde le tempo et repondu avec le meme soin que celui qui construit un grand solo de jazz.',
        'Ce resultat prouve une maitrise reelle du contenu, une memoire musicale solide et une attention constante a l’histoire et au langage du jazz.',
        'Nous sommes heureux de savoir qu’aujourd’hui vous comprenez le jazz avec plus de profondeur, plus de confiance et plus de finesse qu’au debut.',
        `${safeName}, pensez a verifier votre profil car une medaille speciale vous y attend deja.`,
      ],
    },
    pt: {
      title: 'Reconhecimento supremo',
      subtitle: 'Voce concluiu as 15 experiencias de quiz do site com 100% de acerto.',
      buttonLabel: 'Baixar reconhecimento em PDF',
      lines: [
        `Obrigado ${safeName}, voce concluiu todo o percurso dos quizzes com acertividade perfeita de 100%.`,
        'Voce ouviu os detalhes, sustentou o pulso e respondeu com o mesmo cuidado com que um grande solo de jazz e construido.',
        'Esse resultado mostra dominio real do conteudo, memoria musical e atencao constante a historia e a linguagem do jazz.',
        'Ficamos felizes em saber que agora voce tem mais repertorio, mais confianca e mais conhecimento sobre jazz do que tinha no inicio.',
        `${safeName}, confira o seu perfil porque uma medalha especial esta esperando por voce.`,
      ],
    },
  } satisfies Record<SupportedLanguage, {
    title: string;
    subtitle: string;
    buttonLabel: string;
    lines: string[];
  }>;

  return content[language === 'pt' ? 'es' : language];
}

export default async function JazzSpecialistPage() {
  const user = await getServerUser();

  if (!user) {
    redirect('/auth');
  }

  const cookieStore = await cookies();
  const language = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE_KEY)?.value);
  const medalProgress = await getUserJazzMedalProgress(user.id);

  if (!medalProgress.hasSupremeMedal) {
    redirect('/dashboard/profile');
  }

  const studentName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Jazz Student';
  const copy = getCertificateCopy(language, studentName);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.34em] text-primary/80">{copy.title}</p>
        <h1 className="mt-3 text-3xl font-serif font-bold text-foreground sm:text-4xl">
          {copy.subtitle}
        </h1>
      </div>

      <JazzSpecialistCertificate
        language={language}
        studentName={studentName}
        lines={copy.lines}
        buttonLabel={copy.buttonLabel}
      />
    </div>
  );
}
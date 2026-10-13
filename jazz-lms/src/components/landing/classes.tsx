"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { AccessibleDialog } from "@/components/ui/accessible-dialog";
import {
    getLocalizedJazzDescription,
    getLocalizedJazzSubtitle,
} from "@/lib/course-lessons";
import { ArrowLeft, Lock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface ClassItem {
  title: string;
  subtitle: string;
  description: string;
  image: string;
}

const classes: ClassItem[] = [
  {
    title: "Clase 1",
    subtitle: "Introducción a la cultura del jazz",
    description:
      "Esta primera clase presenta una introducción general a la cultura del jazz, sus orígenes históricos y sociales, y los elementos que la distinguen de otras tradiciones musicales.",
    image: "/images/clase1.jpg",
  },
  {
    title: "Clase 2",
    subtitle: "El lenguaje del jazz 1: heterogeneidad sonora",
    description:
      "Tras la introducción inicial, abordamos la heterogeneidad sonora y cómo la personalización del sonido rompe con la idea de pureza presente en otras músicas.",
    image: "/images/clase2.jpg",
  },
  {
    title: "Clase 3",
    subtitle: "El lenguaje del jazz 2: antecedentes",
    description:
      "Revisamos los antecedentes afroamericanos surgidos tras la Guerra Civil y su influencia en el jazz a través del gospel y el blues.",
    image: "/images/clase3.jpg",
  },
  {
    title: "Clase 4",
    subtitle: "El lenguaje del jazz 3: improvisación",
    description:
      "La improvisación se estudia como eje central del lenguaje del jazz, analizando formas y recursos como la paráfrasis, lo motívico y lo modal.",
    image: "/images/clase4.jpg",
  },
  {
    title: "Clase 5",
    subtitle: "Un antecedente decisivo: ragtime",
    description:
      "Exploramos el ragtime, su desarrollo y su transición hacia el nacimiento del jazz de Nueva Orleans.",
    image: "/images/clase5.jpg",
  },
  {
    title: "Clase 6",
    subtitle: "El lenguaje del jazz 4: ritmo",
    description:
      "Analizamos el ritmo en el jazz temprano y la evolución de la sección rítmica hasta el bop.",
    image: "/images/clase6.jpg",
  },
  {
    title: "Clase 7",
    subtitle: "Jamming y blowing",
    description:
      "Estudiamos las jam sessions y su importancia para consolidar la cultura del jazz en ciudades clave como Kansas City y Nueva York.",
    image: "/images/clase7.jpg",
  },
  {
    title: "Clase 8",
    subtitle: "Composición y arreglo en jazz",
    description:
      "Vemos cómo los grandes compositores de jazz escribían pensando en músicos concretos y en sus timbres personales.",
    image: "/images/clase8.jpg",
  },
  {
    title: "Clase 9",
    subtitle: "De las marching bands a los primeros grupos de jazz",
    description:
      "Recorremos las primeras formaciones, desde Nueva Orleans hasta los grupos que definieron el primer sonido del jazz.",
    image: "/images/clase9.jpg",
  },
  {
    title: "Clase 10",
    subtitle: "Swing y combos clásicos",
    description:
      "Nos enfocamos en las grandes orquestas de la era swing y en su papel para expandir el jazz internacionalmente.",
    image: "/images/clase10.jpg",
  },
  {
    title: "Clase 11",
    subtitle: "Combos modernos e instrumentos de sección rítmica",
    description:
      "Abordamos la evolución hacia el bop, hard bop y jazz modal, junto con la función de cada instrumento rítmico.",
    image: "/images/clase11.jpg",
  },
  {
    title: "Clase 12",
    subtitle: "Improvisación",
    description:
      "Profundizamos en los principales procedimientos improvisatorios y en su aplicación por grandes solistas.",
    image: "/images/clase12.jpg",
  },
  {
    title: "Clase 13",
    subtitle: "Jazz y entretenimiento",
    description:
      "Analizamos cómo el jazz pasó de convivir con otros espectáculos populares a consolidarse como cultura musical independiente.",
    image: "/images/clase13.jpg",
  },
  {
    title: "Clase 14",
    subtitle: "Canto jazz 1",
    description:
      "Estudiamos las raíces vocales del jazz y las figuras clave que marcaron su desarrollo en el período clásico.",
    image: "/images/clase14.jpg",
  },
  {
    title: "Clase 15",
    subtitle: "Canto jazz 2",
    description:
      "Cerramos con las grandes voces del swing y su impacto en la evolución del canto jazzístico.",
    image: "/images/clase15.jpg",
  },
];

function ExpandedCard({
  classItem,
  onClose,
  backLabel,
  closeLabel,
  previewLabel,
  lockTitle,
  lockDescription,
  createAccountLabel,
  loginLabel,
  learnListTitle,
  learnBullets,
}: {
  classItem: ClassItem;
  onClose: () => void;
  backLabel: string;
  closeLabel: string;
  previewLabel: string;
  lockTitle: string;
  lockDescription: string;
  createAccountLabel: string;
  loginLabel: string;
  learnListTitle: string;
  learnBullets: string[];
}) {
  return (
    <AccessibleDialog label={classItem.subtitle} onClose={onClose} className="max-w-5xl bg-white dark:bg-gray-900">
        <div className="sticky top-0 z-10 border-b border-border bg-card/95 p-3 backdrop-blur">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              aria-label={closeLabel}
              className="min-h-11 w-fit max-w-full whitespace-normal px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              <ArrowLeft className="h-5 w-5 mr-2.5" />
              {backLabel}
            </Button>
        </div>
        <div className="grid min-w-0 grid-cols-1 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col justify-center p-5 sm:p-8 lg:p-10">

            <div className="mb-4">
              <span className="text-yellow-600 text-sm font-bold uppercase tracking-widest">
                {classItem.title}
              </span>
            </div>

            <h3 className="mb-6 break-words text-2xl font-bold text-gray-900 dark:text-white lg:text-3xl">
              {classItem.subtitle}
            </h3>

            <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-6">
              {classItem.description}
            </p>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                {learnListTitle}
              </h4>
              <ul className="space-y-2">
                {learnBullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed flex items-start gap-2"
                  >
                    <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-yellow-500 flex-shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative min-h-[300px] overflow-hidden bg-black lg:min-h-0">
            <Image
              src={classItem.image}
              alt={classItem.subtitle}
              fill
              className="absolute inset-0 w-full h-full object-cover blur-sm scale-105"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-6 text-white">
              <div className="h-12 w-12 rounded-full bg-white/15 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6" />
              </div>
              <p className="text-xs uppercase tracking-widest opacity-80 mb-2">
                {previewLabel}
              </p>
              <h4 className="text-xl font-bold mb-2">{lockTitle}</h4>
              <p className="text-sm text-white/80 mb-6 max-w-sm">
                {lockDescription}
              </p>

              <div className="w-full max-w-xs space-y-3">
                <Button asChild className="cta-highlight min-h-11 w-full text-black hover:text-black">
                  <Link href="/auth?tab=register">{createAccountLabel}</Link>
                </Button>
                <Button asChild variant="secondary" className="min-h-11 w-full">
                  <Link href="/auth?tab=login">{loginLabel}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
    </AccessibleDialog>
  );
}

export function Classes() {
  const { language } = useLanguage();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [detailedDescriptions, setDetailedDescriptions] = useState<
    string[] | null
  >(null);

  useEffect(() => {
    let isMounted = true;

    if (expandedIndex === null) {
      return;
    }

    import("@/content/landing/classes-detailed-descriptions").then((module) => {
      if (!isMounted) {
        return;
      }
      setDetailedDescriptions(module.classesDetailedDescriptions[language]);
    });

    return () => {
      isMounted = false;
    };
  }, [expandedIndex, language]);

  const copy = {
    es: {
      title: "El curso",
      courseSummary: "15 clases · Primera clase gratis al registrarte",
      subtitle:
        "Explora el programa y selecciona una clase para ver su descripción completa.",
      previewLabel: "Vista previa de clase",
      closeLabel: "Cerrar",
      backLabel: "Volver a las clases",
      classWord: "Clase",
      lockTitle: "Clase bloqueada",
      lockDescription:
        "Prueba la primera clase gratis al crear tu cuenta. Para acceder a las demás clases, podrás comprar el curso completo.",
      createAccountLabel: "Crear cuenta",
      loginLabel: "Iniciar sesión",
      learnListTitle: "En esta clase aprenderás",
      lessonIncludes: [
        "Contexto histórico y cultural del tema principal.",
        "Conceptos clave explicados con ejemplos musicales.",
        "Cómo aplicar esta escucha al resto del curso.",
      ],
    },
    en: {
      title: "The course",
      courseSummary: "15 lessons · First lesson free when you register",
      subtitle: "Explore the program and select a lesson to read its full description.",
      previewLabel: "Lesson preview",
      closeLabel: "Close",
      backLabel: "Back to lessons",
      classWord: "Lesson",
      lockTitle: "Lesson locked",
      lockDescription: "Create your account to try the first lesson free. Purchase the full course to access the remaining lessons.",
      createAccountLabel: "Create account",
      loginLabel: "Log in",
      learnListTitle: "In this lesson you will learn",
      lessonIncludes: [
        "Historical and cultural context of the main topic.",
        "Core concepts explained with musical examples.",
        "How to apply this listening to the rest of the course.",
      ],
    },
    fr: {
      title: "Le cours",
      courseSummary: "15 leçons · Première leçon offerte à l’inscription",
      subtitle:
        "Découvrez le programme et sélectionnez une leçon pour lire sa description complète.",
      previewLabel: "Aperçu de la leçon",
      closeLabel: "Fermer",
      backLabel: "Retour aux leçons",
      classWord: "Leçon",
      lockTitle: "Leçon verrouillée",
      lockDescription:
        "Créez votre compte pour essayer la première leçon gratuitement. Achetez ensuite le cours complet pour accéder aux autres leçons.",
      createAccountLabel: "Créer un compte",
      loginLabel: "Se connecter",
      learnListTitle: "Dans cette leçon, vous apprendrez",
      lessonIncludes: [
        "Le contexte historique et culturel du thème principal.",
        "Les concepts clés expliqués avec des exemples musicaux.",
        "Comment appliquer cette écoute au reste du cours.",
      ],
    },
    pt: {
      title: "O curso",
      courseSummary: "15 aulas · Primeira aula grátis ao se cadastrar",
      subtitle:
        "Selecione uma aula para ver a descrição completa",
      previewLabel: "Prévia da aula",
      closeLabel: "Fechar",
      backLabel: "Voltar às aulas",
      classWord: "Aula",
      lockTitle: "Aula bloqueada",
      lockDescription:
        "Crie sua conta para experimentar a primeira aula grátis. Compre o curso completo para acessar as demais aulas.",
      createAccountLabel: "Criar conta",
      loginLabel: "Entrar",
      learnListTitle: "Nesta aula você aprenderá",
      lessonIncludes: [
        "Contexto histórico e cultural do tema principal.",
        "Conceitos fundamentais explicados com exemplos musicais.",
        "Como aplicar essa escuta ao restante do curso.",
      ],
    },
  }[language];

  const localizedClasses = classes.map((classItem, index) => {
    if (language === "es") return { ...classItem, description: detailedDescriptions?.[index] || classItem.description };

    const lessonNumber = index + 1;
    const localizedSubtitle = getLocalizedJazzSubtitle(lessonNumber, language);
    const localizedDescription = getLocalizedJazzDescription(
      lessonNumber,
      language,
    );

    return {
      ...classItem,
      title: `${copy.classWord} ${lessonNumber}`,
      subtitle: localizedSubtitle || classItem.subtitle,
      description:
        detailedDescriptions?.[index] ||
        localizedDescription ||
        classItem.description,
    };
  });

  const handleCloseExpandedCard = () => {
    setExpandedIndex(null);
  };

  return (
    <>
      <div className="w-full border-y border-border bg-white dark:bg-background">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12 lg:py-16">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-center mb-3 text-gray-900 dark:text-white">
            {copy.title}
          </h2>
          <p className="mb-3 text-center text-sm font-semibold title-accent">{copy.courseSummary}</p>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-8 text-sm">
            {copy.subtitle}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {localizedClasses.map((classItem, index) => (
              <button
                key={index}
                className={`group relative border border-border bg-card rounded-xl overflow-hidden shadow-sm transition-all duration-300 ease-out text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  hoveredIndex === index
                    ? "shadow-2xl scale-105 ring-2 ring-yellow-400 z-10"
                    : "hover:shadow-lg"
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setExpandedIndex(index)}
              >
                <div className="relative h-24 sm:h-28 w-full overflow-hidden">
                  <Image
                    src={classItem.image}
                    alt={classItem.subtitle}
                    fill
                    priority={index === 0}
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>

                <div className="p-3">
                  <h3 className="text-xs font-bold title-accent uppercase tracking-wide leading-tight">
                    {classItem.title}
                  </h3>
                  <p className="mt-2 min-h-[3.75rem] text-sm text-foreground line-clamp-3 leading-snug">
                    {classItem.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {expandedIndex !== null && (
        <ExpandedCard
          classItem={localizedClasses[expandedIndex]}
          onClose={handleCloseExpandedCard}
          backLabel={copy.backLabel}
          closeLabel={copy.closeLabel}
          previewLabel={copy.previewLabel}
          lockTitle={copy.lockTitle}
          lockDescription={copy.lockDescription}
          createAccountLabel={copy.createAccountLabel}
          loginLabel={copy.loginLabel}
          learnListTitle={copy.learnListTitle}
          learnBullets={copy.lessonIncludes}
        />
      )}
    </>
  );
}

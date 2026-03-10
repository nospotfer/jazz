'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import { ArrowLeft, Lock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';
import { getLocalizedJazzDescription, getLocalizedJazzSubtitle } from '@/lib/course-lessons';

interface ClassItem {
  title: string;
  subtitle: string;
  description: string;
  image: string;
}

const classes: ClassItem[] = [
  {
    title: 'Clase 1',
    subtitle: 'Introducción a la cultura del jazz',
    description:
      'Esta primera clase presenta una introducción general a la cultura del jazz, sus orígenes históricos y sociales, y los elementos que la distinguen de otras tradiciones musicales.',
    image: '/images/clase1.jpg',
  },
  {
    title: 'Clase 2',
    subtitle: 'El lenguaje del jazz 1: heterogeneidad sonora',
    description:
      'Tras la introducción inicial, abordamos la heterogeneidad sonora y cómo la personalización del sonido rompe con la idea de pureza presente en otras músicas.',
    image: '/images/clase2.jpg',
  },
  {
    title: 'Clase 3',
    subtitle: 'El lenguaje del jazz 2: antecedentes',
    description:
      'Revisamos los antecedentes afroamericanos surgidos tras la Guerra Civil y su influencia en el jazz a través del gospel y el blues.',
    image: '/images/clase3.jpg',
  },
  {
    title: 'Clase 4',
    subtitle: 'El lenguaje del jazz 3: improvisación',
    description:
      'La improvisación se estudia como eje central del lenguaje del jazz, analizando formas y recursos como la paráfrasis, lo motívico y lo modal.',
    image: '/images/clase4.jpg',
  },
  {
    title: 'Clase 5',
    subtitle: 'Un antecedente decisivo: ragtime',
    description:
      'Exploramos el ragtime, su desarrollo y su transición hacia el nacimiento del jazz de Nueva Orleans.',
    image: '/images/clase5.jpg',
  },
  {
    title: 'Clase 6',
    subtitle: 'El lenguaje del jazz 4: ritmo',
    description:
      'Analizamos el ritmo en el jazz temprano y la evolución de la sección rítmica hasta el bop.',
    image: '/images/clase6.jpg',
  },
  {
    title: 'Clase 7',
    subtitle: 'Jamming y blowing',
    description:
      'Estudiamos las jam sessions y su importancia para consolidar la cultura del jazz en ciudades clave como Kansas City y Nueva York.',
    image: '/images/clase7.jpg',
  },
  {
    title: 'Clase 8',
    subtitle: 'Composición y arreglo en jazz',
    description:
      'Vemos cómo los grandes compositores de jazz escribían pensando en músicos concretos y en sus timbres personales.',
    image: '/images/clase8.jpg',
  },
  {
    title: 'Clase 9',
    subtitle: 'De las marching bands a los primeros grupos de jazz',
    description:
      'Recorremos las primeras formaciones, desde Nueva Orleans hasta los grupos que definieron el primer sonido del jazz.',
    image: '/images/clase9.jpg',
  },
  {
    title: 'Clase 10',
    subtitle: 'Swing y combos clásicos',
    description:
      'Nos enfocamos en las grandes orquestas de la era swing y en su papel para expandir el jazz internacionalmente.',
    image: '/images/clase10.jpg',
  },
  {
    title: 'Clase 11',
    subtitle: 'Combos modernos e instrumentos de sección rítmica',
    description:
      'Abordamos la evolución hacia el bop, hard bop y jazz modal, junto con la función de cada instrumento rítmico.',
    image: '/images/clase11.jpg',
  },
  {
    title: 'Clase 12',
    subtitle: 'Improvisación',
    description:
      'Profundizamos en los principales procedimientos improvisatorios y en su aplicación por grandes solistas.',
    image: '/images/clase12.jpg',
  },
  {
    title: 'Clase 13',
    subtitle: 'Jazz y entretenimiento',
    description:
      'Analizamos cómo el jazz pasó de convivir con otros espectáculos populares a consolidarse como cultura musical independiente.',
    image: '/images/clase13.jpg',
  },
  {
    title: 'Clase 14',
    subtitle: 'Canto jazz 1',
    description:
      'Estudiamos las raíces vocales del jazz y las figuras clave que marcaron su desarrollo en el período clásico.',
    image: '/images/clase14.jpg',
  },
  {
    title: 'Clase 15',
    subtitle: 'Canto jazz 2',
    description:
      'Cerramos con las grandes voces del swing y su impacto en la evolución del canto jazzístico.',
    image: '/images/clase15.jpg',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div
        className="relative z-10 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
          aria-label={closeLabel}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          <div className="p-8 lg:p-10 flex flex-col justify-center overflow-y-auto max-h-[85vh]">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="w-fit px-0 mb-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {backLabel}
            </Button>

            <div className="mb-4">
              <span className="text-yellow-600 text-sm font-bold uppercase tracking-widest">{classItem.title}</span>
            </div>

            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-6">{classItem.subtitle}</h3>

            <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-6">{classItem.description}</p>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                {learnListTitle}
              </h4>
              <ul className="space-y-2">
                {learnBullets.map((bullet) => (
                  <li key={bullet} className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed flex items-start gap-2">
                    <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-yellow-500 flex-shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative bg-black min-h-[300px] lg:min-h-0">
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
              <p className="text-xs uppercase tracking-widest opacity-80 mb-2">{previewLabel}</p>
              <h4 className="text-xl font-bold mb-2">{lockTitle}</h4>
              <p className="text-sm text-white/80 mb-6 max-w-sm">{lockDescription}</p>

              <div className="w-full max-w-xs space-y-3">
                <Button asChild className="w-full">
                  <Link href="/auth?tab=register">{createAccountLabel}</Link>
                </Button>
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/auth?tab=login">{loginLabel}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Classes() {
  const { language } = useLanguage();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const copy = {
    es: {
      title: 'El curso',
      subtitle: 'Haz clic en cualquier clase para ver la descripción completa y una vista previa',
      previewLabel: 'Vista previa de clase',
      closeLabel: 'Cerrar',
      backLabel: 'Volver a las clases',
      classWord: 'Clase',
      lockTitle: 'Clase bloqueada',
      lockDescription: 'Crea una cuenta o inicia sesión para acceder a la lección completa.',
      createAccountLabel: 'Crear cuenta',
      loginLabel: 'Iniciar sesión',
      learnListTitle: 'En esta clase aprenderás',
      lessonIncludes: [
        'Contexto histórico y cultural del tema principal.',
        'Conceptos clave explicados con ejemplos musicales.',
        'Cómo aplicar esta escucha al resto del curso.',
      ],
      detailedDescriptions: [
        'Una introducción amplia a la cultura del jazz: su origen en comunidades afroamericanas, su dimensión social y por qué se convirtió en una forma artística única. Entenderás sus bases estéticas para escuchar el resto del curso con criterio musical e histórico.',
        'Profundizamos en la heterogeneidad sonora del jazz y en la idea de “sonido propio”. Verás cómo timbre, articulación y fraseo construyen identidad artística, y por qué en jazz no existe una sola forma “correcta” de sonar.',
        'Analizamos los antecedentes históricos tras la Guerra Civil en EE.UU. y la relación entre spirituals, gospel y blues. Comprenderás cómo estas tradiciones dieron forma al lenguaje emocional y expresivo del jazz temprano.',
        'Estudiamos la improvisación como núcleo creativo del jazz, distinguiendo recursos melódicos, rítmicos y armónicos. Aprenderás a reconocer paráfrasis, desarrollo motívico y enfoques modales en ejemplos reales.',
        'Exploramos el ragtime como antecedente decisivo del jazz y su aporte rítmico. Conectarás su escritura pianística y su síncopa con los primeros estilos de Nueva Orleans y la transición hacia el jazz moderno.',
        'Nos enfocamos en el ritmo: swing feel, acentuación, interacción de la sección rítmica y evolución histórica. Entenderás cómo batería, contrabajo y piano transforman la energía musical de cada época.',
        'Descubrirás qué son las jam sessions y por qué fueron esenciales para la evolución del jazz. Verás cómo el “blowing” consolidó repertorios, lenguaje común y una cultura de aprendizaje entre músicos.',
        'Trabajamos composición y arreglo en jazz desde una mirada práctica: escritura para instrumentistas concretos, color tímbrico y balance entre estructura e improvisación. Aprenderás cómo el arreglo potencia la identidad de un ensamble.',
        'Recorremos el paso de las marching bands a los primeros grupos de jazz, con foco en instrumentación y función musical. Entenderás cómo se formó la sonoridad colectiva que definió la etapa inicial del género.',
        'Estudiamos la era del swing y el impacto de las big bands en la expansión internacional del jazz. Analizarás repertorio, función de secciones y el diálogo entre arreglos escritos y espacio improvisado.',
        'Abordamos la transición hacia combos modernos, bop y hard bop, junto con el nuevo rol de la sección rítmica. Comprenderás la evolución de la interacción musical y la sofisticación armónica en formatos pequeños.',
        'Volvemos a la improvisación con enfoque avanzado: construcción de discurso, tensión y resolución, y desarrollo narrativo del solo. Aprenderás a escuchar cómo grandes solistas organizan ideas en tiempo real.',
        'Analizamos la relación entre jazz y entretenimiento, desde circuitos populares hasta su legitimación artística. Verás cómo cambió la percepción del género y su lugar en la industria cultural.',
        'Estudiamos el canto jazzístico en su primera etapa: fraseo, swing vocal y uso expresivo del texto. Conocerás figuras clave y recursos que marcaron la identidad de las grandes vocalistas.',
        'Cerramos con la evolución del canto jazz en la era swing y su legado posterior. Entenderás cómo técnica, interpretación y personalidad artística definieron modelos vocales que siguen vigentes hoy.',
      ],
    },
    en: {
      title: 'The course',
      subtitle: 'Click any lesson to see the full description and preview',
      previewLabel: 'Lesson preview',
      closeLabel: 'Close',
      backLabel: 'Back to lessons',
      classWord: 'Lesson',
      lockTitle: 'Lesson locked',
      lockDescription: 'Create an account or log in to unlock the full lesson.',
      createAccountLabel: 'Create account',
      loginLabel: 'Log in',
      learnListTitle: 'In this lesson you will learn',
      lessonIncludes: [
        'Historical and cultural context of the main topic.',
        'Core concepts explained with musical examples.',
        'How to apply this listening to the rest of the course.',
      ],
      detailedDescriptions: [
        'A broad introduction to jazz culture: its roots in African American communities, its social dimension, and why it became a unique artistic language. You build a historical and aesthetic foundation for the rest of the course.',
        'We dive into jazz’s sonic diversity and the concept of personal sound. You see how timbre, articulation, and phrasing shape artistic identity, and why jazz values individuality over standardization.',
        'We examine the post–Civil War historical background in the U.S. and the links between spirituals, gospel, and blues. You understand how these traditions shaped early jazz expression and emotional depth.',
        'Improvisation is explored as the central creative engine of jazz, across melodic, rhythmic, and harmonic approaches. You learn to identify paraphrase, motivic development, and modal thinking in practice.',
        'This lesson focuses on ragtime as a decisive precursor to jazz and its rhythmic legacy. You connect piano writing and syncopation to early New Orleans styles and the birth of modern jazz language.',
        'We focus on rhythm: swing feel, accents, section interaction, and historical evolution. You understand how drums, bass, and piano redefine musical energy across different jazz eras.',
        'You discover how jam sessions shaped jazz culture and musicianship. We analyze how blowing sessions helped consolidate repertoire, shared language, and collaborative learning among players.',
        'We cover jazz composition and arranging in practical terms: writing for specific musicians, timbral color, and structure vs. improvisation. You see how arrangements amplify ensemble identity.',
        'From marching bands to early jazz groups, we trace instrumentation and functional roles. You learn how collective texture and role distribution formed the sound of early jazz ensembles.',
        'We study the swing era and the international rise of big bands. You analyze section writing, repertoire logic, and the balance between arranged material and improvisational space.',
        'This class addresses the shift to modern combos, bop, and hard bop, including new rhythm-section roles. You understand the move toward tighter interaction and harmonic sophistication in small groups.',
        'An advanced improvisation focus: solo architecture, tension-release, and narrative pacing. You learn to hear how major soloists build coherent musical storytelling in real time.',
        'We examine jazz and entertainment, from popular circuits to artistic legitimization. You understand how the genre’s public image evolved and how that changed its cultural status.',
        'Jazz singing, part 1: vocal swing, phrasing, and expressive use of lyrics. You study key artists and stylistic tools that shaped the classic jazz vocal tradition.',
        'We close with jazz singing in the swing era and its long-term legacy. You connect technique, interpretation, and artistic personality to the vocal models still influential today.',
      ],
    },
    fr: {
      title: 'Le cours',
      subtitle: 'Cliquez sur une leçon pour voir la description complète et un aperçu',
      previewLabel: 'Aperçu de la leçon',
      closeLabel: 'Fermer',
      backLabel: 'Retour aux leçons',
      classWord: 'Leçon',
      lockTitle: 'Leçon verrouillée',
      lockDescription: 'Créez un compte ou connectez-vous pour débloquer la leçon complète.',
      createAccountLabel: 'Créer un compte',
      loginLabel: 'Se connecter',
      learnListTitle: 'Dans cette leçon, vous apprendrez',
      lessonIncludes: [
        'Le contexte historique et culturel du thème principal.',
        'Les concepts clés expliqués avec des exemples musicaux.',
        'Comment appliquer cette écoute au reste du cours.',
      ],
      detailedDescriptions: [
        'Une introduction large à la culture jazz : ses racines afro-américaines, sa portée sociale et les raisons de son originalité artistique. Vous construisez une base historique et esthétique pour tout le parcours.',
        'Nous explorons l’hétérogénéité sonore du jazz et la notion de “son personnel”. Vous voyez comment timbre, articulation et phrasé créent l’identité d’un musicien.',
        'Analyse des antécédents historiques après la guerre de Sécession et des liens entre spirituals, gospel et blues. Vous comprenez comment ces traditions ont modelé le langage expressif du jazz.',
        'L’improvisation est étudiée comme moteur créatif central, avec ses ressources mélodiques, rythmiques et harmoniques. Vous apprenez à reconnaître paraphrase, développement motivique et approche modale.',
        'Le ragtime est présenté comme un antécédent décisif du jazz. Vous reliez sa syncope et son écriture pianistique aux premiers styles de La Nouvelle-Orléans.',
        'Leçon centrée sur le rythme : swing feel, accentuation, dialogue de la section rythmique et évolution historique. Vous comprenez le rôle transformateur batterie-contrebasse-piano.',
        'Vous découvrez les jam sessions et leur rôle dans la construction de la culture jazz. Nous voyons comment elles ont renforcé le répertoire, le langage commun et l’apprentissage collectif.',
        'Composition et arrangement en jazz : écrire pour des musiciens précis, travailler la couleur sonore et équilibrer structure et improvisation. Vous voyez comment un arrangement affirme l’identité d’un groupe.',
        'Des marching bands aux premiers ensembles de jazz, nous suivons l’évolution des formations et des fonctions instrumentales. Vous identifiez la naissance de la texture collective du jazz initial.',
        'Étude de l’ère swing et de l’expansion internationale des big bands. Vous analysez l’écriture en sections, le répertoire et l’équilibre entre matière écrite et improvisation.',
        'Transition vers les combos modernes, le bop et le hard bop, avec un nouveau rôle de la section rythmique. Vous comprenez l’évolution de l’interaction et de la complexité harmonique.',
        'Approche avancée de l’improvisation : construction du solo, tension-détente et narration musicale. Vous apprenez à écouter l’organisation du discours en temps réel.',
        'Nous analysons le lien entre jazz et divertissement, des circuits populaires à la reconnaissance artistique. Vous comprenez l’évolution de son image publique et de son statut culturel.',
        'Chant jazz 1 : swing vocal, phrasé et expressivité du texte. Vous découvrez les artistes clés et les procédés qui ont marqué la tradition vocale classique.',
        'Conclusion sur le chant jazz à l’époque swing et son héritage durable. Vous reliez technique, interprétation et personnalité artistique dans les modèles vocaux actuels.',
      ],
    },
    pt: {
      title: 'O curso',
      subtitle: 'Clique em qualquer aula para ver a descrição completa e a prévia',
      previewLabel: 'Prévia da aula',
      closeLabel: 'Fechar',
      backLabel: 'Voltar para as aulas',
      classWord: 'Aula',
      lockTitle: 'Aula bloqueada',
      lockDescription: 'Crie uma conta ou faça login para desbloquear a aula completa.',
      createAccountLabel: 'Criar conta',
      loginLabel: 'Login',
      learnListTitle: 'Nesta aula você vai aprender',
      lessonIncludes: [
        'Contexto histórico e cultural do tema principal.',
        'Conceitos centrais explicados com exemplos musicais.',
        'Como aplicar essa escuta no restante do curso.',
      ],
      detailedDescriptions: [
        'Uma introdução ampla à cultura do jazz: suas raízes afro-americanas, contexto social e os elementos que transformaram o gênero em uma linguagem artística única. Você cria base histórica e estética para entender o curso inteiro.',
        'Aprofundamos a heterogeneidade sonora do jazz e a ideia de “som pessoal”. Você entende como timbre, articulação e fraseado constroem identidade musical e por que a individualidade é central no jazz.',
        'Analisamos o contexto histórico pós-Guerra Civil nos EUA e a ligação entre spirituals, gospel e blues. Você compreende como essas matrizes moldaram o caráter expressivo do jazz inicial.',
        'Estudamos a improvisação como núcleo criativo do jazz, passando por recursos melódicos, rítmicos e harmônicos. Você aprende a reconhecer paráfrase, desenvolvimento motívico e abordagens modais na prática.',
        'Exploramos o ragtime como antecedente decisivo do jazz e seu legado rítmico. Você conecta escrita pianística, síncope e a transição para os primeiros estilos de Nova Orleans.',
        'Foco total em ritmo: swing feel, acentuação, interação da seção rítmica e evolução histórica. Você entende como bateria, contrabaixo e piano redefinem a energia musical em cada período.',
        'Você vai entender o que são jam sessions e por que elas foram fundamentais na cultura do jazz. A aula mostra como o “blowing” consolidou repertório, linguagem comum e aprendizado coletivo entre músicos.',
        'Composição e arranjo em jazz na prática: escrita para músicos específicos, cor tímbrica e equilíbrio entre estrutura e improviso. Você percebe como o arranjo fortalece a identidade de um grupo.',
        'Percorremos a passagem das marching bands para os primeiros grupos de jazz, com foco em instrumentação e função musical. Você entende como nasce a sonoridade coletiva da fase inicial do gênero.',
        'Estudamos a era do swing e o papel das big bands na internacionalização do jazz. Você analisa escrita por seções, lógica de repertório e o diálogo entre partes escritas e improvisadas.',
        'A aula cobre a transição para combos modernos, bop e hard bop, com novo papel da seção rítmica. Você compreende a evolução da interação musical e o aumento da sofisticação harmônica.',
        'Improvisação em nível avançado: construção de discurso, tensão e resolução, e narrativa de solo. Você aprende a ouvir como grandes solistas organizam ideias musicais em tempo real.',
        'Analisamos a relação entre jazz e entretenimento, dos circuitos populares à legitimação artística. Você entende como a percepção pública do gênero mudou ao longo do tempo.',
        'Canto jazz 1: fraseado, swing vocal e uso expressivo da letra. Você conhece artistas fundamentais e os recursos técnicos que moldaram a tradição vocal clássica do jazz.',
        'Encerramos com o canto jazz na era do swing e seu legado posterior. Você conecta técnica, interpretação e personalidade artística aos modelos vocais que influenciam até hoje.',
      ],
    },
  }[language];

  const localizedClasses = classes.map((classItem, index) => {
    if (language === 'es') return classItem;

    const lessonNumber = index + 1;
    const localizedSubtitle = getLocalizedJazzSubtitle(lessonNumber, language);
    const localizedDescription = getLocalizedJazzDescription(lessonNumber, language);

    return {
      ...classItem,
      title: `${copy.classWord} ${lessonNumber}`,
      subtitle: localizedSubtitle || classItem.subtitle,
      description: copy.detailedDescriptions[index] || localizedDescription || classItem.description,
    };
  });

  const handleCloseExpandedCard = () => {
    setExpandedIndex(null);

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        const coursesSection = document.getElementById('board-courses');
        if (coursesSection) {
          coursesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  };

  return (
    <>
      <div className="min-h-screen w-full bg-white dark:bg-background flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-4 text-gray-900 dark:text-white">{copy.title}</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12 text-sm">{copy.subtitle}</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {localizedClasses.map((classItem, index) => (
              <button
                key={index}
                className={`group relative bg-amber-500 rounded-xl overflow-hidden shadow-md transition-all duration-300 ease-out text-left ${
                  hoveredIndex === index ? 'shadow-2xl scale-105 ring-2 ring-yellow-400 z-10' : 'hover:shadow-lg'
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
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>

                <div className="p-3">
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">{classItem.title}</h3>
                  <p className="text-xs text-black/70 mt-0.5 line-clamp-2 leading-snug">{classItem.subtitle}</p>
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

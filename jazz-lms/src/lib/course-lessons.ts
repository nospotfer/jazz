export interface CanonicalJazzClass {
  classNumber: number;
  classLabel: string;
  subtitle: string;
  subtitles: Record<'es' | 'en' | 'fr' | 'pt', string>;
  descriptions: Record<'es' | 'en' | 'fr' | 'pt', string>;
  image: string;
}

export const CANONICAL_JAZZ_CLASSES: CanonicalJazzClass[] = [
  {
    classNumber: 1,
    classLabel: 'Clase 1',
    subtitle: 'Introducción a la cultura del jazz',
    subtitles: {
      es: 'Introducción a la cultura del jazz',
      en: 'Introduction to jazz culture',
      fr: 'Introduction à la culture du jazz',
      pt: 'Introdução à cultura do jazz',
    },
    descriptions: {
      es: 'Introducción general a la cultura del jazz, su origen histórico y sus bases estéticas.',
      en: 'A broad introduction to jazz culture, its historical roots, and core aesthetic principles.',
      fr: 'Introduction générale à la culture du jazz, à ses origines historiques et à ses bases esthétiques.',
      pt: 'Introdução geral à cultura do jazz, às suas origens históricas e bases estéticas.',
    },
    image: '/images/clase1.jpg',
  },
  {
    classNumber: 2,
    classLabel: 'Clase 2',
    subtitle: 'El lenguaje del jazz 1: heterogeneidad sonora',
    subtitles: {
      es: 'El lenguaje del jazz 1: heterogeneidad sonora',
      en: 'The language of jazz 1: sonic heterogeneity',
      fr: 'Le langage du jazz 1 : hétérogénéité sonore',
      pt: 'A linguagem do jazz 1: heterogeneidade sonora',
    },
    descriptions: {
      es: 'La heterogeneidad sonora y la personalización del sonido como rasgo esencial del jazz.',
      en: 'How sonic diversity and personal tone shape the identity of jazz language.',
      fr: 'L’hétérogénéité sonore et la personnalisation du son comme marque essentielle du jazz.',
      pt: 'A heterogeneidade sonora e a personalização do timbre como marca essencial do jazz.',
    },
    image: '/images/clase2.jpg',
  },
  {
    classNumber: 3,
    classLabel: 'Clase 3',
    subtitle: 'El lenguaje del jazz 2: antecedentes',
    subtitles: {
      es: 'El lenguaje del jazz 2: antecedentes',
      en: 'The language of jazz 2: roots',
      fr: 'Le langage du jazz 2 : antécédents',
      pt: 'A linguagem do jazz 2: antecedentes',
    },
    descriptions: {
      es: 'Antecedentes afroamericanos: gospel y blues como raíces fundamentales del lenguaje jazzístico.',
      en: 'African American roots: gospel and blues as key foundations of jazz expression.',
      fr: 'Racines afro-américaines : gospel et blues comme fondements du langage jazzistique.',
      pt: 'Raízes afro-americanas: gospel e blues como fundamentos da linguagem jazzística.',
    },
    image: '/images/clase3.jpg',
  },
  {
    classNumber: 4,
    classLabel: 'Clase 4',
    subtitle: 'El lenguaje del jazz 3: improvisación',
    subtitles: {
      es: 'El lenguaje del jazz 3: improvisación',
      en: 'The language of jazz 3: improvisation',
      fr: 'Le langage du jazz 3 : improvisation',
      pt: 'A linguagem do jazz 3: improvisação',
    },
    descriptions: {
      es: 'La improvisación como eje central del jazz y sus formas principales.',
      en: 'Improvisation as a central pillar of jazz, including its main approaches and forms.',
      fr: 'L’improvisation comme axe central du jazz et ses formes principales.',
      pt: 'A improvisação como eixo central do jazz e suas principais formas.',
    },
    image: '/images/clase4.jpg',
  },
  {
    classNumber: 5,
    classLabel: 'Clase 5',
    subtitle: 'Un antecedente decisivo: ragtime',
    subtitles: {
      es: 'Un antecedente decisivo: ragtime',
      en: 'A decisive precursor: ragtime',
      fr: 'Un antécédent décisif : le ragtime',
      pt: 'Um antecedente decisivo: ragtime',
    },
    descriptions: {
      es: 'Ragtime como antecedente clave y su relación con el surgimiento del jazz temprano.',
      en: 'Ragtime as a key precursor and its link to the rise of early jazz.',
      fr: 'Le ragtime comme antécédent clé et son lien avec la naissance du jazz ancien.',
      pt: 'O ragtime como antecedente-chave e sua relação com o nascimento do jazz inicial.',
    },
    image: '/images/clase5.jpg',
  },
  {
    classNumber: 6,
    classLabel: 'Clase 6',
    subtitle: 'El lenguaje del jazz 4: ritmo',
    subtitles: {
      es: 'El lenguaje del jazz 4: ritmo',
      en: 'The language of jazz 4: rhythm',
      fr: 'Le langage du jazz 4 : rythme',
      pt: 'A linguagem do jazz 4: ritmo',
    },
    descriptions: {
      es: 'Evolución del ritmo y de la sección rítmica desde el jazz temprano hasta el bop.',
      en: 'The evolution of rhythm and the rhythm section from early jazz to bebop.',
      fr: 'Évolution du rythme et de la section rythmique du jazz ancien au bebop.',
      pt: 'Evolução do ritmo e da seção rítmica do jazz inicial ao bebop.',
    },
    image: '/images/clase6.jpg',
  },
  {
    classNumber: 7,
    classLabel: 'Clase 7',
    subtitle: 'Jamming y blowing',
    subtitles: {
      es: 'Jamming y blowing',
      en: 'Jamming and blowing',
      fr: 'Jamming et blowing',
      pt: 'Jamming e blowing',
    },
    descriptions: {
      es: 'La cultura de las jam sessions y su impacto en la consolidación del jazz moderno.',
      en: 'Jam-session culture and its role in consolidating modern jazz practice.',
      fr: 'La culture des jam sessions et son impact sur le jazz moderne.',
      pt: 'A cultura das jam sessions e seu impacto na consolidação do jazz moderno.',
    },
    image: '/images/clase7.jpg',
  },
  {
    classNumber: 8,
    classLabel: 'Clase 8',
    subtitle: 'Composición y arreglo en jazz',
    subtitles: {
      es: 'Composición y arreglo en jazz',
      en: 'Composition and arrangements in jazz',
      fr: 'Composition et arrangements en jazz',
      pt: 'Composição e arranjos no jazz',
    },
    descriptions: {
      es: 'Composición y arreglos pensados para timbres y personalidades musicales concretas.',
      en: 'Composition and arranging focused on specific timbres and performer identities.',
      fr: 'Composition et arrangements pensés pour des timbres et personnalités musicales précises.',
      pt: 'Composição e arranjos pensados para timbres e personalidades musicais específicas.',
    },
    image: '/images/clase8.jpg',
  },
  {
    classNumber: 9,
    classLabel: 'Clase 9',
    subtitle: 'De las marching bands a los primeros grupos de jazz',
    subtitles: {
      es: 'De las marching bands a los primeros grupos de jazz',
      en: 'From marching bands to early jazz groups',
      fr: 'Des marching bands aux premiers groupes de jazz',
      pt: 'Das marching bands aos primeiros grupos de jazz',
    },
    descriptions: {
      es: 'De las marching bands a las primeras formaciones que definieron el sonido del jazz.',
      en: 'From marching bands to the first ensembles that defined the early jazz sound.',
      fr: 'Des marching bands aux premières formations qui ont défini le son du jazz.',
      pt: 'Das marching bands às primeiras formações que definiram o som do jazz.',
    },
    image: '/images/clase9.jpg',
  },
  {
    classNumber: 10,
    classLabel: 'Clase 10',
    subtitle: 'Swing y combos clásicos',
    subtitles: {
      es: 'Swing y combos clásicos',
      en: 'Swing and classic combos',
      fr: 'Swing et combos classiques',
      pt: 'Swing e combos clássicos',
    },
    descriptions: {
      es: 'El swing y los combos clásicos en la expansión internacional del género.',
      en: 'Swing and classic combos in the international expansion of the genre.',
      fr: 'Le swing et les combos classiques dans l’expansion internationale du genre.',
      pt: 'Swing e combos clássicos na expansão internacional do gênero.',
    },
    image: '/images/clase10.jpg',
  },
  {
    classNumber: 11,
    classLabel: 'Clase 11',
    subtitle: 'Combos modernos e instrumentos de sección rítmica',
    subtitles: {
      es: 'Combos modernos e instrumentos de sección rítmica',
      en: 'Modern combos and rhythm-section instruments',
      fr: 'Combos modernes et instruments de section rythmique',
      pt: 'Combos modernos e instrumentos da seção rítmica',
    },
    descriptions: {
      es: 'Combos modernos y nuevas funciones instrumentales en el hard bop y el jazz modal.',
      en: 'Modern combos and new instrumental roles in hard bop and modal jazz.',
      fr: 'Combos modernes et nouveaux rôles instrumentaux dans le hard bop et le jazz modal.',
      pt: 'Combos modernos e novas funções instrumentais no hard bop e no jazz modal.',
    },
    image: '/images/clase11.jpg',
  },
  {
    classNumber: 12,
    classLabel: 'Clase 12',
    subtitle: 'Improvisación',
    subtitles: {
      es: 'Improvisación',
      en: 'Improvisation',
      fr: 'Improvisation',
      pt: 'Improvisação',
    },
    descriptions: {
      es: 'Procedimientos improvisatorios: paráfrasis, fórmula, motivo, modalidad y libertad.',
      en: 'Improvisational tools: paraphrase, patterns, motifs, modality, and freedom.',
      fr: 'Procédés d’improvisation : paraphrase, formules, motifs, modalité et liberté.',
      pt: 'Procedimentos de improvisação: paráfrase, fórmulas, motivo, modalidade e liberdade.',
    },
    image: '/images/clase12.jpg',
  },
  {
    classNumber: 13,
    classLabel: 'Clase 13',
    subtitle: 'Jazz y entretenimiento',
    subtitles: {
      es: 'Jazz y entretenimiento',
      en: 'Jazz and entertainment',
      fr: 'Jazz et divertissement',
      pt: 'Jazz e entretenimento',
    },
    descriptions: {
      es: 'Relación entre jazz y entretenimiento en su proceso de consolidación cultural.',
      en: 'Jazz and entertainment in the genre’s broader cultural consolidation.',
      fr: 'Le lien entre jazz et divertissement dans sa consolidation culturelle.',
      pt: 'Relação entre jazz e entretenimento no processo de consolidação cultural.',
    },
    image: '/images/clase13.jpg',
  },
  {
    classNumber: 14,
    classLabel: 'Clase 14',
    subtitle: 'Canto jazz 1',
    subtitles: {
      es: 'Canto jazz 1',
      en: 'Jazz singing 1',
      fr: 'Chant jazz 1',
      pt: 'Canto jazz 1',
    },
    descriptions: {
      es: 'El canto jazzístico en su primera etapa y sus principales referentes históricos.',
      en: 'Early stages of jazz singing and its leading historical references.',
      fr: 'Le chant jazz à ses débuts et ses principales figures historiques.',
      pt: 'O canto jazz em sua primeira fase e seus principais referenciais históricos.',
    },
    image: '/images/clase14.jpg',
  },
  {
    classNumber: 15,
    classLabel: 'Clase 15',
    subtitle: 'Canto jazz 2',
    subtitles: {
      es: 'Canto jazz 2',
      en: 'Jazz singing 2',
      fr: 'Chant jazz 2',
      pt: 'Canto jazz 2',
    },
    descriptions: {
      es: 'Grandes voces del swing y su influencia en la evolución de la voz como instrumento.',
      en: 'Major swing voices and their impact on the voice as an instrument.',
      fr: 'Grandes voix du swing et influence sur l’évolution de la voix comme instrument.',
      pt: 'Grandes vozes do swing e sua influência na evolução da voz como instrumento.',
    },
    image: '/images/clase15.jpg',
  },
];

export function getCanonicalJazzClass(classNumber: number) {
  return CANONICAL_JAZZ_CLASSES.find((item) => item.classNumber === classNumber);
}

export function getLocalizedJazzClassLabel(
  classNumber: number,
  language: 'es' | 'en' | 'fr' | 'pt'
) {
  const classWords = {
    es: 'Clase',
    en: 'Lesson',
    fr: 'Leçon',
    pt: 'Aula',
  };

  return `${classWords[language]} ${classNumber}`;
}

export function getLocalizedJazzSubtitle(
  classNumber: number,
  language: 'es' | 'en' | 'fr' | 'pt'
) {
  return getCanonicalJazzClass(classNumber)?.subtitles[language] ?? null;
}

export function getLocalizedJazzDescription(
  classNumber: number,
  language: 'es' | 'en' | 'fr' | 'pt'
) {
  return getCanonicalJazzClass(classNumber)?.descriptions[language] ?? null;
}

export interface CanonicalJazzClass {
  classNumber: number;
  classLabel: string;
  subtitle: string; // Updated subtitle
  subtitles: Record<'es' | 'en' | 'fr' | 'pt', string>;
  descriptions: Record<'es' | 'en' | 'fr' | 'pt', string>;
  image: string;
}

export const CANONICAL_JAZZ_CLASSES: CanonicalJazzClass[] = [
  {
    classNumber: 1,
    classLabel: 'Clase 1',
    subtitle: 'La Esencia del Jazz',
    subtitles: {
      es: 'La Esencia del Jazz',
      en: 'The Essence of Jazz',
      fr: 'L’essence du jazz',
      pt: 'A Essencia do Jazz',
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
    subtitle: 'El Lenguaje del Jazz: Heterogeneidad Sonora',
    subtitles: {
      es: 'El Lenguaje del Jazz: Heterogeneidad Sonora',
      en: 'The Language of Jazz: Sonic Heterogeneity',
      fr: 'Le langage du jazz : hétérogénéité sonore',
      pt: 'A Linguagem do Jazz: Heterogeneidade Sonora',
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
    subtitle: 'Gospel y Blues: Las Raices Profundas',
    subtitles: {
      es: 'Gospel y Blues: Las Raices Profundas',
      en: 'Gospel and Blues: The Deep Roots',
      fr: 'Gospel et blues : les racines profondes',
      pt: 'Gospel e Blues: As Raizes Profundas',
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
    subtitle: 'Las Formas del Jazz: Blues y Baladas',
    subtitles: {
      es: 'Las Formas del Jazz: Blues y Baladas',
      en: 'The Forms of Jazz: Blues and Ballads',
      fr: 'Les formes du jazz : blues et ballades',
      pt: 'As Formas do Jazz: Blues e Baladas',
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
    subtitle: 'Un Antecedente Decisivo: El Ragtime',
    subtitles: {
      es: 'Un Antecedente Decisivo: El Ragtime',
      en: 'A Decisive Precedent: Ragtime',
      fr: 'Un antécédent décisif : le ragtime',
      pt: 'Um Antecedente Decisivo: O Ragtime',
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
    subtitle: 'El Ritmo: El Corazon del Jazz',
    subtitles: {
      es: 'El Ritmo: El Corazon del Jazz',
      en: 'Rhythm: The Heart of Jazz',
      fr: 'Le rythme : le cœur du jazz',
      pt: 'O Ritmo: O Coracao do Jazz',
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
    subtitle: 'Jamming and Blowing: El Placer de Improvisar',
    subtitles: {
      es: 'Jamming and Blowing: El Placer de Improvisar',
      en: 'Jamming and Blowing: The Pleasure of Improvising',
      fr: 'Jamming and blowing : le plaisir d’improviser',
      pt: 'Jamming and Blowing: O Prazer de Improvisar',
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
    subtitle: 'La Composicion Colaborativa: Ellington, Basie y Monk',
    subtitles: {
      es: 'La Composicion Colaborativa: Ellington, Basie y Monk',
      en: 'Collaborative Composition: Ellington, Basie, and Monk',
      fr: 'La composition collaborative : Ellington, Basie et Monk',
      pt: 'A Composicao Colaborativa: Ellington, Basie e Monk',
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
    subtitle: 'Instrumentos y Conjuntos: La Orquesta',
    subtitles: {
      es: 'Instrumentos y Conjuntos: La Orquesta',
      en: 'Instruments and Ensembles: The Orchestra',
      fr: 'Instruments et ensembles : l’orchestre',
      pt: 'Instrumentos e Conjuntos: A Orquestra',
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
    subtitle: 'Los Pequenos Grupos y el Mundo de los Solistas',
    subtitles: {
      es: 'Los Pequenos Grupos y el Mundo de los Solistas',
      en: 'Small Groups and the World of Soloists',
      fr: 'Les petits groupes et le monde des solistes',
      pt: 'Os Pequenos Grupos e o Mundo dos Solistas',
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
    subtitle: 'La Seccion Ritmica: El Motor del Grupo',
    subtitles: {
      es: 'La Seccion Ritmica: El Motor del Grupo',
      en: 'The Rhythm Section: The Engine of the Group',
      fr: 'La section rythmique : le moteur du groupe',
      pt: 'A Secao Ritmica: O Motor do Grupo',
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
    subtitle: 'La Improvisacion en el Jazz',
    subtitles: {
      es: 'La Improvisacion en el Jazz',
      en: 'Improvisation in Jazz',
      fr: 'L’improvisation en jazz',
      pt: 'A Improvisacao no Jazz',
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
    subtitle: 'Jazz y Entertainment: Arte o Espectaculo',
    subtitles: {
      es: 'Jazz y Entertainment: Arte o Espectaculo',
      en: 'Jazz and Entertainment: Art or Spectacle',
      fr: 'Jazz et entertainment : art ou spectacle',
      pt: 'Jazz e Entertainment: Arte ou Espetaculo',
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
    subtitle: 'Cantar Jazz (Parte 1): De Bessie Smith a Billie Holiday',
    subtitles: {
      es: 'Cantar Jazz (Parte 1): De Bessie Smith a Billie Holiday',
      en: 'Singing Jazz (Part 1): From Bessie Smith to Billie Holiday',
      fr: 'Chanter le jazz (partie 1) : de Bessie Smith à Billie Holiday',
      pt: 'Cantar Jazz (Parte 1): De Bessie Smith a Billie Holiday',
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
    subtitle: 'Cantar Jazz (Parte 2): De Ella Fitzgerald a Sarah Vaughan',
    subtitles: {
      es: 'Cantar Jazz (Parte 2): De Ella Fitzgerald a Sarah Vaughan',
      en: 'Singing Jazz (Part 2): From Ella Fitzgerald to Sarah Vaughan',
      fr: 'Chanter le jazz (partie 2) : de Ella Fitzgerald à Sarah Vaughan',
      pt: 'Cantar Jazz (Parte 2): De Ella Fitzgerald a Sarah Vaughan',
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

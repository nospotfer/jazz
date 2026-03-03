export interface CanonicalJazzClass {
  classNumber: number;
  classLabel: string;
  subtitle: string;
  image: string;
}

export const CANONICAL_JAZZ_CLASSES: CanonicalJazzClass[] = [
  {
    classNumber: 1,
    classLabel: 'Clase 1',
    subtitle: 'Introducción a la cultura del jazz',
    image: '/images/clase1.jpg',
  },
  {
    classNumber: 2,
    classLabel: 'Clase 2',
    subtitle: 'El lenguaje del jazz 1: heterogeneidad sonora',
    image: '/images/clase2.jpg',
  },
  {
    classNumber: 3,
    classLabel: 'Clase 3',
    subtitle: 'El lenguaje del jazz 2: antecedentes',
    image: '/images/clase3.jpg',
  },
  {
    classNumber: 4,
    classLabel: 'Clase 4',
    subtitle: 'El lenguaje del jazz 3: improvisación',
    image: '/images/clase4.jpg',
  },
  {
    classNumber: 5,
    classLabel: 'Clase 5',
    subtitle: 'Un antecedente decisivo: ragtime',
    image: '/images/clase5.jpg',
  },
  {
    classNumber: 6,
    classLabel: 'Clase 6',
    subtitle: 'El lenguaje del jazz 4: ritmo',
    image: '/images/clase6.jpg',
  },
  {
    classNumber: 7,
    classLabel: 'Clase 7',
    subtitle: 'Jamming y blowing',
    image: '/images/clase7.jpg',
  },
  {
    classNumber: 8,
    classLabel: 'Clase 8',
    subtitle: 'Composición y arreglo en jazz',
    image: '/images/clase8.jpg',
  },
  {
    classNumber: 9,
    classLabel: 'Clase 9',
    subtitle: 'De las marching bands a los primeros grupos de jazz',
    image: '/images/clase9.jpg',
  },
  {
    classNumber: 10,
    classLabel: 'Clase 10',
    subtitle: 'Swing y combos clásicos',
    image: '/images/clase10.jpg',
  },
  {
    classNumber: 11,
    classLabel: 'Clase 11',
    subtitle: 'Combos modernos e instrumentos de sección rítmica',
    image: '/images/clase11.jpg',
  },
  {
    classNumber: 12,
    classLabel: 'Clase 12',
    subtitle: 'Improvisación',
    image: '/images/clase12.jpg',
  },
  {
    classNumber: 13,
    classLabel: 'Clase 13',
    subtitle: 'Jazz y entretenimiento',
    image: '/images/clase13.jpg',
  },
  {
    classNumber: 14,
    classLabel: 'Clase 14',
    subtitle: 'Canto jazz 1',
    image: '/images/clase14.jpg',
  },
  {
    classNumber: 15,
    classLabel: 'Clase 15',
    subtitle: 'Canto jazz 2',
    image: '/images/clase15.jpg',
  },
];

export function getCanonicalJazzClass(classNumber: number) {
  return CANONICAL_JAZZ_CLASSES.find((item) => item.classNumber === classNumber);
}

export interface CanonicalJazzClass {
  classNumber: number;
  classLabel: string;
  subtitle: string;
  image: string;
}

export const CANONICAL_JAZZ_CLASSES: CanonicalJazzClass[] = [
  {
    classNumber: 1,
    classLabel: 'Class 1',
    subtitle: 'Introduction to Jazz Culture',
    image: '/images/clase1.jpg',
  },
  {
    classNumber: 2,
    classLabel: 'Class 2',
    subtitle: 'The Language of Jazz 1: Sonic Heterogeneity',
    image: '/images/clase2.jpg',
  },
  {
    classNumber: 3,
    classLabel: 'Class 3',
    subtitle: 'The Language of Jazz 2: The Antecedents',
    image: '/images/clase3.jpg',
  },
  {
    classNumber: 4,
    classLabel: 'Class 4',
    subtitle: 'The Language of Jazz 3: Improvisation',
    image: '/images/clase4.jpg',
  },
  {
    classNumber: 5,
    classLabel: 'Class 5',
    subtitle: 'A Decisive Antecedent: Ragtime',
    image: '/images/clase5.jpg',
  },
  {
    classNumber: 6,
    classLabel: 'Class 6',
    subtitle: 'The Language of Jazz 4: Rhythm',
    image: '/images/clase6.jpg',
  },
  {
    classNumber: 7,
    classLabel: 'Class 7',
    subtitle: 'Jamming & Blowing',
    image: '/images/clase7.jpg',
  },
  {
    classNumber: 8,
    classLabel: 'Class 8',
    subtitle: 'Composition and Arrangement in Jazz',
    image: '/images/clase8.jpg',
  },
  {
    classNumber: 9,
    classLabel: 'Class 9',
    subtitle: 'From Marching Bands to the First Jazz Groups',
    image: '/images/clase9.jpg',
  },
  {
    classNumber: 10,
    classLabel: 'Class 10',
    subtitle: 'Swing and Classic Combos',
    image: '/images/clase10.jpg',
  },
  {
    classNumber: 11,
    classLabel: 'Class 11',
    subtitle: 'Modern Combos and Rhythm Section Instruments',
    image: '/images/clase11.jpg',
  },
  {
    classNumber: 12,
    classLabel: 'Class 12',
    subtitle: 'Improvisation',
    image: '/images/clase12.jpg',
  },
  {
    classNumber: 13,
    classLabel: 'Class 13',
    subtitle: 'Jazz and Entertainment',
    image: '/images/clase13.jpg',
  },
  {
    classNumber: 14,
    classLabel: 'Class 14',
    subtitle: 'Singing Jazz 1',
    image: '/images/clase14.jpg',
  },
  {
    classNumber: 15,
    classLabel: 'Class 15',
    subtitle: 'Singing Jazz 2',
    image: '/images/clase15.jpg',
  },
];

export function getCanonicalJazzClass(classNumber: number) {
  return CANONICAL_JAZZ_CLASSES.find((item) => item.classNumber === classNumber);
}

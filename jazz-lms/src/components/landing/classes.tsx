'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';

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
  closeLabel,
  previewLabel,
}: {
  classItem: ClassItem;
  onClose: () => void;
  closeLabel: string;
  previewLabel: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
          aria-label={closeLabel}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          {/* Left - Description */}
          <div className="p-8 lg:p-10 flex flex-col justify-center overflow-y-auto max-h-[85vh]">
            <div className="mb-4">
              <span className="text-yellow-600 text-sm font-bold uppercase tracking-widest">
                {classItem.title}
              </span>
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-6">
              {classItem.subtitle}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
              {classItem.description}
            </p>
          </div>

          {/* Right - Preview Visual */}
          <div className="relative bg-black min-h-[300px] lg:min-h-0">
            <Image
              src={classItem.image}
              alt={classItem.subtitle}
              fill
              className="absolute inset-0 w-full h-full object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-xs uppercase tracking-widest opacity-70">{previewLabel}</p>
              <p className="text-sm font-semibold">{classItem.subtitle}</p>
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
      classWord: 'Clase',
    },
    en: {
      title: 'The course',
      subtitle: 'Click any lesson to see the full description and preview',
      previewLabel: 'Lesson preview',
      closeLabel: 'Close',
      classWord: 'Lesson',
    },
    fr: {
      title: 'Le cours',
      subtitle: 'Cliquez sur une leçon pour voir la description complète et un aperçu',
      previewLabel: 'Aperçu de la leçon',
      closeLabel: 'Fermer',
      classWord: 'Leçon',
    },
    pt: {
      title: 'O curso',
      subtitle: 'Clique em qualquer aula para ver a descrição completa e a prévia',
      previewLabel: 'Prévia da aula',
      closeLabel: 'Fechar',
      classWord: 'Aula',
    },
  }[language];

  const localizedClasses = classes.map((classItem, index) => {
    if (language === 'es') return classItem;

    const lessonNumber = index + 1;

    const localizedByLanguage = {
      en: {
        subtitle: `Core topic of lesson ${lessonNumber}`,
        description: `In this lesson, you will explore key ideas of jazz culture through guided examples and practical listening references.`,
      },
      fr: {
        subtitle: `Thème principal de la leçon ${lessonNumber}`,
        description: `Dans cette leçon, vous explorerez des idées clés de la culture jazz avec des exemples guidés et des références d’écoute pratiques.`,
      },
      pt: {
        subtitle: `Tema principal da aula ${lessonNumber}`,
        description: `Nesta aula, você vai explorar ideias centrais da cultura do jazz com exemplos guiados e referências práticas de escuta.`,
      },
    };

    const current = localizedByLanguage[language as 'en' | 'fr' | 'pt'];

    return {
      ...classItem,
      title: `${copy.classWord} ${lessonNumber}`,
      subtitle: current.subtitle,
      description: current.description,
    };
  });

  return (
    <>
      <div className="min-h-screen w-full bg-white dark:bg-background flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            {copy.title}
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12 text-sm">
            {copy.subtitle}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {localizedClasses.map((classItem, index) => (
              <button
                key={index}
                className={`group relative bg-amber-500 rounded-xl overflow-hidden shadow-md transition-all duration-300 ease-out text-left ${
                  hoveredIndex === index
                    ? 'shadow-2xl scale-105 ring-2 ring-yellow-400 z-10'
                    : 'hover:shadow-lg'
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setExpandedIndex(index)}
              >
                {/* Small image thumbnail */}
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

                {/* Title only */}
                <div className="p-3">
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">
                    {classItem.title}
                  </h3>
                  <p className="text-xs text-black/70 mt-0.5 line-clamp-2 leading-snug">
                    {classItem.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded card modal */}
      {expandedIndex !== null && (
        <ExpandedCard
          classItem={localizedClasses[expandedIndex]}
          onClose={() => setExpandedIndex(null)}
          closeLabel={copy.closeLabel}
          previewLabel={copy.previewLabel}
        />
      )}
    </>
  );
}

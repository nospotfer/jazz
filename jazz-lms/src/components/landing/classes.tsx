'use client';

import Image from 'next/image';
import React from 'react';

interface ClassItem {
  title: string;
  subtitle: string;
  description: string;
  image: string;
}

const classes: ClassItem[] = [
  {
    title: 'Clase 1',
    subtitle: 'introducción a la Cultura del Jazz',
    description:
      'En esta primera clase se presenta una introducción general a la Cultura del Jazz.',
    image: '/images/clase1.jpg',
  },
  {
    title: 'Clase 2',
    subtitle: 'El Lenguaje del Jazz 1: La Heterogeneidad Sonora',
    description:
      'En la personalización del sonido puede emerger un principio estético que se elabora a través de sonoridades diversas.',
    image: '/images/clase2.jpg',
  },
  {
    title: 'Clase 3',
    subtitle: 'El Lenguaje del Jazz 2: Los Antecedentes',
    description:
      'Se consideran los antecedentes de influencia africana surgidos tras la Guerra Civil Norteamericana.',
    image: '/images/clase3.jpg',
  },
  {
    title: 'Clase 4',
    subtitle: 'El Lenguaje del Jazz 3: La Improvisación',
    description:
      'Siendo la improvisación una cuestión central del lenguaje, se revisan las formas temáticas.',
    image: '/images/clase4.jpg',
  },
  {
    title: 'Clase 5',
    subtitle: 'Un antecedente decisivo: El Ragtime',
    description:
      'Tras abordar su origen probable, su desarrollo en el piano y en la orquesta.',
    image: '/images/clase5.jpeg',
  },
  {
    title: 'Clase 6',
    subtitle: 'El Lenguaje del Jazz 4: El Ritmo',
    description:
      'Se analiza el ritmo en el jazz inicial y los roles de los instrumentos de la sección rítmica.',
    image: '/images/clase6.jpg',
  },
  {
    title: 'Clase 7',
    subtitle: 'Jamming & Blowing',
    description:
      'Tras una breve referencia al origen del concepto en Chicago, la clase se centra en su consolidación.',
    image: '/images/clase7.jpg',
  },
  {
    title: 'Clase 8',
    subtitle: 'La Composición y el Arreglo en el Jazz',
    description:
      'Los grandes compositores de jazz nunca han creado en abstracto, sino siempre pensando en alguien concreto.',
    image: '/images/clase8.jpg',
  },
  {
    title: 'Clase 9',
    subtitle: 'De las Marching Bands a los primeros conjuntos de jazz',
    description:
      'Se presentan las formaciones iniciales, desde las marching bands de Nueva Orleans.',
    image: '/images/clase9.jpeg',
  },
  {
    title: 'Clase 10',
    subtitle: 'Swing y Combos Clásicos',
    description:
      'La clase se centra en las grandes orquestas de la era del swing, con figuras como Benny Goodman y el Quinteto del Hot Club de Francia.',
    image: '/images/clase10.jpg',
  },
  {
    title: 'Clase 11',
    subtitle: 'Combos modernos e instrumentos en la sección rítmica',
    description:
      'Se aborda la evolución hacia los combos del bop, hard bop y jazz modal, analizando su flexibilidad y protagonismo en la innovación musical.',
    image: '/images/clase11.jpg',
  },
  {
    title: 'Clase 12',
    subtitle: 'La Improvisación',
    description:
      'La clase comienza con el estudio de la improvisación, abordando su forma y las razones de la decisión tímbrica condicionante.',
    image: '/images/clase12.jpg',
  },
  {
    title: 'Clase 13',
    subtitle: 'Jazz y Entertainment',
    description:
      'Aunque hoy en día el jazz se considera una cultura musical propia con valores definidos, en los años 20 su contexto era mucho más diverso.',
    image: '/images/clase13.jpeg',
  },
  {
    title: 'Clase 14',
    subtitle: 'Cantar el Jazz 1',
    description:
      'El jazz, con sus orígenes en la música vocal, tiene en el blues de vodevil cantado por mujeres a uno de sus principales precedentes.',
    image: '/images/clase14.jpg',
  },
  {
    title: 'Clase 15',
    subtitle: 'Cantar el Jazz 2',
    description:
      'La lección explora a las divas del swing, con un enfoque en Billie Holiday y Ella Fitzgerald, analizando su estilo y la interacción con otros músicos.',
    image: '/images/clase15.jpg',
  },
];

export function Classes() {
  return (
    <section className="bg-gray-900 text-white py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl sm:text-5xl font-bold text-center mb-12">El Curso</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {classes.map((classItem, index) => (
            <div key={index} className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="relative mb-4 h-48 w-full overflow-hidden rounded-lg">
                <Image
                  src={classItem.image}
                  alt={classItem.subtitle}
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 33vw, 100vw"
                />
              </div>
              <h3 className="text-xl font-bold text-yellow-500 mb-2">
                {classItem.title}
              </h3>
              <h4 className="text-lg font-semibold mb-4">
                {classItem.subtitle}
              </h4>
              <p className="text-gray-300">{classItem.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

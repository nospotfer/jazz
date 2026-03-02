'use client';

import Image from 'next/image';

interface PressItem {
  titulo: string;
  autor: string;
  fecha: string;
  descripcion: string;
  imagen: string;
}

const press: PressItem[] = [
  {
    titulo: 'Ponente en el Círculo del Liceo',
    autor: 'E. Llinás',
    fecha: 'La Vanguardia, 4/05/2022',
    descripcion:
      '"Enric Vázquez es la piedra angular de la veterana escena jazz de Barcelona"',
    imagen: '/images/en la prensa1.jpeg',
  },
  {
    titulo: 'Jamboree',
    autor: 'J. Sagarra',
    fecha: 'La Vanguardia, 19/01/2020',
    descripcion:
      '"La persona que mejor conoce el jazz de Barcelona desde los años 60"',
    imagen: '/images/en la prensa2.jpeg',
  },
  {
    titulo: 'Iwanowski Guide 101 Barcelona',
    autor: 'K. Sommer',
    fecha: '2023, pag. 207',
    descripcion:
      '"Enric Vázquez es el motor de la popularidad del jazz desde 1958, con publicaciones, emisiones de televisión, conferencias en círculos intelectuales y colaboración en la organización del primer festival de jazz de Barcelona"',
    imagen: '/images/en la prensa3.jpeg',
  },
];

export function Press() {
  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-black flex items-center">
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12">
        <h2 className="text-gray-900 dark:text-white text-4xl sm:text-5xl font-bold text-center mb-12">
          En la prensa
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {press.map((item, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 dark:border-transparent"
            >
              <div className="relative h-48 w-full">
                <Image
                  src={item.imagen}
                  alt={item.titulo}
                  fill
                  className="object-cover"
                  quality={75}
                />
              </div>
              <div className="p-6">
                <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-2">
                  {item.titulo}
                </h3>
                <p className="text-yellow-500 text-sm font-semibold mb-1">
                  {item.autor}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-3">{item.fecha}</p>
                <p className="text-gray-600 dark:text-gray-300 text-sm italic">"{item.descripcion}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
    titulo: 'Conferencinte en el Círculo del Liceo',
    autor: 'E. Llinás',
    fecha: 'La Vanguardia, 4/05/2022',
    descripcion:
      '"Enric Vazquez es la piedra angular de la veterana escena jazzística barcelonesa"',
    imagen: '/images/en la prensa1.jpeg',
  },
  {
    titulo: 'Jamboree',
    autor: 'J. Sagarra',
    fecha: 'La Vanguardia, 19/01/2020',
    descripcion:
      '"La persona que mejor conoce el jazz barcelonés desde los años 60"',
    imagen: '/images/en la prensa2.jpeg',
  },
  {
    titulo: 'Guía Iwanowski 101 Barcelona',
    autor: 'K. Sommer',
    fecha: '2023, pag. 207',
    descripcion:
      '"Enric Vazquez es el impulso de la popularidad del jazz desde 1958 con publicaciones, emisiones de televisión, conferencias en círculos intelectuales, así como colaboración en la organización del primer festival de jazz de barcelona"',
    imagen: '/images/en la prensa3.jpeg',
  },
];

export function Press() {
  return (
    <section className="w-full bg-black py-12 sm:py-16 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-white text-4xl font-bold text-center mb-12">
          En la Prensa
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {press.map((item, index) => (
            <div
              key={index}
              className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
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
                <h3 className="text-white font-bold text-lg mb-2">
                  {item.titulo}
                </h3>
                <p className="text-yellow-500 text-sm font-semibold mb-1">
                  {item.autor}
                </p>
                <p className="text-gray-400 text-xs mb-3">{item.fecha}</p>
                <p className="text-gray-300 text-sm italic">"{item.descripcion}"</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import React from 'react';
import Image from 'next/image';

export function Professor() {
  return (
    <div className="min-h-screen w-full bg-white dark:bg-background flex items-center">
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch min-h-[75vh]">
          {/* Left side - Photo */}
          <div className="relative w-full min-h-[400px] lg:min-h-0 rounded-l-2xl overflow-hidden shadow-2xl">
            <Image
              src="/images/Conoce a tu Profesor.png"
              alt="Enric Vázquez Ramonich"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <p className="text-white text-sm font-medium">
                Enric Vázquez Ramonich
              </p>
              <p className="text-gray-300 text-xs">
                Imagen proporcionada por el Harlem Jazz Museum, NY
              </p>
            </div>
          </div>

          {/* Right side - Text */}
          <div className="bg-gray-900 dark:bg-gray-900 rounded-r-2xl p-8 lg:p-12 flex flex-col justify-center shadow-2xl">
            <div className="border-b-2 border-yellow-600 pb-6 mb-8">
              <h2 className="text-yellow-500 text-4xl lg:text-5xl font-bold">
                Conoce a tu profesor
              </h2>
            </div>

            <div className="space-y-6">
              <p className="text-gray-200 text-base lg:text-lg leading-relaxed">
                Pocas personas pueden decir que han vivido el jazz desde dentro durante más de 60 años.{' '}
                <span className="text-yellow-500 font-semibold">Enric Vázquez Ramonich</span> es
                cofundador del mítico Jamboree Jazz Club y del Jubilee Jazz Club, y ha
                compartido escenario y conversaciones con leyendas como{' '}
                <span className="text-yellow-500/80 italic">Bill Evans, Chet Baker o Art Blakey</span>.
              </p>
              <p className="text-gray-300 text-base lg:text-lg leading-relaxed">
                Ha presentado programas de radio y televisión, escrito en medios especializados y
                participado en obras de referencia como la Guía Universal del Jazz Moderno. También es
                autor de los primeros capítulos de la Historia del Jazz para la Generalitat de Catalunya.
              </p>
              <p className="text-gray-300 text-base lg:text-lg leading-relaxed">
                Ahora, toda esa experiencia y pasión se condensan en{' '}
                <span className="text-white font-bold">&quot;Cultura del Jazz&quot;</span>, un curso diseñado
                para que, incluso si nunca has tocado un instrumento, puedas entender, sentir y
                disfrutar el jazz como si siempre hubieras formado parte de él.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <div className="h-1 w-12 bg-yellow-600 rounded-full" />
              <span className="text-yellow-600 text-sm font-semibold uppercase tracking-widest">
                Más de 60 años de experiencia en jazz
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
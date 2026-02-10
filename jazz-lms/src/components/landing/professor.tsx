import React from 'react';

export function Professor() {
  return (
    <section className="bg-gray-900 text-white py-20">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-8 md:mb-0">
          <img
            src="/images/Conoce a tu Profesor.png"
            alt="Enric Vázquez Ramonich"
            className="rounded-lg shadow-lg w-full"
          />
          <p className="text-sm text-gray-400 mt-2">
            Enric Vázquez Ramonich<br />
            Imagen cedida por el Museo del Jazz de Harlem, NY
          </p>
        </div>
        <div className="md:w-1/2 md:pl-12">
          <h2 className="text-3xl font-bold mb-4">Conoce a tu Profesor</h2>
          <p className="text-lg text-gray-300 mb-4">
            Pocas personas pueden decir que han vivido el jazz desde dentro durante más de 60 años. Enric Vázquez Ramonich es cofundador del mítico Jamboree Jazz Club y del Jubilee Jazz Club, y ha compartido escenario y conversaciones con leyendas como Bill Evans, Chet Baker o Art Blakey.
          </p>
          <p className="text-lg text-gray-300 mb-4">
            Ha presentado programas de radio y televisión, escrito en medios especializados y participado en obras de referencia como la Guía Universal del Jazz Moderno. Además, es el autor de los primeros capítulos de la Historia del Jazz para la Generalitat de Catalunya.
          </p>
          <p className="text-lg text-gray-300">
            Ahora, toda esa experiencia y pasión se condensan en "Cultura del Jazz", un curso pensado para que, aunque nunca hayas tocado un instrumento, puedas entender, sentir y disfrutar el jazz como si siempre hubieras formado parte de él.
          </p>
        </div>
      </div>
    </section>
  );
}
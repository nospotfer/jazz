import React from 'react';

export function WhatYouWillLearn() {
  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl sm:text-5xl font-bold text-yellow-700 text-center mb-12">
          Qué Aprenderás
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-lg sm:text-xl text-gray-700 mb-6">
              Este curso está diseñado para que no solo escuches jazz, sino que lo vivas y lo sientas. Descubrirás su verdadera esencia, su historia y los elementos que lo hacen único y emocionante.
            </p>
            <p className="text-lg sm:text-xl text-gray-700 mb-6">
              Serás capaz de ir a un club de jazz y disfrutarlo más porque comprenderás lo que está ocurriendo en el escenario, te sentirás parte de su cultura y reconocerás los matices que lo hacen especial.
            </p>
            <p className="text-lg sm:text-xl text-gray-700">
              Además, aprenderás a disfrutar a los grandes clásicos con una nueva mirada, entendiendo mejor sus estilos, su lenguaje musical y el porqué de su importancia en la historia del jazz.
            </p>
          </div>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-yellow-700 mb-2">
                El jazz como cultura independiente
              </h3>
              <p className="text-gray-700">
                Aprenderás que el jazz no es solo una fusión de influencias africanas y europeas, sino una cultura musical propia que ha marcado profundamente toda la música popular moderna posterior.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-yellow-700 mb-2">
                La improvisación como creación original
              </h3>
              <p className="text-gray-700">
                Conocerás cómo la improvisación convierte al músico de jazz en autor de cada interpretación, entendiendo de forma sencilla sus mecanismos en distintas épocas y estilos, igual que un compositor en música clásica.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-yellow-700 mb-2">
                El “Sound” personal del músico
              </h3>
              <p className="text-gray-700">
                Descubrirás cómo identificar a un músico por su sonido único: timbre, color y personalidad artística. Entenderás por qué esta “silueta sonora” es su verdadera firma en el mundo del jazz.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-yellow-700 mb-2">
                Libertad creativa y composición colaborativa
              </h3>
              <p className="text-gray-700">
                Comprenderás cómo el jazz integra “ruido” y heterogeneidad sonora, adopta elementos de otras músicas y combina composición e improvisación sin perder la individualidad del músico ni el sonido propio de una orquesta.
              </p>
            </div>
          </div>
        </div>
        <div className="text-center mt-12">
          <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg transition-colors text-lg">
            Empieza Ahora
          </button>
        </div>
      </div>
    </section>
  );
}
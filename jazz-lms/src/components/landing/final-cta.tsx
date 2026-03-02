'use client';

import { useRouter } from 'next/navigation';

export function FinalCTA() {
  const router = useRouter();

  return (
    <>
      <section className="w-full bg-gray-50 dark:bg-background py-16 sm:py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-gray-900 dark:text-white text-4xl sm:text-5xl font-bold mb-4">
            ¡No esperes más!
          </h2>
          <p className="text-yellow-600 text-xl mb-8">
            Empieza hoy tu viaje por el jazz.
          </p>

          <button
            onClick={() => router.push('/auth?tab=register')}
            className="bg-yellow-600 hover:bg-yellow-900 text-white font-bold py-4 px-12 rounded-lg transition-colors text-xl mb-8"
          >
            Regístrate
          </button>

          <div className="bg-gray-100 rounded-lg p-8 mt-12">
            <h3 className="text-gray-800 text-2xl font-bold mb-6">
              ¿Qué podré hacer después de completarlo?
            </h3>
            <ul className="text-left space-y-4 text-gray-700">
              <li className="flex items-start">
                <span className="text-yellow-600 mr-4 font-bold">✓</span>
                <span>Ir a un club de jazz y disfrutar la experiencia con una nueva perspectiva.</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-4 font-bold">✓</span>
                <span>Escuchar los grandes clásicos y entender por qué son fundamentales.</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-4 font-bold">✓</span>
                <span>Reconocer estilos, épocas y músicos por su "sonido".</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-600 mr-4 font-bold">✓</span>
                <span>Sentirte parte de la cultura del jazz, comprendiendo su lenguaje y libertad creativa.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

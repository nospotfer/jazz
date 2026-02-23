'use client';

export function PostCourseContent() {
  const benefits = [
    'Ir a un club de jazz y disfrutar la experiencia con una nueva mirada.',
    'Escuchar a los grandes clásicos y entender por qué son fundamentales.',
    'Reconocer estilos, épocas y músicos por su "sound".',
    'Sentirte parte de la cultura del jazz, comprendiendo su lenguaje y su libertad creativa.',
  ];

  return (
    <section className="w-full bg-gray-800 py-12 sm:py-16 lg:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-yellow-500 text-4xl font-bold text-center mb-4">
          ¿Qué podré hacer después de completarlo?
        </h2>
        <p className="text-gray-300 text-center mb-8">
          Tras terminar el curso serás capaz de:
        </p>

        <ul className="space-y-4 mb-12">
          {benefits.map((benefit, index) => (
            <li
              key={index}
              className="flex items-start text-gray-300 text-lg"
            >
              <span className="text-yellow-500 mr-4 font-bold">•</span>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <div className="text-center">
          <button className="bg-black hover:bg-gray-900 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg">
            ¡Apúntate ahora y da el primer paso!
          </button>
        </div>
      </div>
    </section>
  );
}

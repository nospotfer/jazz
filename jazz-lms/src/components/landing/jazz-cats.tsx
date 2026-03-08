'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers/language-provider';

export function JazzCats() {
  const router = useRouter();
  const { language } = useLanguage();
  const copy = {
    es: {
      title: 'Los "Jazz Cats"',
      body: 'El término "jazz cat" es una expresión informal del argot del jazz para referirse a un músico de jazz o, en un sentido más amplio, a una persona entusiasta y conocedora del género. La palabra "cat" era jerga de la época para referirse a un hombre, a menudo con un toque de "estilo" o "sabiduría callejera".',
      cta: 'Regístrate',
    },
    en: {
      title: 'The "Jazz Cats"',
      body: 'The term "jazz cat" is an informal jazz slang expression for a jazz musician or, more broadly, a person deeply enthusiastic and knowledgeable about the genre. The word "cat" was period slang used to describe a man, often with a sense of style or street wisdom.',
      cta: 'Sign up',
    },
    fr: {
      title: 'Les "Jazz Cats"',
      body: 'Le terme "jazz cat" est une expression familière de l’argot du jazz pour désigner un musicien de jazz ou, plus largement, une personne passionnée et connaisseuse du genre. Le mot "cat" était un terme d’époque pour parler d’un homme, souvent avec une idée de style ou de sagesse de rue.',
      cta: 'S’inscrire',
    },
    pt: {
      title: 'Os "Jazz Cats"',
      body: 'O termo "jazz cat" é uma expressão informal da gíria do jazz para se referir a um músico de jazz ou, de forma mais ampla, a uma pessoa entusiasmada e conhecedora do gênero. A palavra "cat" era uma gíria da época para se referir a um homem, geralmente com um toque de estilo ou malandragem.',
      cta: 'Cadastrar',
    },
  }[language];

  return (
    <>
      <div className="min-h-screen w-full bg-gray-50 dark:bg-background flex items-center">
        <div className="w-full max-w-4xl mx-auto px-6 sm:px-12 lg:px-16 py-12">
          <h2 className="text-gray-900 dark:text-white text-4xl font-bold text-center mb-8">
            {copy.title}
          </h2>

          <p className="text-gray-600 dark:text-gray-300 text-center mb-8 leading-relaxed text-base sm:text-lg">
            {copy.body}
          </p>

          <div className="relative w-full h-96 mb-8 flex items-center justify-center">
            <Image
              src="/images/jazzcats.jpg"
              alt=" Made by pattesdeveloursandco.blogspot.com "
              fill
              className="object-contain"
              quality={90}
            />
          </div>

          <button
            onClick={() => router.push('/auth?tab=register')}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg transition-colors text-lg"
          >
            {copy.cta}
          </button>
        </div>
      </div>
    </>
  );
}

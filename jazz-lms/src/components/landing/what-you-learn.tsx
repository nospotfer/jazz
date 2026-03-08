"use client";

import Image from 'next/image';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/components/providers/language-provider';

export function WhatYouLearn() {
  const router = useRouter();
  const { language } = useLanguage();
  const copy = {
    es: {
      title: 'Lo que aprenderás',
      intro:
        'Este curso está diseñado para que no solo escuches jazz, sino que lo vivas y lo sientas. Descubrirás su verdadera esencia, su historia y los elementos que lo hacen único y emocional.',
      points: [
        {
          title: 'El jazz como cultura independiente',
          desc: 'Comprende que el jazz es una cultura musical propia que ha influido profundamente en toda la música popular moderna.',
        },
        {
          title: 'Improvisación como creación original',
          desc: 'Aprende cómo la improvisación se convierte en la autoría del músico de jazz en cada interpretación.',
        },
        {
          title: 'El "sonido" personal del músico',
          desc: 'Descubre cómo identificar a un músico por su sonido único, timbre, color y personalidad artística.',
        },
        {
          title: 'Libertad creativa y composición colaborativa',
          desc: 'Entiende cómo el jazz integra sonoridades diversas y combina composición con improvisación.',
        },
      ],
      cta: 'Regístrate',
      imageAlt: 'Vista previa del curso de jazz',
    },
    en: {
      title: 'What you will learn',
      intro:
        'This course is designed so you do not just listen to jazz, but truly live and feel it. You will discover its real essence, history, and the elements that make it unique and emotional.',
      points: [
        {
          title: 'Jazz as an independent culture',
          desc: 'Understand that jazz is its own musical culture and has deeply influenced modern popular music.',
        },
        {
          title: 'Improvisation as original creation',
          desc: 'Learn how improvisation becomes musical authorship in every jazz performance.',
        },
        {
          title: 'The musician’s personal “sound”',
          desc: 'Discover how to identify musicians by their unique sound, timbre, color, and artistic personality.',
        },
        {
          title: 'Creative freedom and collaborative composition',
          desc: 'See how jazz blends diverse sonorities and combines composition with improvisation.',
        },
      ],
      cta: 'Sign up',
      imageAlt: 'Preview of the jazz course',
    },
    fr: {
      title: 'Ce que vous apprendrez',
      intro:
        'Ce cours est conçu pour que vous ne vous contentiez pas d’écouter le jazz, mais que vous le viviez et le ressentiez. Vous découvrirez son essence, son histoire et les éléments qui le rendent unique et émouvant.',
      points: [
        {
          title: 'Le jazz comme culture indépendante',
          desc: 'Comprenez que le jazz est une culture musicale à part entière qui a profondément influencé la musique populaire moderne.',
        },
        {
          title: 'L’improvisation comme création originale',
          desc: 'Apprenez comment l’improvisation devient une forme d’auteur dans chaque interprétation jazz.',
        },
        {
          title: 'Le “son” personnel du musicien',
          desc: 'Découvrez comment reconnaître un musicien à son son unique, son timbre, sa couleur et sa personnalité artistique.',
        },
        {
          title: 'Liberté créative et composition collaborative',
          desc: 'Comprenez comment le jazz intègre des sonorités diverses et combine composition et improvisation.',
        },
      ],
      cta: 'S’inscrire',
      imageAlt: 'Aperçu du cours de jazz',
    },
    pt: {
      title: 'O que você vai aprender',
      intro:
        'Este curso foi desenhado para que você não apenas escute jazz, mas viva e sinta o gênero. Você vai descobrir sua essência real, sua história e os elementos que o tornam único e emocionante.',
      points: [
        {
          title: 'O jazz como cultura independente',
          desc: 'Entenda que o jazz é uma cultura musical própria e influenciou profundamente toda a música popular moderna.',
        },
        {
          title: 'Improvisação como criação original',
          desc: 'Aprenda como a improvisação se torna autoria musical em cada interpretação de jazz.',
        },
        {
          title: 'O “som” pessoal do músico',
          desc: 'Descubra como identificar um músico por seu som único, timbre, cor e personalidade artística.',
        },
        {
          title: 'Liberdade criativa e composição colaborativa',
          desc: 'Entenda como o jazz integra sonoridades diversas e combina composição com improvisação.',
        },
      ],
      cta: 'Cadastrar',
      imageAlt: 'Prévia do curso de jazz',
    },
  }[language];

  return (
    <>
      <div className="min-h-screen w-full bg-gray-50 dark:bg-background flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center min-h-[80vh]">
            {/* Left side - Text content */}
            <div className="flex flex-col justify-center">
              <h2 className="text-4xl lg:text-5xl font-bold mb-8 text-amber-600">
                {copy.title}
              </h2>

              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                {copy.intro}
              </p>

              <div className="space-y-6 mb-8">
                {copy.points.map((point) => (
                  <div key={point.title} className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-amber-600 mt-2.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold text-amber-600 mb-1">{point.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                        {point.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => router.push('/auth?tab=register')}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 hover:shadow-lg w-fit"
              >
                {copy.cta}
              </button>
            </div>

            {/* Right side - Visual */}
            <div className="relative w-full aspect-[16/10] lg:aspect-auto lg:h-[70vh] rounded-xl overflow-hidden shadow-2xl bg-black">
              <Image
                src="/images/clase1.jpg"
                alt={copy.imageAlt}
                fill
                priority={false}
                className="absolute inset-0 w-full h-full object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

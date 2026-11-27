"use client";

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
    },
    pt: {
      title: 'O que você aprenderá',
      intro:
        'Este curso foi criado para que você não apenas ouça jazz, mas o viva e sinta. Descubra sua essência, sua história e os elementos que o tornam único e emocionante.',
      points: [
        {
          title: 'O jazz como cultura independente',
          desc: 'Entenda como o jazz desenvolveu uma cultura musical própria e influenciou profundamente a música popular moderna.',
        },
        {
          title: 'Improvisação como criação original',
          desc: 'Descubra como a improvisação se transforma em autoria musical em cada interpretação de jazz.',
        },
        {
          title: 'O “som” pessoal do músico',
          desc: 'Aprenda a reconhecer um músico por seu som, timbre, cor e personalidade artística.',
        },
        {
          title: 'Liberdade criativa e composição colaborativa',
          desc: 'Entenda como o jazz reúne diferentes sonoridades e combina composição com improvisação.',
        },
      ],
      cta: 'Cadastre-se',
    },
  }[language];

  return (
    <>
      <div className="w-full bg-gray-50 dark:bg-background">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12 lg:py-16">
          <div>
            <div className="flex flex-col justify-center">
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold mb-6 title-accent">
                {copy.title}
              </h2>

              <p className="max-w-3xl text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                {copy.intro}
              </p>

              <div className="grid gap-4 sm:grid-cols-2 mb-8">
                {copy.points.map((point) => (
                  <div key={point.title} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-jazz-title-accent)] mt-2.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-bold title-accent mb-1">{point.title}</h3>
                      <p className="text-muted-foreground text-base leading-relaxed">
                        {point.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => router.push('/auth?tab=register')}
                className="cta-highlight py-3 px-8 rounded-lg transition-all duration-300 hover:shadow-lg w-fit"
              >
                {copy.cta}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

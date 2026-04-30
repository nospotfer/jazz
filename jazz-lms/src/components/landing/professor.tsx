"use client";

import { useLanguage } from "@/components/providers/language-provider";
import Image from "next/image";

export function Professor() {
  const { language } = useLanguage();
  const copy = {
    es: {
      credit: "Imagen proporcionada por el Harlem Jazz Museum, NY",
      title: "Conoce a tu profesor",
      p1: "Pocas personas pueden decir que han vivido el jazz desde dentro durante más de 60 años. Enric Vázquez Ramonich es cofundador del mítico Jamboree Jazz Club y del Jubilee Jazz Club, y ha compartido escenario y conversaciones con leyendas como Bill Evans, Chet Baker o Art Blakey.",
      p2: "Ha presentado programas de radio y televisión, escrito en medios especializados y participado en obras de referencia como la Guía Universal del Jazz Moderno. También es autor de los primeros capítulos de la Historia del Jazz para la Generalitat de Catalunya.",
      p3: 'Ahora, toda esa experiencia y pasión se condensan en "Cultura del Jazz", un curso diseñado para que, incluso si nunca has tocado un instrumento, puedas entender, sentir y disfrutar el jazz como si siempre hubieras formado parte de él.',
      badge: "Más de 60 años de experiencia en jazz",
    },
    en: {
      credit: "Image provided by Harlem Jazz Museum, NY",
      title: "Meet your professor",
      p1: "Very few people can say they have lived jazz from the inside for over 60 years. Enric Vázquez Ramonich is co-founder of the legendary Jamboree Jazz Club and Jubilee Jazz Club, and has shared stages and conversations with legends such as Bill Evans, Chet Baker, and Art Blakey.",
      p2: "He has hosted radio and TV programs, written for specialized media, and contributed to reference works such as the Universal Guide to Modern Jazz. He is also the author of the first chapters of the History of Jazz for the Government of Catalonia.",
      p3: 'Now, all that experience and passion comes together in "Jazz Culture", a course designed so that even if you have never played an instrument, you can understand, feel, and enjoy jazz as if you had always been part of it.',
      badge: "Over 60 years of jazz experience",
    },
    fr: {
      credit: "Image fournie par le Harlem Jazz Museum, NY",
      title: "Découvrez votre professeur",
      p1: "Peu de personnes peuvent dire qu’elles ont vécu le jazz de l’intérieur pendant plus de 60 ans. Enric Vázquez Ramonich est cofondateur du mythique Jamboree Jazz Club et du Jubilee Jazz Club, et il a partagé la scène et des échanges avec des légendes comme Bill Evans, Chet Baker ou Art Blakey.",
      p2: "Il a animé des émissions de radio et de télévision, écrit dans des médias spécialisés et participé à des ouvrages de référence comme le Guide universel du jazz moderne. Il est aussi auteur des premiers chapitres de l’Histoire du Jazz pour la Generalitat de Catalogne.",
      p3: 'Aujourd’hui, toute cette expérience et cette passion se concentrent dans "Culture du Jazz", un cours conçu pour que, même sans jamais avoir joué d’instrument, vous puissiez comprendre, ressentir et apprécier le jazz comme si vous en faisiez partie depuis toujours.',
      badge: "Plus de 60 ans d’expérience dans le jazz",
    },
    pt: {
      credit: "Imagem cedida pelo Harlem Jazz Museum, NY",
      title: "Conheça seu professor",
      p1: "Poucas pessoas podem dizer que viveram o jazz por dentro durante mais de 60 anos. Enric Vázquez Ramonich é cofundador do lendário Jamboree Jazz Club e do Jubilee Jazz Club, e já dividiu palco e conversas com lendas como Bill Evans, Chet Baker e Art Blakey.",
      p2: "Ele apresentou programas de rádio e televisão, escreveu em veículos especializados e participou de obras de referência como o Guia Universal do Jazz Moderno. Também é autor dos primeiros capítulos da História do Jazz para a Generalitat da Catalunha.",
      p3: 'Ahora, toda esa experiencia y pasión se concentran en "Cultura del Jazz", un curso diseñado para que, incluso si nunca has tocado un instrumento, puedas entender, sentir y disfrutar el jazz como si siempre hubieras formado parte de él.',
      badge: "Mais de 60 anos de experiência em jazz",
    },
  }[language];

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
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <p className="text-white text-sm font-medium">
                Enric Vázquez Ramonich
              </p>
              <p className="text-gray-300 text-xs">{copy.credit}</p>
            </div>
          </div>

          {/* Right side - Text */}
          <div className="bg-gray-900 dark:bg-gray-900 rounded-r-2xl p-8 lg:p-12 flex flex-col justify-center shadow-2xl">
            <div className="border-b-2 title-accent-border pb-6 mb-8">
              <h2 className="title-accent text-4xl lg:text-5xl font-bold">
                {copy.title}
              </h2>
            </div>

            <div className="space-y-6">
              <p className="text-gray-200 text-base lg:text-lg leading-relaxed">
                {copy.p1}
              </p>
              <p className="text-gray-300 text-base lg:text-lg leading-relaxed">
                {copy.p2}
              </p>
              <p className="text-gray-300 text-base lg:text-lg leading-relaxed">
                {copy.p3}
              </p>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <div className="h-1 w-12 bg-[var(--color-jazz-title-accent)] rounded-full" />
              <span className="title-accent text-sm font-semibold uppercase tracking-widest">
                {copy.badge}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface ClassItem {
  title: string;
  subtitle: string;
  description: string;
  image: string;
}

const classes: ClassItem[] = [
  {
    title: 'Class 1',
    subtitle: 'Introduction to Jazz Culture',
    description:
      'This first class presents a general introduction to Jazz Culture. It covers its historical and social origins, as well as the elements that distinguish it from other musical traditions. Rather than a detailed analysis, the purpose is to offer a panoramic view that allows recognizing the aesthetic and cultural foundations upon which Jazz will develop, preparing the ground to understand its later evolution.',
    image: '/images/clase1.jpg',
  },
  {
    title: 'Class 2',
    subtitle: 'The Language of Jazz 1: Sonic Heterogeneity',
    description:
      'After the introduction to Jazz Culture in Class 1, we address sonic heterogeneity here. In the personalization of sound, an aesthetic principle of beauty can emerge through diverse sonorities, which breaks with the criteria of purity common in classical and popular music. This phenomenon manifests itself in the treatment of the instrument, its modification through mutes or through the voice.',
    image: '/images/clase2.jpg',
  },
  {
    title: 'Class 3',
    subtitle: 'The Language of Jazz 2: The Antecedents',
    description:
      'We consider the antecedents of African influence that emerged after the American Civil War. We focus on Spiritual Song or Gospel and the Blues, with direct examples of their impact on Jazz. The objective is not to conduct an exhaustive study of both genres, but to highlight the features and figures that remain in the jazz unconscious and that reappear throughout its history.',
    image: '/images/clase3.jpg',
  },
  {
    title: 'Class 4',
    subtitle: 'The Language of Jazz 3: Improvisation',
    description:
      'Since improvisation is a central issue in language, we review the thematic forms whose characteristics relate to and partly predetermine improvisation, whether in the paraphrase, formulaic, motivic or modal variants. In the jazz repertoire, the two most widespread forms are the ballad and the blues. Their variants and their influence on different types of improvisation are analyzed.',
    image: '/images/clase4.jpg',
  },
  {
    title: 'Class 5',
    subtitle: 'A Decisive Antecedent: Ragtime',
    description:
      'After addressing its probable origin, its development on piano and in the orchestra, as well as its treatment by classical music composers, the study focuses on the transgression of pianist Jelly Roll Morton. The influence of marching bands, their consolidation and evolution in the birth of New Orleans Jazz is examined.',
    image: '/images/clase5.jpg',
  },
  {
    title: 'Class 6',
    subtitle: 'The Language of Jazz 4: Rhythm',
    description:
      'The rhythm in early jazz and the roles of the rhythm section instruments are analyzed. With the abandonment of ragtime influence, the four beats sound more uniformly. The importance of the break and its use by different drummers is emphasized, highlighting how Jo Jones moved the beat marking to the hi-hat and then to the ride. This evolution leads to bop, where the four beats are marked on the ride and accents are distributed freely between snare and kick.',
    image: '/images/clase6.jpg',
  },
  {
    title: 'Class 7',
    subtitle: 'Jamming & Blowing',
    description:
      'After a brief reference to the concept\'s origin in Chicago, the class focuses on its consolidation in Kansas City and New York. The importance of this process for defining Jazz Culture is analyzed, with examples. The legendary jams between Lester Young and Coleman Hawkins in Kansas are reviewed in 1934, as well as the famous NBC recording in New York in 1956, with Billie Holiday surrounded by the most prominent musicians of the time. These episodes are studied in detail to understand the relevance of jamming and blowing.',
    image: '/images/clase7.jpg',
  },
  {
    title: 'Class 8',
    subtitle: 'Composition and Arrangement in Jazz',
    description:
      'The great jazz composers have never created in abstract, but always thinking of someone concrete. The case of Duke Ellington is examined, who wrote harmony based on the timbre of his soloists, and in some works left no space for improvisation. Also notable within his orchestra is Billy Strayhorn, who delineated the melodic taste of famous alto saxophonist Johnny Hodges, allowing him to complete the composition in performance. The head arrangements of Count Basie\'s orchestra, the role of soloists and riffs are also analyzed. The class concludes with the singular case of Thelonious Monk.',
    image: '/images/clase8.jpg',
  },
  {
    title: 'Class 9',
    subtitle: 'From Marching Bands to the First Jazz Groups',
    description:
      'The initial formations are presented, from the marching bands of New Orleans to the first groups of Louis Armstrong. We analyze how these groups shaped the sound of early jazz, introducing the dialogue between sections and the emerging role of soloists.',
    image: '/images/clase9.jpg',
  },
  {
    title: 'Class 10',
    subtitle: 'Swing and Classic Combos',
    description:
      'The class focuses on the great orchestras of the swing era, with figures such as Benny Goodman and the Hot Club of France Quintet. The importance of instrumental sections, the function of arrangements, and the influence of these formations on the internationalization of jazz are studied.',
    image: '/images/clase10.jpg',
  },
  {
    title: 'Class 11',
    subtitle: 'Modern Combos and Rhythm Section Instruments',
    description:
      'We address the evolution towards bop combos, hard bop and modal jazz, analyzing their flexibility and role in musical innovation. The class concludes with a detailed review of the rhythm section instruments and their respective functions within different groups.',
    image: '/images/clase11.jpg',
  },
  {
    title: 'Class 12',
    subtitle: 'Improvisation',
    description:
      'The class begins with the study of improvisation, addressing its form and the reasons for thematic choice as a conditioning factor. Next, the main procedures are analyzed: paraphrase, formulaic, motivic and modal improvisation, along with particular cases of great soloists who don\'t quite fit into these categories. Finally, free improvisation is addressed, examining melodic, harmonic and rhythmic resources in the works of Ornette Coleman, Cecil Taylor, John Coltrane and John Zorn.',
    image: '/images/clase12.jpg',
  },
  {
    title: 'Class 13',
    subtitle: 'Jazz and Entertainment',
    description:
      'Although today jazz is considered a unique musical culture with defined values and distinct from popular entertainment, in the 1920s its context was much more diverse. Musicians like Louis Armstrong and Fats Waller worked in a variety of venues: from dance clubs to circuses, minstrel shows and even in the streets. Over time, jazz established itself as an independent musical culture, as evidenced by Armstrong\'s Hot Five and Seven, the 52nd Street scene and Minton\'s Playhouse.',
    image: '/images/clase13.jpg',
  },
  {
    title: 'Class 14',
    subtitle: 'Singing Jazz 1',
    description:
      'Jazz, with its origins in vocal music, has in the vaudeville blues sung by women one of its main predecessors. Louis Armstrong is considered a key figure who influenced future vocalists, and white lyricism and crooning are added as important contributions. The classical period closes with figures such as Bing Crosby, Frank Sinatra and the female singers of Duke Ellington\'s orchestra, who established the voice as just another instrument.',
    image: '/images/clase14.jpg',
  },
  {
    title: 'Class 15',
    subtitle: 'Singing Jazz 2',
    description:
      'The lesson explores the divas of swing, with a focus on Billie Holiday and Ella Fitzgerald, analyzing their style and interaction with other instruments. June Christy serves as an example of the cool movement, characterized by a "passion for seeming dispassionate". The course concludes with Sarah Vaughan, considered the foremost exponent of the point at which the voice is established, without a doubt, as just another instrument in jazz.',
    image: '/images/clase15.jpg',
  },
];

export function Classes() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const isExpanded = (index: number) => expandedIndex === index || hoveredIndex === index;
  const isSelected = (index: number) => expandedIndex === index;
  const isHovered = (index: number) => hoveredIndex === index;

  return (
    <section className="bg-white dark:bg-background text-gray-900 dark:text-white py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl sm:text-5xl font-bold text-center mb-12">The Course</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {classes.map((classItem, index) => (
            <div
              key={index}
              className={`bg-amber-500 rounded-xl overflow-hidden shadow-lg transition-all duration-500 ease-out border-2 hover:shadow-2xl hover:-translate-y-2 ${
                isHovered(index)
                  ? 'border-4 border-black dark:border-white'
                  : isSelected(index)
                    ? 'border-black/80 dark:border-white'
                    : 'border-black/30 dark:border-white/40'
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="relative h-64 w-full overflow-hidden border-b-4 border-black">
                <Image
                  src={classItem.image}
                  alt={classItem.subtitle}
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 33vw, 100vw"
                />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {classItem.title}
                </h3>
                <h4 className="text-base font-semibold text-black/90 mb-3">
                  {classItem.subtitle}
                </h4>

                <div className="relative border-t border-black/25 pt-3">
                  {!isExpanded(index) ? (
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-black/90 line-clamp-2 text-sm">{classItem.description}</p>
                      <button
                        onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                        className="flex-shrink-0 mt-1"
                        aria-label="Expand description"
                      >
                        <ChevronDown className="text-gray-900 h-5 w-5 transition-transform duration-500 ease-out" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-black/90 mb-4 text-sm leading-relaxed">{classItem.description}</p>
                      <button
                        onClick={() => setExpandedIndex(null)}
                        className="flex items-center justify-center w-full"
                        aria-label="Collapse description"
                      >
                        <ChevronDown className="text-gray-900 h-5 w-5 rotate-180 transition-transform duration-500 ease-out" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

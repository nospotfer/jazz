'use client';

import Image from 'next/image';
import React, { useState, useRef } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';

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
      'After a brief reference to the concept\'s origin in Chicago, the class focuses on its consolidation in Kansas City and New York. The importance of this process for defining Jazz Culture is analyzed, with examples. The legendary jams between Lester Young and Coleman Hawkins in Kansas are reviewed in 1934, as well as the famous NBC recording in New York in 1956, with Billie Holiday surrounded by the most prominent musicians of the time.',
    image: '/images/clase7.jpg',
  },
  {
    title: 'Class 8',
    subtitle: 'Composition and Arrangement in Jazz',
    description:
      'The great jazz composers have never created in abstract, but always thinking of someone concrete. The case of Duke Ellington is examined, who wrote harmony based on the timbre of his soloists, and in some works left no space for improvisation. Also notable within his orchestra is Billy Strayhorn, who delineated the melodic taste of famous alto saxophonist Johnny Hodges, allowing him to complete the composition in performance.',
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
      'The class begins with the study of improvisation, addressing its form and the reasons for thematic choice as a conditioning factor. Next, the main procedures are analyzed: paraphrase, formulaic, motivic and modal improvisation, along with particular cases of great soloists who don\'t quite fit into these categories. Finally, free improvisation is addressed.',
    image: '/images/clase12.jpg',
  },
  {
    title: 'Class 13',
    subtitle: 'Jazz and Entertainment',
    description:
      'Although today jazz is considered a unique musical culture with defined values and distinct from popular entertainment, in the 1920s its context was much more diverse. Musicians like Louis Armstrong and Fats Waller worked in a variety of venues: from dance clubs to circuses, minstrel shows and even in the streets. Over time, jazz established itself as an independent musical culture.',
    image: '/images/clase13.jpg',
  },
  {
    title: 'Class 14',
    subtitle: 'Singing Jazz 1',
    description:
      'Jazz, with its origins in vocal music, has in the vaudeville blues sung by women one of its main predecessors. Louis Armstrong is considered a key figure who influenced future vocalists, and white lyricism and crooning are added as important contributions. The classical period closes with figures such as Bing Crosby, Frank Sinatra and the female singers of Duke Ellington\'s orchestra.',
    image: '/images/clase14.jpg',
  },
  {
    title: 'Class 15',
    subtitle: 'Singing Jazz 2',
    description:
      'The lesson explores the divas of swing, with a focus on Billie Holiday and Ella Fitzgerald, analyzing their style and interaction with other instruments. June Christy serves as an example of the cool movement, characterized by a "passion for seeming dispassionate". The course concludes with Sarah Vaughan, considered the foremost exponent of the voice as just another instrument in jazz.',
    image: '/images/clase15.jpg',
  },
];

function ExpandedCard({
  classItem,
  onClose,
}: {
  classItem: ClassItem;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          {/* Left - Description */}
          <div className="p-8 lg:p-10 flex flex-col justify-center overflow-y-auto max-h-[85vh]">
            <div className="mb-4">
              <span className="text-yellow-600 text-sm font-bold uppercase tracking-widest">
                {classItem.title}
              </span>
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-6">
              {classItem.subtitle}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
              {classItem.description}
            </p>
          </div>

          {/* Right - Preview Video */}
          <div className="relative bg-black min-h-[300px] lg:min-h-0">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src="/images/videojazz.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-xs uppercase tracking-widest opacity-70">Class Preview</p>
              <p className="text-sm font-semibold">{classItem.subtitle}</p>
            </div>
            <button
              onClick={toggleMute}
              className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Classes() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <>
      <div className="min-h-screen w-full bg-white dark:bg-background flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            The Course
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-12 text-sm">
            Click on any class to see the full description and a preview
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {classes.map((classItem, index) => (
              <button
                key={index}
                className={`group relative bg-amber-500 rounded-xl overflow-hidden shadow-md transition-all duration-300 ease-out text-left ${
                  hoveredIndex === index
                    ? 'shadow-2xl scale-105 ring-2 ring-yellow-400 z-10'
                    : 'hover:shadow-lg'
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setExpandedIndex(index)}
              >
                {/* Small image thumbnail */}
                <div className="relative h-24 sm:h-28 w-full overflow-hidden">
                  <Image
                    src={classItem.image}
                    alt={classItem.subtitle}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>

                {/* Title only */}
                <div className="p-3">
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">
                    {classItem.title}
                  </h3>
                  <p className="text-xs text-black/70 mt-0.5 line-clamp-2 leading-snug">
                    {classItem.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded card modal */}
      {expandedIndex !== null && (
        <ExpandedCard
          classItem={classes[expandedIndex]}
          onClose={() => setExpandedIndex(null)}
        />
      )}
    </>
  );
}

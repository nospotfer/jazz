import { CANONICAL_JAZZ_CLASSES, getCanonicalJazzClass, getLocalizedJazzClassLabel } from '@/lib/course-lessons';
import type { SupportedLanguage } from '@/lib/language';

export type MusicPlatform = 'spotify' | 'apple' | 'amazon' | 'youtube';

export interface MusicPlatformLink {
  label: string;
  href: string;
  platform: MusicPlatform;
}

export interface JazzPlaylistTrack {
  id: string;
  classNumber: number;
  classLabel: string;
  title: string;
  description: string;
  image: string;
  searchTerm: string;
  links: MusicPlatformLink[];
}

const MUSIC_PLATFORM_LABELS: Record<MusicPlatform, string> = {
  spotify: 'Spotify',
  apple: 'Apple Music',
  amazon: 'Amazon Music',
  youtube: 'YouTube',
};

const MUSIC_PLATFORM_TOOLTIP_COPY: Record<SupportedLanguage, Record<MusicPlatform, string>> = {
  es: {
    spotify: 'Abrir en Spotify',
    apple: 'Abrir en Apple Music',
    amazon: 'Abrir en Amazon Music',
    youtube: 'Abrir en YouTube',
  },
  en: {
    spotify: 'Open in Spotify',
    apple: 'Open in Apple Music',
    amazon: 'Open in Amazon Music',
    youtube: 'Open in YouTube',
  },
  fr: {
    spotify: 'Ouvrir dans Spotify',
    apple: 'Ouvrir dans Apple Music',
    amazon: 'Ouvrir dans Amazon Music',
    youtube: 'Ouvrir dans YouTube',
  },
  pt: {
    spotify: 'Abrir no Spotify',
    apple: 'Abrir no Apple Music',
    amazon: 'Abrir no Amazon Music',
    youtube: 'Abrir no YouTube',
  },
};

export function getMusicPlatformTooltip(platform: MusicPlatform, language: SupportedLanguage) {
  return MUSIC_PLATFORM_TOOLTIP_COPY[language][platform];
}

export function buildMusicPlatformLinks(searchTerm: string): MusicPlatformLink[] {
  const encodedSearch = encodeURIComponent(searchTerm);

  return [
    {
      label: MUSIC_PLATFORM_LABELS.spotify,
      href: `https://open.spotify.com/search/${encodedSearch}`,
      platform: 'spotify',
    },
    {
      label: MUSIC_PLATFORM_LABELS.apple,
      href: `https://music.apple.com/search?term=${encodedSearch}`,
      platform: 'apple',
    },
    {
      label: MUSIC_PLATFORM_LABELS.amazon,
      href: `https://music.amazon.com/search/${encodedSearch}`,
      platform: 'amazon',
    },
    {
      label: MUSIC_PLATFORM_LABELS.youtube,
      href: `https://www.youtube.com/results?search_query=${encodedSearch}`,
      platform: 'youtube',
    },
  ];
}

export function getJazzStudyPlaylist(language: SupportedLanguage): JazzPlaylistTrack[] {
  return CANONICAL_JAZZ_CLASSES.map((item) => {
    const title = item.subtitles[language];
    const classLabel = getLocalizedJazzClassLabel(item.classNumber, language);
    const searchTerm = `${title} jazz ${classLabel}`;

    return {
      id: `jazz-class-${item.classNumber}`,
      classNumber: item.classNumber,
      classLabel,
      title,
      description: item.descriptions[language],
      image: item.image,
      searchTerm,
      links: buildMusicPlatformLinks(searchTerm),
    };
  });
}

export function getJazzPlaylistTrackForLesson(params: {
  classNumber: number | null;
  language: SupportedLanguage;
  fallbackTitle: string;
  courseTitle: string;
}) {
  const canonicalClass = params.classNumber ? getCanonicalJazzClass(params.classNumber) : null;

  if (!canonicalClass || !params.classNumber) {
    const searchTerm = `${params.fallbackTitle} ${params.courseTitle}`;

    return {
      id: 'lesson-fallback-track',
      classNumber: 0,
      classLabel: params.courseTitle,
      title: params.fallbackTitle,
      description: params.courseTitle,
      image: '/images/clase1.jpg',
      searchTerm,
      links: buildMusicPlatformLinks(searchTerm),
    };
  }

  const classLabel = getLocalizedJazzClassLabel(params.classNumber, params.language);
  const title = canonicalClass.subtitles[params.language];
  const searchTerm = `${title} ${params.courseTitle}`;

  return {
    id: `jazz-class-${params.classNumber}`,
    classNumber: params.classNumber,
    classLabel,
    title,
    description: canonicalClass.descriptions[params.language],
    image: canonicalClass.image,
    searchTerm,
    links: buildMusicPlatformLinks(searchTerm),
  };
}
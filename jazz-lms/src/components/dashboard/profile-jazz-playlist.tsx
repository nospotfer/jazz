'use client';

import Image from 'next/image';
import { Disc3, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { MusicPlatformLinks } from '@/components/music/music-platform-links';
import { Button } from '@/components/ui/button';
import { getJazzStudyPlaylist } from '@/lib/jazz-playlist';
import type { SupportedLanguage } from '@/lib/language';

interface ProfileJazzPlaylistProps {
  language: SupportedLanguage;
  earnedClassNumbers?: number[];
}

const copyMap = {
  es: {
    eyebrow: 'Sesion de escucha',
    title: 'Playlist jazz para estudiar y seguir el curso',
    subtitle: 'La misma seleccion de referencias vive en tus clases y ahora tambien en tu perfil.',
    nowPlaying: 'En foco',
    playlist: 'Playlist completa',
    play: 'Reproducir rotacion',
    pause: 'Pausar rotacion',
    previous: 'Anterior',
    next: 'Siguiente',
    studyMode: 'Modo estudio activo',
    studyModeOff: 'Modo estudio en pausa',
    earned: 'Medalla ganada',
    trackCount: '15 pistas alineadas con las 15 lecciones del curso.',
  },
  en: {
    eyebrow: 'Listening session',
    title: 'Jazz playlist for study and course flow',
    subtitle: 'The same reference selection lives in your lessons and now also on your profile.',
    nowPlaying: 'In focus',
    playlist: 'Full playlist',
    play: 'Start rotation',
    pause: 'Pause rotation',
    previous: 'Previous',
    next: 'Next',
    studyMode: 'Study mode active',
    studyModeOff: 'Study mode paused',
    earned: 'Medal earned',
    trackCount: '15 tracks aligned with the 15 lessons in the course.',
  },
  fr: {
    eyebrow: 'Session d ecoute',
    title: 'Playlist jazz pour etudier et suivre le cours',
    subtitle: 'La meme selection de references vit dans vos lecons et maintenant aussi dans votre profil.',
    nowPlaying: 'En focus',
    playlist: 'Playlist complete',
    play: 'Lancer la rotation',
    pause: 'Mettre la rotation en pause',
    previous: 'Precedent',
    next: 'Suivant',
    studyMode: 'Mode etude actif',
    studyModeOff: 'Mode etude en pause',
    earned: 'Medaille gagnee',
    trackCount: '15 pistes alignees avec les 15 lecons du cours.',
  },
  pt: {
    eyebrow: 'Sessao de escuta',
    title: 'Playlist jazz para estudar e seguir o curso',
    subtitle: 'A mesma selecao de referencias vive nas aulas e agora tambem no seu perfil.',
    nowPlaying: 'Em foco',
    playlist: 'Playlist completa',
    play: 'Iniciar rotacao',
    pause: 'Pausar rotacao',
    previous: 'Anterior',
    next: 'Proxima',
    studyMode: 'Modo estudo ativo',
    studyModeOff: 'Modo estudo em pausa',
    earned: 'Medalha ganha',
    trackCount: '15 faixas alinhadas com as 15 aulas do curso.',
  },
} as const;

export function ProfileJazzPlaylist({ language, earnedClassNumbers = [] }: ProfileJazzPlaylistProps) {
  const copy = copyMap[language];
  const playlist = useMemo(() => getJazzStudyPlaylist(language), [language]);
  const earnedSet = useMemo(() => new Set(earnedClassNumbers), [earnedClassNumbers]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(playlist.length - 1, 0)));
  }, [playlist.length]);

  useEffect(() => {
    if (!isPlaying || playlist.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % playlist.length);
    }, 8000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlaying, playlist.length]);

  const activeTrack = playlist[activeIndex] ?? playlist[0];

  if (!activeTrack) {
    return null;
  }

  const selectPrevious = () => {
    setActiveIndex((current) => (current - 1 + playlist.length) % playlist.length);
  };

  const selectNext = () => {
    setActiveIndex((current) => (current + 1) % playlist.length);
  };

  return (
    <section className="overflow-hidden rounded-[28px] border border-primary/15 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.2),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.16),_transparent_28%),linear-gradient(145deg,rgba(15,23,42,0.98),rgba(24,24,27,0.94),rgba(17,24,39,0.98))] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.32)]" data-testid="profile-jazz-playlist">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/80">{copy.eyebrow}</p>
            <h2 className="max-w-2xl text-2xl font-serif font-bold text-white">{copy.title}</h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-300">{copy.subtitle}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
            <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-black/20">
              <Image
                src={activeTrack.image}
                alt={activeTrack.title}
                width={360}
                height={360}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85">
                  <Disc3 className={`h-3.5 w-3.5 ${isPlaying ? 'animate-spin' : ''}`} />
                  {isPlaying ? copy.studyMode : copy.studyModeOff}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/80">{copy.nowPlaying}</p>
                <div>
                  <p className="text-sm font-medium text-primary/85">{activeTrack.classLabel}</p>
                  <h3 className="text-2xl font-semibold text-white">{activeTrack.title}</h3>
                </div>
                <p className="text-sm leading-6 text-slate-300">{activeTrack.description}</p>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2">
                  <Button type="button" size="icon-sm" variant="outline" onClick={selectPrevious} className="border-white/15 bg-white/5 text-white hover:bg-white/10" aria-label={copy.previous}>
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" onClick={() => setIsPlaying((current) => !current)} className="rounded-full bg-primary text-black hover:bg-primary/90" aria-label={isPlaying ? copy.pause : copy.play}>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button type="button" size="icon-sm" variant="outline" onClick={selectNext} className="border-white/15 bg-white/5 text-white hover:bg-white/10" aria-label={copy.next}>
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <MusicPlatformLinks links={activeTrack.links} language={language} buttonClassName="border-white/15 bg-white/5 hover:bg-white/10" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200/80">{copy.playlist}</p>
              <p className="text-sm text-slate-300">{copy.trackCount}</p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
              {activeIndex + 1}/{playlist.length}
            </div>
          </div>

          <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
            {playlist.map((track, index) => {
              const isActive = index === activeIndex;
              const isEarned = earnedSet.has(track.classNumber);

              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-colors ${isActive ? 'border-primary/40 bg-primary/12' : 'border-white/8 bg-white/5 hover:bg-white/10'}`}
                  data-testid={`profile-playlist-track-${track.classNumber}`}
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                    <Image src={track.image} alt={track.title} fill className="object-cover" sizes="56px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">{track.classLabel}</span>
                      {isEarned ? (
                        <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100">
                          {copy.earned}
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-sm font-semibold text-white">{track.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-300">{track.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
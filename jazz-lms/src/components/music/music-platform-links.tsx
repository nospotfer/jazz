'use client';

import { Fragment } from 'react';
import { Youtube } from 'lucide-react';

import type { MusicPlatform, MusicPlatformLink } from '@/lib/jazz-playlist';
import type { SupportedLanguage } from '@/lib/language';
import { getMusicPlatformTooltip } from '@/lib/jazz-playlist';

function MusicPlatformIcon({ platform }: { platform: MusicPlatform }) {
  if (platform === 'spotify') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
        <path d="M12 1.5a10.5 10.5 0 1 0 10.5 10.5A10.51 10.51 0 0 0 12 1.5Zm4.82 15.16a.78.78 0 0 1-1.08.26 9.63 9.63 0 0 0-9.72-.54.78.78 0 1 1-.66-1.41 11.2 11.2 0 0 1 11.3.63.78.78 0 0 1 .16 1.06Zm1.54-2.42a.97.97 0 0 1-1.34.32 11.8 11.8 0 0 0-11.93-.67.97.97 0 1 1-.83-1.75 13.75 13.75 0 0 1 13.9.79.97.97 0 0 1 .2 1.31Zm.13-2.61A14.1 14.1 0 0 0 4.1 10.8a1.16 1.16 0 1 1-.98-2.11 16.42 16.42 0 0 1 16.76 1.02 1.16 1.16 0 0 1-1.39 1.92Z" />
      </svg>
    );
  }

  if (platform === 'apple') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
        <path d="M16.6 12.6c0-2 1.6-3 1.7-3.1-1-.6-2.5-.7-3.5-.1-.9.5-1.6.6-2.2.6-.6 0-1.3-.1-2.1-.6-1.1-.6-2.8-.4-3.8.7-1.6 1.8-1.3 5.2.7 8.1.9 1.3 2 2.7 3.5 2.6.7 0 1.2-.2 2-.2s1.2.2 2 .2c1.5 0 2.4-1.3 3.3-2.6.7-1.1 1-2.1 1-2.2-.1 0-2.6-1-2.6-3.4Zm-2.5-7.4c.7-.8 1.2-1.9 1-3-.9.1-2 .6-2.7 1.4-.7.7-1.3 1.9-1.1 3 .9.1 2-.5 2.8-1.4Z" />
      </svg>
    );
  }

  if (platform === 'amazon') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
        <path d="M5.5 16.6c3.2 2.1 8.2 2.3 11.8.6.5-.2 1 .3.5.7-3.9 2.8-9.8 2.9-13 .9-.4-.3 0-1 .7-.7Zm12.8-.9c-.4-.5-2.6-.2-3.6-.1-.3 0-.4-.2-.1-.5 1.8-1.3 4.8-.9 5.1-.5.3.3-.1 3.2-1.8 4.5-.3.2-.5.1-.4-.2.4-1 .9-3.2.8-3.2ZM9.5 11.7c0-1.8 1.3-2.7 3.2-2.7.6 0 1.1.1 1.6.3v-.4c0-.8-.6-1.2-1.5-1.2-.7 0-1.4.2-2.1.5l-.5-1.5c.9-.4 1.9-.7 3-.7 2.2 0 3.4 1 3.4 3v3.3c0 .6.1 1 .4 1.4v.2h-2.1c-.2-.2-.3-.5-.4-.8-.6.6-1.3 1-2.2 1-1.6 0-2.8-.9-2.8-2.4Zm4.8-.5v-.5c-.4-.2-.8-.2-1.3-.2-1 0-1.6.4-1.6 1.1 0 .6.5 1 1.3 1 .9 0 1.6-.5 1.6-1.4Z" />
      </svg>
    );
  }

  return <Youtube className="h-4 w-4" />;
}

const platformColorClass: Record<MusicPlatform, string> = {
  spotify: 'text-emerald-500',
  apple: 'text-rose-500',
  amazon: 'text-sky-500',
  youtube: 'text-red-500',
};

const tooltipGradientClass: Record<MusicPlatform, string> = {
  spotify: 'from-emerald-500 to-emerald-400',
  apple: 'from-rose-500 to-orange-400',
  amazon: 'from-sky-500 to-indigo-500',
  youtube: 'from-red-500 to-rose-500',
};

interface MusicPlatformLinksProps {
  links: MusicPlatformLink[];
  language: SupportedLanguage;
  buttonClassName?: string;
}

export function MusicPlatformLinks({ links, language, buttonClassName }: MusicPlatformLinksProps) {
  return (
    <Fragment>
      {links.map((platformLink) => {
        const tooltip = getMusicPlatformTooltip(platformLink.platform, language);

        return (
          <a
            key={`${platformLink.platform}-${platformLink.href}`}
            href={platformLink.href}
            target="_blank"
            rel="noopener noreferrer"
            title={tooltip}
            aria-label={tooltip}
            data-testid={`music-platform-${platformLink.platform}`}
            className={`relative group inline-flex shrink-0 items-center justify-center h-8 w-8 rounded-md border border-primary/40 bg-background/95 hover:bg-accent text-sm transition-colors ${buttonClassName ?? ''}`.trim()}
          >
            <span className={platformColorClass[platformLink.platform]}>
              <MusicPlatformIcon platform={platformLink.platform} />
            </span>
            <span className={`pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gradient-to-r px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-md transition-all duration-100 group-hover:opacity-100 group-hover:-translate-y-0.5 ${tooltipGradientClass[platformLink.platform]}`}>
              {tooltip}
            </span>
          </a>
        );
      })}
    </Fragment>
  );
}
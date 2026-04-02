"use client";

import type { MusicPlatform, MusicPlatformLink } from "@/lib/jazz-playlist";
import { getMusicPlatformTooltip } from "@/lib/jazz-playlist";
import type { SupportedLanguage } from "@/lib/language";

function MusicPlatformIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M12 1.5a10.5 10.5 0 1 0 10.5 10.5A10.51 10.51 0 0 0 12 1.5Zm4.82 15.16a.78.78 0 0 1-1.08.26 9.63 9.63 0 0 0-9.72-.54.78.78 0 1 1-.66-1.41 11.2 11.2 0 0 1 11.3.63.78.78 0 0 1 .16 1.06Zm1.54-2.42a.97.97 0 0 1-1.34.32 11.8 11.8 0 0 0-11.93-.67.97.97 0 1 1-.83-1.75 13.75 13.75 0 0 1 13.9.79.97.97 0 0 1 .2 1.31Zm.13-2.61A14.1 14.1 0 0 0 4.1 10.8a1.16 1.16 0 1 1-.98-2.11 16.42 16.42 0 0 1 16.76 1.02 1.16 1.16 0 0 1-1.39 1.92Z" />
    </svg>
  );
}

const platformColorClass: Record<MusicPlatform, string> = {
  spotify: "text-emerald-500",
};

const tooltipGradientClass: Record<MusicPlatform, string> = {
  spotify: "from-emerald-500 to-emerald-400",
};

interface MusicPlatformLinksProps {
  links: MusicPlatformLink[];
  language: SupportedLanguage;
  buttonClassName?: string;
}

export function MusicPlatformLinks({
  links,
  language,
  buttonClassName,
}: MusicPlatformLinksProps) {
  return (
    <>
      {links.map((platformLink) => {
        const tooltip = getMusicPlatformTooltip(
          platformLink.platform,
          language,
        );

        return (
          <a
            key={`${platformLink.platform}-${platformLink.href}`}
            href={platformLink.href}
            target="_blank"
            rel="noopener noreferrer"
            title={tooltip}
            aria-label={tooltip}
            data-testid={`music-platform-${platformLink.platform}`}
            className={`relative group inline-flex shrink-0 items-center justify-center h-8 w-8 rounded-md border border-primary/40 bg-background/95 hover:bg-accent text-sm transition-colors ${buttonClassName ?? ""}`.trim()}
          >
            <span className={platformColorClass[platformLink.platform]}>
              <MusicPlatformIcon />
            </span>
            <span
              className={`pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gradient-to-r px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-md transition-all duration-100 group-hover:opacity-100 group-hover:-translate-y-0.5 ${tooltipGradientClass[platformLink.platform]}`}
            >
              {tooltip}
            </span>
          </a>
        );
      })}
    </>
  );
}

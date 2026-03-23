import { describe, expect, test } from "vitest";

import {
  buildMusicPlatformLinks,
  getJazzPlaylistTrackForLesson,
  getJazzStudyPlaylist,
} from "@/lib/jazz-playlist";

describe("jazz playlist helpers", () => {
  test("builds only the spotify music link from a search term", () => {
    const links = buildMusicPlatformLinks("The Essence of Jazz");

    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ platform: "spotify" });
    expect(links[0]?.href).toContain("open.spotify.com/search");
  });

  test("returns the full 15-track canonical study playlist", () => {
    const playlist = getJazzStudyPlaylist("pt");

    expect(playlist).toHaveLength(15);
    expect(playlist[0]).toMatchObject({
      classNumber: 1,
      title: "A Essencia do Jazz",
    });
    expect(playlist[14]).toMatchObject({ classNumber: 15 });
  });

  test("reuses canonical lesson metadata when the class number is known", () => {
    const track = getJazzPlaylistTrackForLesson({
      classNumber: 2,
      language: "en",
      fallbackTitle: "Fallback Lesson",
      courseTitle: "Jazz LMS",
    });

    expect(track.classNumber).toBe(2);
    expect(track.title).toBe("The Language of Jazz: Sonic Heterogeneity");
    expect(track.links[0]?.href).toContain("Jazz%20LMS");
  });

  test("falls back to direct lesson metadata when no canonical class exists", () => {
    const track = getJazzPlaylistTrackForLesson({
      classNumber: null,
      language: "pt",
      fallbackTitle: "Minha Aula Livre",
      courseTitle: "Jazz LMS",
    });

    expect(track.classNumber).toBe(0);
    expect(track.title).toBe("Minha Aula Livre");
    expect(track.links[0]?.href).toContain("Minha%20Aula%20Livre");
  });
});

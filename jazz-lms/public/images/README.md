# Public landing images

Files here are served publicly at `/images/<filename>`. Keep credentials,
customer files and other private material outside `public/`.

The homepage imports its sections from `src/app/page.tsx`. Current image uses:

| Image | Component | Purpose |
| --- | --- | --- |
| `clase1.jpg` | `src/components/landing/promo-video.tsx` | Initial and unavailable-video fallback in the hero. |
| `clase1.jpg` through `clase15.jpg` | `src/components/landing/classes.tsx` | Lesson previews. |
| `Conoce a tu Profesor.png` | `src/components/landing/professor.tsx` | Professor portrait, with its existing credit. |
| `logo-mark.png` | `src/components/layout/header.tsx` | Header logo. |

When promo playback is available, `PromoVideo` obtains its poster from Mux using
the playback response. Replacing a local fallback does not change the Mux asset
or signing configuration. Do not save signed playback or thumbnail URLs here.

`clase1.jpg` is only 191×107 pixels. Enlarging it in CSS or requesting a larger
Next.js image output cannot restore missing detail. A sharper replacement needs
a larger original; retain the intended lesson image and verify its crop on
desktop and mobile before replacing it.

Use `next/image` with appropriate dimensions or `fill`, a correctly positioned
container and responsive `sizes`. Preserve existing image descriptions and
credits when changing an asset.

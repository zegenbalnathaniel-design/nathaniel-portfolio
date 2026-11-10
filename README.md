# Nathaniel Zegenbal — portfolio

A single page that is one day long. It opens as a terminal login, then the
page moves from linen morning to cocoa midnight while a camera flies across a
line-drawn 3D model table, one model per chapter.

## Run

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production build into dist/
```

Deploys on Vercel as a static Vite site (`vercel.json`).

## How it is built

| Piece | Where |
| --- | --- |
| Content (all copy) | `index.html` |
| Terminal login, real ticker facts, honest load progress | `src/boot.ts` |
| Top bar, ⌘K command palette, phone menu, progress | `src/nav.ts`, `src/sections.ts` |
| Day-to-night palette, mixed in OKLab | `src/daylight.ts` |
| Vision board as a working spreadsheet | `src/visionboard.ts`, `src/data/visionboard.ts` |
| Line renderer: silhouettes, creases, clay shading, copper highlight | `src/world/pipeline.ts` |
| The model table, one station per chapter, contact shadows | `src/world/stations.ts` |
| Camera rail, hover tips, click-to-travel, bounce, clickable globe | `src/world/index.ts` |
| The Cinematic Mind: the Memory Projector, film strip, archive | `src/cinema.ts`, `src/data/films.ts` |
| Hairline figures (`@lucasmarkes/hairline`) drawn on the page | `src/figures.ts` |
| Fig. 01, Rate Lab, fiscal and tax panels, the 90-second brief | `src/interactives.ts` |
| Reveals, cursor | `src/motion.ts` |
| Contact QR codes (regenerate with `node scripts/qr.mjs`) | `public/qr/` |

Type: Instrument Serif, Schibsted Grotesk, IBM Plex Mono (self-hosted via Fontsource).
Respects `prefers-reduced-motion`; works without WebGL (the drawing is simply absent).

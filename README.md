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
| Content (all copy, from portfolio v11) | `index.html` |
| Terminal login, real ticker facts, honest load progress | `src/boot.ts` |
| Command bar: type a function, press `<GO>` | `src/cmdbar.ts`, `src/sections.ts` |
| Day-to-night palette, mixed in OKLab | `src/daylight.ts` |
| Line renderer: silhouettes bright, creases dim, copper highlight | `src/world/pipeline.ts` |
| The model table, one station per chapter | `src/world/stations.ts` |
| Camera rail, hover, drag-to-spin, globe labels | `src/world/index.ts` |
| Hairline figures (`@lucasmarkes/hairline`) | `src/figures.ts` |
| Fig. 01, Rate Lab, fiscal and tax panels | `src/interactives.ts` |
| Reveals, cursor | `src/motion.ts` |

Type: Instrument Serif, Schibsted Grotesk, IBM Plex Mono (self-hosted via Fontsource).
Respects `prefers-reduced-motion`; works without WebGL (the drawing is simply absent).

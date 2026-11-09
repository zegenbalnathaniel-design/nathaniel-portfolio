import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/schibsted-grotesk";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./styles/base.css";
import "./styles/terminal.css";
import "./styles/sections.css";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { runBoot } from "./boot";
import { initCmdbar, setActiveSection } from "./cmdbar";
import { applyPalette, paletteBetween } from "./daylight";
import { initFigures } from "./figures";
import { initInteractives, openBrief } from "./interactives";
import { initCursor, initReveals } from "./motion";
import { initScroll, lenis, startScroll } from "./scroll";
import { fmtClock, sectionClock, sections } from "./sections";
import { World } from "./world";

const html = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(pointer: coarse)").matches;
if (!reduced) html.classList.add("motion");

initScroll(reduced);

// ---- the world (if WebGL is unavailable, the page simply has no drawing behind it)
const canvas = document.getElementById("world") as HTMLCanvasElement;
let world: World | null = null;
let worldProgress = 0;
try {
  world = new World({ canvas, reduced, coarse, onProgress: (p) => (worldProgress = p) });
} catch {
  worldProgress = 1;
  canvas.remove();
}

let fontsReady = false;
document.fonts?.ready.then(() => { fontsReady = true; measure(); ScrollTrigger.refresh(); });

const { playCover } = initReveals(reduced);
const cursor = initCursor();
if (world) world.onHover = (k) => cursor.setDrag(k === "drag");
initFigures();
initInteractives({ onYear: (i) => world?.setYear(i), onRate: (r) => world?.setRate(r), reduced });
initCmdbar({ reduced, openBrief });

for (const s of sections) s.el.dataset.clock = `${fmtClock(sectionClock[s.id] ?? 0)} IST`;

// ---- where are we in the day? centres of every section, measured on resize
let centers: number[] = [];
let docH = 1;
function measure() {
  centers = sections.map((s) => {
    const r = s.el.getBoundingClientRect();
    return r.top + scrollY + r.height / 2;
  });
  docH = document.documentElement.scrollHeight - innerHeight;
}
measure();
addEventListener("resize", measure);
addEventListener("load", measure);
new ResizeObserver(measure).observe(document.querySelector("main")!);

const ease = (t: number) => t * t * (3 - 2 * t);
let paletteKey = "";
function update() {
  const sy = lenis ? lenis.scroll : scrollY;
  const y = sy + innerHeight / 2;
  let i = 0;
  while (i < centers.length - 1 && y >= centers[i + 1]) i++;
  const a = sections[i], b = sections[Math.min(i + 1, sections.length - 1)];
  const span = centers[i + 1] !== undefined ? centers[i + 1] - centers[i] : 1;
  const t = a === b ? 0 : Math.min(1, Math.max(0, (y - centers[i]) / span));
  // The light holds through the middle of a section and changes across the seam.
  const tl = ease(Math.min(1, Math.max(0, (t - 0.3) / 0.4)));
  const p = paletteBetween(a.light, b.light, tl);
  applyPalette(p);
  const key = p.bg.concat(p.ink).map((v) => Math.round(v * 400)).join(",");
  if (world && key !== paletteKey) { paletteKey = key; world.setPalette(p); }
  const progress = Math.min(1, Math.max(0, sy / Math.max(1, docH)));
  world?.setRail(a.cam, b.cam, t, progress);
  const clock = fmtClock((sectionClock[a.id] ?? 0) + ((sectionClock[b.id] ?? 0) - (sectionClock[a.id] ?? 0)) * t);
  setActiveSection(t < 0.5 ? a.index : b.index, clock);
}

gsap.ticker.add(() => {
  update();
  world?.frame();
});

// ---- the terminal opening
const quick = (() => { try { return sessionStorage.getItem("nz-session") === "1"; } catch { return false; } })();
runBoot({
  quick,
  reduced,
  progress: () => Math.min(worldProgress, fontsReady ? 1 : 0.94),
  onExitStart: () => {
    html.classList.add("entered");
    startScroll();
    playCover();
    if (location.hash) {
      const el = document.querySelector<HTMLElement>(location.hash);
      if (el) setTimeout(() => (lenis ? lenis.scrollTo(el, { immediate: true }) : el.scrollIntoView()), 50);
    }
  },
}).then(() => {
  html.classList.add("booted");
  try { sessionStorage.setItem("nz-session", "1"); } catch { /* private mode */ }
  measure();
  ScrollTrigger.refresh();
});

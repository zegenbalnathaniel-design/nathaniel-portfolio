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
import { initNav, setActiveSection } from "./nav";
import { applyPalette, paletteBetween } from "./daylight";
import { initFigures } from "./figures";
import { initInteractives, openBrief } from "./interactives";
import { initCursor, initReveals } from "./motion";
import { initScroll, lenis, scrollToEl, startScroll } from "./scroll";
import { fmtClock, sectionClock, sections } from "./sections";
import { initVisionBoard } from "./visionboard";
import { initCinema } from "./cinema";
import { World } from "./world";
import { PLACES } from "./world/stations";

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
initFigures();
initVisionBoard();
initCinema(reduced);
initInteractives({ onYear: (i) => world?.setYear(i), onRate: (r) => world?.setRate(r), reduced });
initNav({ reduced, openBrief });

for (const s of sections) s.el.dataset.clock = `${fmtClock(sectionClock[s.id] ?? 0)} IST`;

// ---- the world talks back: hover tips, travelling by clicking a model, choosing a place
const tip = document.getElementById("worldTip")!;
const placeName = document.getElementById("placeName")!;
const placeMeta = document.getElementById("placeMeta")!;
const placeNote = document.getElementById("placeNote")!;
const placesEl = document.getElementById("places")!;
const regions = ["Gulf", "Southeast Asia", "South India", "West & North India"];
placesEl.innerHTML = regions
  .map((r) => `<div><h4>${r}</h4><div class="pl">${PLACES.filter((p) => p.region === r).map((p) => `<button type="button" data-place="${p.name}">${p.name}</button>`).join("")}</div></div>`)
  .join("");
const fmtLat = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(2)}°${v >= 0 ? pos : neg}`;
const showPlace = (name: string, note: string) => {
  const p = PLACES.find((x) => x.name === name);
  if (!p) return;
  placeName.textContent = p.name;
  placeMeta.textContent = `${p.region} · ${fmtLat(p.lat, "N", "S")} ${fmtLat(p.lon, "E", "W")}`;
  placeNote.textContent = note;
  placesEl.querySelectorAll<HTMLButtonElement>("button").forEach((b) => b.classList.toggle("on", b.dataset.place === name));
};
placesEl.addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-place]");
  if (!b) return;
  if (world?.ready) world.focusPlace(b.dataset.place!);
  else showPlace(b.dataset.place!, "");
});

if (world) {
  const w = world;
  const info: Record<string, { title: string; code: string }> = {};
  for (const s of sections) if (!info[s.cam]) info[s.cam] = { title: s.title, code: s.code };
  info.gift = { title: "Service", code: "SERV" };
  w.setStationInfo(info);
  w.onHover = (kind) => cursor.setWorld(kind);
  w.onTip = (t) => {
    if (!t) { tip.classList.remove("on"); return; }
    (tip.firstElementChild as HTMLElement).textContent = t.title;
    (tip.lastElementChild as HTMLElement).textContent = t.sub;
    tip.style.transform = `translate3d(${Math.min(t.x + 18, innerWidth - 240)}px, ${t.y + 16}px, 0)`;
    tip.classList.add("on");
  };
  w.onStation = (key) => {
    const s = sections.find((x) => x.cam === key) ?? sections.find((x) => x.cam.startsWith(key));
    if (s) scrollToEl(s.el, reduced);
  };
  w.onPlace = (place, note) => showPlace(place.name, note);
}

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
let mapFocused = false;
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
  const active = t < 0.5 ? a : b;
  // first time the globe is in front of us, it turns to home
  if (!mapFocused && active.id === "map" && world?.ready) { mapFocused = true; world.focusPlace("Chennai"); }
  const clock = fmtClock((sectionClock[a.id] ?? 0) + ((sectionClock[b.id] ?? 0) - (sectionClock[a.id] ?? 0)) * t);
  setActiveSection(active.index, clock, progress);
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

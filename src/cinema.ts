// The Cinematic Mind — the Memory Projector.
//
// An isometric line-drawn projector whose two reels wind up as the pointer
// comes near; a continuous film strip of miniature frames runs under it at
// the reels' speed; the frame under the pointer rises out of the strip and
// the lens throws a beam onto a screen that shows the film's title, year and
// the lesson it left. The archive beneath is the same films as title cards;
// clicking one projects it and opens Nathaniel's written lesson. Everything
// here is his words; films without a lesson say so.

import { CORE_COUNT, FILMS, motifSvg, type Film } from "./data/films";
import STILLS from "./data/stills.json";

const stillOf = (f: Film): string | undefined => (STILLS as Record<string, string>)[f.id];
const art = (f: Film, i: number) => { const s = stillOf(f); return s ? `<img class="still" src="${s}" alt="${esc(f.scene)}" loading="lazy" decoding="async"/>` : motifSvg(f.motif, i, 120, 80); };

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// ---------------------------------------------------------------- isometric helpers
const C30 = Math.cos(Math.PI / 6), S30 = 0.5;
/** world (x, y, z) → svg; x runs right-down, z left-down, y up */
const iso = (x: number, y: number, z: number, ox: number, oy: number, s: number): [number, number] => [ox + (x - z) * C30 * s, oy + (x + z) * S30 * s - y * s];

function projectorSvg(): string {
  const S = 13, OX = 150, OY = 262; // scale and origin of the drawing, inside a 1000 × 400 box
  const P = (x: number, y: number, z: number) => iso(x, y, z, OX, OY, S).map((v) => v.toFixed(1)).join(" ");
  const line = (a: [number, number, number], b: [number, number, number], cls = "i") => `<path class="${cls}" d="M${P(...a)} L${P(...b)}"/>`;
  const ring = (cx: number, cy: number, cz: number, r: number, axis: "x" | "z", cls = "i") => {
    let d = "";
    for (let i = 0; i <= 48; i++) {
      const t = (i / 48) * Math.PI * 2;
      const p = axis === "x" ? P(cx, cy + Math.cos(t) * r, cz + Math.sin(t) * r) : P(cx + Math.cos(t) * r, cy + Math.sin(t) * r, cz);
      d += `${i ? "L" : "M"}${p} `;
    }
    return `<path class="${cls}" d="${d}Z"/>`;
  };

  // the body: a box 10 long, 5 high, 4 deep; hidden edges dashed, as everywhere else on the site
  const W = 10, H = 5, D = 4;
  let g = "";
  g += line([0, H, 0], [W, H, 0]) + line([W, H, 0], [W, H, D]) + line([W, H, D], [0, H, D]) + line([0, H, D], [0, H, 0]);
  g += line([W, H, 0], [W, 0, 0]) + line([W, H, D], [W, 0, D]) + line([0, H, D], [0, 0, D]);
  g += line([W, 0, 0], [W, 0, D]) + line([W, 0, D], [0, 0, D]);
  g += line([0, 0, 0], [W, 0, 0], "h") + line([0, 0, 0], [0, 0, D], "h") + line([0, 0, 0], [0, H, 0], "h");
  // a vent grille on the front-left face and a small plate on the right
  for (let i = 0; i < 5; i++) g += line([1.2, 0.9 + i * 0.55, D], [3.6, 0.9 + i * 0.55, D], "s");
  g += line([W, 1.0, 0.6], [W, 1.0, 1.9], "s") + line([W, 1.5, 0.6], [W, 1.5, 1.9], "s");
  // the gate: a slot on the right face the film runs through
  g += line([W, 0.6, 2.9], [W, 4.2, 2.9], "s") + line([W, 0.6, 3.5], [W, 4.2, 3.5], "s");
  // the lens: a cylinder out of the right face
  const LY = 2.8, LZ = 1.6, LR = 1.05, LL = 2.4;
  g += ring(W, LY, LZ, LR, "x") + ring(W + LL, LY, LZ, LR, "x", "a") + ring(W + LL, LY, LZ, LR * 0.55, "x", "s");
  g += line([W, LY + LR, LZ], [W + LL, LY + LR, LZ]) + line([W, LY - LR, LZ], [W + LL, LY - LR, LZ]);
  g += line([W, LY, LZ + LR], [W + LL, LY, LZ + LR]) + line([W, LY, LZ - LR], [W + LL, LY, LZ - LR], "h");
  // the reel arms
  const RZ = 1.2;
  g += line([2.6, H, RZ], [2.6, H + 1.1, RZ]) + line([7.4, H, RZ], [7.4, H + 0.9, RZ]);
  // the film path between the reels, over the gate
  g += `<path class="f" d="M${P(2.6, H + 1.1 + 2.5, RZ)} L${P(7.4, H + 0.9 + 2.0, RZ)}"/>`;
  g += `<path class="f" d="M${P(7.4 + 2.0, H + 0.9, RZ)} L${P(W + 0.05, 4.2, 3.2)} L${P(W + 0.05, 0.6, 3.2)} L${P(W + 1.2, -0.9, 3.2)}"/>`;

  // The reels sit in the x–y plane, so their group maps plane coordinates
  // through the same projection: X = 0.866·x, Y = 0.5·x − y. A rotation
  // inside that group is then a rotation of the reel in its own plane.
  const reel = (id: string, cx: number, r: number) => {
    const [ex, ey] = iso(cx, H + r, RZ, OX, OY, S);
    const [bx, by] = iso(cx, H + r, RZ - 0.5, OX, OY, S);
    const m = (e: number, f: number) => `matrix(${(C30 * S).toFixed(4)} ${(S30 * S).toFixed(4)} 0 ${-S} ${e.toFixed(1)} ${f.toFixed(1)})`;
    let spokes = "";
    for (let k = 0; k < 3; k++) {
      const a = (k * 2 * Math.PI) / 3;
      spokes += `<line class="i" x1="${(Math.cos(a) * 0.55).toFixed(2)}" y1="${(Math.sin(a) * 0.55).toFixed(2)}" x2="${(Math.cos(a) * (r - 0.25)).toFixed(2)}" y2="${(Math.sin(a) * (r - 0.25)).toFixed(2)}"/>`;
      // the cut-outs between the spokes
      const b = a + Math.PI / 3;
      spokes += `<circle class="s" cx="${(Math.cos(b) * r * 0.55).toFixed(2)}" cy="${(Math.sin(b) * r * 0.55).toFixed(2)}" r="${(r * 0.26).toFixed(2)}"/>`;
    }
    return `<g transform="${m(bx, by)}"><circle class="h" cx="0" cy="0" r="${r}"/></g>` +
      `<g transform="${m(ex, ey)}"><circle class="i" cx="0" cy="0" r="${r}"/><circle class="s" cx="0" cy="0" r="${r - 0.22}"/>` +
      `<g class="reel" id="${id}">${spokes}<circle class="a" cx="0" cy="0" r="0.5"/><circle class="i" cx="0" cy="0" r="0.16"/></g></g>`;
  };
  g += reel("reelA", 2.6, 2.6) + reel("reelB", 7.4, 2.2);

  // the beam: from the lens to the screen, and the screen itself, face on
  const [lx, ly] = iso(W + LL, LY, LZ, OX, OY, S);
  const SX = 560, SY = 36, SW = 400, SH = 250;
  const beam = `M${lx.toFixed(1)} ${(ly - LR * S * 0.9).toFixed(1)} L${SX} ${SY} L${SX} ${SY + SH} L${lx.toFixed(1)} ${(ly + LR * S * 0.9).toFixed(1)} Z`;
  g += `<path class="beam" id="beam" d="${beam}"/>`;
  g += `<path class="beam-core" id="beamCore" d="M${lx.toFixed(1)} ${ly.toFixed(1)} L${SX} ${SY + SH / 2}"/>`;
  g += `<rect class="screen" id="screenRect" x="${SX}" y="${SY}" width="${SW}" height="${SH}"/>`;
  g += `<path class="s" d="M${SX + 6} ${SY + SH + 10} L${SX + SW - 6} ${SY + SH + 10}"/>`;
  // the floor line and a registration mark
  g += `<path class="s" d="M${OX - 120} ${OY + 26} L${SX - 40} ${OY + 26}"/>`;
  return `<svg class="proj-svg" viewBox="0 0 1000 400" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${g}</svg>`;
}

// ---------------------------------------------------------------- the section
export function initCinema(reduced: boolean) {
  const host = $("projector");
  if (!host) return;
  host.insertAdjacentHTML("afterbegin", projectorSvg());

  const stripWrap = $("stripWrap"), strip = $("strip");
  const archive = $("archive"), review = $("review");
  const screen = $("projScreen");
  const psTitle = $("psTitle"), psMeta = $("psMeta"), psLesson = $("psLesson"), psK = $("psK");
  $("statFilms").textContent = String(FILMS.length).padStart(3, "0");
  $("statLessons").textContent = String(CORE_COUNT).padStart(2, "0");

  const frame = (f: Film, i: number) =>
    `<button type="button" class="frame${stillOf(f) ? " has-still" : ""}" data-film="${f.id}" aria-label="${esc(f.title)}, ${f.year}"><span class="fr-no">${String(i + 1).padStart(2, "0")}</span>${art(f, i)}<span class="fr-y">${f.year}</span></button>`;
  const frames = FILMS.map(frame).join("");
  strip.innerHTML = frames + frames; // twice, so the strip can loop

  archive.innerHTML = FILMS.map((f, i) =>
    `<button type="button" class="card${f.core ? " core" : ""}${stillOf(f) ? " has-still" : ""}" data-film="${f.id}" aria-pressed="false">
      <span class="cd-no">${String(i + 1).padStart(2, "0")}${f.core ? " · shaped me" : ""}</span>
      <span class="cd-art">${art(f, i)}</span>
      <b>${esc(f.title)}</b>
      <span class="cd-meta">${f.year} · ${esc(f.director)}</span>
      <span class="cd-foot"><span class="cd-tag">${esc(f.tag)}</span><span class="cd-stars" aria-label="Rated five stars">★★★★★</span></span>
    </button>`).join("");

  // ---- projecting a film
  const fillText = (show: Film | null) => {
    if (!show) { psK.textContent = "No film selected"; psTitle.textContent = "Hover a frame"; psMeta.textContent = "or click a card below"; psLesson.textContent = ""; return; }
    psK.textContent = show.core ? "Now showing · one that shaped me" : "Now showing";
    psTitle.textContent = show.title;
    psMeta.textContent = `${show.year} · dir. ${show.director}`;
    psLesson.textContent = show.lesson;
  };
  let shown: Film | null = null;
  let selected: Film | null = null;
  const project = (f: Film | null, sticky = false) => {
    if (sticky) selected = f;
    const show = f ?? selected;
    host.classList.toggle("lit", !!show);
    if (show === shown) return;
    shown = show;
    screen.classList.remove("flick");
    void screen.offsetWidth; // restart the flicker
    screen.classList.add("flick");
    screen.style.removeProperty("--still");
    fillText(show);
    if (!show) return;
    const still = stillOf(show);
    if (still) screen.style.setProperty("--still", `url("${still}")`);
    strip.querySelectorAll<HTMLElement>(".frame").forEach((b) => b.classList.toggle("sel", b.dataset.film === show.id));
    archive.querySelectorAll<HTMLElement>(".card").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.film === show.id)));
  };
  const choose = (f: Film) => {
    project(f, true);
    const still = stillOf(f);
    const i = FILMS.indexOf(f);
    review.innerHTML = `<div class="rv-art">${still ? `<img class="still" src="${still}" alt="${esc(f.scene)} — a frame from ${esc(f.title)}" decoding="async"/>` : motifSvg(f.motif, i, 120, 80)}<span class="rv-cap">${esc(f.scene)}</span></div>
      <div class="rv-body"><b>${esc(f.title)}</b><span class="rv-meta">${f.year} · ${esc(f.director)}${f.core ? " · one that shaped me" : ""} · <span class="cd-stars">★★★★★</span> on Letterboxd</span>
      <span class="rv-k">What it left me</span><p>${esc(f.lesson)}</p>
      <span class="rv-foot">Frame ${String(i + 1).padStart(2, "0")} of ${FILMS.length} · the diary is on <a href="https://letterboxd.com/the_realzeg/" target="_blank" rel="noopener">Letterboxd ↗</a></span></div>`;
    review.hidden = false;
  };
  project(null);

  // On a phone the screen's text sits in the page flow. Reserve room for the longest lesson, so that
  // projecting a film never moves the strip out from under a finger.
  let fitTimer = 0;
  const fitScreen = () => {
    screen.style.minHeight = "";
    if (!matchMedia("(max-width: 640px)").matches) return;
    let max = 0;
    for (const f of FILMS) { fillText(f); max = Math.max(max, screen.offsetHeight); }
    fillText(shown);
    screen.style.minHeight = `${Math.ceil(max)}px`;
  };
  fitScreen();
  document.fonts?.ready.then(fitScreen);
  addEventListener("resize", () => { clearTimeout(fitTimer); fitTimer = window.setTimeout(fitScreen, 150); });

  const byId = (el: EventTarget | null) => {
    const b = (el as HTMLElement | null)?.closest<HTMLElement>("[data-film]");
    return b ? FILMS.find((f) => f.id === b.dataset.film) ?? null : null;
  };
  for (const el of [strip, archive]) {
    // a finger has no hover: touch projects on the tap itself, not on touch-down
    el.addEventListener("pointerover", (e) => { if (e.pointerType === "touch") return; const f = byId(e.target); if (f) project(f); });
    el.addEventListener("pointerout", (e) => { if (e.pointerType === "touch") return; if (byId(e.target)) project(null); });
    el.addEventListener("focusin", (e) => { const f = byId(e.target); if (f) project(f); });
    el.addEventListener("focusout", () => project(null));
    el.addEventListener("click", (e) => { const f = byId(e.target); if (f) choose(f); });
  }

  // ---- the reels and the strip, driven by how near the pointer is
  const reels = [$("reelA"), $("reelB")];
  if (reduced) { stripWrap.classList.add("still"); return; }
  let px = -1e4, py = -1e4;
  addEventListener("pointermove", (e) => { px = e.clientX; py = e.clientY; }, { passive: true });
  addEventListener("pointerleave", () => { px = py = -1e4; });
  let near = 0, speed = 0, angle = 0, offset = 0, last = performance.now();
  let hovering = false;
  strip.addEventListener("pointerover", () => (hovering = true));
  strip.addEventListener("pointerout", () => (hovering = false));
  let inView = false;
  new IntersectionObserver((en) => (inView = en[0].isIntersecting), { rootMargin: "20% 0px" }).observe(host);

  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (inView) {
      const r = host.getBoundingClientRect();
      const cx = r.left + r.width * 0.3, cy = r.top + r.height * 0.45;
      const d = Math.hypot(px - cx, py - cy);
      const want = 1 - smooth(r.width * 0.18, r.width * 0.62, d);
      near += (want - near) * (1 - Math.exp(-dt * 3));
      // the reels wind up toward the pointer and coast down when it leaves; a hovered frame holds the strip
      const target = hovering ? 0.08 : 0.25 + near * 2.6;
      speed += (target - speed) * (1 - Math.exp(-dt * (target > speed ? 2.2 : 1.1)));
      angle += speed * dt;
      const deg = ((angle * 180) / Math.PI).toFixed(2);
      reels[0].setAttribute("transform", `rotate(${deg})`);
      reels[1].setAttribute("transform", `rotate(${(+deg * 1.18).toFixed(2)})`);
      offset += speed * 34 * dt; // px per second at speed 1: the film moves as the reels do
      const half = strip.scrollWidth / 2;
      if (half > 0 && offset >= half) offset -= half;
      strip.style.transform = `translate3d(${(-offset).toFixed(2)}px,0,0)`;
      host.style.setProperty("--near", near.toFixed(3));
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

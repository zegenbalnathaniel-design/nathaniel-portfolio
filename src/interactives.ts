// The research figures carried over from v11 (Fig. 01, the Rate Lab, the
// fiscal and tax panels), restyled, plus the small interactions around them.
// Every number here is the paper's own or labelled illustrative on the page.

import { SERIES } from "./world/stations";

type Hooks = { onYear: (i: number) => void; onRate: (r: number) => void; reduced: boolean };

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

export function initInteractives({ onYear, onRate, reduced }: Hooks) {
  fig01(onYear);
  lenses();
  rateLab(onRate);
  fiscal();
  tax();
  videos();
  brief();
  if (!reduced) tilt();
}

// ---------------------------------------------------------------- Fig. 01
function fig01(onYear: (i: number) => void) {
  const { cons, inc, wea } = SERIES;
  const n = cons.length, PADX = 40, W = 1000 - 2 * PADX, TOP = 22, BOT = 352, YMIN = 0.3, YMAX = 0.78;
  const X = (i: number) => PADX + (i / (n - 1)) * W;
  const Y = (v: number) => BOT - ((v - YMIN) / (YMAX - YMIN)) * (BOT - TOP);
  const path = (a: number[]) => a.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
  $("lineCons").setAttribute("d", path(cons));
  $("lineInc").setAttribute("d", path(inc));
  $("lineWea").setAttribute("d", path(wea));
  let band = `M${X(0)} ${Y(inc[0])} `;
  for (let i = 1; i < n; i++) band += `L${X(i).toFixed(1)} ${Y(inc[i]).toFixed(1)} `;
  for (let j = n - 1; j >= 0; j--) band += `L${X(j).toFixed(1)} ${Y(wea[j]).toFixed(1)} `;
  $("gapband").setAttribute("d", band + "Z");

  const grid = $("f1grid");
  let g = "";
  for (const v of [0.4, 0.5, 0.6, 0.7]) g += `<line x1="${PADX}" x2="${1000 - PADX}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${PADX - 6}" y="${Y(v) + 4}" text-anchor="end">${v.toFixed(1)}</text>`;
  g += `<line x1="${PADX}" x2="${1000 - PADX}" y1="${BOT}" y2="${BOT}"/>`;
  grid.innerHTML = g;

  const lab = (id: string, a: number[], dy: number) => { const t = $(id); t.setAttribute("x", (X(n - 1) - 8).toFixed(1)); t.setAttribute("y", (Y(a[n - 1]) + dy).toFixed(1)); };
  lab("labWea", wea, -10); lab("labInc", inc, -10); lab("labCons", cons, 18);

  const upd = (i: number) => {
    const x = String(X(i));
    const mk = $("marker"); mk.setAttribute("x1", x); mk.setAttribute("x2", x);
    $("dotWea").setAttribute("cx", x); $("dotWea").setAttribute("cy", String(Y(wea[i])));
    $("dotInc").setAttribute("cx", x); $("dotInc").setAttribute("cy", String(Y(inc[i])));
    $("dotCons").setAttribute("cx", x); $("dotCons").setAttribute("cy", String(Y(cons[i])));
    $("outYear").textContent = String(2016 + i);
    $("outCons").textContent = cons[i].toFixed(3);
    $("outInc").textContent = inc[i].toFixed(3);
    $("outWea").textContent = wea[i].toFixed(3);
    $("outGap").textContent = (wea[i] - inc[i]).toFixed(3);
    onYear(i);
  };
  const scrub = $<HTMLInputElement>("yearScrub");
  scrub.addEventListener("input", () => upd(+scrub.value));
  upd(10);

  const fig = $("fig01"), tb = $("tidyBtn");
  tb.addEventListener("click", () => {
    const on = fig.classList.toggle("tidy");
    tb.setAttribute("aria-pressed", String(on));
    tb.textContent = on ? "Show all three" : "Show the tidy answer";
  });
}

// ---------------------------------------------------------------- lens tabs
function lenses() {
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>(".lens"));
  const select = (b: HTMLButtonElement, focus = false) => {
    tabs.forEach((x) => { const on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-selected", String(on)); x.tabIndex = on ? 0 : -1; });
    document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("on", p.id === b.dataset.p));
    if (focus) b.focus();
  };
  tabs.forEach((b, i) => {
    b.addEventListener("click", () => select(b));
    b.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") select(tabs[(i + 1) % tabs.length], true);
      if (e.key === "ArrowLeft") select(tabs[(i - 1 + tabs.length) % tabs.length], true);
    });
  });
}

// ---------------------------------------------------------------- Rate Lab
// Anchor points (rate %, value) from the paper's Table 3; piecewise-linear
// between them, extended (and flagged) beyond.
function rateLab(onRate: (r: number) => void) {
  const A_CORE: [number, number][] = [[0.23, -0.53], [1.99, -0.32], [3.95, 0.4]];
  const A_FULL: [number, number][] = [[0.23, -0.05], [1.99, -0.09], [3.95, -0.23]];
  const slope = (a: [number, number], b: [number, number]) => (b[1] - a[1]) / (b[0] - a[0]);
  const interp = (p: [number, number][], x: number) => {
    const f = p[0], l = p[p.length - 1];
    if (x < f[0]) return f[1] + slope(f, p[1]) * (x - f[0]);
    if (x > l[0]) return l[1] + slope(p[p.length - 2], l) * (x - l[0]);
    for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1]; if (x >= a[0] && x <= b[0]) return a[1] + ((x - a[0]) / (b[0] - a[0])) * (b[1] - a[1]); }
    return l[1];
  };
  type Chan = [string, "up" | "down" | "flat", string, string];
  const R: Record<string, { name: string; cap: string; chans: Chan[] }> = {
    zlb: { name: "Zero-lower-bound regime", cap: "Rates at the floor. New-loan yields reprice toward zero and non-interest deposits can’t fall further — earnings hit their trough (core −0.53).",
      chans: [["Earnings — margin", "down", "↓", "yields toward zero"], ["Capital — CET1", "flat", "→", "near neutral"], ["Asset quality — NCO", "up", "↑", "charge-offs benign"], ["Liquidity — LCR", "flat", "→", "rate-independent"], ["Securities", "flat", "→", "not yet marked down"]] },
    pre: { name: "Pre-pandemic regime", cap: "Rates near 2%. The margin channel is muted; capital sits below its seven-year median (core −0.32).",
      chans: [["Earnings — margin", "flat", "→", "muted"], ["Capital — CET1", "down", "↓", "below 7-yr median"], ["Asset quality — NCO", "flat", "→", "stable"], ["Liquidity — LCR", "flat", "→", "rate-independent"], ["Securities", "flat", "→", "little markdown"]] },
    post: { name: "Post-pandemic regime", cap: "525bp of hikes in 16 months. Margins widen and capital climbs — but the same hikes mark down the fixed-rate securities book, so the full index falls even as the core reaches +0.40.",
      chans: [["Earnings — margin", "up", "↑", "2024Q2 +2.43σ"], ["Capital — CET1", "up", "↑", "CET1 > 15%, +0.83σ"], ["Asset quality — NCO", "down", "↓", "normalising up"], ["Liquidity — LCR", "flat", "→", "rate-independent"], ["Securities", "down", "↓", "fixed-rate book marked down"]] },
  };
  const sign = (v: number) => (v >= 0 ? "+" : "−") + Math.abs(v).toFixed(2);
  const bar = (el: HTMLElement, v: number) => {
    const f = Math.max(-1, Math.min(1, v));
    if (f >= 0) { el.style.left = "50%"; el.style.width = f * 50 + "%"; } else { el.style.left = 50 + f * 50 + "%"; el.style.width = -f * 50 + "%"; }
  };
  const slider = $<HTMLInputElement>("rateSlider");
  let last = "";
  const run = () => {
    const r = +slider.value / 100;
    $("rateOut").textContent = r.toFixed(2);
    const c = interp(A_CORE, r), f = interp(A_FULL, r);
    $("coreVal").textContent = sign(c);
    $("fullVal").textContent = sign(f);
    const est = r < 0.23 || r > 3.95;
    $("coreEst").classList.toggle("on", est);
    $("fullEst").classList.toggle("on", est);
    bar($("coreBar"), c);
    bar($("fullBar"), f);
    const rg = r < 1.1 ? "zlb" : r < 3 ? "pre" : "post";
    if (rg !== last) {
      last = rg;
      $("regimeChip").textContent = R[rg].name;
      $("rateCap").textContent = R[rg].cap;
      $("chanList").innerHTML = R[rg].chans.map(([name, cls, arrow, note]) => `<div class="chan"><span class="${cls}">${arrow}</span><span>${name}</span><span class="note2">${note}</span></div>`).join("");
    }
    onRate(r);
  };
  slider.addEventListener("input", run);
  run();
}

// ---------------------------------------------------------------- fiscal, tax
function fiscal() {
  const leak = $<HTMLInputElement>("leak");
  const run = () => {
    const m = +leak.value / 100, k = 1 / (1 - 0.8 * (1 - 0.2) + m);
    $("multVal").textContent = k.toFixed(2);
    $("leakV").textContent = m > 0.6 ? "high" : m > 0.4 ? "moderate" : "low";
  };
  leak.addEventListener("input", run);
  run();
}
function tax() {
  const ped = $<HTMLInputElement>("ped");
  const run = () => {
    const e = +ped.value / 100;
    $("pedV").textContent = e.toFixed(1);
    const con = Math.min(95, Math.round(e * 55)), rev = Math.max(15, Math.round(95 - e * 45));
    $("revBar").style.width = rev + "%"; $("conBar").style.width = con + "%";
    $("revV").textContent = rev + "%"; $("conV").textContent = con + "%";
    $("taxRead").textContent = e < 0.6 ? "Efficient tax, weak deterrent" : e < 1 ? "Balanced" : "Strong deterrent, thin revenue";
  };
  ped.addEventListener("input", run);
  run();
}

// ---------------------------------------------------------------- videos play only while seen
function videos() {
  const vids = Array.from(document.querySelectorAll<HTMLVideoElement>("video[data-autoplay]"));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target as HTMLVideoElement;
    if (e.isIntersecting && !reduce) v.play().catch(() => {}); else v.pause();
  }), { threshold: 0.25 });
  vids.forEach((v) => io.observe(v));
}

// ---------------------------------------------------------------- 90-second brief
// A one-page dossier. A hairline timer runs down the ninety seconds while it
// is open; "Print / save PDF" prints only the brief.
let openBriefFn = () => {};
export const openBrief = () => openBriefFn();
function brief() {
  const ov = $("brief");
  const bar = $("briefTimer");
  const secs = $("briefClock");
  let lastFocus: Element | null = null;
  let raf = 0, t0 = 0;
  const tick = () => {
    const p = Math.min(1, (performance.now() - t0) / 90000);
    bar.style.transform = `scaleX(${p})`;
    secs.textContent = String(Math.max(0, Math.ceil(90 - p * 90)));
    if (p < 1 && !ov.hidden) raf = requestAnimationFrame(tick);
  };
  const close = () => {
    ov.hidden = true;
    cancelAnimationFrame(raf);
    document.documentElement.classList.remove("is-modal");
    (lastFocus as HTMLElement | null)?.focus?.();
  };
  openBriefFn = () => {
    lastFocus = document.activeElement;
    ov.hidden = false;
    document.documentElement.classList.add("is-modal");
    ov.querySelector<HTMLElement>(".brief-card")?.scrollTo({ top: 0 });
    ov.querySelector<HTMLElement>(".brief-x")?.focus();
    t0 = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  };
  $("briefBtn").addEventListener("click", openBriefFn);
  $("briefPrint").addEventListener("click", () => print());
  ov.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", close));
  ov.querySelectorAll("[data-go]").forEach((el) => el.addEventListener("click", close));
  addEventListener("keydown", (e) => {
    if (ov.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "Tab") {
      const f = Array.from(ov.querySelectorAll<HTMLElement>("button, a[href]"));
      const i = f.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) { f[f.length - 1].focus(); e.preventDefault(); }
      else if (!e.shiftKey && i === f.length - 1) { f[0].focus(); e.preventDefault(); }
    }
  });
}

// ---------------------------------------------------------------- the issue cover tilts toward the pointer
function tilt() {
  if (!matchMedia("(pointer: fine)").matches) return;
  document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${-dy * 7}deg) rotateY(${dx * 9}deg) translateZ(0)`;
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  });
}

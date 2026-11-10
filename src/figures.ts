// Hairline figures (@lucasmarkes/hairline). Each mounts when its plate comes
// near the viewport and is destroyed when it is far away, so only a few run
// at once. Colours come from the --hairline-* properties daylight.ts writes,
// so every figure's plate always matches the card it sits on.

import { exploded, hub, riffle, terminal, terrain, vault, type Figure, type HairlineOptions } from "@lucasmarkes/hairline";

const MAKERS: Record<string, (el: HTMLElement, o?: HairlineOptions) => Figure> = { terrain, exploded, vault, terminal, hub, riffle };

export function initFigures() {
  const hosts = Array.from(document.querySelectorAll<HTMLElement>(".hfig[data-figure]"));
  const live = new Map<HTMLElement, Figure>();
  const theme = () => (document.documentElement.classList.contains("is-night") ? "dark" : "light");

  const mount = (el: HTMLElement) => {
    if (live.has(el)) return;
    const make = MAKERS[el.dataset.figure!];
    if (!make) return;
    const read = el.closest("figure")?.querySelector<HTMLElement>("[data-read]") ?? el.parentElement?.querySelector<HTMLElement>("[data-read]") ?? null;
    const fig = make(el, {
      intensity: 0.6,
      theme: theme(),
      play: el.hasAttribute("data-play"),
      label: el.dataset.label,
      onRead: (t) => { if (read) read.textContent = t; },
    });
    live.set(el, fig);
  };
  const unmount = (el: HTMLElement) => {
    live.get(el)?.destroy();
    live.delete(el);
  };

  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => (e.isIntersecting ? mount(e.target as HTMLElement) : unmount(e.target as HTMLElement))),
    { rootMargin: "60% 0px 60% 0px" },
  );
  hosts.forEach((h) => io.observe(h));

  // Keep the figure's own light/dark default in step with the page.
  let last = theme();
  new MutationObserver(() => {
    const t = theme();
    if (t === last) return;
    last = t;
    live.forEach((f) => f.update({ theme: t }));
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
}

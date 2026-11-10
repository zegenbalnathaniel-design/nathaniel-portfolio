import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

/** Headlines rise out of masks, line by line; blocks fade up; section rules draw across. */
export function initReveals(reduced: boolean) {
  const heads = Array.from(document.querySelectorAll<HTMLElement>("[data-split]"));
  if (reduced) return { playCover: () => {} };

  const splits = new Map<HTMLElement, HTMLElement[]>();
  for (const h of heads) {
    const s = SplitText.create(h, { type: "lines", linesClass: "split-line", mask: "lines", autoSplit: true });
    splits.set(h, s.lines as HTMLElement[]);
    gsap.set(s.lines, { yPercent: 105 });
  }
  const cover = document.querySelector<HTMLElement>(".cover-name")!;

  for (const [h, lines] of splits) {
    if (h === cover) continue;
    gsap.to(lines, {
      yPercent: 0, duration: 1.15, ease: "expo.out", stagger: 0.09,
      scrollTrigger: { trigger: h, start: "top 86%", once: true },
    });
  }

  for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"))) {
    if (el.closest(".sec-cover")) continue;
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1.0, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  }

  for (const sec of Array.from(document.querySelectorAll<HTMLElement>(".sec:not(.sec-cover)"))) {
    gsap.to(sec, {
      "--draw": 1, duration: 1.6, ease: "expo.inOut",
      scrollTrigger: { trigger: sec, start: "top 92%", once: true },
    });
  }

  // The cover plays once the terminal has collapsed.
  const playCover = () => {
    const lines = splits.get(cover) ?? [];
    const tl = gsap.timeline();
    tl.to(lines, { yPercent: 0, duration: 1.4, ease: "expo.out", stagger: 0.12 }, 0.05);
    tl.to(".sec-cover [data-reveal]", { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.08 }, 0.35);
  };
  return { playCover };
}

/** A small dot and a ring; the ring opens on links and says DRAG over models you can turn. */
export function initCursor() {
  if (!matchMedia("(pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return { setWorld: (_: "drag" | "open" | null) => {} };
  const root = document.getElementById("cursor")!;
  const dot = root.querySelector<HTMLElement>(".cursor-dot")!;
  const ring = root.querySelector<HTMLElement>(".cursor-ring")!;
  const label = document.getElementById("cursorLabel")!;
  document.documentElement.classList.add("has-cursor");
  const xDot = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3" }), yDot = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3" });
  const xRing = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" }), yRing = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
  let seen = false;
  addEventListener("pointermove", (e) => {
    if (!seen) {
      if (e.clientX === 0 && e.clientY === 0) return; // synthetic first move from some browsers
      seen = true; gsap.set([dot, ring], { x: e.clientX, y: e.clientY }); root.classList.add("is-on");
    }
    xDot(e.clientX); yDot(e.clientY); xRing(e.clientX); yRing(e.clientY);
    const t = e.target as HTMLElement;
    root.classList.toggle("is-link", !!t.closest("a, button, [data-go], .lens, .board-scroll, .hfig, label"));
    root.classList.toggle("is-text", !!t.closest("input[type=text]"));
  }, { passive: true });
  document.addEventListener("pointerleave", () => root.classList.remove("is-on"));
  document.addEventListener("pointerenter", () => seen && root.classList.add("is-on"));

  // Magnetic: buttons lean toward the pointer.
  document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
    const x = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" }), y = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
    el.addEventListener("pointermove", (e) => { const r = el.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.18); y((e.clientY - r.top - r.height / 2) * 0.3); });
    el.addEventListener("pointerleave", () => { x(0); y(0); });
  });

  return {
    setWorld(kind: "drag" | "open" | null) {
      root.classList.toggle("is-drag", kind === "drag");
      root.classList.toggle("is-open", kind === "open");
      label.textContent = kind === "drag" ? "DRAG" : kind === "open" ? "CLICK" : "";
    },
  };
}

import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export let lenis: Lenis | null = null;

export function initScroll(reduced: boolean) {
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis!.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
}

export function startScroll() {
  lenis?.start();
}

const barH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--bar-h")) || 46;

export function scrollToEl(el: HTMLElement, reduced: boolean) {
  const isSection = el.classList.contains("sec");
  const offset = isSection ? 0 : -(barH() + 28);
  if (lenis && !reduced) {
    const dist = Math.abs(el.getBoundingClientRect().top);
    const duration = Math.min(2.6, 0.9 + dist / 4200);
    lenis.scrollTo(el, { offset, duration, easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) });
  } else {
    const y = el.getBoundingClientRect().top + scrollY + offset;
    scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
  }
}

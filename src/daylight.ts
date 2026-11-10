// Daylight: the page is one day, linen at 07:00 to cocoa at midnight.
// Each section names a light; between two sections the light is mixed in
// OKLab. The ink is not mixed with the background: it flips from espresso to
// sand around the moment the background passes mid-luminance, quickly, so
// text never sits at low contrast for long.

export type RGB = [number, number, number];
export type Palette = { bg: RGB; accent: RGB; accentInk: RGB; ink: RGB; card: RGB; night: number };

const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB;

const LIGHTS: Record<string, string> = {
  dawn: "#C8B89B",
  morning: "#C3B294",
  noon: "#BDAB8D",
  afternoon: "#B6A385",
  late: "#AD9A7C",
  golden: "#A49174",
  dusk: "#9B886B",
  evening: "#2B2018",
  night: "#18110C",
  midnight: "#120C08",
};

const INK_DARK = hex("#1C120B");
const INK_LIGHT = hex("#E9DCC5");
const ACC_DAY = hex("#8E3D12");
const ACC_NIGHT = hex("#D9813F");
const ACC_DUSK = hex("#7A2E10");
const ACC_INK_DUSK = hex("#4A1E0B");
const ACC_INK_DAY = hex("#6E2B0E");
const ACC_INK_NIGHT = hex("#E59456");
const PAPER = hex("#FFF8EC");

// --- OKLab ---------------------------------------------------------------
const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function oklab([r, g, b]: RGB): RGB {
  const R = toLin(r), G = toLin(g), B = toLin(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function fromOklab([L, a, b]: RGB): RGB {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const R = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const B = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return [R, G, B].map((c) => Math.min(1, Math.max(0, toSrgb(c)))) as RGB;
}
export function mixOk(a: RGB, b: RGB, t: number): RGB {
  const A = oklab(a), B = oklab(b);
  return fromOklab([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

const LIGHT_OK: Record<string, RGB> = Object.fromEntries(Object.entries(LIGHTS).map(([k, v]) => [k, hex(v)]));

export function paletteBetween(a: string, b: string, t: number): Palette {
  const bg = mixOk(LIGHT_OK[a] ?? LIGHT_OK.morning, LIGHT_OK[b] ?? LIGHT_OK.morning, t);
  const L = oklab(bg)[0];
  // 1 = night. The flip is steep around L ≈ 0.55.
  const night = 1 - smooth(0.42, 0.52, L);
  const ink = mixOk(INK_DARK, INK_LIGHT, night);
  const card = mixOk(bg, PAPER, 0.3 * (1 - night) + 0.05 * night);
  // As the daylight beige darkens toward dusk, the copper deepens with it so
  // it keeps its contrast; after the flip it brightens for the dark page.
  const dusk = Math.min(1, Math.max(0, (0.8 - L) / 0.16)) * (1 - night);
  return {
    bg,
    ink,
    card,
    accent: mixOk(mixOk(ACC_DAY, ACC_DUSK, dusk), ACC_NIGHT, night),
    accentInk: mixOk(mixOk(ACC_INK_DAY, ACC_INK_DUSK, dusk), ACC_INK_NIGHT, night),
    night,
  };
}

const css = ([r, g, b]: RGB, a = 1) =>
  a >= 1 ? `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)})` : `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)} / ${a})`;

let lastKey = "";
export function applyPalette(p: Palette) {
  const key = [p.bg, p.ink, p.accent].flat().map((v) => Math.round(v * 255)).join(",");
  if (key === lastKey) return;
  lastKey = key;
  const s = document.documentElement.style;
  s.setProperty("--bg", css(p.bg));
  s.setProperty("--card", css(p.card));
  s.setProperty("--ink", css(p.ink));
  s.setProperty("--ink-2", css(p.ink, 0.66));
  s.setProperty("--ink-3", css(p.ink, 0.42));
  s.setProperty("--rule", css(p.ink, 0.18));
  s.setProperty("--rule-2", css(p.ink, 0.09));
  s.setProperty("--accent", css(p.accent));
  s.setProperty("--accent-ink", css(p.accentInk));
  // Hairline figures: the plate is the card they sit on; the lit stroke is copper.
  s.setProperty("--hairline-plate", css(p.card));
  s.setProperty("--hairline-hi", css(p.accent));
  s.setProperty("--hairline-edge", css(p.ink, 0.86));
  s.setProperty("--hairline-mid", css(p.ink, 0.46));
  s.setProperty("--hairline-lo", css(p.ink, 0.2));
  s.setProperty("--hairline-stroke", "0.9");
  document.documentElement.classList.toggle("is-night", p.night > 0.5);
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute("content", "#120C08");
}

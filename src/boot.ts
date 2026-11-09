// The opening: logging in to a terminal. Every line it prints is true: the
// ticker carries facts from the portfolio itself, and the WORLD line reports
// the real progress of the 3D scene loading behind it.

import { gsap } from "gsap";

export const TICKER: [string, string, string][] = [
  ["EDGT", "HSSL TOP 10 / 15,000+", "≈0.07%"],
  ["BFPI", "CORE ρ +0.722", "FULL ρ +0.111"],
  ["SG.FISC", "MULTIPLIER ≈ 0.88", "EE"],
  ["NFO", "NATIONAL FINALIST", "50,000+ FIELD"],
  ["TFF", "ISSUE 01 · JUN 2026", "30PP"],
  ["PAPERS", "UNDER PEER REVIEW", "×2"],
  ["IEIL", "6 LABS", "iBFPI · 5 BANKS"],
  ["SPRINT", "100/200/400M", "1ST · BEST ATHLETE"],
  ["DIST", "21K ×2", "42K PLANNED"],
  ["XMAS.BOX", "100+ KITS", "SINCE 2024"],
  ["TEACH", "CPU/GPU SEMINAR", "35 STUDENTS"],
  ["KSPCA", "₹20,000 RAISED", "2022"],
];

const IST = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
export const istNow = () => IST.format(new Date()).replace(",", "").toUpperCase();

type BootOpts = { quick: boolean; reduced: boolean; progress: () => number; onExitStart: () => void };

export function runBoot({ quick, reduced, progress, onExitStart }: BootOpts): Promise<void> {
  const root = document.getElementById("boot")!;
  const screen = document.getElementById("bootScreen")!;
  const log = document.getElementById("bootLog")!;
  const keys = document.getElementById("bootKeys")!;
  const ticker = document.getElementById("bootTicker")!;
  const tickerWrap = ticker.parentElement!;
  const hint = document.getElementById("bootHint")!;
  const time = document.getElementById("bootTime")!;
  const crt = document.getElementById("bootCrt")!;

  const tick = () => (time.textContent = `${istNow()} IST`);
  tick();
  const clock = window.setInterval(tick, 1000);

  const items = TICKER.map(([k, v, c]) => `<span>${k}<b>${v}</b><i>${c} ▲</i></span>`).join("");
  ticker.innerHTML = items + items;

  // How many monospace columns fit, so the leader dots end on the right edge.
  const probe = document.createElement("span");
  probe.textContent = "0".repeat(20);
  probe.style.visibility = "hidden";
  log.appendChild(probe);
  const cw = probe.getBoundingClientRect().width / 20 || 9;
  probe.remove();
  const cols = Math.max(34, Math.min(78, Math.floor(log.clientWidth / cw) - 1));
  const roomy = cols >= 66;
  const lead = (left: string, rightLen = 4) => left + " " + ".".repeat(Math.max(3, cols - left.length - rightLen - 2)) + " ";

  let skipped = false;
  let done = false;
  let resolveRun!: () => void;
  const finished = new Promise<void>((r) => (resolveRun = r));
  const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, skipped ? 0 : ms));

  const line = (html = "") => {
    const el = document.createElement("div");
    el.innerHTML = html || "&nbsp;";
    log.appendChild(el);
    return el;
  };
  const type = async (el: HTMLElement, prefix: string, text: string, speed: number) => {
    for (let i = 1; i <= text.length; i++) {
      if (skipped) break;
      el.innerHTML = `${prefix}${text.slice(0, i)}<span class="caret"></span>`;
      await wait(speed + Math.random() * speed * 0.8);
    }
    el.innerHTML = `${prefix}${text}`;
  };

  const exit = async () => {
    if (done) return;
    done = true;
    window.clearInterval(clock);
    removeEventListener("keydown", skip);
    root.removeEventListener("pointerdown", skip);
    onExitStart();
    if (reduced) {
      await gsap.to(root, { opacity: 0, duration: 0.4 });
    } else {
      const tl = gsap.timeline();
      tl.to(screen, { scaleY: 0.004, filter: "brightness(2.4)", duration: 0.32, ease: "power3.in" })
        .set(screen, { opacity: 0 })
        .set(crt, { opacity: 1, scaleX: 1 })
        .to(crt, { scaleX: 0, duration: 0.28, ease: "power3.in" })
        .to(crt, { opacity: 0, duration: 0.1 }, "-=0.04")
        .to(root, { backgroundColor: "rgba(5,3,2,0)", duration: 0.55, ease: "power2.out" }, "-=0.1");
      await tl;
    }
    resolveRun();
  };

  const skip = (e: Event) => {
    if (e instanceof KeyboardEvent && (e.metaKey || e.ctrlKey || e.altKey)) return;
    skipped = true;
    void exit();
  };
  addEventListener("keydown", skip);
  root.addEventListener("pointerdown", skip);

  const ok = '<span class="ok">OK</span>';

  (async () => {
    if (quick || reduced) {
      line(`<span class="dim">NZ TERMINAL · SESSION RESUMED · ${istNow()} IST</span>`);
      line(lead("LOGIN : NZEGENBAL", 2) + ok);
      line('<span class="big">Nathaniel Zegenbal</span>');
      keys.classList.add("on");
      tickerWrap.classList.add("on");
      await wait(reduced ? 900 : 1100);
      return exit();
    }

    if (roomy) line('<span class="dim">NZ TERMINAL — PERSONAL RESEARCH SYSTEM · REL 12.0</span>');
    line(`<span class="dim">CHENNAI NODE · 13.08°N 80.27°E${roomy ? ` · ${istNow()} IST` : ""}</span>`);
    line();
    await wait(260);
    const l1 = line();
    await type(l1, "LOGIN     : ", "NZEGENBAL", 52);
    await wait(140);
    const l2 = line();
    await type(l2, "PASSWORD  : ", "••••••••••", 26);
    await wait(120);
    const l3 = line(lead("AUTHENTICATING", 2));
    await wait(420);
    l3.innerHTML += ok;
    hint.textContent = "AUTHENTICATED · LOADING";
    line();

    const loadRow = async (label: string, body: string, ms: number) => {
      const b = roomy ? body : "";
      const el = line(`<span class="dim">LOAD</span>  ${label.padEnd(10)}${b}`);
      await wait(ms);
      el.innerHTML = lead(`LOAD  ${label.padEnd(10)}${b}`, 2) + ok;
    };
    await loadRow("RESEARCH", "BFPI · CAPABILITY-TO-OWNERSHIP", 240);
    await loadRow("VENTURES", "EDGT · TFF · BTC · IEIL · SUBS", 220);

    // The world line reports the actual scene progress.
    const w = line();
    const bar = (p: number) => {
      const n = 12, f = Math.round(p * n);
      return `${"█".repeat(f)}${"░".repeat(n - f)}`;
    };
    const t0 = performance.now();
    for (;;) {
      const p = Math.min(1, progress());
      w.innerHTML = `<span class="dim">LOAD</span>  ${"WORLD".padEnd(10)}${roomy ? "LINE GEOMETRY " : ""}<span class="hi">${bar(p)}</span> ${String(Math.round(p * 100)).padStart(3)}%`;
      if (p >= 1 || skipped || performance.now() - t0 > 6000) break;
      await wait(60);
    }
    w.innerHTML = lead(`LOAD  ${"WORLD".padEnd(10)}${roomy ? "LINE GEOMETRY " : ""}${bar(1)} 100%`, 2) + ok;
    line();
    keys.classList.add("on");
    tickerWrap.classList.add("on");
    line('<span class="dim">WELCOME,</span>');
    line('<span class="big">Nathaniel Zegenbal</span>');
    hint.textContent = "READY · ENTERING AT 07:00 IST";
    await wait(1300);
    await exit();
  })();

  return finished;
}

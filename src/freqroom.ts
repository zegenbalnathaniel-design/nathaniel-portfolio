// The Frequency Room — an analog sound machine.
//
// One isometric line drawing of a small 1970s studio: a turntable whose
// platter you can flick, a cassette deck whose reels trade tape as it plays,
// a synthesizer you can actually play (pointer, or A–K on the keyboard),
// two VU meters whose needles ride springs, and an oscilloscope that draws
// the waveform the synth is making. Charcoal plate, ivory linework, amber
// where something is lit. Every mechanism is a spring or a rate, never a
// keyframe, so it answers the hand the way a machine would.

type V3 = [number, number, number];

// ---------------------------------------------------------------- isometric drawing
const S = 15, OX = 302, OY = 108, C = Math.cos(Math.PI / 6), H = 0.5;
const px = (x: number, y: number, z: number): [number, number] => [OX + (x - z) * C * S, OY + (x + z) * H * S - y * S];
const P = (x: number, y: number, z: number) => px(x, y, z).map((v) => v.toFixed(1)).join(" ");
const poly = (pts: V3[], cls = "f", extra = "") => `<path class="${cls}" ${extra} d="M${pts.map((p) => P(...p)).join(" L")} Z"/>`;
const seg = (a: V3, b: V3, cls = "i") => `<path class="${cls}" d="M${P(...a)} L${P(...b)}"/>`;
/** A box as its three visible faces (top, +x, +z), filled so it hides what is behind it. */
const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, cls = "f") =>
  poly([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], cls) +
  poly([[x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [x1, y0, z0]], cls) +
  poly([[x0, y1, z1], [x1, y1, z1], [x1, y0, z1], [x0, y0, z1]], cls);
/** The horizontal plane through (cx, cy, cz): local (u, w) are offsets along x and z. */
const mXZ = (cx: number, cy: number, cz: number) => { const [e, f] = px(cx, cy, cz); return `matrix(${(C * S).toFixed(4)} ${(H * S).toFixed(4)} ${(-C * S).toFixed(4)} ${(H * S).toFixed(4)} ${e.toFixed(1)} ${f.toFixed(1)})`; };
/** The vertical plane facing the viewer through (cx, cy, cz): local (u, v) are offsets along x and up. */
const mXY = (cx: number, cy: number, cz: number) => { const [e, f] = px(cx, cy, cz); return `matrix(${(C * S).toFixed(4)} ${(H * S).toFixed(4)} 0 ${-S} ${e.toFixed(1)} ${f.toFixed(1)})`; };
const fx = (v: number) => v.toFixed(3);
/** A vertical cylinder: top disc, the front half of the bottom rim, and the two silhouette lines. */
function cyl(cx: number, y0: number, y1: number, cz: number, r: number, cls = "f") {
  const a = -Math.PI / 4, b = (3 * Math.PI) / 4;
  const side = poly([[cx + Math.cos(a) * r, y1, cz + Math.sin(a) * r], [cx + Math.cos(b) * r, y1, cz + Math.sin(b) * r], [cx + Math.cos(b) * r, y0, cz + Math.sin(b) * r], [cx + Math.cos(a) * r, y0, cz + Math.sin(a) * r]], cls);
  const rim = `<g transform="${mXZ(cx, y0, cz)}"><path class="i" d="M${fx(Math.cos(a) * r)} ${fx(Math.sin(a) * r)} A${r} ${r} 0 0 1 ${fx(Math.cos(b) * r)} ${fx(Math.sin(b) * r)}"/></g>`;
  const top = `<g transform="${mXZ(cx, y1, cz)}"><circle class="${cls}" r="${r}"/></g>`;
  return side + rim + top;
}
const itext = (x: number, y: number, z: number, t: string, size = 0.55, cls = "t", anchor = "start") =>
  `<text class="${cls}" transform="${mXZ(x, y, z)}" font-size="${size}" text-anchor="${anchor}">${t}</text>`;
const ftext = (x: number, y: number, z: number, t: string, size = 0.55, cls = "t", anchor = "start") =>
  `<text class="${cls}" transform="${mXY(x, y, z)} scale(1 -1)" font-size="${size}" text-anchor="${anchor}">${t}</text>`;

// ---------------------------------------------------------------- the instrument's parts
const WHITE = [60, 62, 64, 65, 67, 69, 71, 72], BLACK: Record<number, number> = { 0: 61, 1: 63, 3: 66, 4: 68, 5: 70 };
const NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const noteName = (m: number) => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`;
const KEYMAP: Record<string, number> = { a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72 };
const WAVES = ["sawtooth", "square", "triangle"] as const;
const WAVE_LABEL = ["SAW", "SQR", "TRI"];

function drawScene(): string {
  let g = "";
  // the desk
  g += box(0, 48, 0, 2, 0, 16, "f");
  g += seg([0, 2, 0.6], [48, 2, 0.6], "s") + seg([0.6, 2, 0], [0.6, 2, 16], "s"); // the back rails

  // ---- turntable
  g += box(1, 13, 2, 3.2, 2, 14);
  g += cyl(7, 3.2, 3.55, 8, 4.7);
  g += `<g transform="${mXZ(7, 3.6, 8)}"><g id="ttPlatter" data-act="platter">
    <circle class="f" r="4.3"/>
    ${[1.7, 2.3, 2.9, 3.5, 3.95].map((r) => `<circle class="s" r="${r}"/>`).join("")}
    <circle class="al" r="1.3"/><circle class="i" r="1.3" fill="none"/>
    <path class="i" d="M0.35 0 L1.15 0"/><circle class="i" r="0.1" cx="-0.6" cy="0.55"/>
    <path class="s" d="M-4.1 0 L-3.6 0"/>
  </g><circle class="f" r="0.14"/></g>`;
  g += cyl(7, 3.6, 4.25, 8, 0.12, "i");
  // the tonearm: a pivot, a counterweight, the arm, and the headshell over the record
  g += cyl(12, 3.2, 4.3, 3.2, 0.55);
  g += seg([12, 4.3, 3.2], [12.7, 4.3, 2.5], "i") + cyl(12.7, 4.05, 4.5, 2.5, 0.3);
  g += `<g id="ttArm">${seg([12, 4.3, 3.2], [8.1, 4.05, 6.1], "i")}${seg([12, 4.22, 3.2], [8.1, 3.97, 6.1], "i")}${box(7.6, 8.3, 3.7, 4.05, 5.9, 6.5)}</g>`;
  // the speed switch
  g += box(2, 3.4, 3.2, 3.5, 12, 13.2);
  g += `<g id="ttSpeed" data-act="speed" transform="${mXZ(2.7, 3.5, 12.6)}"><rect class="hit" x="-1.2" y="-1" width="2.4" height="2"/><path class="i" id="ttLever" d="M0 0 L-0.45 -0.45"/><circle class="i" r="0.14"/></g>`;
  g += itext(1.9, 3.5, 13.6, "33", 0.5, "t") + itext(3.1, 3.5, 13.6, "45", 0.5, "t");
  g += itext(1.4, 3.2, 14.45, "DIRECT DRIVE · FLICK TO SPIN", 0.5, "tl");

  // ---- cassette deck
  g += box(15, 27, 2, 4.2, 3, 12);
  g += `<g transform="${mXZ(0, 4.21, 0)}">
    <path class="f2" d="M16.5 4 L25.5 4 L25.5 9.6 L16.5 9.6 Z"/>
    <path class="s" d="M17.3 9 L24.7 9"/><path class="s" d="M17.3 9 L17.6 8.3"/><path class="s" d="M24.7 9 L24.4 8.3"/>
    <circle class="i" cx="21" cy="9" r="0.18"/><circle class="f" cx="21.55" cy="9" r="0.36"/>
    <g id="csL" transform="translate(18.9 6.8)"><circle class="al" id="csPackL" r="2"/><g id="csReelL"><circle class="f" r="0.8"/>${[0, 60, 120, 180, 240, 300].map((a) => `<path class="i" transform="rotate(${a})" d="M0.45 0 L0.8 0"/>`).join("")}</g></g>
    <g id="csR" transform="translate(23.1 6.8)"><circle class="al" id="csPackR" r="0.95"/><g id="csReelR"><circle class="f" r="0.8"/>${[0, 60, 120, 180, 240, 300].map((a) => `<path class="i" transform="rotate(${a})" d="M0.45 0 L0.8 0"/>`).join("")}</g></g>
    <path class="f2" d="M23.2 10.3 L26.2 10.3 L26.2 11.5 L23.2 11.5 Z"/>
    <text class="tc" id="csCounter" x="24.7" y="11.15" font-size="0.75" text-anchor="middle">000</text>
    <circle class="led" id="csLed" cx="26.65" cy="10.9" r="0.22"/>
  </g>`;
  const btn = (id: string, x0: number, label: string) =>
    `<g id="csBtn-${id}" data-act="btn" data-btn="${id}">${box(x0, x0 + 1.8, 4.2, 5.0, 10.2, 11.6)}${itext(x0 + 0.2, 5.0, 11.25, label, 0.5, "tb")}</g>`;
  g += btn("rew", 16.3, "◀◀") + btn("play", 18.5, "PLAY") + btn("stop", 20.7, "STOP");
  g += itext(15.4, 4.2, 12.5, "CASSETTE · TAPE MOVES FROM REEL TO REEL", 0.5, "tl");

  // ---- the rack: VU meters and the oscilloscope, on the faces that look at you
  g += box(29, 38.5, 2, 9, 0, 3.5) + box(39.5, 47, 2, 9, 0, 3.5);
  g += `<g transform="${mXY(0, 0, 3.51)}">
    <rect class="lamp" x="29.9" y="2.5" width="8.3" height="0.7" rx="0.1"/>
    ${[29.8, 34.2].map((x0, i) => {
      const xc = x0 + 2, py = 4.5;
      let m = `<rect class="f2" x="${x0}" y="4" width="4" height="4.3" rx="0.12"/>`;
      let arc = "";
      for (let a = -50; a <= 50; a += 10) {
        const r0 = 3.0, r1 = a % 50 === 0 ? 2.55 : a % 20 === 0 ? 2.7 : 2.82;
        const sa = Math.sin((a * Math.PI) / 180), ca = Math.cos((a * Math.PI) / 180);
        arc += `<path class="${a > 20 ? "a" : "i"}" d="M${fx(xc + sa * r0)} ${fx(py + ca * r0)} L${fx(xc + sa * r1)} ${fx(py + ca * r1)}"/>`;
      }
      const A = (d: number, r: number) => `${fx(xc + Math.sin((d * Math.PI) / 180) * r)} ${fx(py + Math.cos((d * Math.PI) / 180) * r)}`;
      arc += `<path class="i" d="M${A(-50, 3)} A3 3 0 0 1 ${A(20, 3)}"/><path class="a" d="M${A(20, 3)} A3 3 0 0 1 ${A(50, 3)}"/>`;
      m += arc;
      m += `<text class="tf" x="${fx(xc)}" y="${fx(py + 3.55)}" font-size="0.5" text-anchor="middle">VU · ${i ? "R" : "L"}</text>`;
      m += `<text class="tf" x="${fx(xc - 2.3)}" y="${fx(py + 2.1)}" font-size="0.42">-20</text><text class="tf" x="${fx(xc + 1.9)}" y="${fx(py + 2.1)}" font-size="0.42">+3</text>`;
      m += `<g transform="translate(${fx(xc)} ${fx(py)})"><g id="vu${i}"><path class="n" d="M0 0 L0 3.2"/></g><circle class="f" r="0.22"/></g>`;
      return m;
    }).join("")}
    <text class="tf" x="30" y="8.75" font-size="0.46">MONITOR · THE NEEDLE RIDES A SPRING</text>
    <rect class="f2" x="40.3" y="3.4" width="5.9" height="4.8" rx="0.3"/>
    ${[1, 2, 3, 4].map((i) => `<path class="g" d="M${fx(40.3 + (i * 5.9) / 5)} 3.5 L${fx(40.3 + (i * 5.9) / 5)} 8.1"/>`).join("")}
    ${[1, 2, 3].map((i) => `<path class="g" d="M40.4 ${fx(3.4 + (i * 4.8) / 4)} L46.1 ${fx(3.4 + (i * 4.8) / 4)}"/>`).join("")}
    <path class="trace" id="scope" d="M40.4 5.8 L46.1 5.8"/>
    <text class="tf" x="40.3" y="8.75" font-size="0.46">SCOPE · TWO CYCLES OF THE LOWEST NOTE</text>
    <g transform="translate(41.3 2.75)"><circle class="f" r="0.32"/><path class="i" d="M0 0 L0 0.28"/></g>
    <g transform="translate(45.2 2.75)"><circle class="f" r="0.32"/><path class="i" d="M0 0 L0.2 0.2"/></g>
    <text class="tf" x="41.9" y="2.9" font-size="0.4">TIME</text><text class="tf" x="44.6" y="2.9" font-size="0.4" text-anchor="end">VOLT</text>
  </g>`;

  // ---- synthesizer: panel, knobs, switches, keys
  g += box(29, 47, 2, 3.2, 5, 14.5);
  g += box(29.3, 46.7, 3.2, 4.6, 5.3, 8.3);
  const knob = (i: number, x: number, label: string) =>
    `<g transform="${mXZ(x, 4.61, 6.7)}" data-act="knob" data-knob="${i}"><circle class="hit" r="1.1"/><circle class="f" r="0.75"/><g id="knob${i}"><path class="a" d="M0 0 L0 -0.62"/></g></g>` +
    itext(x - 1.0, 4.61, 8.0, label, 0.44, "tl");
  g += knob(0, 31.6, "CUTOFF") + knob(1, 34.6, "RESO") + knob(2, 37.6, "DECAY");
  g += `<g transform="${mXZ(0, 4.61, 0)}" data-act="wave"><rect class="hit" x="39.6" y="5.6" width="3.6" height="2.4"/><rect class="f2" x="40.2" y="5.9" width="0.6" height="1.9" rx="0.3"/><rect class="f" id="syWave" x="40.08" y="5.95" width="0.84" height="0.5" rx="0.1"/>
    ${WAVE_LABEL.map((w, i) => `<text class="tl" x="41.2" y="${fx(6.35 + i * 0.65)}" font-size="0.44">${w}</text>`).join("")}</g>`;
  g += `<g transform="${mXZ(0, 4.61, 0)}" data-act="power"><rect class="hit" x="43.3" y="5.7" width="3.3" height="2.3"/><rect class="f2" x="43.7" y="6.2" width="1.3" height="0.9" rx="0.1"/><rect class="f" id="syPower" x="43.75" y="6.25" width="0.6" height="0.8" rx="0.08"/><circle class="led" id="syLed" cx="46" cy="6.65" r="0.25"/><text class="tl" x="43.6" y="7.7" font-size="0.44">SOUND</text></g>`;
  g += itext(29.5, 4.61, 5.8, "SYNTH · PLAY WITH THE POINTER, OR A–K", 0.46, "tl");
  for (let i = 0; i < 8; i++) {
    const x0 = 29.4 + i * 2.15;
    g += `<g id="key${WHITE[i]}" class="key" data-act="key" data-note="${WHITE[i]}">${box(x0, x0 + 2.1, 3.2, 3.9, 8.6, 14.3)}<path class="kl" d="M${P(x0 + 0.3, 3.91, 13.9)} L${P(x0 + 1.8, 3.91, 13.9)}"/></g>`;
  }
  for (const [iw, n] of Object.entries(BLACK)) {
    const xc = 29.4 + (+iw + 1) * 2.15;
    g += `<g id="key${n}" class="key black" data-act="key" data-note="${n}">${box(xc - 0.6, xc + 0.6, 3.2, 4.6, 8.6, 12)}</g>`;
  }
  g += itext(29.5, 3.2, 15.0, "C4", 0.46, "tl") + itext(44.7, 3.2, 15.0, "C5", 0.46, "tl");
  return g;
}

// ---------------------------------------------------------------- springs and state
class Spring {
  x = 0; v = 0;
  constructor(public k: number, public c: number, x = 0) { this.x = x; }
  to(target: number, dt: number) {
    const a = this.k * (target - this.x) - this.c * this.v;
    this.v += a * dt; this.x += this.v * dt;
    return Math.abs(this.v) > 1e-3 || Math.abs(target - this.x) > 1e-3;
  }
  set(x: number) { this.x = x; this.v = 0; }
}
type Voice = { note: number; env: number; on: boolean; phase: number; osc?: OscillatorNode; gain?: GainNode; filt?: BiquadFilterNode };

export function initFrequencyRoom(reduced: boolean) {
  const host = document.getElementById("freq");
  if (!host) return;
  host.innerHTML = `<svg class="freq-svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs><filter id="frGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <text class="tt" x="24" y="34">THE FREQUENCY ROOM</text><text class="ts" x="24" y="50">AN ANALOG SOUND MACHINE · EVERY PART MOVES ON A SPRING</text>
    <text class="ts" x="976" y="582" text-anchor="end" id="frRead">AT REST</text>
    ${drawScene()}
  </svg>`;
  const svg = host.querySelector("svg")!;
  const $ = (id: string) => svg.querySelector<SVGElement>("#" + id)!;
  const read = host.closest("figure")?.querySelector<HTMLElement>("[data-read]") ?? null;
  const frRead = $("frRead");
  const say = (t: string) => { frRead.textContent = t.toUpperCase(); if (read) read.textContent = t; };

  // ---- state
  let rpm45 = false;
  const platterW = new Spring(6, 3, 0); // angular velocity follows the motor; a flick pushes it
  let platterA = 0;
  const motorW = () => ((rpm45 ? 45 : 33.33) / 60) * Math.PI * 2;
  const tape = { playing: false, rewinding: false, p: 0.18, aL: 0, aR: 0 };
  const btnS: Record<string, Spring> = { rew: new Spring(420, 18), play: new Spring(420, 18), stop: new Spring(420, 18) };
  const knobs = [0.62, 0.3, 0.45];
  let wave = 0, power = true;
  const voices = new Map<number, Voice>();
  const keyS = new Map<number, Spring>();
  for (const n of [...WHITE, ...Object.values(BLACK)]) keyS.set(n, new Spring(900, 32));
  const vu = [new Spring(110, 8), new Spring(110, 9)];

  // ---- audio, only after a gesture and only when the switch is on
  let ctx: AudioContext | null = null, master: GainNode | null = null;
  const audio = () => {
    if (!power) return null;
    if (!ctx) {
      try { ctx = new AudioContext(); master = ctx.createGain(); master.gain.value = 0.11; master.connect(ctx.destination); } catch { return null; }
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  };
  const freq = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
  const noteOn = (n: number) => {
    if (voices.get(n)?.on) return;
    const v: Voice = { note: n, env: 0, on: true, phase: 0 };
    const ac = audio();
    if (ac && master) {
      const osc = ac.createOscillator(); osc.type = WAVES[wave]; osc.frequency.value = freq(n);
      const filt = ac.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 180 + knobs[0] * knobs[0] * 9000; filt.Q.value = 0.5 + knobs[1] * 14;
      const gain = ac.createGain(); gain.gain.setValueAtTime(0.0001, ac.currentTime); gain.gain.exponentialRampToValueAtTime(1, ac.currentTime + 0.012);
      osc.connect(filt); filt.connect(gain); gain.connect(master); osc.start();
      v.osc = osc; v.gain = gain; v.filt = filt;
    }
    voices.set(n, v);
    keyEl(n)?.classList.add("lit");
    say(`${noteName(n)} · ${WAVE_LABEL[wave].toLowerCase()}`);
  };
  const noteOff = (n: number) => {
    const v = voices.get(n);
    if (!v || !v.on) return;
    v.on = false;
    keyEl(n)?.classList.remove("lit");
    if (v.gain && ctx) {
      const rel = 0.08 + knobs[2] * 1.2;
      v.gain.gain.cancelScheduledValues(ctx.currentTime);
      v.gain.gain.setValueAtTime(Math.max(0.0001, v.gain.gain.value), ctx.currentTime);
      v.gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + rel);
      v.osc?.stop(ctx.currentTime + rel + 0.05);
    }
  };
  const keyEl = (n: number) => svg.querySelector<SVGGElement>(`#key${n}`);

  // ---- pointer: one handler, the part under the pointer decides
  type Drag = { kind: "platter"; lastA: number; lastT: number } | { kind: "knob"; i: number; y0: number; v0: number } | { kind: "key"; note: number };
  let drag: Drag | null = null;
  const platterCenter = () => { const r = svg.getBoundingClientRect(); const [cx, cy] = px(7, 3.6, 8); return { x: r.left + (cx / 1000) * r.width, y: r.top + (cy / 600) * r.height, k: r.width / 1000 }; };
  const platterAngle = (e: PointerEvent) => {
    // back from the screen into the platter's own plane: u − w = X/(C·S), u + w = Y/(H·S)
    const c = platterCenter();
    const X = (e.clientX - c.x) / c.k / (C * S), Y = (e.clientY - c.y) / c.k / (H * S);
    return Math.atan2((Y - X) / 2, (Y + X) / 2);
  };
  svg.addEventListener("pointerdown", (e) => {
    const t = (e.target as Element).closest<SVGElement>("[data-act]");
    if (!t) return;
    e.preventDefault();
    host.focus({ preventScroll: true });
    const act = t.dataset.act;
    if (act === "key") { const n = +t.dataset.note!; noteOn(n); drag = { kind: "key", note: n }; }
    else if (act === "platter") { drag = { kind: "platter", lastA: platterAngle(e), lastT: performance.now() }; say("platter in hand"); }
    else if (act === "knob") { const i = +t.dataset.knob!; drag = { kind: "knob", i, y0: e.clientY, v0: knobs[i] }; }
    else if (act === "btn") { transport(t.dataset.btn!); }
    else if (act === "speed") { rpm45 = !rpm45; $("ttLever").setAttribute("d", rpm45 ? "M0 0 L0.45 -0.45" : "M0 0 L-0.45 -0.45"); say(rpm45 ? "45 rpm" : "33⅓ rpm"); }
    else if (act === "wave") { wave = (wave + 1) % 3; $("syWave").setAttribute("y", fx(5.95 + wave * 0.65)); for (const v of voices.values()) if (v.osc) v.osc.type = WAVES[wave]; say(`${WAVE_LABEL[wave].toLowerCase()} wave`); }
    else if (act === "power") { power = !power; $("syPower").setAttribute("x", power ? "43.75" : "44.35"); $("syLed").classList.toggle("on", power); if (!power) for (const n of [...voices.keys()]) noteOff(n); say(power ? "sound on" : "sound off"); }
    if (drag) svg.setPointerCapture(e.pointerId);
    wake();
  });
  svg.addEventListener("pointermove", (e) => {
    if (!drag) return;
    if (drag.kind === "platter") {
      const a = platterAngle(e), now = performance.now();
      let d = a - drag.lastA; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
      const dt = Math.max(1, now - drag.lastT) / 1000;
      platterA += d; platterW.set(d / dt);
      drag.lastA = a; drag.lastT = now;
    } else if (drag.kind === "knob") {
      const v = Math.min(1, Math.max(0, drag.v0 - (e.clientY - drag.y0) / 140));
      knobs[drag.i] = v;
      for (const vc of voices.values()) {
        if (vc.filt && drag.i < 2) { vc.filt.frequency.value = 180 + knobs[0] * knobs[0] * 9000; vc.filt.Q.value = 0.5 + knobs[1] * 14; }
      }
      say(`${["cutoff", "resonance", "decay"][drag.i]} ${Math.round(v * 100)}%`);
    } else if (drag.kind === "key") {
      // slide along the keys like a glissando
      const t = document.elementFromPoint(e.clientX, e.clientY)?.closest<SVGElement>("[data-act=key]");
      const n = t ? +t.dataset.note! : -1;
      if (n >= 0 && n !== drag.note) { noteOff(drag.note); noteOn(n); drag.note = n; }
    }
    wake();
  });
  const release = () => {
    if (!drag) return;
    if (drag.kind === "key") noteOff(drag.note);
    if (drag.kind === "platter") say("platter released");
    drag = null; wake();
  };
  svg.addEventListener("pointerup", release);
  svg.addEventListener("pointercancel", release);
  svg.addEventListener("lostpointercapture", release);

  // keyboard: the figure is a group with focus; letters play, like on the panel
  host.addEventListener("keydown", (e) => {
    const n = KEYMAP[e.key.toLowerCase()];
    if (n === undefined || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    e.preventDefault(); e.stopPropagation();
    noteOn(n); wake();
  });
  host.addEventListener("keyup", (e) => { const n = KEYMAP[e.key.toLowerCase()]; if (n !== undefined) { noteOff(n); wake(); } });
  host.addEventListener("blur", () => { for (const n of [...voices.keys()]) noteOff(n); });

  const transport = (b: string) => {
    if (b === "play") { tape.playing = !tape.playing && tape.p < 1; tape.rewinding = false; say(tape.playing ? "tape running" : "tape stopped"); }
    else if (b === "rew") { tape.rewinding = !tape.rewinding && tape.p > 0; tape.playing = false; say(tape.rewinding ? "rewinding" : "tape stopped"); }
    else { tape.playing = tape.rewinding = false; say("tape stopped"); }
    $("csLed").classList.toggle("on", tape.playing);
    stopPop = performance.now() + 160;
  };
  let stopPop = 0;

  // ---- the frame: everything that moves, moves here
  const scope = $("scope"), vuEl = [$("vu0"), $("vu1")], platterEl = $("ttPlatter"), reelL = $("csReelL"), reelR = $("csReelR"), packL = $("csPackL"), packR = $("csPackR"), counter = $("csCounter");
  const knobEls = [0, 1, 2].map((i) => $(`knob${i}`));
  let inView = false, running = false, last = 0;
  new IntersectionObserver((en) => { inView = en[0].isIntersecting; if (inView) wake(); }, { rootMargin: "15% 0px" }).observe(host);
  function wake() { if (!running && inView) { running = true; last = performance.now(); requestAnimationFrame(tick); } }

  function tick(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    let busy = !!drag || voices.size > 0 || tape.playing || tape.rewinding;

    // turntable: velocity springs back to the motor's; a flick overshoots and settles
    if (!(drag?.kind === "platter")) {
      if (reduced) platterW.set(0); else { platterW.to(motorW(), dt); busy = true; }
      platterA += platterW.x * dt;
    }
    platterEl.setAttribute("transform", `rotate(${((platterA * 180) / Math.PI).toFixed(2)})`);

    // cassette: tape speed is constant, so each reel turns at speed / its own radius
    if (tape.playing || tape.rewinding) {
      const v = tape.rewinding ? -6 : 1;
      tape.p = Math.min(1, Math.max(0, tape.p + (v * dt) / 60));
      const rL = 0.95 + (1 - tape.p) * 1.05, rR = 0.95 + tape.p * 1.05;
      tape.aL += (v * 2.6 * dt) / rL; tape.aR += (v * 2.6 * dt) / rR;
      packL.setAttribute("r", fx(rL)); packR.setAttribute("r", fx(rR));
      reelL.setAttribute("transform", `rotate(${((tape.aL * 180) / Math.PI).toFixed(2)})`);
      reelR.setAttribute("transform", `rotate(${((tape.aR * 180) / Math.PI).toFixed(2)})`);
      counter.textContent = String(Math.round(tape.p * 999)).padStart(3, "0");
      if (tape.p >= 1 || tape.p <= 0) { tape.playing = tape.rewinding = false; $("csLed").classList.remove("on"); say(tape.p >= 1 ? "end of side" : "rewound"); }
    }
    for (const b of ["rew", "play", "stop"]) {
      const down = (b === "play" && tape.playing) || (b === "rew" && tape.rewinding) || (b === "stop" && now < stopPop);
      const s = btnS[b];
      if (reduced) s.set(down ? 0.45 : 0); else if (s.to(down ? 0.45 : 0, dt)) busy = true;
      $(`csBtn-${b}`).setAttribute("transform", `translate(0 ${fx(s.x * S)})`);
    }

    // synth: envelopes for the picture (the sound has its own), keys on springs
    let level = 0, lowest = 128;
    for (const [n, v] of voices) {
      const rel = 0.08 + knobs[2] * 1.2;
      v.env = v.on ? Math.min(1, v.env + dt / 0.012) : v.env * Math.exp(-dt / (rel * 0.35));
      if (!v.on && v.env < 0.004) { voices.delete(n); continue; }
      level += v.env; if (n < lowest) lowest = n;
    }
    for (const [n, s] of keyS) {
      const down = voices.get(n)?.on ? 0.3 : 0;
      if (reduced) s.set(down); else if (s.to(down, dt)) busy = true;
      keyEl(n)!.setAttribute("transform", `translate(0 ${fx(s.x * S)})`);
    }
    knobEls.forEach((k, i) => k.setAttribute("transform", `rotate(${fx(-135 + knobs[i] * 270)})`));

    // the scope: two cycles of the lowest note, every voice added in, drawn as it is
    const N = 72, w0 = 40.4, w1 = 46.1, yc = 5.8, amp = 1.9;
    let d = "";
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      let y = 0;
      if (voices.size) {
        for (const v of voices.values()) {
          const ph = (u * 2 * freq(v.note)) / freq(lowest);
          const t = ph - Math.floor(ph);
          const w = wave === 0 ? 2 * t - 1 : wave === 1 ? (t < 0.5 ? 1 : -1) : 4 * Math.abs(t - 0.5) - 1;
          y += w * v.env * 0.55;
        }
        y = Math.max(-1, Math.min(1, y)) * (0.35 + knobs[0] * 0.65);
      } else if (!reduced) y = Math.sin(now / 900 + u * 7) * 0.012 + (Math.random() - 0.5) * 0.02;
      d += `${i ? "L" : "M"}${fx(w0 + u * (w1 - w0))} ${fx(yc + y * amp)} `;
    }
    scope.setAttribute("d", d);
    scope.classList.toggle("hot", level > 0.02);

    // VU: the needle chases the level on a spring, with a hair of wobble at rest
    const target = Math.min(1, level * 0.75) * 100 - 50;
    vu.forEach((s, i) => {
      const wob = reduced ? 0 : Math.sin(now / 700 + i * 2.1) * 1.2;
      if (reduced) s.set(target); else if (s.to(target + wob, dt)) busy = true;
      vuEl[i].setAttribute("transform", `rotate(${fx(-s.x)})`);
    });

    if (busy && inView) requestAnimationFrame(tick); else running = false;
  }
  // The first paint, and the idle machine
  vu.forEach((s) => s.set(-50));
  $("syLed").classList.add("on");
  wake();
  if (reduced) { last = performance.now(); tick(performance.now()); }
}

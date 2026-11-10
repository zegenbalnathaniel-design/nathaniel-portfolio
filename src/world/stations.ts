// The diorama: one small model per chapter, each on its own plinth, laid
// along a route like an architect's table. Solids are plain boxes, cylinders
// and tori; the line renderer turns them into drawings. Line geometry
// (grids, lanes, coastlines, sketch marks) is added on the LINE layer.

import {
  Box3,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  MeshBasicMaterial,
  CatmullRomCurve3,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Line,
  Mesh,
  Object3D,
  PlaneGeometry,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type BufferGeometry as BG,
} from "three";
import { LAYER_LINE, LAYER_MESH, LAYER_SHADOW, idMaterial } from "./pipeline";
import { LAND } from "../data/land";

export const M = {
  ink: new LineBasicMaterial({ transparent: true, opacity: 0.62, depthWrite: false }),
  inkSoft: new LineBasicMaterial({ transparent: true, opacity: 0.3, depthWrite: false }),
  grid: new LineBasicMaterial({ transparent: true, opacity: 0.075, depthWrite: false }),
  accent: new LineBasicMaterial({ transparent: true, opacity: 1, depthWrite: false }),
  accentSoft: new LineBasicMaterial({ transparent: true, opacity: 0.5, depthWrite: false }),
  dash: new LineDashedMaterial({ transparent: true, opacity: 0.5, dashSize: 0.22, gapSize: 0.18, depthWrite: false }),
  route: new LineDashedMaterial({ transparent: true, opacity: 0.32, dashSize: 0.9, gapSize: 0.7, depthWrite: false }),
};

/** sx, sy: where the target sits on screen, as a fraction of the view (negative sx = right of centre). */
export type CamKey = { target: Vector3; h: number; az: number; el: number; sx?: number; sy?: number };

// Spacing of the route: wide enough that a neighbour never drifts behind the copy.
const SX = 1.5, SZ = 1.3;

export type Spinner = {
  obj: Object3D;
  id: number;
  angle: number;
  vel: number;
  idle: number; // radians per second when nobody is holding it
  axis: "y" | "globe";
  goal?: number; // an angle to settle at (the globe turning to a chosen place)
  bx: number; // squash-and-stretch spring: displacement and velocity
  bv: number;
  name?: string;
};

export type Station = {
  key: string;
  group: Group;
  cam: CamKey;
  spinners: Spinner[];
  restLit?: number; // the object lit at rest, if any
  tick?: (t: number, dt: number, near: boolean) => boolean; // returns true while animating
  hero: Group | null; // everything but the plinth, so a click can make it bounce
  bx: number;
  bv: number;
};

let nextId = 2;
const newId = () => nextId++;

// ---------------------------------------------------------------- helpers
function mesh(geo: BG, id: number, parent: Object3D, x = 0, y = 0, z = 0) {
  const m = new Mesh(geo, idMaterial(id));
  m.position.set(x, y, z);
  m.layers.set(LAYER_MESH);
  parent.add(m);
  return m;
}
/** A box standing on y (its base at y). */
function box(p: Object3D, id: number, w: number, h: number, d: number, x = 0, y = 0, z = 0) {
  const g = new BoxGeometry(w, h, d);
  g.translate(0, h / 2, 0);
  return mesh(g, id, p, x, y, z);
}
function cyl(p: Object3D, id: number, r: number, h: number, x = 0, y = 0, z = 0, seg = 40, rTop = r) {
  const g = new CylinderGeometry(rTop, r, h, seg, 1);
  g.translate(0, h / 2, 0);
  return mesh(g, id, p, x, y, z);
}
function segs(p: Object3D, pts: number[], mat = M.ink, dashed = false) {
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pts, 3));
  const l = new LineSegments(g, mat);
  if (dashed) l.computeLineDistances();
  l.layers.set(LAYER_LINE);
  l.frustumCulled = false;
  p.add(l);
  return l;
}
function poly(p: Object3D, pts: Vector3[], mat = M.ink, dashed = false) {
  const g = new BufferGeometry().setFromPoints(pts);
  const l = new Line(g, mat);
  if (dashed) l.computeLineDistances();
  l.layers.set(LAYER_LINE);
  l.frustumCulled = false;
  p.add(l);
  return l;
}
function circle(cx: number, cz: number, r: number, y = 0.02, n = 72) {
  const pts: Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push(new Vector3(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r));
  }
  return pts;
}
function plinth(p: Object3D, w: number, d: number, h = 0.35) {
  return box(p, 1, w, h, d);
}
function boxEdgesDashed(p: Object3D, w: number, h: number, d: number, x: number, y: number, z: number) {
  const X = [x - w / 2, x + w / 2], Y = [y, y + h], Z = [z - d / 2, z + d / 2];
  const pts: number[] = [];
  const e = (a: number[], b: number[]) => pts.push(...a, ...b);
  for (const yy of Y) { e([X[0], yy, Z[0]], [X[1], yy, Z[0]]); e([X[1], yy, Z[0]], [X[1], yy, Z[1]]); e([X[1], yy, Z[1]], [X[0], yy, Z[1]]); e([X[0], yy, Z[1]], [X[0], yy, Z[0]]); }
  for (const xx of X) for (const zz of Z) e([xx, Y[0], zz], [xx, Y[1], zz]);
  return segs(p, pts, M.dash, true);
}
// ---- soft contact shadows: one blurred blob per footprint
const shadowTex = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(64, 64, 6, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,1)");
  r.addColorStop(0.45, "rgba(255,255,255,.55)");
  r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  return new CanvasTexture(c);
})();
export const SH = {
  ground: new MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.16, depthWrite: false }),
  object: new MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.26, depthWrite: false }),
};
function blob(p: Object3D, x: number, z: number, w: number, d: number, y: number, mat: MeshBasicMaterial) {
  const g = new PlaneGeometry(w, d);
  g.rotateX(-Math.PI / 2);
  const m = new Mesh(g, mat);
  m.position.set(x, y, z);
  m.layers.set(LAYER_SHADOW);
  m.renderOrder = -1;
  p.add(m);
  return m;
}
/** Shadows under a station's plinth and under what stands on it, then gathers
 *  everything but the plinth into a "hero" group that a click can bounce. */
function finish(st: Station, opts: { objects?: boolean } = {}) {
  const g = st.group;
  g.updateWorldMatrix(true, true);
  const base = new Box3(), objs = new Box3(), tmp = new Box3();
  const plinthMeshes: Object3D[] = [];
  g.children.forEach((c) => {
    if (c instanceof Mesh && c.material === idMaterial(1)) { plinthMeshes.push(c); base.union(tmp.setFromObject(c)); }
  });
  g.traverse((o) => {
    if (o instanceof Mesh && o.material !== idMaterial(1) && o.layers.isEnabled(LAYER_MESH)) objs.union(tmp.setFromObject(o));
  });
  const off = (v: Vector3) => v.sub(g.position);
  // a little toward the back: the key light comes from the front-left
  if (!base.isEmpty()) {
    const mn = off(base.min.clone()), mx = off(base.max.clone());
    blob(g, (mn.x + mx.x) / 2, (mn.z + mx.z) / 2 - 0.35, mx.x - mn.x + 2.2, mx.z - mn.z + 2.2, 0.012, SH.ground);
    if (opts.objects !== false && !objs.isEmpty()) {
      const a = off(objs.min.clone()), b = off(objs.max.clone());
      blob(g, (a.x + b.x) / 2, (a.z + b.z) / 2 - 0.2, (b.x - a.x) * 1.25 + 0.6, (b.z - a.z) * 1.25 + 0.6, mx.y + 0.014, SH.object);
    }
  }
  const hero = new Group();
  g.children.slice().forEach((c) => {
    if (plinthMeshes.includes(c) || c.layers.isEnabled(LAYER_SHADOW)) return;
    hero.add(c);
  });
  g.add(hero);
  st.hero = hero;
}

function station(key: string, x: number, z: number, cam: Omit<CamKey, "target"> & { dx?: number; dy?: number; dz?: number }): Station {
  const group = new Group();
  x *= SX; z *= SZ;
  group.position.set(x, 0, z);
  return { key, group, spinners: [], hero: null, bx: 0, bv: 0, cam: { target: new Vector3(x + (cam.dx ?? 0), cam.dy ?? 1.2, z + (cam.dz ?? 0)), h: cam.h, az: cam.az, el: cam.el, sx: cam.sx, sy: cam.sy } };
}

// ---------------------------------------------------------------- data
// Fig. 01's series (illustrative, as labelled on the page).
export const SERIES = {
  cons: [0.34, 0.343, 0.347, 0.35, 0.352, 0.351, 0.354, 0.357, 0.36, 0.362, 0.365],
  inc: [0.47, 0.478, 0.486, 0.492, 0.495, 0.49, 0.5, 0.508, 0.515, 0.522, 0.53],
  wea: [0.6, 0.612, 0.625, 0.638, 0.645, 0.64, 0.658, 0.675, 0.69, 0.71, 0.73],
};

export type Place = { name: string; lat: number; lon: number; anchor: boolean; region: string };
const P = (name: string, lat: number, lon: number, anchor: 0 | 1, region: string): Place => ({ name, lat, lon, anchor: !!anchor, region });
export const PLACES: Place[] = [
  P("Dubai", 25.2, 55.3, 1, "Gulf"), P("Abu Dhabi", 24.45, 54.38, 0, "Gulf"),
  P("Singapore", 1.35, 103.82, 1, "Southeast Asia"), P("Jakarta", -6.2, 106.8, 1, "Southeast Asia"),
  P("Chennai", 13.08, 80.27, 1, "South India"), P("Madurai", 9.93, 78.12, 0, "South India"), P("Kodaikanal", 10.24, 77.49, 0, "South India"),
  P("Kodaikanal Lake", 10.23, 77.48, 0, "South India"), P("Vattakanal", 10.21, 77.5, 0, "South India"), P("Dindigul", 10.36, 77.98, 0, "South India"),
  P("Salem", 11.66, 78.15, 0, "South India"), P("Karur", 10.96, 78.08, 0, "South India"), P("Trichy", 10.79, 78.7, 0, "South India"),
  P("Vellore", 12.92, 79.13, 0, "South India"), P("Poondi", 13.18, 79.86, 0, "South India"), P("Coimbatore", 11.02, 76.96, 0, "South India"),
  P("Pondicherry", 11.94, 79.83, 0, "South India"), P("Bangalore", 12.97, 77.59, 0, "South India"), P("Coorg", 12.34, 75.8, 0, "South India"),
  P("Mangalore", 12.91, 74.86, 0, "South India"), P("Kochi", 9.93, 76.27, 0, "South India"), P("Thiruvalla", 9.38, 76.57, 0, "South India"),
  P("Alappuzha", 9.49, 76.33, 0, "South India"), P("Palakkad", 10.78, 76.65, 0, "South India"),
  P("Mumbai", 19.08, 72.88, 1, "West & North India"), P("Pune", 18.52, 73.86, 0, "West & North India"), P("Lonavala", 18.75, 73.41, 0, "West & North India"),
  P("Lavasa", 18.41, 73.51, 0, "West & North India"), P("Mahabaleshwar", 17.92, 73.66, 0, "West & North India"), P("Kolhapur", 16.7, 74.24, 0, "West & North India"),
  P("Goa", 15.3, 74.12, 0, "West & North India"), P("Delhi", 28.61, 77.21, 1, "West & North India"), P("Gurgaon", 28.46, 77.03, 0, "West & North India"),
  P("Faridabad", 28.41, 77.31, 0, "West & North India"),
];
/** A line for the places that mean something particular. */
export const PLACE_NOTES: Record<string, string> = {
  Chennai: "Home base — Alphabet International School, CSK Academy, Christmas-in-a-Box.",
  Kodaikanal: "School before Chennai — Kodaikanal International School.",
  "Kodaikanal Lake": "School before Chennai — Kodaikanal International School.",
  Pune: "Under-12 district cricket.",
  Singapore: "The economy in my Extended Essay — its Resilience & Solidarity Budgets.",
};

// ---------------------------------------------------------------- stations
export type WorldParts = {
  stations: Station[];
  ground: Group;
  route: { full: Line; drawn: Line; count: number };
  setYear: (i: number) => void;
  setRate: (r: number) => void;
  globe: { sphere: Object3D; spin: Spinner; radius: number; labels: { name: string; local: Vector3 }[]; pins: { place: Place; local: Vector3 }[]; ring: Line };
  overview: { day: CamKey; night: CamKey };
};

export function buildWorld(onStep: (p: number) => void): WorldParts {
  const stations: Station[] = [];
  const total = 15;
  let built = 0;
  const step = () => onStep(++built / total);

  // ---- ground: a sheet, a faint survey grid
  const ground = new Group();
  const gp = new PlaneGeometry(1600, 1600);
  gp.rotateX(-Math.PI / 2);
  mesh(gp, 1, ground, 180, 0, -10);
  {
    const pts: number[] = [];
    for (let x = -60; x <= 420; x += 4) pts.push(x, 0.01, -90, x, 0.01, 60);
    for (let z = -90; z <= 60; z += 4) pts.push(-60, 0.01, z, 420, 0.01, z);
    segs(ground, pts, M.grid);
  }

  // ---- 01 HABIT: the vision board as a field of cells, one row per grade
  const habit = station("habit", 0, 0, { h: 15, az: 40, el: 32 });
  {
    const g = habit.group, id = newId();
    plinth(g, 9.4, 6.4);
    const rows: ("d" | "s" | "p")[][] = [["d", "d"], ["d", "d", "d"], ["d", "d", "d", "d", "d", "s"], ["p", "p"]];
    rows.forEach((row, r) => {
      const z = -2.2 + r * 1.45;
      const height = [0.55, 0.95, 1.45, 1.9][r];
      row.forEach((c, k) => {
        const x = -3.3 + k * 1.32;
        if (c === "d") box(g, id, 1.05, height + (k % 3) * 0.08, 1.05, x, 0.35, z);
        else if (c === "s") {
          box(g, id, 1.05, 0.08, 1.05, x, 0.35, z);
          segs(g, [x - 0.5, 0.45, z - 0.5, x + 0.5, 0.45, z + 0.5], M.accent);
        } else boxEdgesDashed(g, 1.05, height, 1.05, x, 0.35, z);
      });
    });
  }
  finish(habit);
  stations.push(habit); step();

  // ---- 02 OWNERSHIP: three walls tracing Fig. 01; the gap between income and wealth in copper
  let setYear = (_: number) => {};
  const ridges = station("ridges", 22, -8, { h: 15, az: 52, el: 26 });
  {
    const g = ridges.group, id = newId();
    plinth(g, 13, 6);
    const X = (i: number) => -5.5 + i * 1.1;
    const Y = (v: number) => 0.35 + ((v - 0.3) / 0.48) * 4.4;
    const wall = (vals: number[], z: number) => {
      const s = new Shape();
      s.moveTo(X(0), 0.35);
      vals.forEach((v, i) => s.lineTo(X(i), Y(v)));
      s.lineTo(X(vals.length - 1), 0.35);
      s.closePath();
      const geo = new ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: false });
      geo.translate(0, 0, z - 0.08);
      mesh(geo, id, g);
    };
    wall(SERIES.wea, -1.6);
    wall(SERIES.inc, 0);
    wall(SERIES.cons, 1.6);
    const gap: number[] = [];
    SERIES.inc.forEach((v, i) => gap.push(X(i), Y(v) + 0.02, 0, X(i), Y(SERIES.wea[i]) + 0.02, -1.6));
    segs(g, gap, M.accentSoft);
    const markerId = newId();
    const marker = box(g, markerId, 0.05, 4.9, 4.4, X(10), 0.35, 0);
    let target = X(10);
    setYear = (i) => { target = X(i); };
    ridges.restLit = markerId;
    ridges.tick = (_t, dt) => {
      const d = target - marker.position.x;
      if (Math.abs(d) < 0.001) return false;
      marker.position.x += d * (1 - Math.exp(-dt * 10));
      return true;
    };
  }
  finish(ridges);
  stations.push(ridges); step();

  // ---- 03 TRANSMISSION: a bank, and a pillar for the rate that it answers
  let setRate = (_: number) => {};
  const bank = station("bank", 44, -2, { h: 17, az: 38, el: 27, dx: 3.2, dz: -0.6 });
  {
    const g = bank.group, id = newId();
    box(g, 1, 19, 0.3, 8, 2.2, 0, 0);
    box(g, id, 8.2, 0.28, 5.2, 1.2, 0.3, 0);
    box(g, id, 7.6, 0.28, 4.6, 1.2, 0.58, 0);
    box(g, id, 7.0, 0.28, 4.0, 1.2, 0.86, 0);
    for (let i = 0; i < 6; i++) cyl(g, id, 0.27, 3.1, -1.6 + i * 1.12, 1.14, 1.5, 28, 0.24);
    box(g, id, 6.2, 3.1, 2.2, 1.2, 1.14, -0.7);
    box(g, id, 7.2, 0.5, 4.1, 1.2, 4.24, 0);
    const tri = new Shape();
    tri.moveTo(-3.6, 0); tri.lineTo(3.6, 0); tri.lineTo(0, 1.25); tri.closePath();
    const ped = new ExtrudeGeometry(tri, { depth: 4.1, bevelEnabled: false });
    ped.translate(1.2, 4.74, -2.05);
    mesh(ped, id, g);

    const pid = newId();
    const pillarGeo = new BoxGeometry(0.9, 1, 0.9);
    pillarGeo.translate(0, 0.5, 0);
    // The rate stands to the bank's right, where the Rate Lab leaves the drawing visible.
    const PX = 8.6, PZ = -1.4;
    const pillar = mesh(pillarGeo, pid, g, PX, 0.3, PZ);
    const cap = box(g, pid, 1.3, 0.14, 1.3, PX, 0.3, PZ);
    bank.restLit = pid;
    const rings = [0, 1, 2].map(() => poly(g, circle(PX, PZ, 1, 0.33, 64), M.accentSoft));
    let rate = 3.95, shown = 3.95;
    setRate = (r) => { rate = r; };
    bank.tick = (t, dt, near) => {
      shown += (rate - shown) * (1 - Math.exp(-dt * 9));
      const h = 0.25 + shown * 1.15;
      pillar.scale.y = h;
      cap.position.y = 0.3 + h;
      if (!near) return Math.abs(rate - shown) > 0.002;
      const speed = 0.18 + shown * 0.07;
      rings.forEach((ring, i) => {
        const k = ((t * speed + i / 3) % 1);
        const s = 1 + k * 4.2;
        ring.scale.set(s, 1, s);
        ring.position.set(PX * (1 - s), 0, PZ * (1 - s));
        (ring.material as LineBasicMaterial).opacity = 0.5;
        ring.visible = k < 0.96;
      });
      return true;
    };
  }
  finish(bank);
  stations.push(bank); step();

  // ---- 04 THE LAB: six labs around one evidence ledger, linked like the Hub figure
  const lab = station("lab", 56, -22, { h: 15, az: 50, el: 30 });
  {
    const g = lab.group;
    plinth(g, 11, 8, 0.3);
    const ledgerId = newId();
    cyl(g, ledgerId, 1.0, 0.5, 0, 0.3, 0, 48);
    cyl(g, ledgerId, 0.62, 0.22, 0, 0.8, 0, 48);
    const spots: [number, number, number][] = [[-3.4, -2.2, 1.3], [0, -2.7, 1.0], [3.4, -2.2, 2.3], [-3.4, 2.2, 1.6], [0, 2.7, 0.9], [3.4, 2.2, 1.2]];
    const links: number[] = [];
    spots.forEach(([x, z, h], i) => {
      const id = i === 2 ? newId() : newId();
      box(g, id, 1.5, h, 1.5, x, 0.3, z);
      box(g, id, 1.7, 0.1, 1.7, x, 0.3 + h, z);
      if (i === 2) lab.restLit = id; // the banking lab: the iBFPI
      links.push(0, 0.36, 0, x, 0.36, z);
    });
    segs(g, links, M.dash, true);
  }
  finish(lab);
  stations.push(lab); step();

  // ---- 04 VENTURES: five plinths, five objects you can spin
  const plinths = station("plinths", 68, -12, { h: 24, az: 46, el: 28, dx: 0.5, sx: -0.29 });
  {
    const g = plinths.group;
    const spot = (i: number) => -8.4 + i * 4.2;
    const base = (i: number) => box(g, 1, 2.8, 0.7, 2.8, spot(i), 0, 0);
    const holder = (i: number) => { const o = new Group(); o.position.set(spot(i), 0.7, 0); g.add(o); return o; };
    const spin = (o: Object3D, id: number, idle = 0, name = "") => {
      plinths.spinners.push({ obj: o, id, angle: 0, vel: 0, idle, axis: "y", bx: 0, bv: 0, name });
      blob(g, o.position.x, o.position.z - 0.15, 2.3, 2.3, 0.714, SH.object);
    };

    // Edugate: a gate
    base(0); { const o = holder(0), id = newId();
      box(o, id, 2.1, 0.16, 1.1, 0, 0, 0);
      box(o, id, 0.34, 2.0, 0.42, -0.78, 0.16, 0); box(o, id, 0.34, 2.0, 0.42, 0.78, 0.16, 0);
      const arch = new TorusGeometry(0.78, 0.17, 10, 28, Math.PI); arch.translate(0, 2.16, 0); mesh(arch, id, o);
      box(o, id, 0.5, 0.16, 0.5, 0, 2.86, 0);
      spin(o, id, 0, "Edugate"); }
    // The Financial Frontier: a stack of issues
    base(1); { const o = holder(1), id = newId();
      for (let i = 0; i < 8; i++) { const s = box(o, id, 1.75, 0.07, 1.3, 0, i * 0.075, 0); s.rotation.y = Math.sin(i * 2.3) * 0.09; }
      const fold = new Group(); fold.position.set(0, 0.62, 0); o.add(fold);
      const a = box(fold, id, 1.6, 0.05, 0.62, 0, 0, -0.31); a.rotation.x = -0.32;
      const b = box(fold, id, 1.6, 0.05, 0.62, 0, 0, 0.31); b.rotation.x = 0.32;
      spin(o, id, 0, "The Financial Frontier"); }
    // Bitcoin: a coin on its edge, turning slowly
    base(2); { const o = holder(2), id = newId();
      const coin = new CylinderGeometry(1.0, 1.0, 0.22, 56); coin.rotateX(Math.PI / 2); coin.translate(0, 1.02, 0); mesh(coin, id, o);
      const face = new CylinderGeometry(0.74, 0.74, 0.27, 56); face.rotateX(Math.PI / 2); face.translate(0, 1.02, 0); mesh(face, id, o);
      const bar = new BoxGeometry(0.16, 0.9, 0.3); bar.translate(-0.12, 1.02, 0); mesh(bar, id, o);
      box(o, id, 1.0, 0.06, 0.5, 0, 0, 0);
      spin(o, id, 0.45, "Bitcoin Desk Simulator"); }
    // India Economic Intelligence Lab: a chart of six labs
    base(3); { const o = holder(3), id = newId();
      box(o, id, 2.2, 0.12, 1.3, 0, 0, 0);
      [0.5, 0.95, 0.72, 1.35, 1.08, 1.7].forEach((h, i) => box(o, id, 0.26, h, 0.26, -0.85 + i * 0.34, 0.12, ((i % 2) - 0.5) * 0.36));
      spin(o, id, 0, "India Economic Intelligence Lab"); }
    // Substack: a mailbox, flag up
    base(4); { const o = holder(4), id = newId();
      box(o, id, 0.16, 1.15, 0.16, 0, 0, 0);
      box(o, id, 0.74, 0.42, 1.25, 0, 1.15, 0);
      const top = new CylinderGeometry(0.37, 0.37, 1.25, 28, 1, false, -Math.PI / 2, Math.PI);
      top.rotateX(Math.PI / 2); top.translate(0, 1.57, 0); mesh(top, id, o);
      box(o, id, 0.04, 0.62, 0.12, 0.42, 1.25, 0.32);
      box(o, id, 0.04, 0.16, 0.34, 0.42, 1.73, 0.43);
      spin(o, id, 0, "Essays on Substack"); }
  }
  finish(plinths, { objects: false });
  stations.push(plinths); step();

  // ---- 05 NEWSLETTER: the issue, larger, folded open on its stack
  const press = station("press", 92, -4, { h: 12, az: 34, el: 33 });
  {
    const g = press.group, id = newId();
    plinth(g, 7, 5.2);
    for (let i = 0; i < 12; i++) { const s = box(g, id, 3.4, 0.07, 2.4, 0.2, 0.35 + i * 0.072, 0); s.rotation.y = Math.sin(i * 1.7) * 0.05; }
    const top = 0.35 + 12 * 0.072;
    const leftPage = new Group(); leftPage.position.set(-1.5, top, 0); g.add(leftPage);
    box(leftPage, id, 1.65, 0.04, 2.3, 0.82, 0, 0);
    const rightPage = new Group(); rightPage.position.set(-1.5 + 1.65, top, 0); g.add(rightPage);
    const rp = box(rightPage, id, 1.65, 0.04, 2.3, 0.82, 0, 0); rp.parent!.rotation.z = 0.5;
    const rules: number[] = [];
    for (let r = 0; r < 9; r++) rules.push(0.1, 0.05, -0.95 + r * 0.24, 1.5, 0.05, -0.95 + r * 0.24);
    segs(leftPage, rules, M.inkSoft);
    press.restLit = id;
  }
  finish(press);
  stations.push(press); step();

  // ---- 06 FAILURES: dominoes — one down, one leaning, the rest standing
  const dominoes = station("dominoes", 110, -14, { h: 11, az: 58, el: 24 });
  {
    const g = dominoes.group, id = newId();
    plinth(g, 8, 3, 0.3);
    const tile = (x: number, rz: number) => { const p = new Group(); p.position.set(x, 0.3, 0); p.rotation.z = rz; g.add(p); box(p, id, 0.36, 2.3, 1.3, 0.18, 0, 0); return p; };
    tile(-2.9, -1.18);
    tile(-0.6, -0.38);
    tile(1.1, 0);
    tile(2.7, 0);
  }
  finish(dominoes);
  stations.push(dominoes); step();

  // ---- 07 ATHLETICS: a track, lanes drawn on the ground, hurdles on the straight
  const track = station("track", 136, -2, { h: 30, az: 42, el: 34 });
  {
    const g = track.group, id = newId();
    const L = 16, R0 = 5.2, lanes = 5, lw = 0.95;
    const stadium = (r: number) => {
      const pts: Vector3[] = [];
      for (let i = 0; i <= 40; i++) { const a = -Math.PI / 2 + (i / 40) * Math.PI; pts.push(new Vector3(L / 2 + Math.cos(a) * r, 0.03, Math.sin(a) * r)); }
      for (let i = 0; i <= 40; i++) { const a = Math.PI / 2 + (i / 40) * Math.PI; pts.push(new Vector3(-L / 2 + Math.cos(a) * r, 0.03, Math.sin(a) * r)); }
      pts.push(pts[0].clone());
      return pts;
    };
    for (let i = 0; i <= lanes; i++) poly(g, stadium(R0 + i * lw), i === 0 || i === lanes ? M.ink : M.inkSoft);
    const infield = new Shape();
    infield.moveTo(-L / 2, -R0 + 0.3);
    infield.lineTo(L / 2, -R0 + 0.3);
    infield.absarc(L / 2, 0, R0 - 0.3, -Math.PI / 2, Math.PI / 2, false);
    infield.lineTo(-L / 2, R0 - 0.3);
    infield.absarc(-L / 2, 0, R0 - 0.3, Math.PI / 2, Math.PI * 1.5, false);
    const inf = new ExtrudeGeometry(infield, { depth: 0.12, bevelEnabled: false });
    inf.rotateX(Math.PI / 2); inf.translate(0, 0.12, 0);
    mesh(inf, 1, g);
    const zLane = (k: number) => R0 + lw * (k + 0.5);
    for (const hx of [-4, 0, 4]) for (let k = 0; k < lanes; k++) {
      const z = zLane(k);
      box(g, id, 0.08, 0.8, 0.08, hx, 0, z - 0.36); box(g, id, 0.08, 0.8, 0.08, hx, 0, z + 0.36);
      box(g, id, 0.06, 0.16, 0.8, hx, 0.72, z);
    }
    const fx = L / 2;
    box(g, id, 0.14, 1.6, 0.14, fx, 0, R0 - 0.1); box(g, id, 0.14, 1.6, 0.14, fx, 0, R0 + lanes * lw + 0.1);
    segs(g, [fx, 1.25, R0 - 0.1, fx + 0.25, 1.22, R0 + 2.4, fx + 0.25, 1.22, R0 + 2.4, fx, 1.25, R0 + lanes * lw + 0.1], M.accent);
    segs(g, [fx, 0.04, R0, fx, 0.04, R0 + lanes * lw], M.ink);
    for (let k = 0; k < lanes; k++) box(g, id, 0.5, 0.22, 0.3, -fx + 0.6, 0, zLane(k));
  }
  finish(track, { objects: false });
  stations.push(track); step();

  // ---- 08 CREATIVE: a drafting table with a sketch drawn structure-first
  const drafting = station("drafting", 164, -14, { h: 10, az: 30, el: 34 });
  {
    const g = drafting.group, id = newId();
    plinth(g, 5.6, 4.2, 0.25);
    for (const [x, z] of [[-1.4, -0.9], [1.4, -0.9], [-1.4, 0.9], [1.4, 0.9]]) box(g, id, 0.12, 1.75, 0.12, x, 0.25, z);
    const board = new Group(); board.position.set(0, 2.0, 0); board.rotation.x = -0.36; g.add(board);
    box(board, id, 3.4, 0.08, 2.3, 0, 0, 0);
    box(board, id, 3.4, 0.1, 0.08, 0, 0.08, 1.12);
    const sk: number[] = [];
    const y = 0.085, cx = -0.3, cz = 0.1, s = 0.55;
    const P = [[cx - s, cz - s * 0.6], [cx + s, cz - s * 0.6], [cx + s, cz + s * 0.8], [cx - s, cz + s * 0.8]];
    const Q = P.map(([a, b]) => [a + 0.42, b - 0.5]);
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      sk.push(P[i][0], y, P[i][1], P[j][0], y, P[j][1]);
      sk.push(Q[i][0], y, Q[i][1], Q[j][0], y, Q[j][1]);
      sk.push(P[i][0], y, P[i][1], Q[i][0], y, Q[i][1]);
    }
    sk.push(-1.5, y, 0.95, 0.9, y, -0.95, -1.5, y, 0.95, 1.5, y, 0.9);
    segs(board, sk, M.ink);
    const pencil = new Group(); pencil.position.set(0.95, 0.12, 0.55); pencil.rotation.set(0, 0.5, Math.PI / 2); board.add(pencil);
    cyl(pencil, id, 0.055, 1.1, 0, 0, 0, 6);
    const tip = new CylinderGeometry(0, 0.055, 0.18, 6); tip.translate(0, 1.19, 0); mesh(tip, id, pencil);
  }
  finish(drafting);
  stations.push(drafting); step();

  // ---- 09 LIBRARY: a shelf of exactly eleven books
  const shelf = station("shelf", 184, -6, { h: 12, az: 50, el: 22 });
  {
    const g = shelf.group, id = newId();
    plinth(g, 6, 2.6, 0.2);
    box(g, id, 0.12, 3.4, 1.0, -2.1, 0.2, 0); box(g, id, 0.12, 3.4, 1.0, 2.1, 0.2, 0);
    for (const y of [0.2, 1.3, 2.4, 3.5]) box(g, id, 4.32, 0.1, 1.0, 0, y, 0);
    const books: [number, number, number, number][] = [
      [0, 0.26, 0.86, 0], [0, 0.2, 0.78, 0], [0, 0.3, 0.92, 0], [0, 0.22, 0.8, 0], [0, 0.24, 0.84, 0.2],
      [1, 0.28, 0.9, 0], [1, 0.2, 0.74, 0], [1, 0.32, 0.95, 0], [1, 0.22, 0.82, 0],
      [2, 0.3, 0.88, 0], [2, 0.24, 0.8, -0.26],
    ];
    const cursor = [-1.95, -1.95, -1.95];
    books.forEach(([row, w, h, lean]) => {
      const p = new Group();
      p.position.set(cursor[row] + w / 2, [0.3, 1.4, 2.5][row], 0.05);
      p.rotation.z = lean;
      g.add(p);
      box(p, id, w, h, 0.72, 0, 0, 0);
      cursor[row] += w + 0.03 + (lean ? 0.25 : 0);
    });
  }
  finish(shelf);
  stations.push(shelf); step();

  // ---- 10b CINEMA: a screen, the rows of seats, and a projector at the back
  const cinema = station("cinema", 202, -12, { h: 13, az: 44, el: 26, dx: 0.4, sx: -0.34 });
  {
    const g = cinema.group;
    plinth(g, 7.2, 6.2, 0.25);
    const sid = newId();
    // the screen, standing at the far end, a thin slab with a frame
    box(g, sid, 5.6, 3.2, 0.14, 0, 0.25, -2.6);
    box(g, sid, 0.18, 3.5, 0.3, -2.85, 0.25, -2.6);
    box(g, sid, 0.18, 3.5, 0.3, 2.85, 0.25, -2.6);
    box(g, sid, 5.9, 0.16, 0.3, 0, 3.6, -2.6);
    // seats: four rows of six, each a seat and a back
    const cid = newId();
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
      const x = -2.15 + c * 0.86, z = -1.0 + r * 0.9;
      box(g, cid, 0.62, 0.3, 0.6, x, 0.25, z);
      box(g, cid, 0.62, 0.62, 0.14, x, 0.25, z + 0.24);
    }
    // the aisle, a dashed line down the middle; the beam, three lines from the projector to the screen
    segs(g, [0, 0.27, -1.4, 0, 0.27, 2.0], M.inkSoft, true);
    const pid = newId();
    cyl(g, pid, 0.1, 1.5, 0, 0.25, 2.6, 12);
    box(g, pid, 0.8, 0.5, 1.0, 0, 1.75, 2.6);
    cyl(g, pid, 0.16, 0.3, 0, 1.85, 2.0, 16).rotation.x = Math.PI / 2;
    segs(g, [0, 2.0, 1.95, -2.6, 2.6, -2.5, 0, 2.0, 1.95, 2.6, 2.6, -2.5, 0, 2.0, 1.95, 0, 1.0, -2.5], M.accentSoft, true);
    cinema.restLit = sid;
  }
  finish(cinema);
  stations.push(cinema); step();

  // ---- 10c MUSIC: a record player, the platter turning
  const music = station("music", 220, -2, { h: 9, az: 36, el: 36, sx: -0.34 });
  {
    const g = music.group, id = newId();
    plinth(g, 4.6, 3.8, 0.25);
    box(g, id, 3.6, 0.5, 2.8, 0, 0.25, 0);
    // the platter and the record on it turn together
    const rid = newId();
    const platter = new Group(); platter.position.set(-0.45, 0.75, 0); g.add(platter);
    cyl(platter, rid, 1.12, 0.1, 0, 0, 0, 56);
    cyl(platter, rid, 1.0, 0.03, 0, 0.1, 0, 56);
    cyl(platter, rid, 0.06, 0.32, 0, 0.1, 0, 10);
    // grooves and the label, with a tick so the turn can be seen
    for (const r of [0.42, 0.6, 0.78, 0.93]) poly(platter, circle(0, 0, r, 0.135, 64), M.inkSoft);
    poly(platter, circle(0, 0, 0.3, 0.135, 40), M.accent);
    segs(platter, [0.3, 0.14, 0, 0.98, 0.14, 0], M.accent);
    music.spinners.push({ obj: platter, id: rid, angle: 0, vel: 0, idle: 0.9, axis: "y", bx: 0, bv: 0, name: "The turntable" });
    // the tonearm, pivoting at the back-right corner and resting over the record
    const arm = new Group(); arm.position.set(1.3, 0.75, -0.95); arm.rotation.y = 0.62; g.add(arm);
    cyl(arm, id, 0.2, 0.3, 0, 0, 0, 20);
    const a = box(arm, id, 0.08, 0.08, 1.9, 0, 0.26, 0.95);
    a.rotation.x = 0.0;
    box(arm, id, 0.16, 0.1, 0.34, 0, 0.2, 1.85);
    // two knobs and a speed switch
    cyl(g, id, 0.12, 0.08, 1.3, 0.75, 0.75, 16);
    cyl(g, id, 0.12, 0.08, 1.3, 0.75, 1.05, 16);
    box(g, id, 0.3, 0.06, 0.12, 1.0, 0.75, 1.1);
    music.restLit = rid;
  }
  finish(music);
  stations.push(music); step();

  // ---- 10 RECORD: an open ledger, ruled
  const ledger = station("ledger", 236, -16, { h: 9, az: 36, el: 38 });
  {
    const g = ledger.group, id = newId();
    plinth(g, 4.8, 3.6, 0.25);
    const page = (side: number) => {
      const p = new Group(); p.position.set(0, 0.42, 0); p.rotation.z = side * 0.12; g.add(p);
      box(p, id, 1.9, 0.06, 2.6, side * 0.98, 0, 0);
      const r: number[] = [];
      for (let i = 0; i < 11; i++) r.push(side * 0.15, 0.07, -1.1 + i * 0.22, side * 1.8, 0.07, -1.1 + i * 0.22);
      r.push(side * 0.55, 0.07, -1.2, side * 0.55, 0.07, 1.2);
      segs(p, r, M.inkSoft);
    };
    page(-1); page(1);
    cyl(g, id, 0.14, 2.6, 0, 0.42, -1.3, 16).rotation.x = Math.PI / 2;
    box(g, id, 4.2, 0.17, 2.9, 0, 0.25, 0);
  }
  finish(ledger);
  stations.push(ledger); step();

  // ---- 11 MAP: a globe on a stand, coastlines and the places that taught me
  const R = 4;
  const globeSt = station("globe", 258, -6, { h: 15, az: 44, el: 20, dy: 5.4 });
  const sphereHolder = new Group();
  const labels: { name: string; local: Vector3 }[] = [];
  const pinData: { place: Place; local: Vector3 }[] = [];
  let selRing!: Line;
  let globeSpin!: Spinner;
  {
    const g = globeSt.group, id = newId();
    plinth(g, 6, 6, 0.25);
    cyl(g, id, 1.5, 0.3, 0, 0.25, 0, 48, 1.3);
    cyl(g, id, 0.13, 1.0, 0, 0.55, 0, 16);
    const tilt = new Group(); tilt.position.set(0, 5.6, 0); tilt.rotation.z = -0.41; g.add(tilt);
    const ring = new TorusGeometry(R + 0.35, 0.07, 8, 96, Math.PI * 1.1); ring.rotateZ(-Math.PI * 0.55); mesh(ring, id, tilt);
    tilt.add(sphereHolder);
    const gid = newId();
    mesh(new SphereGeometry(R, 96, 64), gid, sphereHolder);
    const v = (lat: number, lon: number, r = R * 1.004) => {
      const la = (lat * Math.PI) / 180, lo = (lon * Math.PI) / 180;
      return new Vector3(Math.cos(la) * Math.sin(lo) * r, Math.sin(la) * r, Math.cos(la) * Math.cos(lo) * r);
    };
    const grat: number[] = [];
    for (let lon = 0; lon < 360; lon += 30) for (let lat = -84; lat < 84; lat += 4) { const a = v(lat, lon, R * 1.003), b = v(lat + 4, lon, R * 1.003); grat.push(a.x, a.y, a.z, b.x, b.y, b.z); }
    for (let lat = -60; lat <= 60; lat += 30) for (let lon = 0; lon < 360; lon += 4) { const a = v(lat, lon, R * 1.003), b = v(lat, lon + 4, R * 1.003); grat.push(a.x, a.y, a.z, b.x, b.y, b.z); }
    segs(sphereHolder, grat, M.inkSoft);
    const coast: number[] = [];
    for (const ringPts of LAND) for (let i = 0; i < ringPts.length - 1; i++) { const a = v(ringPts[i][0], ringPts[i][1]), b = v(ringPts[i + 1][0], ringPts[i + 1][1]); coast.push(a.x, a.y, a.z, b.x, b.y, b.z); }
    segs(sphereHolder, coast, M.ink);
    const pins: number[] = [];
    for (const pl of PLACES) {
      const a = v(pl.lat, pl.lon, R * 1.004), b = v(pl.lat, pl.lon, R * (pl.anchor ? 1.09 : 1.05));
      pins.push(a.x, a.y, a.z, b.x, b.y, b.z);
      if (pl.anchor) labels.push({ name: pl.name, local: v(pl.lat, pl.lon, R * 1.1) });
      pinData.push({ place: pl, local: v(pl.lat, pl.lon, R * (pl.anchor ? 1.09 : 1.05)) });
    }
    segs(sphereHolder, pins, M.accent);
    // the ring that marks a chosen place, laid flat on the sphere's surface
    const loop: Vector3[] = [];
    for (let i = 0; i <= 40; i++) { const t = (i / 40) * Math.PI * 2; loop.push(new Vector3(Math.cos(t) * 0.22, Math.sin(t) * 0.22, 0)); }
    selRing = poly(sphereHolder, loop, M.accent);
    selRing.visible = false;
    // Start with India facing the camera's side of the room.
    globeSpin = { obj: sphereHolder, id: gid, angle: -1.35 + Math.PI * 0.25, vel: 0, idle: 0.06, axis: "globe", bx: 0, bv: 0, name: "The globe" };
    sphereHolder.rotation.y = globeSpin.angle;
    globeSt.spinners.push(globeSpin);
  }
  finish(globeSt);
  stations.push(globeSt); step();

  // ---- 13 CONTACT: a gift box — Christmas-in-a-Box
  const gift = station("gift", 300, -6, { h: 9.5, az: 40, el: 30, dy: 1.4 });
  {
    const g = gift.group;
    plinth(g, 4.6, 4.6, 0.3);
    const o = new Group(); o.position.set(0, 0.3, 0); g.add(o);
    const id = newId();
    box(o, id, 2.2, 1.55, 2.2, 0, 0, 0);
    box(o, id, 2.42, 0.42, 2.42, 0, 1.55, 0);
    box(o, id, 0.34, 0.44, 2.46, 0, 1.55, 0);
    box(o, id, 2.46, 0.44, 0.34, 0, 1.55, 0);
    box(o, id, 0.3, 1.56, 2.24, 0, 0, 0);
    box(o, id, 2.24, 1.56, 0.3, 0, 0, 0);
    const loop = (ry: number) => { const t = new TorusGeometry(0.42, 0.09, 8, 28); t.rotateY(ry); t.rotateZ(0.5 * Math.sign(ry || 1)); t.translate(Math.cos(ry) * 0.35, 2.32, -Math.sin(ry) * 0.35); mesh(t, id, o); };
    loop(0.6); loop(0.6 + Math.PI);
    gift.spinners.push({ obj: o, id, angle: 0, vel: 0, idle: 0.12, axis: "y", bx: 0, bv: 0, name: "Christmas-in-a-Box" });
    gift.restLit = id;
  }
  finish(gift);
  stations.push(gift); step();

  for (const s of stations) {
    const r = s.group;
    if (r.parent == null) ground.add(r);
  }

  // ---- the route between stations, dashed; the part already travelled, in copper
  const pts = stations.map((s) => new Vector3(s.group.position.x, 0.05, s.group.position.z + 4.5));
  const curve = new CatmullRomCurve3(pts, false, "catmullrom", 0.4);
  const sample = curve.getPoints(stations.length * 40);
  const full = poly(ground, sample, M.route, true);
  const drawn = poly(ground, sample, M.accentSoft);
  drawn.geometry.setDrawRange(0, 0);
  step();

  const centerX = (stations[0].group.position.x + stations[stations.length - 1].group.position.x) / 2;
  return {
    stations,
    ground,
    route: { full, drawn, count: sample.length },
    setYear,
    setRate,
    globe: { sphere: sphereHolder, spin: globeSpin, radius: R, labels, pins: pinData, ring: selRing },
    overview: {
      // The cover: the table seen end-on, the first models stacked in a column on the right.
      day: { target: new Vector3(64, 0, -6), h: 58, az: 14, el: 27, sx: -0.21, sy: -0.2 },
      night: { target: new Vector3(centerX + 20, 0, -12), h: 118, az: 45, el: 46, sx: -0.18, sy: 0 },
    },
  };
}

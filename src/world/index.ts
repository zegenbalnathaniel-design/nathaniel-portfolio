import {
  Color,
  Line,
  LineBasicMaterial,
  BufferGeometry,
  OrthographicCamera,
  Plane,
  Raycaster,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Mesh,
  type Object3D,
  type ShaderMaterial,
} from "three";
import { LAYER_LINE, LAYER_MESH, LAYER_SHADOW, LinePipeline } from "./pipeline";
import { M, SH, PLACE_NOTES, buildWorld, type CamKey, type Place, type Spinner, type Station, type WorldParts } from "./stations";
import type { Palette } from "../daylight";

const DEG = Math.PI / 180;
const ease = (t: number) => t * t * (3 - 2 * t);
const damp = (a: number, b: number, l: number, dt: number) => a + (b - a) * (1 - Math.exp(-l * dt));

export type WorldOpts = { canvas: HTMLCanvasElement; reduced: boolean; coarse: boolean; onProgress: (p: number) => void };
export type Tip = { title: string; sub: string; x: number; y: number } | null;

export class World {
  renderer: WebGLRenderer;
  scene = new Scene();
  camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 500);
  pipe: LinePipeline;
  parts!: WorldParts;
  keys = new Map<string, CamKey>();
  ready = false;

  // the camera's state, damped toward the rail
  cur = { target: new Vector3(), h: 60, az: 45, el: 36, sx: -0.2, sy: 0 };
  want = { target: new Vector3(), h: 60, az: 45, el: 36, sx: -0.2, sy: 0 };
  pointer = new Vector2(0, 0);
  pointerPx = new Vector2(-1e4, -1e4);
  pointerSm = new Vector2(0, 0);
  overCanvas = false;
  ray = new Raycaster();
  hoverId = -1;
  restLit = -1;
  drag: { sp: Spinner; x: number; t: number; moved: number } | null = null;
  down: { x: number; y: number; t: number } | null = null;
  spinners: Spinner[] = [];
  activeStation: Station | null = null;
  routeProgress = 0;
  dpr = 1;
  w = 1;
  h = 1;
  reduced: boolean;
  coarse: boolean;
  canvas: HTMLCanvasElement;
  labelEls: HTMLSpanElement[] = [];
  selLabel: HTMLSpanElement | null = null;
  selected: { place: Place; local: Vector3 } | null = null;
  palette: Palette | null = null;
  dirty = true;
  last = performance.now();
  running = true;
  cursorRing!: Line;
  ground = new Plane(new Vector3(0, 1, 0), 0);
  info: Record<string, { title: string; code: string }> = {};

  // hooks for the page
  onHover: (kind: "drag" | "open" | null) => void = () => {};
  onTip: (tip: Tip) => void = () => {};
  onStation: (key: string) => void = () => {};
  onPlace: (place: Place, note: string) => void = () => {};

  constructor({ canvas, reduced, coarse, onProgress }: WorldOpts) {
    this.canvas = canvas;
    this.reduced = reduced;
    this.coarse = coarse;
    this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.autoClear = false;
    this.dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.6 : 2);
    this.renderer.setPixelRatio(this.dpr);
    this.pipe = new LinePipeline(2, 2);
    this.ray.layers.set(LAYER_MESH);
    onProgress(0.05);

    // Build across a few frames so the boot line can show honest progress.
    requestAnimationFrame(() => {
      this.parts = buildWorld((p) => onProgress(0.05 + p * 0.75));
      this.scene.add(this.parts.ground);
      for (const s of this.parts.stations) {
        this.keys.set(s.key, s.cam);
        this.spinners.push(...s.spinners);
      }
      this.keys.set("cover", this.parts.overview.day);
      this.keys.set("overview", this.parts.overview.night);
      const gift = this.keys.get("gift");
      if (gift) this.keys.set("giftClose", { ...gift, target: gift.target.clone().add(new Vector3(0, -0.3, 0)), h: gift.h * 0.72, el: 22, az: gift.az + 14 });

      // the pointer's footprint on the ground: a small copper ring
      const pts: Vector3[] = [];
      for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2; pts.push(new Vector3(Math.cos(a), 0.03, Math.sin(a))); }
      this.cursorRing = new Line(new BufferGeometry().setFromPoints(pts), new LineBasicMaterial({ transparent: true, opacity: 0.85, depthWrite: false }));
      this.cursorRing.layers.set(LAYER_LINE);
      this.cursorRing.frustumCulled = false;
      this.cursorRing.visible = false;
      this.scene.add(this.cursorRing);

      this.resize();
      this.camera.layers.enableAll();
      this.renderer.compile(this.scene, this.camera);
      this.renderer.compile(this.pipe.post, this.pipe.postCam);
      const k = this.keys.get("cover")!;
      this.cur.target.copy(k.target); this.cur.h = k.h; this.cur.az = k.az; this.cur.el = k.el;
      this.cur.sx = k.sx ?? -0.2; this.cur.sy = k.sy ?? 0;
      this.want.target.copy(k.target);
      requestAnimationFrame(() => {
        onProgress(1);
        this.ready = true;
      });
    });

    addEventListener("resize", () => this.resize());
    addEventListener("pointermove", (e) => this.onPointerMove(e), { passive: true });
    canvas.addEventListener("pointerdown", (e) => this.onPointerDown(e));
    addEventListener("pointerup", (e) => this.onPointerUp(e));
    addEventListener("pointercancel", () => this.endDrag());
    canvas.addEventListener("pointerleave", () => this.leave());
    document.addEventListener("visibilitychange", () => { this.running = !document.hidden; this.last = performance.now(); });
    this.labelHost = document.getElementById("worldLabels");
  }
  labelHost: HTMLElement | null = null;

  setStationInfo(info: Record<string, { title: string; code: string }>) { this.info = info; }

  resize() {
    this.w = innerWidth;
    this.h = innerHeight;
    this.renderer.setSize(this.w, this.h, false);
    this.canvas.style.width = this.w + "px";
    this.canvas.style.height = this.h + "px";
    const pw = Math.floor(this.w * this.dpr), ph = Math.floor(this.h * this.dpr);
    this.pipe.setSize(pw, ph);
    this.pipe.mat.uniforms.uScale.value = this.dpr >= 1.5 ? 1.25 : 1;
    // Where the text column ends. On narrow screens the copy spans the width, so the
    // whole drawing is ghosted; on wide ones only the left of it is.
    const head = document.querySelector(".sec:not(.sec-cover) .sec-head");
    const right = head ? head.getBoundingClientRect().right / this.w : 0.55;
    const col = this.pipe.mat.uniforms.uCol.value as Vector3;
    if (this.w / this.h > 1.15) col.set(Math.min(0.72, right), 0.1, 0.16);
    else col.set(1.4, 0.1, 0.3);
    this.dirty = true;
  }

  // ------------------------------------------------------------ rail
  /** a, b: data-cam keys of the two sections around the viewport centre; t in 0..1 between them. */
  setRail(a: string, b: string, t: number, progress: number) {
    if (!this.ready) return;
    const A = this.keys.get(a) ?? this.keys.get("cover")!, B = this.keys.get(b) ?? A;
    const e = ease(t);
    this.want.target.lerpVectors(A.target, B.target, e);
    // Pull back while travelling between two models, so the move reads as a flight.
    const dist = A.target.distanceTo(B.target);
    const lift = A === B ? 0 : Math.sin(Math.PI * e) * Math.min(1.4, dist / 26);
    this.want.h = (A.h + (B.h - A.h) * e) * (1 + lift);
    this.want.az = A.az + (B.az - A.az) * e;
    this.want.el = A.el + (B.el - A.el) * e + lift * 6;
    const sxA = A.sx ?? -0.2, sxB = B.sx ?? -0.2, syA = A.sy ?? 0, syB = B.sy ?? 0;
    this.want.sx = sxA + (sxB - sxA) * e;
    this.want.sy = syA + (syB - syA) * e;
    const key = t < 0.5 ? a : b;
    this.activeStation = this.parts.stations.find((s) => key === s.key || key.startsWith(s.key)) ?? null;
    this.restLit = this.activeStation?.restLit ?? -1;
    this.routeProgress = progress;
  }

  setPalette(p: Palette) {
    this.palette = p;
    const u = this.pipe.mat.uniforms;
    (u.uBg.value as Vector3).set(...p.bg);
    (u.uInk.value as Vector3).set(...p.ink);
    (u.uAccent.value as Vector3).set(...p.accent);
    u.uNight.value = p.night;
    u.uClay.value = 0.17 - p.night * 0.07;
    const ink = new Color().setRGB(p.ink[0], p.ink[1], p.ink[2], SRGBColorSpace);
    const acc = new Color().setRGB(p.accent[0], p.accent[1], p.accent[2], SRGBColorSpace);
    M.ink.color.copy(ink); M.inkSoft.color.copy(ink); M.grid.color.copy(ink); M.dash.color.copy(ink); M.route.color.copy(ink);
    M.accent.color.copy(acc); M.accentSoft.color.copy(acc);
    M.grid.opacity = 0.075 + p.night * 0.03;
    if (this.cursorRing) (this.cursorRing.material as LineBasicMaterial).color.copy(acc);
    // shadows: espresso by day, a deeper dark at night (never the light night ink)
    const shade = new Color().setRGB(p.ink[0] * (1 - p.night), p.ink[1] * (1 - p.night), p.ink[2] * (1 - p.night), SRGBColorSpace);
    SH.ground.color.copy(shade); SH.object.color.copy(shade);
    SH.ground.opacity = 0.16 + p.night * 0.2; SH.object.opacity = 0.26 + p.night * 0.24;
    this.renderer.setClearColor(new Color().setRGB(p.bg[0], p.bg[1], p.bg[2], SRGBColorSpace), 1);
    this.dirty = true;
  }

  setYear(i: number) { this.parts?.setYear(i); this.dirty = true; }
  setRate(r: number) { this.parts?.setRate(r); this.dirty = true; }

  // ------------------------------------------------------------ picking
  private setPointer(e: PointerEvent) {
    this.pointer.set((e.clientX / this.w) * 2 - 1, -(e.clientY / this.h) * 2 + 1);
    this.pointerPx.set(e.clientX, e.clientY);
  }
  private castRay() {
    this.ray.setFromCamera(this.pointer, this.camera);
    this.ray.far = this.camera.far - this.camera.near;
  }
  pickSpinner(): Spinner | null {
    this.castRay();
    const hits = this.ray.intersectObjects(this.spinners.map((s) => s.obj), true);
    if (!hits.length) return null;
    let o: Object3D | null = hits[0].object;
    while (o) {
      const sp = this.spinners.find((s) => s.obj === o);
      if (sp) return sp;
      o = o.parent;
    }
    return null;
  }
  lastHitId = -1;
  pickStation(): Station | null {
    this.castRay();
    const hits = this.ray.intersectObjects(this.parts.stations.map((s) => s.group), true);
    this.lastHitId = -1;
    if (!hits.length) return null;
    const mat = (hits[0].object as Mesh).material as ShaderMaterial;
    const hid = mat?.uniforms?.uId?.value as number | undefined;
    if (hid !== undefined && hid > 1) this.lastHitId = hid;
    let o: Object3D | null = hits[0].object;
    while (o) {
      const st = this.parts.stations.find((s) => s.group === o);
      if (st) return st;
      o = o.parent;
    }
    return null;
  }
  /** The globe pin nearest the pointer on screen, if it faces us and is close enough. */
  pickPin(maxPx = 18): { place: Place; local: Vector3 } | null {
    if (this.activeStation?.key !== "globe") return null;
    const g = this.parts.globe;
    const center = new Vector3();
    g.sphere.getWorldPosition(center);
    const toCam = this.camera.position.clone().sub(center).normalize();
    let best: { place: Place; local: Vector3 } | null = null, bestD = maxPx;
    const p = new Vector3();
    for (const pin of g.pins) {
      p.copy(pin.local).applyMatrix4(g.sphere.matrixWorld);
      if (p.clone().sub(center).normalize().dot(toCam) < 0.12) continue;
      p.project(this.camera);
      const sx = ((p.x + 1) / 2) * this.w, sy = ((1 - p.y) / 2) * this.h;
      const d = Math.hypot(sx - this.pointerPx.x, sy - this.pointerPx.y);
      if (d < bestD) { bestD = d; best = pin; }
    }
    return best;
  }

  // ------------------------------------------------------------ input
  onPointerMove(e: PointerEvent) {
    this.setPointer(e);
    if (this.drag) {
      const now = performance.now();
      const dx = e.clientX - this.drag.x;
      const dtm = Math.max(1, now - this.drag.t);
      const k = this.drag.sp.axis === "globe" ? 0.006 : 0.012;
      this.drag.sp.goal = undefined;
      this.drag.sp.angle += dx * k;
      this.drag.sp.vel = ((dx * k) / dtm) * 1000;
      this.drag.moved += Math.abs(dx);
      this.drag.x = e.clientX;
      this.drag.t = now;
      this.dirty = true;
      return;
    }
    if (!this.ready) return;
    this.overCanvas = e.target === this.canvas;
    if (this.coarse) return;
    let tip: Tip = null, id = -1, kind: "drag" | "open" | null = null;
    if (this.overCanvas) {
      const pin = this.pickPin();
      if (pin) {
        tip = { title: pin.place.name, sub: `${pin.place.region} · click`, x: e.clientX, y: e.clientY };
        kind = "open";
      } else {
        const sp = this.pickSpinner();
        if (sp) {
          id = sp.id; kind = "drag";
          tip = { title: sp.name ?? "", sub: "drag to turn · click to bounce", x: e.clientX, y: e.clientY };
        } else {
          const st = this.pickStation();
          if (st) {
            const inf = this.info[st.key];
            const here = st === this.activeStation;
            kind = "open";
            id = this.lastHitId;
            if (inf) tip = { title: `${inf.code} · ${inf.title}`, sub: here ? "you are here · click" : "click to travel here", x: e.clientX, y: e.clientY };
          }
        }
      }
    }
    if (id !== this.hoverId) { this.hoverId = id; this.dirty = true; }
    this.onHover(kind);
    this.onTip(tip);
    if (this.overCanvas) this.dirty = true; // the ground ring follows the pointer
  }
  leave() {
    this.overCanvas = false;
    this.onTip(null);
    this.onHover(null);
    if (this.hoverId !== -1) { this.hoverId = -1; }
    this.dirty = true;
  }
  onPointerDown(e: PointerEvent) {
    if (!this.ready) return;
    this.setPointer(e);
    this.down = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (this.pickPin()) return; // a pin wins over spinning the globe
    const sp = this.pickSpinner();
    if (!sp) return;
    this.drag = { sp, x: e.clientX, t: performance.now(), moved: 0 };
    sp.vel = 0;
    this.hoverId = sp.id;
    this.canvas.setPointerCapture?.(e.pointerId);
    document.documentElement.classList.add("is-dragging");
  }
  onPointerUp(e: PointerEvent) {
    const d = this.down;
    this.down = null;
    const wasDrag = this.drag;
    this.endDrag();
    if (!d || !this.ready) return;
    const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y);
    if (moved > 6 || performance.now() - d.t > 600) return;
    this.setPointer(e);
    // a click
    const pin = this.pickPin();
    if (pin) { this.focusPlace(pin.place.name); return; }
    const sp = wasDrag?.sp ?? this.pickSpinner();
    if (sp) { sp.bv = -5.5; this.dirty = true; return; }
    const st = this.pickStation();
    if (!st) return;
    st.bv = -4.5;
    this.dirty = true;
    if (st !== this.activeStation) this.onStation(st.key);
  }
  endDrag() {
    if (!this.drag) return;
    this.drag = null;
    document.documentElement.classList.remove("is-dragging");
  }

  /** Turn the globe so a place faces the camera, ring it, and tell the page. */
  focusPlace(name: string) {
    if (!this.parts) return;
    const g = this.parts.globe;
    const pin = g.pins.find((p) => p.place.name === name);
    if (!pin) return;
    const tilt = g.sphere.parent!;
    const center = new Vector3();
    tilt.getWorldPosition(center);
    const camLocal = tilt.worldToLocal(this.camera.position.clone());
    const phiC = Math.atan2(camLocal.x, camLocal.z);
    const L = (pin.place.lon * Math.PI) / 180;
    const sp = g.spin;
    let goal = phiC - L;
    goal += 2 * Math.PI * Math.round((sp.angle - goal) / (2 * Math.PI));
    sp.goal = goal;
    sp.vel = 0;
    const dir = pin.local.clone().normalize();
    g.ring.position.copy(dir.clone().multiplyScalar(g.radius * 1.006));
    g.ring.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), dir);
    g.ring.visible = true;
    this.selected = pin;
    this.onPlace(pin.place, PLACE_NOTES[pin.place.name] ?? "");
    this.dirty = true;
  }

  // ------------------------------------------------------------ frame
  frame() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!this.ready || !this.running) return;
    const t = now / 1000;

    // camera
    const L = this.reduced ? 60 : 3.2;
    const c = this.cur, w = this.want;
    const before = c.target.x + c.target.z + c.h + c.az + c.el;
    c.target.x = damp(c.target.x, w.target.x, L, dt);
    c.target.y = damp(c.target.y, w.target.y, L, dt);
    c.target.z = damp(c.target.z, w.target.z, L, dt);
    c.h = damp(c.h, w.h, L, dt);
    c.az = damp(c.az, w.az, L, dt);
    c.el = damp(c.el, w.el, L, dt);
    c.sx = damp(c.sx, w.sx, L, dt);
    c.sy = damp(c.sy, w.sy, L, dt);
    if (!this.reduced && !this.coarse) {
      this.pointerSm.x = damp(this.pointerSm.x, this.pointer.x, 2.5, dt);
      this.pointerSm.y = damp(this.pointerSm.y, this.pointer.y, 2.5, dt);
    }
    const moved = Math.abs(before - (c.target.x + c.target.z + c.h + c.az + c.el)) > 1e-4;
    const pmoved = Math.abs(this.pointerSm.x - this.pointer.x) + Math.abs(this.pointerSm.y - this.pointer.y) > 1e-3;

    let anim = false;
    const near = (o: Object3D) => {
      const p = new Vector3();
      o.getWorldPosition(p);
      return Math.abs(p.x - c.target.x) + Math.abs(p.z - c.target.z) < c.h * 1.2;
    };
    // squash and stretch: a spring on the vertical scale, volume kept roughly constant
    const spring = (o: { bx: number; bv: number }, target: Object3D | null) => {
      if (Math.abs(o.bx) < 1e-4 && Math.abs(o.bv) < 1e-4) { if (o.bx !== 0) { o.bx = 0; o.bv = 0; target?.scale.set(1, 1, 1); } return false; }
      const steps = 2, h = dt / steps;
      for (let i = 0; i < steps; i++) { o.bv += (-240 * o.bx - 11 * o.bv) * h; o.bx += o.bv * h; }
      target?.scale.set(1 - o.bx * 0.45, 1 + o.bx, 1 - o.bx * 0.45);
      return true;
    };
    // spinners: drag, inertia, settling on a goal, idle turn (only those near the camera)
    for (const sp of this.spinners) {
      if (spring(sp, sp.obj)) anim = true;
      if (!near(sp.obj)) continue;
      if (this.drag?.sp !== sp) {
        if (sp.goal !== undefined) {
          sp.angle = damp(sp.angle, sp.goal, this.reduced ? 60 : 4, dt);
          if (Math.abs(sp.goal - sp.angle) < 0.002) sp.goal = undefined;
          anim = true;
        } else if (Math.abs(sp.vel) > 0.01) { sp.angle += sp.vel * dt; sp.vel *= Math.exp(-dt * 1.6); anim = true; }
        else if (!this.reduced && sp.idle && !(sp.axis === "globe" && this.selected)) { sp.angle += sp.idle * dt; anim = true; }
      }
      sp.obj.rotation.y = sp.angle;
    }
    for (const s of this.parts.stations) {
      if (spring(s, s.hero)) anim = true;
      if (s.tick) {
        const isNear = near(s.group) && !this.reduced;
        if (s.tick(t, dt, isNear)) anim = true;
      }
    }
    // route drawn up to here
    const n = Math.round(this.parts.route.count * this.routeProgress);
    this.parts.route.drawn.geometry.setDrawRange(0, n);

    if (!(moved || pmoved || anim || this.dirty)) return;
    this.dirty = false;
    this.render();
    this.updateLabels();
  }

  render() {
    const c = this.cur;
    const aspect = this.w / this.h;
    const H = c.h, W = H * aspect;
    const cam = this.camera;
    cam.left = -W / 2; cam.right = W / 2; cam.top = H / 2; cam.bottom = -H / 2;
    const az = (c.az + this.pointerSm.x * 2.2) * DEG;
    const el = (c.el + this.pointerSm.y * 1.4) * DEG;
    const dir = new Vector3(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
    // Frame the model to the right of the text column on wide screens, above it on narrow ones.
    const right = new Vector3(-Math.sin(az), 0, Math.cos(az)).negate();
    const up = new Vector3().crossVectors(right, dir).normalize().negate();
    const shiftX = aspect > 1.15 ? c.sx * W : 0;
    const shiftY = aspect > 1.15 ? c.sy * H : -0.24 * H;
    const target = c.target.clone().addScaledVector(right, shiftX).addScaledVector(up, shiftY);
    const dist = 200;
    cam.position.copy(target).addScaledVector(dir, dist);
    cam.near = 1; cam.far = dist + 260;
    cam.up.set(0, 1, 0);
    cam.lookAt(target);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();

    // the ground ring under the pointer
    if (this.cursorRing) {
      const show = this.overCanvas && !this.coarse && !this.drag;
      if (show) {
        this.castRay();
        const hit = new Vector3();
        if (this.ray.ray.intersectPlane(this.ground, hit)) {
          this.cursorRing.position.set(hit.x, 0, hit.z);
          const r = H * 0.016;
          this.cursorRing.scale.set(r, 1, r);
        }
      }
      this.cursorRing.visible = show;
    }

    const u = this.pipe.mat.uniforms;
    u.uRange.value = cam.far - cam.near;
    u.uNear.value = cam.near;
    // a silhouette must break depth by more than a couple of pixels' worth of world
    u.uSil.value = Math.max(0.035, (H / (this.h * this.dpr)) * 2.2);
    (u.uFog.value as Vector2).set(dist + H * 0.2, dist + H * 1.6);
    u.uHi.value = this.hoverId >= 0 ? this.hoverId : this.restLit;
    (u.uGN.value as Vector3).set(0, 1, 0).transformDirection(cam.matrixWorldInverse);

    const r = this.renderer;
    // 1 · normals, ids, depth
    r.setRenderTarget(this.pipe.rt);
    r.setClearColor(0x000000, 0);
    r.clear(true, true, false);
    cam.layers.set(LAYER_MESH);
    r.render(this.scene, cam);
    // 2 · lines and clay from the buffers, depth written back
    r.setRenderTarget(null);
    if (this.palette) r.setClearColor(new Color().setRGB(...this.palette.bg, SRGBColorSpace), 1);
    r.clear(true, true, false);
    r.render(this.pipe.post, this.pipe.postCam);
    // 3 · soft contact shadows, under whatever stands in front of them
    cam.layers.set(LAYER_SHADOW);
    r.render(this.scene, cam);
    // 4 · true line geometry, hidden behind solids
    cam.layers.set(LAYER_LINE);
    r.render(this.scene, cam);
    // 5 · paper veil over the text column
    r.render(this.pipe.veil, this.pipe.postCam);
  }

  // Place names beside the globe's anchor pins and the chosen place, only on the side facing us.
  updateLabels() {
    const host = this.labelHost;
    if (!host || !this.parts) return;
    const g = this.parts.globe;
    if (!this.labelEls.length) {
      this.labelEls = g.labels.map((l) => {
        const s = document.createElement("span");
        s.textContent = l.name;
        host.appendChild(s);
        return s;
      });
      this.selLabel = document.createElement("span");
      this.selLabel.className = "sel";
      host.appendChild(this.selLabel);
    }
    const atGlobe = this.activeStation?.key === "globe";
    const center = new Vector3();
    g.sphere.getWorldPosition(center);
    const toCam = this.camera.position.clone().sub(center).normalize();
    const place = (el: HTMLElement, local: Vector3, hide: boolean) => {
      const p = local.clone().applyMatrix4(g.sphere.matrixWorld);
      const facing = p.clone().sub(center).normalize().dot(toCam) > 0.25;
      const show = atGlobe && facing && !hide;
      el.style.opacity = show ? "1" : "0";
      if (!show) return;
      p.project(this.camera);
      el.style.transform = `translate3d(${((p.x + 1) / 2) * this.w + 6}px, ${((1 - p.y) / 2) * this.h - 6}px, 0)`;
    };
    const selName = this.selected?.place.name;
    g.labels.forEach((l, i) => place(this.labelEls[i], l.local, l.name === selName));
    if (this.selLabel) {
      if (this.selected) { this.selLabel.textContent = this.selected.place.name; place(this.selLabel, this.selected.local, false); }
      else this.selLabel.style.opacity = "0";
    }
  }
}

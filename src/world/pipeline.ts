// The line renderer.
//
// Pass 1 draws every solid into an offscreen target: the surface direction
// (from screen-space derivatives, so every flat face is exactly flat) in RGB,
// the object's id in alpha, and depth. Pass 2 is a full-screen shader that
// finds where depth breaks (a silhouette: drawn at full ink), where the
// surface direction turns sharply (a crease: drawn at about half ink), and
// where one object meets another. Everything else is the paper colour, so
// solids hide what is behind them the way plates do in the hairline figures.
// Pass 2 also writes the depth back, so pass 3 can draw true line geometry
// (grid, lanes, coastlines) occluded correctly by the solids.

import {
  AlwaysDepth,
  DepthTexture,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  UnsignedByteType,
  UnsignedIntType,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  NearestFilter,
} from "three";

export const LAYER_MESH = 1;
export const LAYER_LINE = 2;
export const LAYER_SHADOW = 3;

const idCache = new Map<number, ShaderMaterial>();

export function idMaterial(id: number): ShaderMaterial {
  let m = idCache.get(id);
  if (m) return m;
  m = new ShaderMaterial({
    uniforms: { uId: { value: id } },
    vertexShader: /* glsl */ `
      varying vec3 vView;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      varying vec3 vView;
      uniform float uId;
      void main() {
        vec3 n = normalize(cross(dFdx(vView), dFdy(vView)));
        gl_FragColor = vec4(n * 0.5 + 0.5, uId / 255.0);
      }`,
  });
  idCache.set(id, m);
  return m;
}

export class LinePipeline {
  rt: WebGLRenderTarget;
  post: Scene;
  postCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  mat: ShaderMaterial;

  constructor(w: number, h: number) {
    const depth = new DepthTexture(w, h, UnsignedIntType);
    this.rt = new WebGLRenderTarget(w, h, {
      type: UnsignedByteType,
      depthTexture: depth,
      depthBuffer: true,
      minFilter: NearestFilter,
      magFilter: NearestFilter,
    });
    this.mat = new ShaderMaterial({
      depthTest: true,
      depthWrite: true,
      depthFunc: AlwaysDepth,
      uniforms: {
        tN: { value: this.rt.texture },
        tD: { value: depth },
        uRes: { value: new Vector2(w, h) },
        uScale: { value: 1 },
        uRange: { value: 400 },
        uNear: { value: 0.1 },
        uSil: { value: 0.06 },
        uBg: { value: new Vector3(0.9, 0.86, 0.79) },
        uInk: { value: new Vector3(0.14, 0.09, 0.06) },
        uAccent: { value: new Vector3(0.75, 0.39, 0.17) },
        uHi: { value: -1 },
        uFog: { value: new Vector2(60, 220) },
        uNight: { value: 0 },
        // The text column: lines behind it are ghosted so the copy stays readable.
        // x: right edge of the column (0..1), y: how far the fade runs, z: alpha kept behind text.
        uCol: { value: new Vector3(0.58, 0.12, 0.2) },
        // Clay: faces turned toward a soft key light read a touch lighter,
        // faces turned away a touch darker — measured against the ground, so
        // the paper stays the paper. uGN is the ground's normal in view space.
        uGN: { value: new Vector3(0, 1, 0) },
        uClay: { value: 0.16 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D tN;
        uniform sampler2D tD;
        uniform vec2 uRes;
        uniform float uScale, uRange, uNear, uSil, uHi, uNight;
        uniform vec3 uBg, uInk, uAccent;
        uniform vec2 uFog;
        uniform vec3 uCol;
        uniform vec3 uGN;
        uniform float uClay;

        float D(vec2 uv) { return texture2D(tD, uv).r; }
        vec4 N(vec2 uv) { return texture2D(tN, uv); }
        float nd(vec4 a, vec4 b) {
          if (a.a < 0.5 / 255.0 || b.a < 0.5 / 255.0) return 0.0;
          return 1.0 - dot(a.xyz * 2.0 - 1.0, b.xyz * 2.0 - 1.0);
        }

        void main() {
          vec2 px = uScale / uRes;
          float d0 = D(vUv);
          float dl = D(vUv - vec2(px.x, 0.0)), dr = D(vUv + vec2(px.x, 0.0));
          float du = D(vUv + vec2(0.0, px.y)), dd = D(vUv - vec2(0.0, px.y));
          vec4 c0 = N(vUv);
          vec4 cl = N(vUv - vec2(px.x, 0.0)), cr = N(vUv + vec2(px.x, 0.0));
          vec4 cu = N(vUv + vec2(0.0, px.y)), cd = N(vUv - vec2(0.0, px.y));

          // Silhouettes: where depth is not locally planar (orthographic depth is linear).
          float lap = (abs(dl + dr - 2.0 * d0) + abs(du + dd - 2.0 * d0)) * uRange;
          float idEdge = step(0.5 / 255.0, max(max(abs(c0.a - cl.a), abs(c0.a - cr.a)), max(abs(c0.a - cu.a), abs(c0.a - cd.a))));
          float sil = max(smoothstep(uSil * 0.45, uSil, lap), idEdge);
          // Creases: where the surface direction turns.
          float n = max(max(nd(c0, cl), nd(c0, cr)), max(nd(c0, cu), nd(c0, cd)));
          float crease = smoothstep(0.1, 0.26, n) * (1.0 - sil);

          // Which object owns the line: the nearest one among the samples.
          float dm = d0; float idm = c0.a;
          if (dl < dm) { dm = dl; idm = cl.a; }
          if (dr < dm) { dm = dr; idm = cr.a; }
          if (du < dm) { dm = du; idm = cu.a; }
          if (dd < dm) { dm = dd; idm = cd.a; }
          float lit = step(abs(idm * 255.0 - uHi), 0.5);

          float z = uNear + dm * uRange;
          float fog = 1.0 - 0.72 * smoothstep(uFog.x, uFog.y, z);

          float a = (sil * mix(0.92, 1.0, lit) + crease * mix(0.4, 0.75, lit)) * fog;
          vec3 ink = mix(uInk, uAccent, lit);

          // Paper: a faint light falloff, warm by day, a cooler pool by night.
          vec2 q = vUv - vec2(0.62, 0.55);
          float glow = 1.0 - smoothstep(0.0, 0.9, length(q * vec2(1.0, 1.25)));
          vec3 paper = uBg * (1.0 + mix(0.035, 0.09, uNight) * glow - mix(0.025, 0.0, uNight) * (1.0 - glow));

          // Clay shading of the solids (ground and background stay flat paper).
          if (c0.a > 0.5 / 255.0) {
            vec3 n0 = normalize(c0.xyz * 2.0 - 1.0);
            vec3 L = normalize(vec3(-0.42, 0.78, 0.46));
            float k = (dot(n0, L) - dot(uGN, L)) * uClay;
            paper *= 1.0 + k * fog;
          }
          gl_FragColor = vec4(mix(paper, ink, clamp(a, 0.0, 1.0)), 1.0);
          gl_FragDepth = d0;
        }`,
    });
    this.post = new Scene();
    const quad = new Mesh(new PlaneGeometry(2, 2), this.mat);
    quad.frustumCulled = false;
    this.post.add(quad);

    // Pass 4: a veil of paper over the text column, so solids and line
    // geometry alike are ghosted behind the copy.
    const u = this.mat.uniforms;
    this.veilMat = new ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: { uBg: u.uBg, uNight: u.uNight, uCol: u.uCol },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */ `
        precision highp float;
        varying vec2 vUv;
        uniform vec3 uBg; uniform float uNight; uniform vec3 uCol;
        void main() {
          vec2 q = vUv - vec2(0.62, 0.55);
          float glow = 1.0 - smoothstep(0.0, 0.9, length(q * vec2(1.0, 1.25)));
          vec3 paper = uBg * (1.0 + mix(0.035, 0.09, uNight) * glow - mix(0.025, 0.0, uNight) * (1.0 - glow));
          float keep = mix(uCol.z, 1.0, smoothstep(uCol.x - uCol.y * 0.4, uCol.x + uCol.y, vUv.x));
          gl_FragColor = vec4(paper, 1.0 - keep);
        }`,
    });
    this.veil = new Scene();
    const vq = new Mesh(new PlaneGeometry(2, 2), this.veilMat);
    vq.frustumCulled = false;
    this.veil.add(vq);
  }
  veil: Scene;
  veilMat: ShaderMaterial;

  setSize(w: number, h: number) {
    this.rt.setSize(w, h);
    (this.mat.uniforms.uRes.value as Vector2).set(w, h);
  }
}

import { useEffect, useRef } from 'react'
import { getTheme } from '@/lib/theme'
import { A11Y_EVENT, motionReduced } from '@/lib/a11y'
import * as THREE from 'three'

/**
 * Full-page contour background - KhaelWorks' own design.
 *
 * A survey map drawn on ledger paper: fine evenly spaced contour lines, every
 * fourth one heavier, one line picked out in brand green like a trend line on
 * a chart, all over a faint 36px grid. The terrain breathes slowly; the cursor
 * drops ripples that run out through the lines and fade.
 *
 * Everything is drawn by one fragment shader on a fullscreen quad. Line width
 * comes from fwidth(), so lines stay hairline at any density. Spacing is in
 * screen pixels, not viewport fractions, so a wide monitor shows more terrain
 * instead of stretched terrain.
 *
 * Runtime rules carried over from the previous background, because they were
 * measured on real machines: 30fps cap (the drift is slow, 60 buys nothing),
 * pixel ratio 1, pause in a hidden tab, skip on touch and reduced motion, and
 * App.tsx removes it entirely on the `low` perf tier.
 */

// 3D simplex noise: Copyright (c) 2011 Ashima Arts / Ian McEwan. MIT License.
// https://github.com/ashima/webgl-noise - this block stays MIT.
const noiseGLSL = `
  vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
    vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;
    vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
`

const RIPPLES = 8

const vert = `
  void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }
`

const frag = `
  uniform float uTime;
  uniform vec2  uRes;                 // CSS pixels
  uniform float uPR;                  // device pixels per CSS pixel actually rendered
  uniform float uDark;                // 0 light, 1 dark
  uniform vec4  uRip[${RIPPLES}];     // x, y (CSS px, y up), age (s), strength
  ${noiseGLSL}

  const float SPACING   = 14.3;   // contour bands per unit of terrain height
  const float RIP_SPEED = 260.0;  // px per second
  const float RIP_LIFE  = 2.6;    // seconds

  float hairline(float v, float px){
    float f = fract(v);
    float d = min(f, 1.0 - f);
    float w = fwidth(v) * px;
    return 1.0 - smoothstep(0.0, w, d);
  }

  void main(){
    vec2 p = gl_FragCoord.xy / uPR;          // CSS px, origin bottom-left
    vec2 q = p / 900.0;

    // Terrain: a broad slow layer, a finer one, and a gentle tilt so the
    // lines run across the page rather than closing into pebbles.
    float n = snoise(vec3(q * 1.15, uTime * 0.05))
            + snoise(vec3(q * 3.1 + 7.0, uTime * 0.08)) * 0.22
            + (1.0 - p.y / uRes.y) * 0.35;

    for (int i = 0; i < ${RIPPLES}; i++) {
      vec4 r = uRip[i];
      if (r.w <= 0.0) continue;
      float ring = distance(p, r.xy) - r.z * RIP_SPEED;
      n += exp(-ring * ring / 900.0) * 0.08 * max(0.0, 1.0 - r.z / RIP_LIFE) * r.w;
    }

    float bands = n * SPACING;
    float idx   = floor(bands + 0.5);
    float major = 1.0 - step(0.5, mod(idx, 4.0));
    float trend = 1.0 - step(0.5, abs(idx - 4.0));

    float lMinor = hairline(bands, 1.0);
    float lMajor = hairline(bands, 1.3) * major;
    float lTrend = hairline(bands, 1.8) * trend;

    vec2 g = mod(p, 36.0);
    float grid = 1.0 - smoothstep(0.0, 1.0, min(g.x, g.y));

    vec3 bg     = mix(vec3(0.957, 0.957, 0.929), vec3(0.024, 0.047, 0.102), uDark);
    vec3 ink    = mix(vec3(0.043, 0.118, 0.247), vec3(0.63, 0.75, 0.90), uDark);
    vec3 green  = mix(vec3(0.043, 0.478, 0.373), vec3(0.31, 0.82, 0.68), uDark);

    vec3 col = bg;
    col = mix(col, ink, grid * mix(0.04, 0.045, uDark));
    col = mix(col, ink, max(lMinor * mix(0.085, 0.10, uDark), lMajor * mix(0.17, 0.20, uDark)) * (1.0 - trend));
    col = mix(col, green, lTrend * mix(0.72, 0.75, uDark));
    gl_FragColor = vec4(col, 1.0);
  }
`

export default function ContourCanvas() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isTouch =
      'ontouchstart' in window ||
      window.matchMedia('(pointer: coarse)').matches ||
      navigator.maxTouchPoints > 0
    if (reduced || isTouch) return

    const scene = new THREE.Scene()
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const renderer = new THREE.WebGLRenderer({ antialias: false })
    // 1:1 on purpose - see the history in git for HeroCanvasV2: a higher
    // ratio cost scroll smoothness on HiDPI laptops. Step down, never up.
    const pr = Math.min(window.devicePixelRatio, 1)
    renderer.setPixelRatio(pr)
    renderer.setSize(window.innerWidth, window.innerHeight)
    el.appendChild(renderer.domElement)

    const dark = { value: getTheme() === 'dark' ? 1 : 0 }
    let targetDark = dark.value
    const onThemeChange = () => { targetDark = getTheme() === 'dark' ? 1 : 0 }
    window.addEventListener('themechange', onThemeChange)

    const rip = Array.from({ length: RIPPLES }, () => new THREE.Vector4(0, 0, 0, 0))
    const geo = new THREE.PlaneGeometry(2, 2)
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uTime: { value: 0 },
        uRes: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uPR: { value: pr },
        uDark: dark,
        uRip: { value: rip },
      },
      depthTest: false,
      depthWrite: false,
    })
    scene.add(new THREE.Mesh(geo, mat))

    // Ripples: one every 160ms while the pointer moves, oldest slot reused.
    let next = 0
    let lastDrop = 0
    const onMove = (e: MouseEvent) => {
      const now = performance.now()
      if (now - lastDrop < 160) return
      lastDrop = now
      rip[next].set(e.clientX, window.innerHeight - e.clientY, 0, 1)
      next = (next + 1) % RIPPLES
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight)
      mat.uniforms.uRes.value.set(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    let visible = document.visibilityState !== 'hidden'
    const onVisibility = () => {
      const now = document.visibilityState !== 'hidden'
      if (now && !visible) { visible = true; lastTs = performance.now(); if (!held) raf = requestAnimationFrame(loop) }
      else visible = now
    }
    document.addEventListener('visibilitychange', onVisibility)

    const FRAME_INTERVAL = 1000 / 30
    const DRIFT_PER_SECOND = 1.0
    const DARK_PER_SECOND = 7.0
    let time = Math.random() * 100
    let lastTs = performance.now()

    // The accessibility menu's Reduce motion switch: hold the current frame,
    // pick up again when it is switched back off.
    let held = false
    const onA11y = () => {
      const was = held
      held = motionReduced()
      if (was && !held && visible) { lastTs = performance.now(); raf = requestAnimationFrame(loop) }
    }
    window.addEventListener(A11Y_EVENT, onA11y)

    function loop(now: number = performance.now()) {
      if (!visible || held) return
      raf = requestAnimationFrame(loop)
      if (now - lastTs < FRAME_INTERVAL - 1) return
      const dt = Math.min(0.05, (now - lastTs) / 1000)
      lastTs = now
      time += DRIFT_PER_SECOND * dt
      for (const r of rip) {
        if (r.w <= 0) continue
        r.z += dt
        if (r.z > 2.6) r.w = 0
      }
      dark.value += (targetDark - dark.value) * (1 - Math.exp(-DARK_PER_SECOND * dt))
      mat.uniforms.uTime.value = time
      renderer.render(scene, cam)
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('themechange', onThemeChange)
      window.removeEventListener(A11Y_EVENT, onA11y)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
      geo.dispose()
      mat.dispose()
    }
  }, [])

  return <div ref={ref} className="hero-canvas" aria-hidden="true" />
}

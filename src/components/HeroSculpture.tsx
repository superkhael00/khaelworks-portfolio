import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { getTheme } from '@/lib/theme'
import { motionReduced } from '@/lib/a11y'
import { buildSculpt } from '@/lib/sculptShapes'

/**
 * The Home hero sculpture: a cloud of dots that morphs
 * Busywork (a pile of paper) -> Automation (a workflow) -> Done (a check),
 * which is the headline's promise drawn as an object.
 *
 *  - Hover: dots near the cursor push away, tint green and settle back.
 *  - Drag (left button or a finger): rotate it in 3D. The morph pauses while
 *    it is held, it keeps some momentum on release, then eases back to front.
 *  - Off screen or in a hidden tab it stops rendering.
 *  - Reduced motion: no morph, sway or drift; it only redraws while dragged.
 *
 * All per-dot work happens in the vertex shader: the three shapes live in
 * GPU buffers and the CPU only sends a handful of uniforms per frame.
 */

const vert = `
  attribute vec3 p0;
  attribute vec3 p1;
  attribute vec3 p2;
  attribute vec3 aRole;
  attribute float aWire;
  attribute float aRand;
  uniform float uFrom, uTo, uMix, uBurst, uTime, uSize, uScale, uMouseOn, uFlowW;
  uniform vec3 uMouse, uInk, uDim, uAcc;
  varying vec3 vCol;

  vec3 pick(float i){ return i < 0.5 ? p0 : (i < 1.5 ? p1 : p2); }
  float rolePick(float i){ return i < 0.5 ? aRole.x : (i < 1.5 ? aRole.y : aRole.z); }
  vec3 roleCol(float r){ return (r > 1.5 && r < 2.5) ? uAcc : (r > 0.5 ? uDim : uInk); }

  void main(){
    // Stagger each dot a little so the change ripples through the shape.
    float mm = clamp((uMix - aRand * 0.25) / 0.75, 0.0, 1.0);
    vec3 pos = mix(pick(uFrom), pick(uTo), mm);

    // Swirl mid-morph, and a tiny idle breath.
    float sc = uBurst * 0.45;
    pos += sc * vec3(sin(pos.y * 2.1 + uTime * 1.3 + aRand * 31.0),
                     sin(pos.z * 2.3 + uTime * 1.1 + aRand * 17.0),
                     sin(pos.x * 1.9 + uTime * 1.5 + aRand * 7.0));
    pos.xy += vec2(sin(uTime * 1.3 + aRand * 40.0), cos(uTime * 1.1 + aRand * 30.0)) * 0.006;

    // Cursor push, in the sculpture's own space.
    vec2 d = pos.xy - uMouse.xy;
    float dist = length(d);
    float f = dist < 0.62 ? pow(1.0 - dist / 0.62, 2.0) * 0.7 * uMouseOn : 0.0;
    pos += vec3(d / (dist + 1e-4) * f, f * (aRand - 0.5) * 1.4);

    vec3 c = mix(roleCol(rolePick(uFrom)), roleCol(rolePick(uTo)), mm);
    // Data pulses running down the workflow's wires.
    if (aRole.y > 2.5 && uFlowW > 0.01) {
      float t = fract(aWire), w = floor(aWire);
      float dd = fract(uTime * 0.55 + w * 0.37) - t;
      float pl = (dd >= 0.0 && dd < 0.24) ? 1.0 - dd / 0.24 : 0.0;
      c = mix(c, uAcc, pl * uFlowW);
    }
    c = mix(c, uAcc, min(1.0, f * 3.0));
    vCol = c;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uScale / -mv.z;
  }
`

const frag = `
  uniform float uAlpha;
  varying vec3 vCol;
  void main(){
    float r = length(gl_PointCoord - 0.5);
    if (r > 0.5) discard;
    gl_FragColor = vec4(vCol, uAlpha * smoothstep(0.5, 0.3, r));
  }
`

const STAGES = ['Busywork', 'Automation', 'Done'] as const
const HOLD = 3.4
const MORPH = 1.7
const CYCLE = HOLD + MORPH

function palette() {
  return getTheme() === 'dark'
    ? { ink: [0.8, 0.86, 0.95], dim: [0.42, 0.52, 0.66], acc: [0.31, 0.82, 0.68], alpha: 0.92 }
    : { ink: [0.04, 0.12, 0.25], dim: [0.45, 0.5, 0.58], acc: [0.04, 0.48, 0.37], alpha: 0.9 }
}

export default function HeroSculpture({ count = 16000 }: { count?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stage, setStage] = useState(0)
  const [hint, setHint] = useState(true)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || motionReduced()

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch {
      wrap.dataset.off = 'true'
      return
    }
    const pr = Math.min(window.devicePixelRatio || 1, 2)
    renderer.setPixelRatio(pr)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50)
    camera.position.set(0, 0.15, 7.2)

    const data = buildSculpt(count)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(data.pos[0], 3))
    geo.setAttribute('p0', new THREE.BufferAttribute(data.pos[0], 3))
    geo.setAttribute('p1', new THREE.BufferAttribute(data.pos[1], 3))
    geo.setAttribute('p2', new THREE.BufferAttribute(data.pos[2], 3))
    geo.setAttribute('aRole', new THREE.BufferAttribute(data.role, 3))
    geo.setAttribute('aWire', new THREE.BufferAttribute(data.wire, 1))
    geo.setAttribute('aRand', new THREE.BufferAttribute(data.rand, 1))
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4) // the morph moves dots past the static bounds

    const pal = palette()
    const u = {
      uFrom: { value: 0 }, uTo: { value: 1 }, uMix: { value: 0 }, uBurst: { value: 0 },
      uTime: { value: 0 }, uSize: { value: 0.03 }, uScale: { value: 300 },
      uMouseOn: { value: 0 }, uFlowW: { value: 0 }, uMouse: { value: new THREE.Vector3(99, 99, 0) },
      uInk: { value: new THREE.Color(...(pal.ink as [number, number, number])) },
      uDim: { value: new THREE.Color(...(pal.dim as [number, number, number])) },
      uAcc: { value: new THREE.Color(...(pal.acc as [number, number, number])) },
      uAlpha: { value: pal.alpha },
    }
    const mat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: u, transparent: true, depthWrite: false })
    const points = new THREE.Points(geo, mat)
    const group = new THREE.Group()
    group.rotation.order = 'YXZ'
    group.add(points)
    scene.add(group)

    const onTheme = () => {
      const p = palette()
      u.uInk.value.setRGB(p.ink[0], p.ink[1], p.ink[2]); u.uDim.value.setRGB(p.dim[0], p.dim[1], p.dim[2])
      u.uAcc.value.setRGB(p.acc[0], p.acc[1], p.acc[2]); u.uAlpha.value = p.alpha
      dirty = true
    }
    window.addEventListener('themechange', onTheme)

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      if (!r.width || !r.height) return
      renderer.setSize(r.width, r.height, false)
      camera.aspect = r.width / r.height
      camera.updateProjectionMatrix()
      u.uScale.value = (r.height * pr) / 2 // same size attenuation as THREE.PointsMaterial
      group.scale.setScalar(0.86 * Math.min(1, camera.aspect / 1.15) + 0.06)
      dirty = true
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // ---- Pointer: hover push + drag to rotate ----
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    const hit = new THREE.Vector3(), mouseTarget = new THREE.Vector3(99, 99, 0)
    let hover = false
    const rot = { x: 0, y: 0, vx: 0, vy: 0, drag: false, px: 0, py: 0, idle: 99, id: -1 }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      hover = Math.abs(ndc.x) < 1.1 && Math.abs(ndc.y) < 1.1
      if (rot.drag && e.pointerId === rot.id) {
        const dx = e.clientX - rot.px, dy = e.clientY - rot.py
        rot.px = e.clientX; rot.py = e.clientY
        rot.vy = dx * 0.009; rot.vx = dy * 0.009
        rot.y += rot.vy; rot.x = Math.max(-1.35, Math.min(1.35, rot.x + rot.vx)); rot.idle = 0
      }
      dirty = true
    }
    const onLeave = () => { hover = false }
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      rot.drag = true; rot.id = e.pointerId; rot.px = e.clientX; rot.py = e.clientY; rot.vx = rot.vy = 0
      canvas.setPointerCapture(e.pointerId)
      wrap.dataset.drag = 'true'
      setHint(false)
    }
    const onUp = () => {
      if (!rot.drag) return
      rot.drag = false
      delete wrap.dataset.drag
      try { canvas.releasePointerCapture(rot.id) } catch { /* already released */ }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    canvas.addEventListener('lostpointercapture', onUp)

    // ---- Visibility ----
    let onScreen = true
    const io = new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; if (onScreen) kick() })
    io.observe(wrap)
    const onVis = () => { if (document.visibilityState !== 'hidden') kick() }
    document.addEventListener('visibilitychange', onVis)

    // ---- Loop ----
    let raf = 0, running = false, dirty = true
    let last = performance.now(), simT = 0, clock = 0, lastStage = -1
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

    function frame(now: number) {
      raf = 0
      if (!onScreen || document.visibilityState === 'hidden') { running = false; return }
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const f60 = dt * 60

      if (!still) { clock += dt; if (!rot.drag) simT += dt }
      if (!rot.drag) {
        rot.idle += dt
        rot.y += rot.vy * f60
        rot.x = Math.max(-1.35, Math.min(1.35, rot.x + rot.vx * f60))
        const damp = Math.pow(0.93, f60)
        rot.vx *= damp; rot.vy *= damp
        if (rot.idle > 1.6) { // back to the front view, the short way round
          const ty = Math.round(rot.y / (Math.PI * 2)) * Math.PI * 2, k = 1 - Math.pow(0.965, f60)
          rot.y += (ty - rot.y) * k; rot.x += -rot.x * k
        }
      }

      // Timeline: hold, then morph to the next shape.
      const ph = simT / CYCLE, k = Math.floor(ph), local = (ph - k) * CYCLE
      const from = still ? 1 : ((k % 3) + 3) % 3, to = (from + 1) % 3
      const raw = still || local < HOLD ? 0 : (local - HOLD) / MORPH
      u.uFrom.value = from; u.uTo.value = to; u.uMix.value = ease(raw); u.uBurst.value = Math.sin(Math.PI * raw)
      u.uFlowW.value = (from === 1 ? 1 - u.uMix.value : 0) + (to === 1 ? u.uMix.value : 0)
      u.uTime.value = clock
      const s = raw < 0.5 ? from : to
      if (s !== lastStage) { lastStage = s; setStage(s) }

      group.rotation.y = (still ? 0 : Math.sin(simT * 0.25) * 0.38) + rot.y
      group.rotation.x = (still ? 0 : Math.sin(simT * 0.17) * 0.08 - 0.04) + rot.x
      group.updateMatrixWorld()

      // Hover push follows a smoothed cursor, so dots drift back rather than snap.
      const pushOn = hover && !rot.drag && rot.idle > 0.4 && !still
      if (pushOn) {
        ray.setFromCamera(ndc, camera)
        if (ray.ray.intersectPlane(plane, hit)) mouseTarget.copy(points.worldToLocal(hit.clone()))
      }
      u.uMouse.value.lerp(mouseTarget, 1 - Math.pow(0.8, f60))
      u.uMouseOn.value += ((pushOn ? 1 : 0) - u.uMouseOn.value) * (1 - Math.pow(0.9, f60))

      renderer.render(scene, camera)
      dirty = false

      const offFront = Math.abs(rot.y - Math.round(rot.y / (Math.PI * 2)) * Math.PI * 2)
      const moving = Math.abs(rot.vx) + Math.abs(rot.vy) > 1e-4 || Math.abs(rot.x) > 1e-3 || offFront > 1e-3
      if (!still || rot.drag || moving || dirty) raf = requestAnimationFrame(frame)
      else running = false
    }
    function kick() {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    resize()
    kick()
    // Reduced motion only redraws on demand; dragging wakes it.
    const wake = () => kick()
    canvas.addEventListener('pointerdown', wake)
    window.addEventListener('pointermove', wake, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect(); ro.disconnect()
      window.removeEventListener('themechange', onTheme)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointermove', wake)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVis)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerdown', wake)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('lostpointercapture', onUp)
      geo.dispose(); mat.dispose(); renderer.dispose()
    }
  }, [count])

  return (
    <div className="sculpt" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className="sculpt__canvas"
        role="img"
        aria-label="Animated dots: a pile of paperwork becomes a workflow, then a check mark. Drag to rotate."
      />
      <div className={`sculpt__hint${hint ? '' : ' is-gone'}`} aria-hidden="true">Drag to rotate</div>
      <div className="sculpt__steps" aria-hidden="true">
        {STAGES.map((label, i) => (
          <span key={label} className={i === stage ? 'is-on' : undefined}>{label}</span>
        ))}
      </div>
    </div>
  )
}

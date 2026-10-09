/**
 * Dot titles: a page heading drawn as a fine grid of dots. The cursor pushes
 * the dots away with a slight swirl; a soft spring brings them home, so the
 * words scatter and reform.
 *
 * The real heading stays in the DOM exactly as CSS lays it out - same font,
 * wrapping and position, still read by screen readers and search engines. Its
 * glyphs are made transparent and a canvas on top draws the dots. The canvas
 * is built from the heading's own word boxes (Range.getClientRects), so the
 * dots sit where the letters would and nothing about the layout changes. That
 * matters on Home, where the intro flies its copy onto the heading's rect.
 *
 * Off: reduced motion (the OS setting or the site's accessibility menu), high
 * contrast, forced colours, touch-only screens, headings under 28px, or no
 * canvas support. Then the heading is just text.
 */
import { A11Y_EVENT, readPrefs } from './a11y'

type Opts = { gather?: boolean }

const pointer = { x: -9999, y: -9999, vx: 0, vy: 0 }
const items = new Set<DotTitle>()
let listening = false
let running = false
let last = 0

function onPointerMove(e: PointerEvent) {
  pointer.vx = e.clientX - pointer.x
  pointer.vy = e.clientY - pointer.y
  pointer.x = e.clientX
  pointer.y = e.clientY
  for (const it of items) it.awake = true
  kick()
}
function onPointerGone() { pointer.x = pointer.y = -9999 }
function onTheme() { for (const it of items) it.recolor() }

function listen(on: boolean) {
  if (on === listening) return
  listening = on
  const fn = on ? 'addEventListener' : 'removeEventListener'
  window[fn]('pointermove', onPointerMove as EventListener, { passive: true } as AddEventListenerOptions)
  window[fn]('pointerdown', onPointerMove as EventListener, { passive: true } as AddEventListenerOptions)
  document.documentElement[fn]('pointerleave', onPointerGone)
  window[fn]('blur', onPointerGone)
  window[fn]('themechange', onTheme)
}

function tick(now: number) {
  const dt = Math.min(3, (now - last) / 16.7 || 1)
  last = now
  let any = false
  for (const it of items) if (it.visible && it.awake) { it.step(dt); any = any || it.awake }
  pointer.vx *= 0.9
  pointer.vy *= 0.9
  if (any) requestAnimationFrame(tick)
  else running = false
}
function kick() {
  if (running) return
  running = true
  last = performance.now()
  requestAnimationFrame(tick)
}

export function dotTitlesAllowed(): boolean {
  if (typeof window === 'undefined') return false
  const prefs = readPrefs()
  if (prefs.motion || prefs.contrast) return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (window.matchMedia('(forced-colors: active)').matches) return false
  // A cursor is the point of the effect. Touch screens keep crisp plain text.
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return false
  return !!document.createElement('canvas').getContext
}

class DotTitle {
  el: HTMLElement
  cv: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  visible = false
  awake = true
  private gather: boolean
  private gathered = false
  private ready = false
  private W = 0
  private H = 0
  private d = 1
  private fs = 40
  private r = 1
  private n = 0
  private hx = new Float32Array(0)
  private hy = new Float32Array(0)
  private x = new Float32Array(0)
  private y = new Float32Array(0)
  private vx = new Float32Array(0)
  private vy = new Float32Array(0)
  private ink = '#0B1E3F'
  private acc = '#0B7A5F'
  private io: IntersectionObserver
  private ro: ResizeObserver
  private rt = 0
  private dead = false

  constructor(el: HTMLElement, opts: Opts) {
    this.el = el
    this.gather = opts.gather ?? true
    this.cv = document.createElement('canvas')
    this.cv.className = 'dot-title__canvas'
    this.cv.setAttribute('aria-hidden', 'true')
    this.ctx = this.cv.getContext('2d') as CanvasRenderingContext2D
    el.classList.add('dot-title')
    el.appendChild(this.cv)
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting
      if (this.visible) { this.awake = true; kick() }
    })
    this.ro = new ResizeObserver(() => {
      clearTimeout(this.rt)
      this.rt = window.setTimeout(() => this.layout(false), 120)
    })
    const start = () => {
      if (this.dead) return
      this.layout(this.gather)
      this.io.observe(el)
      this.ro.observe(el)
    }
    if (document.fonts?.ready) document.fonts.ready.then(start, start)
    else start()
  }

  recolor() {
    const root = getComputedStyle(document.documentElement)
    this.ink = getComputedStyle(this.el).color
    this.acc = root.getPropertyValue('--orange-ink').trim() || '#0B7A5F'
    if (this.ready) this.draw()
  }

  /** Sample the heading's own glyphs into dot positions. */
  layout(gather: boolean) {
    if (this.dead) return
    const el = this.el
    const er = el.getBoundingClientRect()
    const w = el.offsetWidth, h = el.offsetHeight
    if (!w || !h) return
    const zoom = er.width / w || 1 // the a11y text-size setting uses CSS zoom
    const cs = getComputedStyle(el)
    const fs = parseFloat(cs.fontSize)
    if (fs < 28) { // too small to read as dots: stay text
      el.classList.remove('is-dotted'); this.cv.style.display = 'none'; this.ready = false; return
    }
    this.cv.style.display = ''
    const pad = Math.ceil(fs * 1.3)
    const W = w + pad * 2, H = h + pad * 2
    const d = Math.min(2, window.devicePixelRatio || 1)
    this.fs = fs; this.W = W; this.H = H; this.d = d

    const oc = document.createElement('canvas')
    oc.width = W; oc.height = H
    const g = oc.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D
    g.fillStyle = '#000'
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const range = document.createRange()
    for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
      const parent = node.parentElement
      if (!parent) continue
      const pcs = getComputedStyle(parent)
      g.font = `${pcs.fontStyle} ${pcs.fontWeight} ${pcs.fontSize} ${pcs.fontFamily}`
      const ls = pcs.letterSpacing === 'normal' ? 0 : parseFloat(pcs.letterSpacing)
      if ('letterSpacing' in g) (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${ls}px`
      const text = node.data
      for (const m of text.matchAll(/\S+/g)) {
        range.setStart(node, m.index ?? 0)
        range.setEnd(node, (m.index ?? 0) + m[0].length)
        const rects = range.getClientRects()
        if (!rects.length) continue
        const r = rects[0]
        const met = g.measureText(m[0])
        const asc = met.fontBoundingBoxAscent ?? parseFloat(pcs.fontSize) * 0.92
        const desc = met.fontBoundingBoxDescent ?? parseFloat(pcs.fontSize) * 0.3
        const lx = (r.left - er.left) / zoom
        // Centre the font box in the line's content box, then sit on its baseline.
        const ly = (r.top - er.top) / zoom + (r.height / zoom - (asc + desc)) / 2 + asc
        g.fillText(m[0], lx + pad, ly + pad)
      }
    }
    range.detach?.()

    const data = g.getImageData(0, 0, W, H).data
    const step = Math.max(2.2, fs / 22)
    this.r = step * 0.46
    const hx: number[] = [], hy: number[] = []
    for (let yy = step / 2; yy < H; yy += step) {
      for (let xx = step / 2; xx < W; xx += step) {
        if (data[((yy | 0) * W + (xx | 0)) * 4 + 3] > 140) { hx.push(xx); hy.push(yy) }
      }
    }
    const n = hx.length
    this.n = n
    this.hx = Float32Array.from(hx); this.hy = Float32Array.from(hy)
    this.x = new Float32Array(n); this.y = new Float32Array(n)
    this.vx = new Float32Array(n); this.vy = new Float32Array(n)
    const cloud = gather && !this.gathered
    for (let i = 0; i < n; i++) {
      if (cloud) {
        const a = Math.random() * Math.PI * 2, rr = 40 + Math.random() * fs * 1.6
        this.x[i] = this.hx[i] + Math.cos(a) * rr
        this.y[i] = this.hy[i] + Math.sin(a) * rr * 0.6
      } else { this.x[i] = this.hx[i]; this.y[i] = this.hy[i] }
    }
    this.gathered = true

    this.cv.width = W * d; this.cv.height = H * d
    this.cv.style.width = `${W}px`; this.cv.style.height = `${H}px`
    this.cv.style.left = `${-pad}px`; this.cv.style.top = `${-pad}px`
    this.recolor()
    this.ready = true
    this.draw()
    el.classList.add('is-dotted') // only now hide the real glyphs - no blank frame
    this.awake = true
    kick()
  }

  step(dt: number) {
    if (!this.ready) { this.awake = false; return }
    const rect = this.cv.getBoundingClientRect()
    const zoom = rect.width / this.W || 1
    const mx = (pointer.x - rect.left) / zoom, my = (pointer.y - rect.top) / zoom
    const R = this.fs * 1.15
    const near = mx > -R && mx < this.W + R && my > -R && my < this.H + R
    const speed = Math.min(1.6, Math.hypot(pointer.vx, pointer.vy) / 18 + 0.35)
    const damp = Math.pow(0.88, dt)
    const { hx, hy, x, y, vx, vy, n } = this
    let moving = false
    for (let i = 0; i < n; i++) {
      let ax = (hx[i] - x[i]) * 0.028, ay = (hy[i] - y[i]) * 0.028 // spring home
      if (near) {
        const dx = x[i] - mx, dy = y[i] - my, d2 = dx * dx + dy * dy
        if (d2 < R * R) {
          const dd = Math.sqrt(d2) + 0.001, f = (1 - dd / R) ** 2 * speed
          ax += (dx / dd) * f * 2.0 - (dy / dd) * f * 1.5 // push out + swirl
          ay += (dy / dd) * f * 2.0 + (dx / dd) * f * 1.5
        }
      }
      vx[i] = (vx[i] + ax * dt) * damp
      vy[i] = (vy[i] + ay * dt) * damp
      x[i] += vx[i] * dt
      y[i] += vy[i] * dt
      if (!moving && (Math.abs(vx[i]) > 0.01 || Math.abs(vy[i]) > 0.01 || Math.abs(hx[i] - x[i]) > 0.15 || Math.abs(hy[i] - y[i]) > 0.15)) moving = true
    }
    if (!moving) { x.set(hx); y.set(hy) }
    this.awake = moving || near
    this.draw()
  }

  draw() {
    const c = this.ctx, r = this.r, { x, y, hx, hy, n } = this
    c.setTransform(this.d, 0, 0, this.d, 0, 0)
    c.clearRect(0, 0, this.W, this.H)
    c.fillStyle = this.ink
    c.beginPath()
    const loose: number[] = []
    for (let i = 0; i < n; i++) {
      if (Math.abs(x[i] - hx[i]) + Math.abs(y[i] - hy[i]) > 3) { loose.push(i); continue }
      c.moveTo(x[i] + r, y[i])
      c.arc(x[i], y[i], r, 0, Math.PI * 2)
    }
    c.fill()
    if (loose.length) {
      c.fillStyle = this.acc
      c.beginPath()
      for (const i of loose) { c.moveTo(x[i] + r, y[i]); c.arc(x[i], y[i], r * 0.9, 0, Math.PI * 2) }
      c.fill()
    }
  }

  destroy() {
    this.dead = true
    clearTimeout(this.rt)
    this.io.disconnect()
    this.ro.disconnect()
    this.cv.remove()
    this.el.classList.remove('dot-title', 'is-dotted')
  }
}

/** Turn a heading into a dot title. Returns a cleanup, or null if it stays text. */
export function attachDotTitle(el: HTMLElement | null, opts: Opts = {}): (() => void) | null {
  if (!el || !dotTitlesAllowed()) return null
  const t = new DotTitle(el, opts)
  items.add(t)
  listen(true)
  return () => {
    t.destroy()
    items.delete(t)
    if (!items.size) listen(false)
  }
}

export { A11Y_EVENT }

/**
 * Point clouds for the Home hero sculpture. Three shapes with the same number
 * of points, so point i of one shape morphs into point i of the next:
 *
 *   0  Busywork    a messy pile of documents with lines of text on them
 *   1  Automation  a 3D workflow: rounded nodes joined by curved wires
 *   2  Done        a thick check mark inside a ring
 *
 * Each point also carries a role per shape (0 ink, 1 dim, 2 accent, 3 wire)
 * and, for the workflow, where it sits along its wire so the shader can run
 * data pulses down the cables. Seeded random, so the shapes are identical on
 * every load.
 */

export type SculptData = {
  count: number
  pos: [Float32Array, Float32Array, Float32Array]
  role: Float32Array // vec3 per point: role in shape 0, 1, 2
  wire: Float32Array // wire index + position along it (0..1) in shape 1
  rand: Float32Array
}

export const ROLE = { ink: 0, dim: 1, accent: 2, wire: 3 } as const

export function buildSculpt(count: number): SculptData {
  let seed = 21
  const rnd = () => ((seed = (seed * 16807) % 2147483647), (seed - 1) / 2147483646)
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const rotX = (v: number[], a: number) => [v[0], v[1] * Math.cos(a) - v[2] * Math.sin(a), v[1] * Math.sin(a) + v[2] * Math.cos(a)]
  const rotY = (v: number[], a: number) => [v[0] * Math.cos(a) + v[2] * Math.sin(a), v[1], -v[0] * Math.sin(a) + v[2] * Math.cos(a)]
  const rotZ = (v: number[], a: number) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a), v[2]]

  const pos: SculptData['pos'] = [new Float32Array(count * 3), new Float32Array(count * 3), new Float32Array(count * 3)]
  const role = new Float32Array(count * 3)
  const wire = new Float32Array(count)
  const rand = new Float32Array(count)
  const put = (s: 0 | 1 | 2, i: number, x: number, y: number, z: number, r: number) => {
    pos[s][i * 3] = x; pos[s][i * 3 + 1] = y; pos[s][i * 3 + 2] = z; role[i * 3 + s] = r
  }

  // ---- 0. Busywork: a pile of sheets ----
  seed = 3
  const sheets: { x: number; y: number; z: number; rx: number; ry: number; rz: number }[] = []
  for (let k = 0; k < 9; k++) {
    sheets.push({ x: (rnd() - 0.5) * 1.5, y: -0.9 + k * 0.2 + (rnd() - 0.5) * 0.15, z: (rnd() - 0.5) * 1.0, rz: (rnd() - 0.5) * 0.9, rx: -1.15 + (rnd() - 0.5) * 0.35, ry: (rnd() - 0.5) * 0.8 })
  }
  sheets.push({ x: 1.25, y: 1.15, z: 0.3, rz: 0.7, rx: -0.4, ry: 0.6 }, { x: -1.35, y: 0.9, z: -0.2, rz: -0.5, rx: -0.2, ry: -0.5 })
  for (let i = 0; i < count; i++) {
    if (rnd() < 0.04) { put(0, i, (rnd() - 0.5) * 4, (rnd() - 0.5) * 3.2, (rnd() - 0.5) * 2, ROLE.dim); continue }
    const sh = sheets[Math.floor(rnd() * sheets.length)]
    const w = 1.15, h = 1.5
    let u: number, v: number, r: number = ROLE.ink
    const q = rnd()
    if (q < 0.3) {
      const e = rnd() * 2 * (w + h)
      if (e < w) { u = e; v = 0 } else if (e < w + h) { u = w; v = e - w } else if (e < 2 * w + h) { u = e - w - h; v = h } else { u = 0; v = e - 2 * w - h }
    } else if (q < 0.78) {
      const line = Math.floor(rnd() * 9)
      v = h * 0.12 + line * h * 0.085
      u = w * 0.12 + rnd() * w * (line === 0 ? 0.45 : line % 3 === 2 ? 0.55 : 0.8)
    } else { u = rnd() * w; v = rnd() * h; r = ROLE.dim }
    let p = [u - w / 2, v - h / 2, 0]
    p = rotZ(p, sh.rz); p = rotX(p, sh.rx); p = rotY(p, sh.ry)
    put(0, i, p[0] + sh.x, p[1] + sh.y, p[2] + sh.z, r)
  }

  // ---- 1. Automation: nodes and wires ----
  seed = 7
  const NODES = [[-1.75, 0, 0.2], [-0.55, 0.85, -0.25], [-0.55, -0.85, 0.25], [0.7, 0, 0], [1.8, 0.75, -0.2], [1.8, -0.75, 0.2]]
  const WIRES = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5]]
  const bez = (a: number[], b: number[], t: number) => {
    const dx = (b[0] - a[0]) * 0.55, mt = 1 - t
    const p1 = [a[0] + dx, a[1], a[2]], p2 = [b[0] - dx, b[1], b[2]]
    return [0, 1, 2].map((k) => mt * mt * mt * a[k] + 3 * mt * mt * t * p1[k] + 3 * mt * t * t * p2[k] + t * t * t * b[k])
  }
  for (let i = 0; i < count; i++) {
    const r = rnd()
    if (r < 0.58) {
      const n = Math.floor(rnd() * NODES.length), c = NODES[n], hs = n === 3 ? 0.36 : 0.27
      if (rnd() < 0.16) { // the node's icon: a small accent disc on its face
        const a = rnd() * 6.283, rr = rnd() * hs * 0.35
        put(1, i, c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr, c[2] + hs * 1.02, ROLE.accent); continue
      }
      let x = rnd() * 2 - 1, y = rnd() * 2 - 1, z = rnd() * 2 - 1
      const ax = Math.floor(rnd() * 3), sg = rnd() < 0.5 ? -1 : 1
      if (ax === 0) x = sg; else if (ax === 1) y = sg; else z = sg
      const m = Math.max(Math.abs(x), Math.abs(y), Math.abs(z)), len = Math.hypot(x, y, z), k = 0.82
      x = lerp(x / m, (x / len) * 1.25, 1 - k); y = lerp(y / m, (y / len) * 1.25, 1 - k); z = lerp(z / m, (z / len) * 1.25, 1 - k)
      put(1, i, c[0] + x * hs, c[1] + y * hs, c[2] + z * hs, ROLE.ink)
    } else if (r < 0.97) {
      const w = Math.floor(rnd() * WIRES.length), a = NODES[WIRES[w][0]], b = NODES[WIRES[w][1]], t = rnd()
      const p = bez([a[0] + 0.3, a[1], a[2]], [b[0] - 0.3, b[1], b[2]], t)
      const j = 0.022
      put(1, i, p[0] + (rnd() - 0.5) * j, p[1] + (rnd() - 0.5) * j, p[2] + (rnd() - 0.5) * j, ROLE.wire)
      wire[i] = w + t
    } else put(1, i, (rnd() - 0.5) * 4.2, (rnd() - 0.5) * 2.8, (rnd() - 0.5) * 1.5, ROLE.dim)
  }

  // ---- 2. Done: a check mark with depth, inside a ring ----
  seed = 13
  const segs = [[[-0.72, 0.02], [-0.22, -0.5]], [[-0.22, -0.5], [0.82, 0.62]]]
  for (let i = 0; i < count; i++) {
    const r = rnd()
    if (r < 0.48) {
      const [a, b] = segs[rnd() < 0.32 ? 0 : 1], t = rnd()
      const x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t)
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l
      const off = (rnd() - 0.5) * 0.24, dep = (rnd() - 0.5) * 0.4
      const side = rnd() < 0.75, o2 = side ? (rnd() < 0.5 ? -0.12 : 0.12) : off
      const o = side ? o2 : off
      put(2, i, x + nx * o, y + ny * o, side ? dep : rnd() < 0.5 ? -0.2 : 0.2, ROLE.accent)
    } else if (r < 0.9) {
      const a = rnd() * 6.283, b = rnd() * 6.283, R = 1.45, tr = 0.1
      put(2, i, (R + tr * Math.cos(b)) * Math.cos(a), (R + tr * Math.cos(b)) * Math.sin(a), tr * Math.sin(b), ROLE.ink)
    } else if (r < 0.97) {
      const a = rnd() * 6.283, R = 1.75 + rnd() * 0.25
      put(2, i, Math.cos(a) * R, Math.sin(a) * R, (rnd() - 0.5) * 0.3, ROLE.dim)
    } else put(2, i, (rnd() - 0.5) * 4.2, (rnd() - 0.5) * 3.2, (rnd() - 0.5) * 1.5, ROLE.dim)
  }

  seed = 99
  for (let i = 0; i < count; i++) rand[i] = rnd()
  return { count, pos, role, wire, rand }
}

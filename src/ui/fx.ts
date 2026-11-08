/* Capa de partículas a pantalla completa (un solo canvas, un solo bucle). */
type P = {
  x: number; y: number; vx: number; vy: number; life: number; max: number
  size: number; color: string; rot: number; vr: number; g: number; drag: number
  kind: 'dot' | 'shard' | 'confetti' | 'ring' | 'star'
  pts?: number[]
}

let canvas: HTMLCanvasElement | null = null
let c2d: CanvasRenderingContext2D | null = null
const ps: P[] = []
let running = false
let dpr = 1

function ensure() {
  if (canvas || typeof document === 'undefined') return
  canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60'
  document.body.appendChild(canvas)
  c2d = canvas.getContext('2d')
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas!.width = innerWidth * dpr; canvas!.height = innerHeight * dpr
  }
  resize(); addEventListener('resize', resize)
}

function loop() {
  if (!c2d || !canvas) return
  c2d.setTransform(dpr, 0, 0, dpr, 0, 0)
  c2d.clearRect(0, 0, innerWidth, innerHeight)
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i]
    p.life++
    if (p.life < 0) continue
    if (p.life > p.max) { ps.splice(i, 1); continue }
    p.vx *= p.drag; p.vy = p.vy * p.drag + p.g
    p.x += p.vx; p.y += p.vy; p.rot += p.vr
    const t = p.life / p.max
    const a = p.kind === 'ring' ? 1 - t : t < .7 ? 1 : 1 - (t - .7) / .3
    c2d.globalAlpha = Math.max(0, a)
    c2d.save(); c2d.translate(p.x, p.y); c2d.rotate(p.rot)
    if (p.kind === 'dot') {
      c2d.fillStyle = p.color; c2d.shadowColor = p.color; c2d.shadowBlur = 10
      c2d.beginPath(); c2d.arc(0, 0, p.size * (1 - t * .6), 0, Math.PI * 2); c2d.fill()
    } else if (p.kind === 'star') {
      c2d.fillStyle = p.color; c2d.shadowColor = p.color; c2d.shadowBlur = 14
      const s = p.size * (1 - t * .5)
      c2d.beginPath()
      for (let k = 0; k < 8; k++) { const r = k % 2 ? s * .35 : s; const ang = (k / 8) * Math.PI * 2; c2d.lineTo(Math.cos(ang) * r, Math.sin(ang) * r) }
      c2d.closePath(); c2d.fill()
    } else if (p.kind === 'confetti') {
      c2d.fillStyle = p.color
      c2d.scale(1, Math.abs(Math.sin(p.rot * 2)) + .15)
      c2d.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
    } else if (p.kind === 'shard' && p.pts) {
      c2d.fillStyle = p.color; c2d.strokeStyle = 'rgba(255,255,255,.55)'; c2d.lineWidth = 1
      c2d.beginPath(); c2d.moveTo(p.pts[0], p.pts[1]); for (let k = 2; k < p.pts.length; k += 2) c2d.lineTo(p.pts[k], p.pts[k + 1]); c2d.closePath()
      c2d.fill(); c2d.stroke()
    } else if (p.kind === 'ring') {
      c2d.strokeStyle = p.color; c2d.lineWidth = 3 * (1 - t) + .5; c2d.shadowColor = p.color; c2d.shadowBlur = 16
      c2d.beginPath(); c2d.arc(0, 0, p.size * (0.2 + t * 1.2), 0, Math.PI * 2); c2d.stroke()
    }
    c2d.restore()
  }
  c2d.globalAlpha = 1
  if (ps.length) requestAnimationFrame(loop)
  else { running = false; c2d.clearRect(0, 0, innerWidth, innerHeight) }
}
function kick() { if (!running) { running = true; requestAnimationFrame(loop) } }
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

export function burst(x: number, y: number, colors: string[], n = 40, speed = 7) {
  ensure()
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2, sp = speed * (.3 + Math.random())
    ps.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0, max: 40 + Math.random() * 30, size: 2 + Math.random() * 4, color: pick(colors), rot: 0, vr: 0, g: .08, drag: .94, kind: Math.random() < .25 ? 'star' : 'dot' })
  }
  kick()
}

export function ring(x: number, y: number, color: string, size = 160) {
  ensure()
  ps.push({ x, y, vx: 0, vy: 0, life: 0, max: 34, size, color, rot: 0, vr: 0, g: 0, drag: 1, kind: 'ring' })
  kick()
}

/** La tarjeta perdedora se rompe en cristales */
export function shatter(rect: DOMRect, color: string) {
  ensure()
  const cols = 5, rows = 6, w = rect.width / cols, h = rect.height / rows
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const cx = rect.left + i * w + w / 2, cy = rect.top + j * h + h / 2
    const jit = () => (Math.random() - .5) * w * .5
    const pts = [-w / 2 + jit(), -h / 2 + jit(), w / 2 + jit(), -h / 2 + jit(), w / 2 + jit(), h / 2 + jit(), -w / 2 + jit(), h / 2 + jit()]
    const dx = cx - (rect.left + rect.width / 2), dy = cy - (rect.top + rect.height / 2)
    ps.push({ x: cx, y: cy, vx: dx * .06 + (Math.random() - .5) * 3, vy: dy * .05 - Math.random() * 4, life: 0, max: 55 + Math.random() * 25, size: 0, color, rot: 0, vr: (Math.random() - .5) * .25, g: .35, drag: .985, kind: 'shard', pts })
  }
  kick()
}

export function confetti(colors: string[], n = 160) {
  ensure()
  for (let i = 0; i < n; i++) {
    const fromLeft = i % 2 === 0
    ps.push({ x: fromLeft ? -10 : innerWidth + 10, y: innerHeight * (.55 + Math.random() * .3), vx: (fromLeft ? 1 : -1) * (5 + Math.random() * 9), vy: -(10 + Math.random() * 10), life: 0, max: 120 + Math.random() * 60, size: 7 + Math.random() * 7, color: pick(colors), rot: Math.random() * 6, vr: (Math.random() - .5) * .3, g: .28, drag: .985, kind: 'confetti' })
  }
  kick()
}

/** Chispas que viajan de A a B (la idea elegida vuela a tu país) */
export function trail(from: { x: number; y: number }, to: { x: number; y: number }, color: string) {
  ensure()
  for (let i = 0; i < 26; i++) {
    const f = i / 26
    const frames = 26
    ps.push({ x: from.x + (Math.random() - .5) * 40, y: from.y + (Math.random() - .5) * 30, vx: (to.x - from.x) / frames * (.85 + f * .3), vy: (to.y - from.y) / frames * (.85 + f * .3), life: -i, max: frames + 6, size: 2 + Math.random() * 3, color, rot: 0, vr: 0, g: 0, drag: 1, kind: 'dot' })
  }
  kick()
}

import { useEffect, useRef, useState } from 'react'
import { PARTIES, partyById } from '../engine/data'
import { tendencyOf } from '../engine/engine'
import { sfx, haptic } from '../audio/sfx'
import { burst } from './fx'

const W = 1080, H = 1920
const DISPLAY = "'Bricolage Grotesque Variable', system-ui, sans-serif"
const BODY = "'Nunito Variable', system-ui, sans-serif"
const fmt = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export interface CardData { pos: number; eco: number | null; cul: number | null }

/** Dibuja la imagen para redes (formato historia 9:16) */
export function drawCard(cv: HTMLCanvasElement, d: CardData) {
  cv.width = W; cv.height = H
  const c = cv.getContext('2d')!
  const me = partyById(tendencyOf(d.pos))

  // fondo: noche violeta con auroras del color de tu tendencia
  const bg = c.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#1d1650'); bg.addColorStop(.55, '#0d0a24'); bg.addColorStop(1, '#070514')
  c.fillStyle = bg; c.fillRect(0, 0, W, H)
  const glow = (x: number, y: number, r: number, col: string, a: number) => {
    const g = c.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, hexA(col, a)); g.addColorStop(1, hexA(col, 0))
    c.fillStyle = g; c.fillRect(0, 0, W, H)
  }
  glow(200, 300, 700, '#6d28d9', .55); glow(950, 900, 650, me.color, .35); glow(300, 1700, 600, '#0f766e', .35)
  // estrellas
  const rnd = mulberry(Math.round(d.pos * 100) + 7)
  for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(255,255,255,${.15 + rnd() * .5})`; c.beginPath(); c.arc(rnd() * W, rnd() * H * .7, rnd() * 2.4 + .5, 0, Math.PI * 2); c.fill() }

  c.textAlign = 'center'; c.textBaseline = 'alphabetic'
  // marca
  c.font = `800 64px ${DISPLAY}`
  const brand = 'ESPECTRO'
  const bw = c.measureText(brand).width
  const tg = c.createLinearGradient(W / 2 - bw / 2, 0, W / 2 + bw / 2, 0)
  PARTIES.forEach((p, k) => tg.addColorStop(k / (PARTIES.length - 1), p.color))
  c.fillStyle = tg; c.fillText(brand, W / 2, 170)
  c.font = `800 30px ${BODY}`; c.fillStyle = 'rgba(221,214,254,.75)'
  spaced(c, 'TEST DE IDEOLOGÍA POLÍTICA', W / 2, 225, 6)

  // medalla
  drawMedal(c, W / 2, 640, me.color, me.glyph)

  // resultado
  c.font = `800 38px ${BODY}`; c.fillStyle = 'rgba(255,255,255,.8)'
  spaced(c, 'MI IDEOLOGÍA ES', W / 2, 1030, 8)
  const name = me.name.toUpperCase()
  let size = 130
  c.font = `800 ${size}px ${DISPLAY}`
  while (c.measureText(name).width > W - 140 && size > 70) { size -= 4; c.font = `800 ${size}px ${DISPLAY}` }
  c.save(); c.shadowColor = me.color; c.shadowBlur = 40; c.fillStyle = '#ffffff'; c.fillText(name, W / 2, 1160); c.restore()
  c.font = `700 44px ${BODY}`; c.fillStyle = me.color
  c.fillText(`${fmt(d.pos)} sobre 10`, W / 2, 1240)

  // espectro
  drawSpectrum(c, 120, 1320, W - 240, 34, d.pos, true)
  c.font = `800 26px ${BODY}`; c.fillStyle = 'rgba(255,255,255,.75)'
  c.textAlign = 'left'; c.fillText('IZQUIERDA', 120, 1420)
  c.textAlign = 'right'; c.fillText('DERECHA', W - 120, 1420)
  c.textAlign = 'center'; c.fillText('CENTRO', W / 2, 1420)

  // ejes
  const rows: [string, number | null][] = [['💶  Economía', d.eco], ['🧭  Valores y sociedad', d.cul]]
  rows.forEach(([label, v], k) => {
    if (v === null) return
    const y = 1530 + k * 120
    const t = partyById(tendencyOf(v))
    c.textAlign = 'left'; c.font = `800 34px ${BODY}`; c.fillStyle = '#ffffff'; c.fillText(label, 120, y)
    c.textAlign = 'right'; c.fillStyle = t.color; c.fillText(`${t.name} · ${fmt(v)}`, W - 120, y)
    drawSpectrum(c, 120, y + 26, W - 240, 14, v, false)
  })

  // pie
  c.textAlign = 'center'
  c.font = `800 40px ${DISPLAY}`; c.fillStyle = '#fde68a'
  c.fillText('¿Y tú, dónde estás?', W / 2, 1810)
  c.font = `700 28px ${BODY}`; c.fillStyle = 'rgba(221,214,254,.7)'
  c.fillText(location.host && !location.host.includes('claude') ? location.host : 'Haz el test Espectro', W / 2, 1860)
}

function drawMedal(c: CanvasRenderingContext2D, x: number, y: number, col: string, glyph: string) {
  // cintas
  const ribbon = (dx: number, tint: string) => {
    c.save(); c.translate(x + dx, y + 150); c.rotate(dx < 0 ? .18 : -.18)
    c.fillStyle = tint; c.beginPath()
    c.moveTo(-55, -40); c.lineTo(55, -40); c.lineTo(55, 230); c.lineTo(0, 185); c.lineTo(-55, 230); c.closePath(); c.fill()
    c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(-14, -40, 28, 250)
    c.restore()
  }
  ribbon(-85, shade(col, -.15)); ribbon(85, shade(col, -.3))
  // resplandor
  const halo = c.createRadialGradient(x, y, 100, x, y, 340)
  halo.addColorStop(0, hexA('#fde68a', .45)); halo.addColorStop(1, hexA('#fde68a', 0))
  c.fillStyle = halo; c.beginPath(); c.arc(x, y, 340, 0, Math.PI * 2); c.fill()
  // rayos
  c.save(); c.translate(x, y)
  for (let i = 0; i < 24; i++) { c.rotate(Math.PI / 12); c.fillStyle = 'rgba(253,230,138,.10)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-18, -330); c.lineTo(18, -330); c.closePath(); c.fill() }
  c.restore()
  // borde dentado de oro
  c.beginPath()
  for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2, r = i % 2 ? 218 : 236; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) }
  c.closePath()
  const gold = c.createLinearGradient(x - 230, y - 230, x + 230, y + 230)
  gold.addColorStop(0, '#fff7c2'); gold.addColorStop(.35, '#facc15'); gold.addColorStop(.7, '#ca8a04'); gold.addColorStop(1, '#fde68a')
  c.fillStyle = gold; c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 40; c.fill(); c.shadowBlur = 0
  // disco del color de la tendencia
  const disc = c.createRadialGradient(x - 60, y - 70, 20, x, y, 200)
  disc.addColorStop(0, shade(col, .45)); disc.addColorStop(.6, col); disc.addColorStop(1, shade(col, -.35))
  c.fillStyle = disc; c.beginPath(); c.arc(x, y, 188, 0, Math.PI * 2); c.fill()
  c.lineWidth = 10; c.strokeStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(x, y, 168, 0, Math.PI * 2); c.stroke()
  // estrellas en arco
  c.fillStyle = '#fff'
  for (let k = -2; k <= 2; k++) { const a = -Math.PI / 2 + k * .28; star(c, x + Math.cos(a) * 130, y + Math.sin(a) * 130, k === 0 ? 20 : 14) }
  // siglas
  c.textAlign = 'center'; c.textBaseline = 'middle'
  c.font = `800 ${glyph.length > 1 ? 130 : 160}px ${DISPLAY}`
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillText(glyph, x + 5, y + 35)
  c.fillStyle = '#ffffff'; c.fillText(glyph, x, y + 30)
  c.textBaseline = 'alphabetic'
  // brillo
  const shine = c.createLinearGradient(x - 190, y - 190, x + 60, y + 60)
  shine.addColorStop(0, 'rgba(255,255,255,.35)'); shine.addColorStop(.5, 'rgba(255,255,255,0)')
  c.fillStyle = shine; c.beginPath(); c.arc(x, y, 188, 0, Math.PI * 2); c.fill()
}

function drawSpectrum(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, v: number, big: boolean) {
  const g = c.createLinearGradient(x, 0, x + w, 0)
  PARTIES.forEach((p) => g.addColorStop(p.pos / 10, p.color))
  c.fillStyle = g; roundRect(c, x, y, w, h, h / 2); c.fill()
  const mx = x + (v / 10) * w, my = y + h / 2, r = big ? 42 : 20
  c.fillStyle = '#ffffff'; c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 18
  c.beginPath(); c.arc(mx, my, r, 0, Math.PI * 2); c.fill(); c.shadowBlur = 0
  c.lineWidth = big ? 8 : 5; c.strokeStyle = '#1a103d'; c.beginPath(); c.arc(mx, my, r - (big ? 6 : 4), 0, Math.PI * 2); c.stroke()
  if (big) { c.fillStyle = '#1a103d'; c.font = `800 26px ${BODY}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('YO', mx, my + 1); c.textBaseline = 'alphabetic' }
}

const roundRect = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath()
}
const star = (c: CanvasRenderingContext2D, x: number, y: number, r: number) => {
  c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * .45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) } c.closePath(); c.fill()
}
const spaced = (c: CanvasRenderingContext2D, t: string, x: number, y: number, sp: number) => {
  const w = [...t].reduce((s, ch) => s + c.measureText(ch).width + sp, -sp)
  let cx = x - w / 2
  c.textAlign = 'left'; for (const ch of t) { c.fillText(ch, cx, y); cx += c.measureText(ch).width + sp } c.textAlign = 'center'
}
function hexA(hex: string, a: number) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})` }
function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16), f = (v: number) => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k))
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`
}
function mulberry(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

/** Ventana con la imagen lista y los botones para compartir o guardar */
export function ShareModal({ data, onClose }: { data: CardData; onClose: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const me = partyById(tendencyOf(data.pos))

  useEffect(() => {
    let alive = true
    // esperar a que las fuentes estén listas para que la imagen salga con la tipografía buena
    const go = () => { if (!alive || !cv.current) return; drawCard(cv.current, data); setUrl(cv.current.toDataURL('image/png')) }
    Promise.all([document.fonts.load(`800 60px ${DISPLAY}`), document.fonts.load(`800 30px ${BODY}`)]).then(go, go)
    sfx.fanfare(); haptic([30, 40, 60])
    return () => { alive = false }
  }, [])

  const blob = () => new Promise<Blob | null>((res) => cv.current!.toBlob(res, 'image/png'))
  const fileName = `espectro-${me.name.toLowerCase().replace(/\s+/g, '-')}.png`

  const share = async (e: React.MouseEvent) => {
    const b = await blob()
    if (!b) return
    const file = new File([b], fileName, { type: 'image/png' })
    const text = `Mi ideología es ${me.name} (${fmt(data.pos)} de 10). ¿Y tú, dónde estás? Haz el test Espectro.`
    try {
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text, title: 'Espectro' }); return }
    } catch { return /* el usuario lo canceló */ }
    download(e)
    setMsg('Tu móvil no deja compartir directamente: hemos guardado la imagen para que la subas tú.')
  }

  const download = (e: React.MouseEvent) => {
    const a = document.createElement('a')
    a.href = url!; a.download = fileName
    document.body.appendChild(a); a.click(); a.remove()
    burst(e.clientX, e.clientY, ['#fde68a', me.color, '#ffffff'], 30, 6)
    setMsg((m) => m || 'Imagen guardada. Si no la ves, mantén pulsada la imagen y elige «Guardar».')
  }

  return (
    <div className="share-modal fixed inset-0 z-[80] flex flex-col items-center overflow-y-auto px-4 pt-[max(env(safe-area-inset-top),16px)] pb-[max(env(safe-area-inset-bottom),16px)]">
      <div className="flex w-full max-w-md items-center justify-between">
        <p className="font-display text-xl font-extrabold">🏅 Tu medalla</p>
        <button className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-xl" onClick={onClose} aria-label="Cerrar">✕</button>
      </div>
      <canvas ref={cv} className="hidden" />
      <div className="share-preview mt-3 w-full max-w-[300px]">
        {url ? <img src={url} alt={`Mi ideología es ${me.name}, ${fmt(data.pos)} sobre 10`} className="block w-full rounded-2xl" /> : <div className="aspect-[9/16] w-full animate-pulse rounded-2xl bg-white/10" />}
      </div>
      <div className="mt-4 flex w-full max-w-md flex-col gap-2.5">
        <button className="btn-main" onClick={share} disabled={!url}>Compartir en redes 📲</button>
        <button className="btn-ghost py-3" onClick={download} disabled={!url}>Guardar imagen ⬇️</button>
        {msg && <p className="text-center text-[15px] font-semibold text-violet-100/85">{msg}</p>}
        <p className="text-center text-[13px] font-semibold text-violet-200/60">Tamaño perfecto para historias de Instagram, WhatsApp y TikTok.</p>
      </div>
    </div>
  )
}

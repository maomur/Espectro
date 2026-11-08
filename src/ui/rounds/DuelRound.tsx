import { useLayoutEffect, useRef } from 'react'
import { proposalById, topicById } from '../../engine/data'
import { score } from '../../engine/engine'
import type { Proposal } from '../../engine/types'
import { sfx, haptic } from '../../audio/sfx'
import { burst, ring, shatter } from '../fx'
import { Blind, PropText, rectCenter, type RoundProps } from './common'

const HOLD_MS = 750

export function DuelRound({ round, done }: RoundProps) {
  const [a, b] = round.items
  const wa = useRef<HTMLDivElement>(null)
  const wb = useRef<HTMLDivElement>(null)
  const busy = useRef(true)

  // Entrada: las cartas vuelan desde los lados girando en 3D
  useLayoutEffect(() => {
    sfx.cardIn()
    const opts = { duration: 750, easing: 'cubic-bezier(.2,.9,.3,1.15)', fill: 'backwards' as const }
    wa.current!.animate([{ transform: 'translateX(-120%) rotateY(-55deg) rotateZ(-8deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], opts)
    wb.current!.animate([{ transform: 'translateX(120%) rotateY(55deg) rotateZ(8deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { ...opts, delay: 110 }).onfinish = () => { busy.current = false }
  }, [])

  const pick = (side: 'a' | 'b', strong: boolean) => {
    if (busy.current) return
    busy.current = true
    const win = side === 'a' ? wa.current! : wb.current!
    const lose = side === 'a' ? wb.current! : wa.current!
    const r = win.getBoundingClientRect(), c = rectCenter(r)
    ring(c.x, c.y, strong ? '#fde68a' : '#c4b5fd', strong ? 260 : 170)
    burst(c.x, c.y, ['#fde68a', '#f9a8d4', '#a5b4fc', '#5eead4', '#ffffff'], strong ? 90 : 40, strong ? 12 : 7)
    sfx.pick(strong); haptic(strong ? [30, 40, 60] : 25)
    const lr = lose.getBoundingClientRect()
    lose.style.visibility = 'hidden'
    shatter(lr, 'rgba(196,181,253,.35)')
    setTimeout(() => sfx.shatter(), 60)
    win.animate([{ transform: 'none', filter: 'brightness(1)' }, { transform: 'scale(1.05)', filter: 'brightness(1.5)', offset: .4 }, { transform: 'scale(.6) translateY(-30%)', opacity: 0, filter: 'brightness(2)' }],
      { duration: 650, easing: 'cubic-bezier(.5,0,.7,.4)', fill: 'forwards' })
    setTimeout(() => done(score.duel(round.items, side === 'a' ? a : b, strong), { from: r, strong }), 420)
  }

  const none = () => {
    if (busy.current) return
    busy.current = true
    sfx.none(); haptic([15, 30, 15])
    ;[wa.current!, wb.current!].forEach((w, i) => w.animate([
      { transform: 'none' }, { transform: `translateY(-14px) rotate(${i ? 4 : -4}deg)`, offset: .2 },
      { transform: `translateY(110vh) rotate(${i ? 35 : -35}deg)`, opacity: .4 },
    ], { duration: 650, delay: i * 60, easing: 'cubic-bezier(.5,0,.8,.5)', fill: 'forwards' }))
    setTimeout(() => done(score.duel(round.items, null, false)), 650)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex min-h-0 flex-1 flex-col gap-3 [perspective:1100px]">
        <div ref={wa} className="flex min-h-0 flex-1"><Card p={proposalById(a)} label="Idea A" hue="#a5b4fc" onPick={(s) => pick('a', s)} busy={busy} /></div>
        <div className="pointer-events-none absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2"><div className="vs-orb">VS</div></div>
        <div ref={wb} className="flex min-h-0 flex-1"><Card p={proposalById(b)} label="Idea B" hue="#f9a8d4" onPick={(s) => pick('b', s)} busy={busy} /></div>
      </div>
      <div className="mt-3 flex justify-center">
        <button className="btn-ghost" onClick={none}>🙅 No me convence ninguna</button>
      </div>
    </div>
  )
}

function Card({ p, label, hue, onPick, busy }: { p: Proposal; label: string; hue: string; onPick: (strong: boolean) => void; busy: React.RefObject<boolean> }) {
  const el = useRef<HTMLDivElement>(null)
  const hold = useRef<{ t0: number; raf: number; x: number; y: number; fired: boolean } | null>(null)

  const setCharge = (v: number) => {
    el.current?.style.setProperty('--charge', String(v))
    el.current?.classList.toggle('shake-sm', v > .35)
  }
  const tilt = (e: React.PointerEvent) => {
    const r = el.current!.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height
    el.current!.style.setProperty('--mx', `${px * 100}%`)
    el.current!.style.setProperty('--my', `${py * 100}%`)
    el.current!.style.setProperty('--hx', `${px * 100}%`)
    const k = hold.current ? 1 + Math.min(1, (performance.now() - hold.current.t0) / HOLD_MS) * .06 : 1
    el.current!.style.transform = `rotateY(${(px - .5) * 14}deg) rotateX(${(.5 - py) * 12}deg) scale(${k})`
  }
  const stop = () => {
    if (hold.current) cancelAnimationFrame(hold.current.raf)
    hold.current = null
    sfx.chargeStop(); setCharge(0)
    if (el.current) el.current.style.transform = ''
  }
  const down = (e: React.PointerEvent) => {
    if (busy.current) return
    el.current!.setPointerCapture(e.pointerId)
    tilt(e)
    const h = { t0: performance.now(), raf: 0, x: e.clientX, y: e.clientY, fired: false }
    hold.current = h
    sfx.chargeStart()
    const loop = () => {
      const v = Math.min(1, (performance.now() - h.t0) / HOLD_MS)
      setCharge(v)
      if (v > .3 && v < 1) haptic(5)
      if (v >= 1 && !h.fired) { h.fired = true; stop(); onPick(true); return }
      h.raf = requestAnimationFrame(loop)
    }
    h.raf = requestAnimationFrame(loop)
  }
  const up = (e: React.PointerEvent) => {
    const h = hold.current
    if (!h) return
    const moved = Math.hypot(e.clientX - h.x, e.clientY - h.y) > 40
    stop()
    if (!h.fired && !moved) onPick(false)
  }

  return (
    <div ref={el} className="card flex w-full flex-col transition-[transform] duration-150 [container-type:size]" onPointerDown={down} onPointerMove={(e) => { if (hold.current) tilt(e) }} onPointerUp={up} onPointerCancel={stop} role="button" aria-label={`${label}: ${p.title}`}>
      <span className="watermark">{topicById(p.topic).emoji}</span>
      <span className="liquid" />
      <span className="holo" />
      <span className="charge-ring" />
      <span className="love">💛 ¡Me encanta!</span>
      <div className="card-head flex items-center justify-between">
        <span className="rounded-full px-2.5 py-0.5 text-[14px] font-black tracking-wider uppercase" style={{ background: `${hue}26`, color: hue }}>{label}</span>
        <Blind />
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center"><PropText p={p} size="fit" /></div>
    </div>
  )
}

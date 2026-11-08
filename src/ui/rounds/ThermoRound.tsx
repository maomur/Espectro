import { useLayoutEffect, useRef, useState } from 'react'
import { proposalById, topicById } from '../../engine/data'
import { score } from '../../engine/engine'
import { sfx, haptic } from '../../audio/sfx'
import { burst } from '../fx'
import { Blind, PropText, type RoundProps } from './common'

const FACES = [
  { max: 15, face: '😡', label: 'Nada' },
  { max: 35, face: '🙁', label: 'Poco' },
  { max: 60, face: '😐', label: 'Regular' },
  { max: 85, face: '🙂', label: 'Bastante' },
  { max: 101, face: '😍', label: '¡Totalmente!' },
]
const faceOf = (v: number) => FACES.find((f) => v < f.max)!
/** rojo → ámbar → verde */
const hueOf = (v: number) => `hsl(${Math.round(v * 1.35)} 85% 62%)`

/** Termómetro: una sola idea y un deslizador gigante con cara que cambia */
export function ThermoRound({ round, done }: RoundProps) {
  const id = round.items[0]
  const p = proposalById(id)
  const [v, setV] = useState(50)
  const [touched, setTouched] = useState(false)
  const track = useRef<HTMLDivElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const knob = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const lastTick = useRef(5)

  useLayoutEffect(() => {
    sfx.cardIn()
    card.current!.animate([{ transform: 'translateY(-30px) rotateX(40deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 600, easing: 'cubic-bezier(.2,.9,.3,1.2)' })
    // pista: el círculo se balancea para invitar a arrastrarlo
    knob.current!.animate([{ translate: '0 0' }, { translate: '-26px 0' }, { translate: '26px 0' }, { translate: '0 0' }], { duration: 1200, delay: 700, easing: 'ease-in-out' })
  }, [])

  const setFrom = (x: number) => {
    const r = track.current!.getBoundingClientRect()
    const nv = Math.round(Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100)))
    setV(nv)
    const t = Math.round(nv / 10)
    if (t !== lastTick.current) {
      lastTick.current = t
      sfx.slide(nv); haptic(6)
    }
  }
  const down = (e: React.PointerEvent) => { track.current!.setPointerCapture(e.pointerId); dragging.current = true; setTouched(true); setFrom(e.clientX) }
  const move = (e: React.PointerEvent) => { if (dragging.current) setFrom(e.clientX) }
  const up = () => { dragging.current = false }

  const finish = () => {
    const r = knob.current!.getBoundingClientRect()
    burst(r.left + r.width / 2, r.top + r.height / 2, [hueOf(v), '#ffffff', '#fde68a'], 20 + Math.round(v / 2), 3 + v / 15)
    if (v >= 60) sfx.yes(); else if (v <= 35) sfx.no(); else sfx.tap()
    haptic(20)
    card.current!.animate([{ transform: 'none' }, { transform: 'scale(1.04)', offset: .3 }, { transform: 'scale(.7) translateY(-20%)', opacity: 0 }], { duration: 500, easing: 'cubic-bezier(.5,0,.7,.4)', fill: 'forwards' })
    setTimeout(() => done(score.thermo(id, v), { from: card.current!.getBoundingClientRect(), strong: v >= 95 }), 380)
  }

  const f = faceOf(v)
  return (
    <div className="flex h-full flex-col" style={{ ['--heat' as string]: hueOf(v) }}>
      <div ref={card} className="card thermo-card flex min-h-0 flex-1 flex-col [container-type:size]">
        <span className="watermark">{topicById(p.topic).emoji}</span>
        <div className="card-head flex items-center justify-between">
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[14px] font-black tracking-wider text-rose-200 uppercase">Una sola idea</span>
          <Blind />
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-center"><PropText p={p} size="fit" /></div>
      </div>

      <div className="mt-4 text-center">
        <p className="font-display text-[1.9rem] leading-none font-extrabold" style={{ color: hueOf(v) }}>{f.face} {f.label}</p>
      </div>

      <div ref={track} className="thermo-track mt-4" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} role="slider" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} aria-label="Cuánto te convence">
        <div className="thermo-fill" style={{ width: `${v}%` }} />
        <div ref={knob} className="thermo-knob" style={{ left: `${v}%` }}><span key={f.face} className="face-pop">{f.face}</span></div>
      </div>
      <div className="mt-1 flex justify-between px-1 text-[15px] font-extrabold text-violet-200/75"><span>Nada</span><span>Totalmente</span></div>

      <button className="btn-main mt-3" onClick={finish}>{touched ? 'Listo' : 'Arrastra el círculo 👆'}</button>
    </div>
  )
}

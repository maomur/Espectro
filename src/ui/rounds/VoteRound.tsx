import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { proposalById, topicById } from '../../engine/data'
import { score } from '../../engine/engine'
import { sfx, haptic } from '../../audio/sfx'
import { burst, ring } from '../fx'
import { type RoundProps } from './common'

type V = 'yes' | 'abs' | 'no'
const VOTES: { id: V; label: string; icon: string; color: string; shout: string }[] = [
  { id: 'yes', label: 'SÍ', icon: '✔', color: '#22c55e', shout: 'Has votado SÍ' },
  { id: 'abs', label: 'ABSTENCIÓN', icon: '●', color: '#f59e0b', shout: 'Te has abstenido' },
  { id: 'no', label: 'NO', icon: '✖', color: '#ef4444', shout: 'Has votado NO' },
]

/** Escaños del hemiciclo en semicírculo: filas de dentro hacia fuera; tu escaño, en la primera fila, en el centro */
function useSeats() {
  return useMemo(() => {
    const seats: { x: number; y: number; d: number; me: boolean }[] = []
    const cx = 160, cy = 132
    for (let r = 0; r < 7; r++) {
      const rad = 34 + r * 13
      const n = 9 + r * 4
      for (let k = 0; k < n; k++) {
        const a = Math.PI - (k / (n - 1)) * Math.PI
        const x = cx + Math.cos(a) * rad, y = cy - Math.sin(a) * rad
        seats.push({ x, y, d: Math.hypot(x - cx, y - (cy - 34)), me: r === 0 && k === Math.floor(n / 2) })
      }
    }
    return seats
  }, [])
}

/** Votación en el Congreso: eres diputado y votas una ley con los botones del escaño */
export function VoteRound({ round, done }: RoundProps) {
  const id = round.items[0]
  const p = proposalById(id)
  const seats = useSeats()
  const [vote, setVote] = useState<V | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    sfx.bell()
    card.current!.animate([{ transform: 'translateY(30px) scale(.95)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 550, easing: 'cubic-bezier(.2,.9,.3,1.2)' })
    // los escaños se encienden de dentro hacia fuera al empezar la sesión
    svg.current!.querySelectorAll('circle.seat').forEach((c, k) => (c as SVGElement).animate(
      [{ opacity: 0, transform: 'scale(0)' }, { opacity: 1, transform: 'scale(1)' }],
      { duration: 300, delay: Number((c as SVGElement).dataset.d) * 5 + (k % 3) * 10, fill: 'backwards', easing: 'cubic-bezier(.3,1.6,.4,1)' }))
  }, [])

  const cast = (v: (typeof VOTES)[number], e: React.MouseEvent<HTMLButtonElement>) => {
    if (vote) return
    setVote(v.id)
    const b = e.currentTarget.getBoundingClientRect()
    burst(b.left + b.width / 2, b.top + b.height / 2, [v.color, '#ffffff'], 24, 6)
    sfx.stamp(v.id !== 'no'); haptic([25, 40, 25])
    // tu escaño se ilumina y la luz recorre el hemiciclo en el color de tu voto
    const me = svg.current!.querySelector('circle.me') as SVGElement
    const r = me.getBoundingClientRect()
    ring(r.left + r.width / 2, r.top + r.height / 2, v.color, 120)
    svg.current!.querySelectorAll('circle.seat').forEach((c) => (c as SVGElement).animate(
      [{ fill: 'rgba(255,255,255,.18)' }, { fill: v.color, offset: .4 }, { fill: 'rgba(255,255,255,.18)' }],
      { duration: 900, delay: Number((c as SVGElement).dataset.d) * 6 + 120, easing: 'ease-out' }))
    panel.current?.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1, offset: .6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.9,.3,1.3)', fill: 'both' })
    setTimeout(() => done(score.vote(id, v.id), { from: v.id === 'yes' ? card.current!.getBoundingClientRect() : undefined }), 1500)
  }

  const chosen = VOTES.find((x) => x.id === vote)
  return (
    <div className="flex h-full flex-col">
      <div className="relative">
        <svg ref={svg} viewBox="0 0 320 138" className="mx-auto block h-[clamp(70px,13dvh,118px)] w-auto" aria-label="Hemiciclo del Congreso">
          {seats.map((s, k) => (
            <circle key={k} data-d={Math.round(s.d)} className={`seat ${s.me ? 'me' : ''}`} cx={s.x} cy={s.y} r={s.me ? 6.5 : 4.2}
              fill={s.me ? (chosen?.color ?? '#fde68a') : 'rgba(255,255,255,.18)'} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
          ))}
          <rect x="138" y="124" width="44" height="12" rx="3" fill="rgba(255,255,255,.3)" />
        </svg>
        <span className="me-tag">⬆ tu escaño</span>
      </div>

      <div ref={card} className="vote-card mt-2 flex min-h-0 flex-1 flex-col [container-type:size]">
        <span className="vote-board">🏛️ VOTACIÓN Nº {round.step + 1} · {topicById(p.topic).name.toUpperCase()}</span>
        <span className="mt-2 text-[clamp(1rem,4.6vw,1.15rem)] font-bold text-violet-100/80">Se vota esta propuesta:</span>
        <div className="flex min-h-0 flex-1 flex-col justify-center">
          <h3 className="font-display text-[clamp(1.35rem,min(9vw,15cqh),2.6rem)] leading-[1.08] font-extrabold text-balance">«{p.title}»</h3>
          <p className="mt-1.5 text-[clamp(1.05rem,min(5.6vw,9cqh),1.45rem)] leading-snug font-semibold text-violet-100/80">{p.detail}</p>
        </div>
        {chosen && <div ref={panel} className="vote-result" style={{ background: chosen.color }}>{chosen.icon} {chosen.shout}</div>}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {VOTES.map((v) => (
          <button key={v.id} onClick={(e) => cast(v, e)} disabled={!!vote && vote !== v.id}
            className={`vote-key ${vote === v.id ? 'pressed' : ''}`} style={{ ['--k' as string]: v.color }} aria-label={`Votar ${v.label}`}>
            <span className="text-[1.6rem] leading-none">{v.icon}</span>
            <span className={`${v.id === 'abs' ? 'text-[13px]' : 'text-[1.35rem]'} leading-none font-black`}>{v.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

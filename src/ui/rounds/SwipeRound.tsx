import { useLayoutEffect, useRef, useState } from 'react'
import { proposalById, topicById } from '../../engine/data'
import { score } from '../../engine/engine'
import { sfx, haptic } from '../../audio/sfx'
import { burst } from '../fx'
import { Blind, PropText, rectCenter, type RoundProps } from './common'

const THRESHOLD = 90

/** Mazo de cartas: deslizar a la derecha = a favor, a la izquierda = en contra */
export function SwipeRound({ round, done }: RoundProps) {
  const [i, setI] = useState(0)
  const votes = useRef<Record<string, boolean>>({})
  const lastYes = useRef<DOMRect | undefined>(undefined)
  const top = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; id: number } | null>(null)
  const flying = useRef(false)
  const deck = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    sfx.cardIn()
    deck.current!.animate([{ transform: 'translateY(60%) scale(.8)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 650, easing: 'cubic-bezier(.2,.9,.3,1.2)' })
  }, [])

  const setDx = (dx: number) => {
    const el = top.current
    if (!el) return
    el.style.transform = `translateX(${dx}px) rotate(${dx / 14}deg)`
    el.style.setProperty('--yes', String(Math.max(0, Math.min(1, dx / THRESHOLD))))
    el.style.setProperty('--no', String(Math.max(0, Math.min(1, -dx / THRESHOLD))))
  }

  const vote = (yes: boolean) => {
    if (flying.current || !top.current) return
    flying.current = true
    const id = round.items[i]
    votes.current[id] = yes
    const el = top.current
    const r = el.getBoundingClientRect(), c = rectCenter(r)
    if (yes) { lastYes.current = r; sfx.yes(); haptic(20); burst(c.x + 80, c.y, ['#5eead4', '#bbf7d0', '#ffffff'], 30, 7) }
    else { sfx.no(); haptic([10, 20, 10]); burst(c.x - 80, c.y, ['#fb7185', '#fecdd3'], 18, 5) }
    el.style.transition = 'none'
    el.style.setProperty(yes ? '--yes' : '--no', '1')
    const cur = el.style.transform || 'none'
    el.animate([{ transform: cur }, { transform: `translateX(${yes ? 140 : -140}%) rotate(${yes ? 30 : -30}deg)`, opacity: .2 }], { duration: 380, easing: 'cubic-bezier(.4,0,.8,.5)', fill: 'forwards' }).onfinish = () => {
      flying.current = false
      if (i + 1 >= round.items.length) {
        const yesAny = Object.values(votes.current).some(Boolean)
        done(score.swipe(votes.current), { from: yesAny ? lastYes.current : undefined })
      } else setI(i + 1)
    }
  }

  const down = (e: React.PointerEvent) => {
    if (flying.current) return
    top.current!.setPointerCapture(e.pointerId)
    top.current!.style.transition = 'none'
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
  }
  const move = (e: React.PointerEvent) => { if (drag.current) setDx(e.clientX - drag.current.x) }
  const up = (e: React.PointerEvent) => {
    const d = drag.current
    drag.current = null
    if (!d) return
    const dx = e.clientX - d.x
    if (Math.abs(dx) > THRESHOLD) return vote(dx > 0)
    const el = top.current!
    el.style.transition = 'transform .45s cubic-bezier(.3,1.6,.4,1)'
    setDx(0)
  }

  const left = round.items.slice(i)
  return (
    <div className="flex h-full flex-col">
      <div ref={deck} className="relative min-h-0 flex-1">
        {left.slice(0, 3).reverse().map((id) => {
          const k = left.indexOf(id)
          const p = proposalById(id)
          const isTop = k === 0
          return (
            <div
              key={id}
              ref={isTop ? top : undefined}
              className="card swipe-card absolute inset-0 flex flex-col [container-type:size]"
              style={isTop ? { touchAction: 'none' } : { transform: `translateY(${k * 14}px) scale(${1 - k * .05})`, filter: `brightness(${1 - k * .15})`, transition: 'transform .4s cubic-bezier(.2,.9,.3,1.2)' }}
              onPointerDown={isTop ? down : undefined}
              onPointerMove={isTop ? move : undefined}
              onPointerUp={isTop ? up : undefined}
              onPointerCancel={isTop ? up : undefined}
            >
              <span className="watermark">{topicById(p.topic).emoji}</span>
              <span className="stamp yes">A FAVOR</span>
              <span className="stamp no">EN CONTRA</span>
              <div className="card-head flex items-center justify-between">
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[14px] font-black tracking-wider text-teal-200 uppercase">Idea {round.items.indexOf(id) + 1} de {round.items.length}</span>
                <Blind />
              </div>
              <div className="flex min-h-0 flex-1 flex-col justify-center"><PropText p={p} size="fit" /></div>
              {isTop && <p className="text-center text-[15px] font-extrabold text-violet-200/70">⬅︎ en contra · a favor ➡︎</p>}
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex items-center justify-center gap-8">
        <button className="vote-btn no" onClick={() => vote(false)} aria-label="En contra">✕</button>
        <button className="vote-btn yes" onClick={() => vote(true)} aria-label="A favor">✓</button>
      </div>
    </div>
  )
}

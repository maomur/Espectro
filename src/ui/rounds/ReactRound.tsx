import { useLayoutEffect, useRef, useState } from 'react'
import { proposalById, topicById } from '../../engine/data'
import { score, type Reaction } from '../../engine/engine'
import { sfx, haptic } from '../../audio/sfx'
import { burst } from '../fx'
import { Blind, PropText, type RoundProps } from './common'

const REACTIONS: { id: Reaction; emoji: string; label: string; color: string }[] = [
  { id: 'love', emoji: '❤️', label: 'Me encanta', color: '#fb7185' },
  { id: 'like', emoji: '👍', label: 'Me gusta', color: '#5eead4' },
  { id: 'meh', emoji: '😐', label: 'Me da igual', color: '#fde68a' },
  { id: 'dislike', emoji: '👎', label: 'No me gusta', color: '#a5b4fc' },
]

/** Reacciona como en redes: una idea cada vez, cuatro caras */
export function ReactRound({ round, done }: RoundProps) {
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<Reaction | null>(null)
  const reactions = useRef<Record<string, Reaction>>({})
  const card = useRef<HTMLDivElement>(null)
  const busy = useRef(false)
  const id = round.items[i]
  const p = proposalById(id)

  useLayoutEffect(() => {
    sfx.cardIn()
    card.current!.animate([{ transform: 'translateX(70%) rotate(8deg) scale(.9)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.2,.9,.3,1.2)' })
  }, [i])

  /** emojis que suben flotando, como las reacciones en directo */
  const floatUp = (from: DOMRect, emoji: string, n: number) => {
    for (let k = 0; k < n; k++) {
      const e = document.createElement('div')
      e.className = 'float-emoji'
      e.textContent = emoji
      e.style.left = `${from.left + from.width / 2 + (Math.random() - .5) * 40}px`
      e.style.top = `${from.top}px`
      document.body.appendChild(e)
      const dx = (Math.random() - .5) * 120, up = 180 + Math.random() * 220
      e.animate([
        { transform: 'translate(-50%,0) scale(.4)', opacity: 0 },
        { transform: `translate(calc(-50% + ${dx * .4}px), -${up * .3}px) scale(1.3)`, opacity: 1, offset: .25 },
        { transform: `translate(calc(-50% + ${dx}px), -${up}px) scale(.9) rotate(${dx / 6}deg)`, opacity: 0 },
      ], { duration: 1100 + Math.random() * 500, delay: k * 70, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'backwards' }).onfinish = () => e.remove()
    }
  }

  const react = (r: (typeof REACTIONS)[number], e: React.MouseEvent<HTMLButtonElement>) => {
    if (busy.current) return
    busy.current = true
    reactions.current[id] = r.id
    setPicked(r.id)
    const b = e.currentTarget.getBoundingClientRect()
    floatUp(b, r.emoji, r.id === 'love' ? 9 : r.id === 'like' ? 6 : 3)
    burst(b.left + b.width / 2, b.top + b.height / 2, [r.color, '#ffffff'], r.id === 'love' ? 30 : 14, 5)
    if (r.id === 'love' || r.id === 'like') sfx.yes(); else if (r.id === 'dislike') sfx.no(); else sfx.tap()
    haptic(r.id === 'love' ? [20, 30, 20] : 15)
    const c = card.current!
    setTimeout(() => {
      c.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(-70%) rotate(-8deg) scale(.9)', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.5,0,.8,.5)', fill: 'forwards' }).onfinish = () => {
        if (i + 1 >= round.items.length) {
          const best = Object.entries(reactions.current).sort((a, b) => score.react({ x: b[1] }).x - score.react({ x: a[1] }).x)[0]
          done(score.react(reactions.current), { from: best && (best[1] === 'love' || best[1] === 'like') ? c.getBoundingClientRect() : undefined })
        } else {
          c.getAnimations().forEach((a) => a.cancel())
          busy.current = false
          setPicked(null)
          setI(i + 1)
        }
      }
    }, 650)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex justify-center gap-2">
        {round.items.map((x, k) => <i key={x} className={`h-2.5 rounded-full transition-all duration-300 ${k === i ? 'w-8 bg-violet-200' : k < i ? 'w-2.5 bg-violet-300/70' : 'w-2.5 bg-white/20'}`} />)}
      </div>
      <div ref={card} key={id} className="card flex min-h-0 flex-1 flex-col [container-type:size]">
        <span className="watermark">{topicById(p.topic).emoji}</span>
        <div className="card-head flex items-center justify-between">
          <span className="rounded-full bg-white/10 px-3 py-1 text-[14px] font-black text-violet-200">Idea {i + 1} de {round.items.length}</span>
          <Blind />
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-center"><PropText p={p} size="fit" /></div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {REACTIONS.map((r) => (
          <button key={r.id} onClick={(e) => react(r, e)} className={`react-btn ${picked === r.id ? 'on' : picked ? 'off' : ''}`} style={{ ['--r' as string]: r.color }} aria-label={r.label}>
            <span className="text-[2.4rem] leading-none">{r.emoji}</span>
            <span className="text-[15px] leading-tight font-extrabold">{r.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

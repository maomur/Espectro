import { useRef } from 'react'
import { TOPICS } from '../engine/data'
import type { TopicId } from '../engine/types'
import { useGame } from '../store'
import { sfx, haptic } from '../audio/sfx'
import { burst, ring } from './fx'

const LABEL = ['', 'Me importa', 'Mucho', '¡Muchísimo!']

const SHORT = typeof matchMedia !== 'undefined' && matchMedia('(max-height: 700px)').matches

export function Topics() {
  const { weights, cycleWeight, start } = useGame()
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  const tap = (id: TopicId, color: string) => {
    const lvl = cycleWeight(id)
    sfx.bubble(lvl); haptic(lvl * 8)
    const el = refs.current[id]
    if (el) {
      el.classList.remove('wobble'); void el.offsetWidth; el.classList.add('wobble')
      const r = el.getBoundingClientRect()
      burst(r.left + r.width / 2, r.top + r.height / 2, [color, '#ffffff', '#fde68a'], 10 + lvl * 10, 3 + lvl * 2)
    }
  }

  const go = (e: React.MouseEvent) => {
    sfx.whoosh(); haptic([20, 40, 20])
    ring(e.clientX, e.clientY, '#f9a8d4', 260)
    burst(e.clientX, e.clientY, ['#fde68a', '#f9a8d4', '#a5b4fc'], 60, 10)
    setTimeout(start, 380)
  }

  return (
    <div className="screen-in relative z-10 mx-auto flex h-full max-w-md flex-col px-5 pt-[max(env(safe-area-inset-top),20px)] pb-[max(env(safe-area-inset-bottom),18px)]">
      <div className="text-center">
        <p className="text-xs font-extrabold tracking-[.25em] text-violet-200/70 uppercase">Paso 1</p>
        <h2 className="title-xl mt-2 text-[2.6rem]">¿Qué te <span className="bg-gradient-to-r from-amber-200 to-pink-300 bg-clip-text text-transparent">quita el sueño</span>?</h2>
        <p className="mt-2 text-base font-semibold text-violet-100/80 [@media(max-height:700px)]:hidden">Todos los temas están incluidos. Si alguno te importa menos, tócalo para hacerlo más pequeño.</p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 place-items-center gap-1 py-2">
        {TOPICS.map((t, i) => {
          const lvl = weights[t.id]
          return (
            <button
              key={t.id}
              ref={(el) => { refs.current[t.id] = el }}
              onClick={() => tap(t.id, t.color)}
              className="bubble"
              style={{ width: SHORT ? 70 : 'min(96px, 11dvh)', height: SHORT ? 70 : 'min(96px, 11dvh)', transform: `scale(${(SHORT ? [1, .86, .95, 1.04] : [1, .84, .96, 1.1])[lvl]})`, zIndex: lvl, ['--c' as string]: t.color, ['--lvl' as string]: lvl, ['--bob' as string]: `${4.5 + (i % 3)}s`, ['--delay' as string]: `${-i * .7}s` }}
              aria-label={`${t.name}: ${LABEL[lvl]}`}
            >
              <span className="bubble-skin" />
              <span className="relative flex flex-col items-center leading-none">
                <span className="text-3xl">{t.emoji}</span>
                <span className="mt-1 max-w-[88px] text-center text-[15px] leading-tight font-black">{t.name}</span>
                <span className="mt-1 flex gap-0.5">{[1, 2, 3].map((k) => <i key={k} className="block h-1.5 w-1.5 rounded-full" style={{ background: k <= lvl ? '#fff' : '#ffffff40' }} />)}</span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="text-base font-bold text-violet-100/85">
          <span className="font-display text-2xl text-amber-200">25</span> preguntas en <span className="font-display text-2xl text-amber-200">5</span> fases de juego
        </p>
        <button className="btn-main w-full" onClick={go}>¡A jugar! 🎲</button>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { topicById } from '../engine/data'
import type { RoundType, Scores } from '../engine/types'
import { ROUNDS_PER_STAGE, STAGES } from '../engine/engine'
import { useGame } from '../store'
import { sfx, haptic } from '../audio/sfx'
import { burst, ring, trail } from './fx'
import { MECHANIC, rectCenter, type DoneFx } from './rounds/common'
import { DuelRound } from './rounds/DuelRound'
import { SwipeRound } from './rounds/SwipeRound'
import { ThermoRound } from './rounds/ThermoRound'
import { ReactRound } from './rounds/ReactRound'
import { VoteRound } from './rounds/VoteRound'

const ROUNDS = { duel: DuelRound, swipe: SwipeRound, thermo: ThermoRound, react: ReactRound, vote: VoteRound }

type Toast = { id: number; text: string; color: string }

export function Play() {
  const { rounds, index, streak, muted, toggleMute, answer } = useGame()
  const round = rounds[index]
  const root = useRef<HTMLDivElement>(null)
  const busy = useRef(false)
  const [intro, setIntro] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [flash, setFlash] = useState<{ id: number; x: number; y: number } | null>(null)

  // Presentación de cada fase
  useEffect(() => {
    if (!round) return
    busy.current = false
    // al empezar cada fase: tarjeta que presenta la mecánica
    if (round.step === 0) { setIntro(round.id); sfx.intro() }
  }, [round?.id])

  if (!round) return null
  const topic = topicById(round.topic)
  const mech = MECHANIC[round.type]
  const Comp = ROUNDS[round.type]
  const showToast = (text: string, color: string) => setToast({ id: Date.now(), text, color })

  const done = (scores: Scores | null, fx: DoneFx = {}) => {
    if (busy.current) return
    busy.current = true
    const best = scores ? Math.max(...Object.values(scores)) : 0
    const builds = best >= 0.5
    const x = 8 + Math.random() * 84
    let wait = 250
    if (builds) {
      const t = document.getElementById('score-target')!.getBoundingClientRect()
      const to = { x: t.left + t.width / 2, y: t.top + t.height / 2 }
      const from = fx.from ? rectCenter(fx.from) : { x: innerWidth / 2, y: innerHeight / 2 }
      setFlash({ id: Date.now(), x: from.x, y: from.y })
      trail(from, to, '#fde68a')
      if (fx.strong) {
        root.current?.classList.remove('screen-shake'); void root.current?.offsetWidth; root.current?.classList.add('screen-shake')
        showToast('¡MUY DE ACUERDO! ×2', '#fde68a')
      }
      setTimeout(() => { burst(to.x, to.y, ['#fde68a', '#bbf7d0', '#ffffff'], 24, 4); ring(to.x, to.y, '#fde68a', 60); sfx.build() }, 560)
      wait = 700
    }
    setTimeout(() => {
      const n = builds ? streak + 1 : 0
      if (!fx.strong && (n === 3 || n === 5 || n === 8)) { showToast(`🔥 Racha ×${n}`, '#fb923c'); sfx.streak(n) }
      else if (round.step === ROUNDS_PER_STAGE - 1 && round.stage < STAGES - 1) { showToast(`✅ ¡Fase ${round.stage + 1} superada!`, '#5eead4'); sfx.streak(5) }
      answer(scores, { strong: fx.strong, x })
    }, wait)
  }

  const skip = () => {
    if (busy.current || intro) return
    sfx.tap(); haptic(10)
    done(null)
  }

  return (
    <div ref={root} className="relative z-10 mx-auto flex h-full max-w-md flex-col pt-[max(env(safe-area-inset-top),10px)] pb-[max(env(safe-area-inset-bottom),12px)]">
      {/* HUD */}
      <div className="flex items-center gap-3 px-4">
        <div className="flex flex-1 gap-2.5">
          {Array.from({ length: STAGES }, (_, st) => (
            <div key={st} className="flex flex-1 gap-[3px]">
              {rounds.filter((r) => r.stage === st).map((r) => { const i = rounds.indexOf(r); return <div key={r.id} className="seg flex-1"><b style={{ width: i < index ? '100%' : i === index ? '40%' : 0 }} /></div> })}
            </div>
          ))}
        </div>
        <div id="score-target" className="flex h-10 min-w-14 items-center justify-center rounded-full bg-white/10 px-3 text-lg font-black" style={{ color: streak >= 3 ? '#fdba74' : '#ddd6fe' }}>
          {streak >= 3 ? '🔥' : '✦'} {streak}
        </div>
        <button onClick={toggleMute} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-base" aria-label="Sonido">{muted ? '🔇' : '🔊'}</button>
      </div>

      {/* Tema + fase */}
      <div className="mt-2 flex items-center gap-2 px-4">
        <span key={round.id} className="screen-in inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[16px] font-black" style={{ background: `${topic.color}30`, border: `1px solid ${topic.color}90` }}>
          {topic.emoji} {topic.name}
        </span>
        <span className="min-w-0 truncate text-[15px] font-extrabold text-violet-200/85">Fase {round.stage + 1}/{STAGES} · {round.step + 1} de {ROUNDS_PER_STAGE}</span>
        <button onClick={skip} className="ml-auto shrink-0 rounded-full px-2.5 py-1 text-[14px] font-extrabold text-violet-200/80 active:bg-white/10">Saltar 🤷</button>
      </div>

      {/* La pregunta y cómo se contesta: siempre visibles */}
      <div className="ask mx-4 mt-2" style={{ ['--m' as string]: mech.color }}>
                <div className="min-w-0">
          <p className="font-display text-[clamp(1.6rem,7.6vw,2.05rem)] leading-[1.08] font-extrabold text-balance">{mech.ask}</p>
          <p className="mt-1 text-[clamp(1.12rem,5.1vw,1.3rem)] leading-snug font-semibold text-violet-100/90">{mech.how}</p>
        </div>
      </div>

      {/* Ronda */}
      <div className="mt-2.5 flex min-h-0 flex-1 flex-col px-4 [&>*]:min-h-0 [&>*]:flex-1">
        {!intro && <Comp key={round.id} round={round} done={done} />}
      </div>

      {intro && <MechIntro type={round.type} stage={round.stage} onGo={() => { sfx.whoosh(); haptic(15); setIntro(null) }} />}

      {toast && (
        <div key={toast.id} className="toast-pop pointer-events-none fixed top-[38%] left-1/2 z-[70] rounded-2xl px-5 py-3 font-display text-2xl font-extrabold whitespace-nowrap text-[#1a103d] shadow-2xl" style={{ background: toast.color }} onAnimationEnd={() => setToast(null)}>
          {toast.text}
        </div>
      )}
      {flash && <div key={flash.id} className="flash" style={{ ['--fx' as string]: `${flash.x}px`, ['--fy' as string]: `${flash.y}px` }} onAnimationEnd={() => setFlash(null)} />}
    </div>
  )
}

/** Tarjeta de presentación de cada fase */
function MechIntro({ type, stage, onGo }: { type: RoundType; stage: number; onGo: () => void }) {
  const m = MECHANIC[type]
  return (
    <div className="mech-intro fixed inset-0 z-40 grid place-items-center px-6" onClick={onGo}>
      <div className="mech-card w-full max-w-sm rounded-[32px] p-7 text-center" style={{ ['--m' as string]: m.color }}>
        <p className="text-[14px] font-black tracking-[.2em] text-violet-200/80 uppercase">Fase {stage + 1} de {STAGES} · {ROUNDS_PER_STAGE} preguntas</p>
        <div className="mech-emoji mx-auto mt-4 grid h-28 w-28 place-items-center rounded-full text-6xl">{m.emoji}</div>
        <h2 className="title-xl mt-5 text-[2.5rem]" style={{ color: m.color }}>{m.title}</h2>
        <p className="mt-3 font-display text-[1.3rem] leading-snug font-bold text-white">{m.ask}</p>
        <p className="mt-2 text-[1.1rem] leading-snug font-semibold text-violet-100/90">{m.how}</p>
        <button className="btn-main mt-7 w-full" onClick={(e) => { e.stopPropagation(); onGo() }}>¡Entendido, vamos!</button>
      </div>
    </div>
  )
}

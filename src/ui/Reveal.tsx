import { useEffect, useMemo, useRef, useState } from 'react'
import { PARTIES, partyById, proposalById, topicById } from '../engine/data'
import { computeAffinity, computePosition, tendencyOf } from '../engine/engine'
import { useGame } from '../store'
import { sfx, haptic } from '../audio/sfx'
import { confetti, burst } from './fx'
import { World } from './World'

const FLIP_GAP = 260

export function Reveal() {
  const { rounds, answers, weights, world, restart } = useGame()
  // tus ideas favoritas: todo lo que puntuaste con 0,5 o más (máx. 12, las más altas primero)
  const chosen = useMemo(() => answers
    .flatMap((a) => Object.entries(a.scores ?? {}).filter(([, v]) => v >= 0.5).map(([id, v]) => ({ p: proposalById(id), v, strong: v >= 1 })))
    .sort((x, y) => y.v - x.v)
    .slice(0, 12), [answers])
  // todas las propuestas que salieron, con lo que contestaste (null = la saltaste)
  const seen = useMemo(() => rounds.flatMap((r) => {
    const a = answers.find((x) => x.roundId === r.id)
    return r.items.map((id) => ({ p: proposalById(id), v: a?.scores ? a.scores[id] ?? 0 : null }))
  }).sort((x, y) => x.p.partyId.localeCompare(y.p.partyId)), [rounds, answers])
  const aff = useMemo(() => computeAffinity(rounds, answers, weights), [rounds, answers, weights])
  const pos = useMemo(() => computePosition(rounds, answers, weights), [rounds, answers, weights])
  const posEco = useMemo(() => computePosition(rounds, answers, weights, 'eco'), [rounds, answers, weights])
  const posCul = useMemo(() => computePosition(rounds, answers, weights, 'cul'), [rounds, answers, weights])
  const me = pos === null ? null : partyById(tendencyOf(pos))
  const [flipped, setFlipped] = useState(0)
  const [stage, setStage] = useState<'curtain' | 'flip' | 'bars' | 'done'>('curtain')
  const [grow, setGrow] = useState(false)
  const barsRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // Coreografía: telón → giro de cartas una a una → redoble → barras → corona
  useEffect(() => {
    const t: number[] = []
    t.push(window.setTimeout(() => { setStage('flip'); sfx.whoosh() }, 2000))
    chosen.forEach((_, i) => t.push(window.setTimeout(() => { setFlipped(i + 1); sfx.flip(i); haptic(8); (gridRef.current?.children[i] as HTMLElement | undefined)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }, 2500 + i * FLIP_GAP)))
    const tb = 2700 + chosen.length * FLIP_GAP
    t.push(window.setTimeout(() => sfx.drum(), tb))
    t.push(window.setTimeout(() => setStage('bars'), tb + 400))
    t.push(window.setTimeout(() => { barsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, tb + 450))
    t.push(window.setTimeout(() => setGrow(true), tb + 900))
    t.push(window.setTimeout(() => {
      setStage('done'); sfx.fanfare(); haptic([40, 60, 40, 60, 120])
      confetti(me ? [me.color, '#fde68a', '#f9a8d4', '#ffffff', '#a5b4fc'] : ['#fde68a', '#f9a8d4'])
    }, tb + 2800))
    return () => t.forEach(clearTimeout)
  }, [])

  const share = async () => {
    const text = me && pos !== null
      ? `He hecho el test Espectro: salgo en ${me.name} (${fmt(pos)} de 10, donde 0 es izquierda y 10 derecha). ¿Y tú dónde estás?`
      : 'He hecho el test Espectro. ¿Y tú dónde estás en la política?'
    try {
      if (navigator.share) await navigator.share({ title: 'Espectro', text })
      else { await navigator.clipboard.writeText(text); burst(innerWidth / 2, innerHeight - 80, ['#fde68a', '#5eead4'], 30, 5) }
    } catch { /* cancelado */ }
  }

  return (
    <div className="relative z-10 h-full overflow-y-auto">
      {stage === 'curtain' && <>
        <div className="curtain l" /><div className="curtain r" />
        <div className="fixed inset-0 z-[51] grid place-items-center" style={{ animation: 'flash 1s .8s forwards' }}>
          <p className="title-xl text-center text-5xl"><span className="letter">¡Ya tienes</span><br /><span className="letter" style={{ animationDelay: '.2s' }}>tu resultado!</span></p>
        </div>
      </>}

      <div className="mx-auto max-w-md px-4 pt-[max(env(safe-area-inset-top),18px)] pb-[max(env(safe-area-inset-bottom),24px)]">
        <div className="screen-in text-center" style={{ animationDelay: '1.6s' }}>
          <p className="text-xs font-extrabold tracking-[.25em] text-violet-200/70 uppercase">Resultado</p>
          <h2 className="title-xl mt-1 text-[2.4rem]">¿De qué tendencia<br />eran tus ideas?</h2>
        </div>

        {/* Cartas que giran */}
        <div ref={gridRef} className="mt-5 grid grid-cols-2 gap-2.5">
          {chosen.map(({ p, strong }, i) => {
            const party = partyById(p.partyId)
            const t = topicById(p.topic)
            return (
              <div key={p.id} className={`flip h-[132px] ${i < flipped ? 'on' : ''}`}>
                <div className="flip-in h-full">
                  <div className="flip-face glass flex flex-col justify-between p-2.5">
                    <span className="text-[12px] font-black text-violet-200/70">{t.emoji} {t.name}{strong ? ' · ⭐' : ''}</span>
                    <span className="line-clamp-3 text-[15px] leading-tight font-extrabold">{p.title}</span>
                    <span className="text-[12px] font-black tracking-[.3em] text-violet-200/40">? ? ?</span>
                  </div>
                  <div className="flip-face flip-back flex flex-col justify-between p-2.5" style={{ background: `linear-gradient(150deg, ${party.color}, ${party.color}99)`, color: '#120c2c', boxShadow: `0 0 24px ${party.color}66` }}>
                    <span className="text-[12px] font-black opacity-70">{t.emoji} {t.name}{strong ? ' · ⭐' : ''}</span>
                    <span className="line-clamp-2 text-[14px] leading-tight font-extrabold">{p.title}</span>
                    <span className="font-display text-[1.05rem] leading-none font-extrabold">{party.short}</span>
                  </div>
                </div>
              </div>
            )
          })}
          {!chosen.length && <p className="col-span-2 text-center text-sm font-bold text-violet-200/70">No elegiste ninguna idea. ¡Prueba otra vez!</p>}
        </div>

        {/* Tu sitio en el espectro */}
        {(stage === 'bars' || stage === 'done') && pos !== null && me && (
          <div ref={barsRef} className="screen-in glass mt-6 rounded-3xl p-4">
            <p className="text-[13px] font-black tracking-[.2em] text-violet-200/80 uppercase">Tu sitio en la política</p>
            <h3 className="mt-1 font-display text-[2rem] leading-[1.05] font-extrabold">Te sitúas en el <span style={{ color: me.color }}>{me.name.toLowerCase()}</span></h3>
            <p className="mt-1 text-[1.05rem] font-bold text-violet-100/85"><b className="text-[1.3rem] tabular-nums">{fmt(pos)}</b> sobre 10 · 0 es la izquierda y 10 la derecha</p>
            <Spectrum value={grow ? pos : 5} big />
            <p className="mt-3 text-[1.05rem] leading-snug font-semibold text-violet-100/85">{me.about}</p>
            <div className="mt-4 grid gap-3">
              {posEco !== null && <div><p className="text-[15px] font-extrabold">💶 En economía: <span style={{ color: partyById(tendencyOf(posEco)).color }}>{partyById(tendencyOf(posEco)).name.toLowerCase()}</span> ({fmt(posEco)})</p><Spectrum value={grow ? posEco : 5} /></div>}
              {posCul !== null && <div><p className="text-[15px] font-extrabold">🧭 En valores y sociedad: <span style={{ color: partyById(tendencyOf(posCul)).color }}>{partyById(tendencyOf(posCul)).name.toLowerCase()}</span> ({fmt(posCul)})</p><Spectrum value={grow ? posCul : 5} /></div>}
            </div>
          </div>
        )}

        {(stage === 'bars' || stage === 'done') && (
          <div className="screen-in glass mt-4 rounded-3xl p-4">
            <h3 className="font-display text-xl font-extrabold">Tu cercanía a cada tendencia</h3>
            <p className="text-sm font-semibold text-violet-200/80">Cuánto se parecen tus respuestas a las de cada tendencia.</p>
            <div className="mt-3 flex flex-col gap-2.5">
              {PARTIES.map((party, i) => {
                const a = aff.find((x) => x.partyId === party.id)!
                const top = aff[0].partyId === party.id
                return (
                  <div key={party.id} className="flex items-center gap-2.5">
                    <span className="grid h-10 w-12 shrink-0 place-items-center rounded-xl text-[13px] leading-none font-black text-[#120c2c]" style={{ background: party.color }}>
                      {top && stage === 'done' ? <span className="crown text-xl">👑</span> : party.glyph}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between text-base font-extrabold"><span>{party.name}</span><Count to={grow ? a.pct : 0} /></div>
                      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/10">
                        <div className="bar h-full rounded-full" style={{ width: grow ? `${a.pct}%` : 0, background: party.color, transitionDelay: `${i * 90}ms`, boxShadow: `0 0 12px ${party.color}` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {stage === 'done' && <>
          <div className="screen-in mt-5 overflow-hidden rounded-3xl border border-white/10">
            <div className="glass px-4 py-2 text-sm font-extrabold">🌍 El país que has construido</div>
            <World built={world} progress={1} id="world-final" />
          </div>

          <p className="screen-in mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-[14px] leading-snug font-semibold text-violet-100/80">
            Es un resultado <b>orientativo</b>, no una etiqueta. Usa la misma escala izquierda–derecha que el CIS y las dos dimensiones con las que la ciencia política estudia las ideologías (economía y valores). «Extrema» solo indica el punto más alejado del centro; no es un juicio. En las encuestas del CIS, la respuesta más frecuente es el centro.
          </p>

          <details className="screen-in glass mt-4 rounded-2xl p-3">
            <summary className="cursor-pointer text-base font-extrabold">📚 Todas las ideas que has visto ({seen.length}) y de qué tendencia son</summary>
            <ul className="mt-3 flex flex-col gap-3">
              {seen.map(({ p, v }) => {
                const party = partyById(p.partyId)
                return (
                  <li key={p.id} className="border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between gap-2 text-[13px] font-black"><span style={{ color: party.color }}>{party.name}</span><span>{verdict(v)}</span></div>
                    <p className="mt-0.5 text-[16px] leading-snug font-extrabold">{p.title}</p>
                    <p className="text-[14px] leading-snug font-semibold text-violet-100/75">{p.detail}</p>
                    <p className="mt-1 text-[13px] font-semibold text-violet-200/70">Posición {fmt(p.pos)} de 10 · {p.dim === 'eco' ? 'economía' : 'valores y sociedad'}</p>
                  </li>
                )
              })}
            </ul>
          </details>

          <div className="screen-in mt-4 flex flex-col gap-2.5">
            <button className="btn-main" onClick={share}>Retar a un amigo 📲</button>
            <button className="btn-ghost py-3" onClick={() => { sfx.whoosh(); restart() }}>Jugar otra vez</button>
          </div>
        </>}
      </div>
    </div>
  )
}

function Count({ to }: { to: number }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const f = (t: number) => {
      const k = Math.min(1, (t - t0) / 1800)
      setV(Math.round(to * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(f)
    }
    raf = requestAnimationFrame(f)
    return () => cancelAnimationFrame(raf)
  }, [to])
  return <span className="tabular-nums">{v}%</span>
}

function verdict(v: number | null) {
  if (v === null) return '🤷 saltada'
  if (v >= 0.9) return '💚 la apoyaste mucho'
  if (v >= 0.5) return '👍 la apoyaste'
  if (v > 0.1) return '😐 te dio igual'
  return '👎 no la apoyaste'
}

const fmt = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** Barra del espectro izquierda–derecha con un marcador "TÚ" que se desliza hasta tu posición */
function Spectrum({ value, big = false }: { value: number; big?: boolean }) {
  return (
    <div className={big ? 'mt-7' : 'mt-1.5'}>
      <div className={`spectrum ${big ? 'big' : ''}`} style={{ background: `linear-gradient(90deg, ${PARTIES.map((p) => `${p.color} ${p.pos * 10}%`).join(', ')})` }}>
        <span className="spectrum-mark" style={{ left: `${value * 10}%` }}>{big ? 'TÚ' : ''}</span>
      </div>
      {big && (
        <div className="mt-5 grid grid-cols-5 text-center text-[11px] leading-tight font-black text-violet-100/80">
          {PARTIES.map((p) => <span key={p.id}>{p.name.replace('Extrema ', 'Extrema\n').replace('Centro ', 'Centro\n').split('\n').map((w, k) => <span key={k} className="block">{w}</span>)}</span>)}
        </div>
      )}
    </div>
  )
}

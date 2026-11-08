import { useEffect, useMemo, useState } from 'react'
import { PARTIES, partyById, proposalById } from '../engine/data'
import { computePosition, tendencyOf } from '../engine/engine'
import { useGame } from '../store'
import { sfx, haptic } from '../audio/sfx'
import { confetti, burst } from './fx'
import { ShareModal } from './ShareCard'

const fmt = (n: number) => n.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/**
 * Resultado: primero lo importante y en grande (tu tendencia y tu sitio en el espectro),
 * después tus dos ejes, tu cercanía a cada tendencia y tus ideas destapadas.
 */
export function Reveal() {
  const { rounds, answers, weights, restart } = useGame()
  const pos = useMemo(() => computePosition(rounds, answers, weights), [rounds, answers, weights])
  // cercanía a cada tendencia según la distancia en la escala: así siempre cuadra con tu resultado
  const aff = useMemo(() => pos === null ? [] : PARTIES
    .map((t) => ({ partyId: t.id, pct: Math.round(100 * Math.max(0, 1 - Math.abs(pos - t.pos) / 6)) }))
    .sort((x, y) => y.pct - x.pct), [pos])
  const posEco = useMemo(() => computePosition(rounds, answers, weights, 'eco'), [rounds, answers, weights])
  const posCul = useMemo(() => computePosition(rounds, answers, weights, 'cul'), [rounds, answers, weights])
  const me = pos === null ? null : partyById(tendencyOf(pos))
  // tus ideas favoritas (máx. 6)
  const favs = useMemo(() => answers
    .flatMap((a) => Object.entries(a.scores ?? {}).filter(([, v]) => v >= 0.5).map(([id, v]) => ({ p: proposalById(id), v })))
    .sort((x, y) => y.v - x.v).slice(0, 6), [answers])
  // todas las ideas que salieron, con lo que contestaste (null = la saltaste)
  const seen = useMemo(() => rounds.flatMap((r) => {
    const a = answers.find((x) => x.roundId === r.id)
    return r.items.map((id) => ({ p: proposalById(id), v: a?.scores ? a.scores[id] ?? 0 : null }))
  }).sort((x, y) => x.p.pos - y.p.pos), [rounds, answers])

  const [stage, setStage] = useState<'curtain' | 'result' | 'done'>('curtain')
  const [grow, setGrow] = useState(false)
  const [card, setCard] = useState(false)

  // Coreografía: telón → redoble → el marcador "TÚ" se desliza → confeti
  useEffect(() => {
    const t: number[] = []
    t.push(window.setTimeout(() => { setStage('result'); sfx.drum() }, 1900))
    t.push(window.setTimeout(() => setGrow(true), 2300))
    t.push(window.setTimeout(() => {
      setStage('done'); sfx.fanfare(); haptic([40, 60, 40, 60, 120])
      confetti(me ? [me.color, '#fde68a', '#f9a8d4', '#ffffff', '#a5b4fc'] : ['#fde68a', '#f9a8d4'])
    }, 4500))
    return () => t.forEach(clearTimeout)
  }, [])

  const share = async () => {
    const text = me && pos !== null
      ? `He hecho el test Espectro: salgo en ${me.name} (${fmt(pos)} de 10). ¿Y tú dónde estás?`
      : 'He hecho el test Espectro. ¿Y tú dónde estás en la política?'
    try {
      if (navigator.share) await navigator.share({ title: 'Espectro', text })
      else { await navigator.clipboard.writeText(text); burst(innerWidth / 2, innerHeight - 80, ['#fde68a', '#5eead4'], 30, 5) }
    } catch { /* cancelado */ }
  }
  const openCard = () => { sfx.whoosh(); setCard(true) }

  return (
    <div className="relative z-10 h-full overflow-y-auto">
      {stage === 'curtain' && <>
        <div className="curtain l" /><div className="curtain r" />
        <div className="fixed inset-0 z-[51] grid place-items-center" style={{ animation: 'flash 1s .8s forwards' }}>
          <p className="title-xl text-center text-5xl"><span className="letter">¡Ya tienes</span><br /><span className="letter" style={{ animationDelay: '.2s' }}>tu resultado!</span></p>
        </div>
      </>}

      <div className="mx-auto flex max-w-md flex-col gap-6 px-4 pt-[max(env(safe-area-inset-top),22px)] pb-[max(env(safe-area-inset-bottom),28px)]">
        {pos === null || !me ? (
          <div className="glass rounded-3xl p-6 text-center">
            <p className="font-display text-[1.8rem] leading-tight font-extrabold">Has saltado todas las preguntas</p>
            <p className="mt-2 text-[1.15rem] font-semibold text-violet-100/85">Sin respuestas no podemos situarte. ¡Prueba otra vez!</p>
            <button className="btn-main mt-5 w-full" onClick={() => { sfx.whoosh(); restart() }}>Repetir el test</button>
          </div>
        ) : <>
          {/* 1 · Lo importante, en grande */}
          <section className="res-hero screen-in" style={{ ['--t' as string]: me.color }}>
            <p className="res-kicker">Tu resultado</p>
            <h1 className="res-name" style={{ color: me.color }}>{me.name}</h1>
            <p className="res-score"><b>{fmt(pos)}</b> de 10</p>
            <Spectrum value={grow ? pos : 5} big />
            <p className="res-about">{me.about}</p>
            <button className={`btn-main mt-5 w-full ${stage === 'done' ? 'medal-cta' : ''}`} onClick={openCard}>🏅 Compartir mi medalla</button>
          </section>

          {/* 2 · Tus dos ejes */}
          {stage !== 'curtain' && (
            <section className="screen-in">
              <h2 className="res-h2">Por temas</h2>
              <div className="grid grid-cols-2 gap-3">
                <Axis icon="💶" label="Economía" value={posEco} grow={grow} />
                <Axis icon="🧭" label="Valores y sociedad" value={posCul} grow={grow} />
              </div>
            </section>
          )}

          {/* 3 · Cercanía a cada tendencia */}
          {stage !== 'curtain' && (
            <section className="glass screen-in rounded-3xl p-5" style={{ animationDelay: '.15s' }}>
              <h2 className="res-h2 !mb-1">Te pareces a…</h2>
              <p className="mb-4 text-[1.05rem] font-semibold text-violet-100/75">Lo cerca que estás de cada tendencia</p>
              <div className="flex flex-col gap-4">
                {PARTIES.map((party, i) => {
                  const a = aff.find((x) => x.partyId === party.id)!
                  const top = aff[0].partyId === party.id
                  return (
                    <div key={party.id}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[1.2rem] font-extrabold">{top && stage === 'done' && <span className="crown mr-1 inline-block">👑</span>}{party.name}</span>
                        <Count to={grow ? a.pct : 0} />
                      </div>
                      <div className="mt-1.5 h-4 overflow-hidden rounded-full bg-white/10">
                        <div className="bar h-full rounded-full" style={{ width: grow ? `${a.pct}%` : 0, background: party.color, transitionDelay: `${i * 90}ms`, boxShadow: `0 0 12px ${party.color}` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* 4 · Tus ideas favoritas, destapadas */}
          {stage === 'done' && favs.length > 0 && (
            <section className="screen-in">
              <h2 className="res-h2">Tus ideas favoritas eran de…</h2>
              <div className="flex flex-col gap-3">
                {favs.map(({ p }, k) => {
                  const t = partyById(p.partyId)
                  return (
                    <div key={p.id} className="fav-row" style={{ animationDelay: `${k * 120}ms` }}>
                      <p className="text-[1.15rem] leading-snug font-extrabold">{p.title}</p>
                      <span className="fav-chip" style={{ background: t.color }}>{t.name}</span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* 5 · Acciones y nota */}
          {stage === 'done' && <>
            <div className="screen-in flex flex-col gap-3">
              <button className="btn-main" onClick={openCard}>🏅 Compartir mi medalla</button>
              <button className="btn-ghost py-3.5 text-[1.05rem]" onClick={share}>Retar a un amigo 📲</button>
              <button className="btn-ghost py-3.5 text-[1.05rem]" onClick={() => { sfx.whoosh(); restart() }}>Repetir el test</button>
            </div>

            <p className="screen-in rounded-2xl border border-white/10 bg-white/5 p-4 text-[1.02rem] leading-snug font-semibold text-violet-100/80">
              Resultado <b>orientativo</b>. Usa la escala izquierda–derecha del CIS. «Extrema» solo significa lo más lejos del centro, no es un juicio.
            </p>

            <details className="screen-in glass rounded-2xl p-4">
              <summary className="cursor-pointer text-[1.1rem] font-extrabold">📚 Ver todas las ideas ({seen.length})</summary>
              <ul className="mt-3 flex flex-col gap-4">
                {seen.map(({ p, v }) => {
                  const t = partyById(p.partyId)
                  return (
                    <li key={p.id} className="border-t border-white/10 pt-3">
                      <div className="flex items-center justify-between gap-2 text-[15px] font-black"><span style={{ color: t.color }}>{t.name} · {fmt(p.pos)}</span><span>{verdict(v)}</span></div>
                      <p className="mt-1 text-[1.1rem] leading-snug font-extrabold">{p.title}</p>
                      <p className="text-[1rem] leading-snug font-semibold text-violet-100/75">{p.detail}</p>
                    </li>
                  )
                })}
              </ul>
            </details>
          </>}
        </>}
      </div>
      {card && pos !== null && <ShareModal data={{ pos, eco: posEco, cul: posCul }} onClose={() => setCard(false)} />}
    </div>
  )
}

/** Tarjeta de un eje: tendencia en grande, nota y una barra pequeña */
function Axis({ icon, label, value, grow }: { icon: string; label: string; value: number | null; grow: boolean }) {
  if (value === null) return <div className="axis-tile"><p className="text-[1rem] font-extrabold">{icon} {label}</p><p className="mt-2 text-[1rem] font-semibold text-violet-100/70">Sin respuestas</p></div>
  const t = partyById(tendencyOf(value))
  return (
    <div className="axis-tile" style={{ ['--t' as string]: t.color }}>
      <p className="text-[1rem] leading-tight font-extrabold text-violet-100/85">{icon} {label}</p>
      <p className="mt-2 font-display text-[1.45rem] leading-[1.05] font-extrabold" style={{ color: t.color }}>{t.name}</p>
      <p className="mt-1 text-[1.1rem] font-extrabold tabular-nums">{fmt(value)} <span className="text-[.95rem] font-bold text-violet-100/70">de 10</span></p>
      <Spectrum value={grow ? value : 5} />
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
  return <span className="text-[1.25rem] font-black tabular-nums">{v}%</span>
}

function verdict(v: number | null) {
  if (v === null) return '🤷 saltada'
  if (v >= 0.9) return '💚 mucho'
  if (v >= 0.5) return '👍 sí'
  if (v > 0.1) return '😐 igual'
  return '👎 no'
}

/** Barra del espectro izquierda–derecha con un marcador que se desliza hasta tu posición */
function Spectrum({ value, big = false }: { value: number; big?: boolean }) {
  return (
    <div className={big ? 'mt-8' : 'mt-3'}>
      <div className={`spectrum ${big ? 'big' : ''}`} style={{ background: `linear-gradient(90deg, ${PARTIES.map((p) => `${p.color} ${p.pos * 10}%`).join(', ')})` }}>
        <span className="spectrum-mark" style={{ left: `${value * 10}%` }}>{big ? 'TÚ' : ''}</span>
      </div>
      {big && (
        <div className="mt-6 flex justify-between text-[1rem] font-black text-violet-100/80">
          <span>Izquierda</span><span>Centro</span><span>Derecha</span>
        </div>
      )}
    </div>
  )
}

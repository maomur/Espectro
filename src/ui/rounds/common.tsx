import type { Proposal, Round, RoundType, Scores } from '../../engine/types'

export interface DoneFx {
  /** desde dónde vuela la chispa hacia tu país */
  from?: DOMRect
  strong?: boolean
}

export interface RoundProps {
  round: Round
  done: (scores: Scores | null, fx?: DoneFx) => void
}

/** Mecánicas: nombre, la pregunta (siempre visible) y cómo se contesta */
export const MECHANIC: Record<RoundType, { emoji: string; title: string; ask: string; how: string; color: string }> = {
  duel: { emoji: '⚔️', title: 'Duelo a ciegas', ask: '¿Cuál de estas dos prefieres?', how: 'Toca la que más te guste. Si te encanta, déjala pulsada.', color: '#f9a8d4' },
  swipe: { emoji: '👆', title: '¿Sí o no?', ask: '¿Estás a favor o en contra?', how: 'Desliza a la derecha 👉 si te gusta. A la izquierda 👈 si no.', color: '#5eead4' },
  thermo: { emoji: '🌡️', title: 'El termómetro', ask: '¿Cuánto te gusta esta idea?', how: 'Mueve el círculo: a la izquierda nada, a la derecha mucho.', color: '#fb7185' },
  vote: { emoji: '🏛️', title: 'Vota en el Congreso', ask: 'Eres diputado: ¿votas esta propuesta?', how: 'Pulsa SÍ si la apoyas, NO si estás en contra o ABSTENCIÓN si no lo tienes claro.', color: '#fcd34d' },
  react: { emoji: '💬', title: 'Reacciona', ask: '¿Qué te parece esta idea?', how: 'Toca la carita que mejor diga lo que piensas.', color: '#c4b5fd' },
}

/** Texto de una propuesta en letra grande (público amplio) */
export function PropText({ p, size = 'lg' }: { p: Proposal; size?: 'fit' | 'xl' | 'lg' | 'md' }) {
  // 'fit': se adapta a la altura de su tarjeta (container-type: size) para no recortarse nunca
  if (size === 'fit') return (
    <>
      <h3 className="font-display text-[clamp(1.35rem,min(9.2vw,14cqh),2.7rem)] leading-[1.08] font-extrabold tracking-tight text-balance">{p.title}</h3>
      <p className="mt-1.5 text-[clamp(1.08rem,min(5.8vw,9cqh),1.5rem)] leading-snug font-semibold text-violet-100/80">{p.detail}</p>
    </>
  )
  const t = size === 'xl' ? 'text-[clamp(1.5rem,7.4vw,2.1rem)]' : size === 'lg' ? 'text-[clamp(1.3rem,6.2vw,1.75rem)]' : 'text-[clamp(1.12rem,5.2vw,1.4rem)]'
  const d = size === 'md' ? 'text-[clamp(.95rem,4.2vw,1.05rem)]' : 'text-[clamp(1.02rem,4.6vw,1.2rem)]'
  return (
    <>
      <h3 className={`font-display ${t} leading-[1.08] font-extrabold tracking-tight text-balance`}>{p.title}</h3>
      <p className={`mt-1.5 ${d} leading-snug font-semibold text-violet-100/80`}>{p.detail}</p>
    </>
  )
}

/** Etiqueta "partido oculto" */
export function Blind() {
  return (
    <span className="flex items-center gap-1.5 text-[12px] font-black text-violet-200/60" aria-label="Tendencia oculta">
      🕶️ <span className="rounded bg-white/15 px-1.5 tracking-[.3em] text-transparent [text-shadow:0_0_6px_#fff8] select-none">TENDENCIA</span>
    </span>
  )
}

export const rectCenter = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 })

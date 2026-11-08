import { PARTIES, PROPOSALS, TOPICS, proposalById } from './data'
import type { Affinity, Answer, Proposal, Round, RoundType, TopicId, Weight } from './types'

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Weights = Record<TopicId, Weight>

export const defaultWeights = (): Weights =>
  Object.fromEntries(TOPICS.map((t) => [t.id, 3])) as Weights // todos los temas, al máximo

/** La partida va por fases: cada fase usa UNA mecánica durante varias rondas seguidas */
export const STAGES = 5
export const ROUNDS_PER_STAGE = 5
export const TOTAL_ROUNDS = STAGES * ROUNDS_PER_STAGE

/** Cuántas propuestas enseña cada mecánica (como máximo) y el mínimo con el que aún tiene sentido */
export const ROUND_SIZE: Record<RoundType, number> = { duel: 2, swipe: 3, thermo: 1, react: 3, vote: 1 }
export const ROUND_MIN: Record<RoundType, number> = { duel: 2, swipe: 2, thermo: 1, react: 2, vote: 1 }
export const ROUND_TYPES: RoundType[] = ['duel', 'swipe', 'vote', 'thermo', 'react']

/**
 * Mecánicas de la partida: las cinco, una por fase. Siempre empieza el duelo (el más fácil);
 * el orden de las demás cambia en cada partida.
 */
export function pickStages(rnd: () => number): RoundType[] {
  const rest = ROUND_TYPES.filter((t) => t !== 'duel').sort(() => rnd() - 0.5)
  return (['duel', ...rest] as RoundType[]).slice(0, STAGES)
}

/**
 * Construye la partida:
 * 1. Fases de 5 rondas con la misma mecánica (así se entiende bien antes de cambiar).
 * 2. Cada ronda elige tema según lo que le importa al usuario (más peso = más rondas),
 *    sin repetir tema seguido si se puede y sin pasarse de las propuestas de ese tema.
 * 3. Cada ronda se llena con propuestas de partidos distintos, priorizando a los
 *    partidos que menos han salido, sin repetir propuesta en toda la partida.
 */
export function buildRounds(weights: Weights, seed: number, proposals: Proposal[] = PROPOSALS): Round[] {
  const rnd = mulberry32(seed)
  const shuffle = <T,>(a: T[]) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
  const stages = pickStages(rnd)

  const exposure: Record<string, number> = Object.fromEntries(PARTIES.map((p) => [p.id, 0]))
  const topicCount: Record<string, number> = Object.fromEntries(TOPICS.map((t) => [t.id, 0]))
  const used = new Set<string>()
  const pool = (topic: TopicId) => proposals.filter((p) => p.topic === topic && !used.has(p.id))
  const partiesIn = (ps: Proposal[]) => new Set(ps.map((p) => p.partyId)).size
  const rounds: Round[] = []
  let prevTopic: TopicId | null = null

  stages.forEach((type, stage) => {
    for (let k = 0; k < ROUNDS_PER_STAGE; k++) {
      // tema: el que más "le toca" según su peso, que tenga propuestas suficientes
      const candidates = TOPICS.map((t) => ({ t: t.id, room: Math.min(pool(t.id).length, partiesIn(pool(t.id))) }))
        .filter((c) => c.room >= ROUND_MIN[type])
        .map((c) => ({ ...c, k: weights[c.t] / (topicCount[c.t] + 1) + (c.t === prevTopic ? -10 : 0) + (c.room >= ROUND_SIZE[type] ? 0.5 : 0) + rnd() * 0.3 }))
        .sort((x, y) => y.k - x.k)
      if (!candidates.length) continue
      const { t: topic, room } = candidates[0]
      const size = Math.min(ROUND_SIZE[type], room)
      const ps = pool(topic)
      const parties = [...new Set(ps.map((p) => p.partyId))]
        // menos salidas primero; a igualdad, el que más propuestas le quedan en el tema
        .map((id) => ({ id, k: exposure[id] - ps.filter((p) => p.partyId === id).length * 0.3 + rnd() * 0.25 }))
        .sort((x, y) => x.k - y.k)
        .slice(0, size)
        .map((x) => x.id)
      const items = shuffle(parties.map((party) => {
        const opts = ps.filter((p) => p.partyId === party)
        const chosen = opts[Math.floor(rnd() * opts.length)]
        used.add(chosen.id)
        exposure[party]++
        return chosen.id
      }))
      topicCount[topic]++
      prevTopic = topic
      rounds.push({ id: `r${rounds.length}`, topic, type, items, stage, step: k })
    }
  })
  return rounds
}

/** Cuánto esperamos que alguien en la posición p apoye una idea situada en s (0 a 1) */
export const WIDTH = 4
export const expected = (s: number, p: number) => Math.max(0, 1 - Math.abs(s - p) / WIDTH)

/** Respuestas con su peso: cada idea contestada, su posición, su eje y cuánto la apoyaste */
function answered(rounds: Round[], answers: Answer[], weights: Weights) {
  const out: { pos: number; dim: 'eco' | 'cul'; a: number; w: number; partyId: string }[] = []
  for (const ans of answers) {
    const round = rounds.find((r) => r.id === ans.roundId)
    if (!round || !ans.scores) continue
    for (const id of round.items) {
      const p = proposalById(id)
      out.push({ pos: p.pos, dim: p.dim, a: clamp01(ans.scores[id] ?? 0), w: weights[round.topic], partyId: p.partyId })
    }
  }
  return out
}

/**
 * Tu posición en la escala 0–10.
 * Lo que apoyas te acerca a su posición. Lo que rechazas te aleja de ella (cuenta como su
 * opuesto, 10 − posición), con más fuerza cuanto más extrema es la idea: rechazar una idea
 * de centro no dice hacia qué lado estás. Así, decir que sí a todo o que no a todo deja
 * en el centro, y nadie acaba en un extremo solo por contestar "no" muchas veces.
 * Se puede calcular solo con un eje (económico o social). Devuelve null si no hay respuestas.
 */
export function computePosition(rounds: Round[], answers: Answer[], weights: Weights, dim?: 'eco' | 'cul'): number | null {
  const xs = answered(rounds, answers, weights).filter((x) => !dim || x.dim === dim)
  if (!xs.length) return null
  let num = 0, den = 0
  for (const x of xs) {
    const pull = x.w * x.a
    const push = x.w * (1 - x.a) * 0.5 * (Math.abs(x.pos - 5) / 5)
    num += pull * x.pos + push * (10 - x.pos)
    den += pull + push
  }
  if (den < 1e-9) return 5
  return Math.round((num / den) * 10) / 10
}

/** Etiqueta de una posición, con los mismos cortes que las ideas */
export { tendencyOf } from './data'

/**
 * Cercanía a cada tendencia (0–100 %): qué parecido es lo que has contestado
 * a lo que contestaría alguien de esa tendencia.
 */
export function computeAffinity(rounds: Round[], answers: Answer[], weights: Weights): Affinity[] {
  const xs = answered(rounds, answers, weights)
  return PARTIES.map((t) => {
    let points = 0, max = 0
    for (const x of xs) { points += x.w * (1 - Math.abs(x.a - expected(x.pos, t.pos))); max += x.w }
    return { partyId: t.id, points, max, pct: max ? Math.round((points / max) * 100) : 0 }
  }).sort((x, y) => y.pct - x.pct || y.points - x.points)
}

export type Reaction = 'love' | 'like' | 'meh' | 'dislike'
export const REACTION_VALUE: Record<Reaction, number> = { love: 1, like: 2 / 3, meh: 1 / 3, dislike: 0 }

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/* ---------- Puntuación de cada mecánica (pura, testeada) ---------- */

export const score = {
  duel: (items: string[], picked: string | null, strong: boolean) =>
    Object.fromEntries(items.map((id) => [id, id === picked ? (strong ? 1 : 0.75) : 0])),
  swipe: (votes: Record<string, boolean>) =>
    Object.fromEntries(Object.entries(votes).map(([id, yes]) => [id, yes ? 1 : 0])),
  thermo: (id: string, value: number) => ({ [id]: clamp01(value / 100) }),
  /** votación en el Congreso: sí 1 · abstención 0,5 · no 0 */
  vote: (id: string, v: 'yes' | 'abs' | 'no') => ({ [id]: v === 'yes' ? 1 : v === 'abs' ? 0.5 : 0 }),
  /** reacciones: ❤️ 1 · 👍 0,67 · 😐 0,33 · 👎 0 */
  react: (reactions: Record<string, Reaction>) =>
    Object.fromEntries(Object.entries(reactions).map(([id, r]) => [id, REACTION_VALUE[r]])),
}

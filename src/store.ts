import { create } from 'zustand'
import { proposalById } from './engine/data'
import { buildRounds, defaultWeights, type Weights } from './engine/engine'
import type { Answer, Round, Scores, TopicId, Weight, WorldItem } from './engine/types'
import { setMuted } from './audio/sfx'

export type Phase = 'intro' | 'topics' | 'play' | 'reveal'

export interface Built { id: number; item: WorldItem; x: number; scale: number; color: string }

interface S {
  phase: Phase
  weights: Weights
  seed: number
  rounds: Round[]
  answers: Answer[]
  index: number
  world: Built[]
  streak: number
  muted: boolean
  go(phase: Phase): void
  cycleWeight(t: TopicId): Weight
  start(): void
  answer(scores: Scores | null, opts?: { strong?: boolean; x?: number }): void
  restart(): void
  toggleMute(): void
}

let bid = 0
const loadMuted = () => { try { return localStorage.getItem('espectro.muted') === '1' } catch { return false } }
// colores neutros: lo que construyes nunca delata al partido
const PALETTE = ['#fde68a', '#a5f3fc', '#c4b5fd', '#fecdd3', '#bbf7d0', '#fed7aa']

export const useGame = create<S>((set, get) => ({
  phase: 'intro',
  weights: defaultWeights(),
  seed: 0,
  rounds: [],
  answers: [],
  index: 0,
  world: [],
  streak: 0,
  muted: (() => { const m = loadMuted(); setMuted(m); return m })(),

  go: (phase) => set({ phase }),

  cycleWeight: (t) => {
    const w = get().weights[t]
    const next = (w === 1 ? 3 : w - 1) as Weight // empiezan al máximo: cada toque baja un nivel
    set({ weights: { ...get().weights, [t]: next } })
    return next
  },

  start: () => {
    const seed = Math.floor(Math.random() * 1e9)
    set({ seed, rounds: buildRounds(get().weights, seed), answers: [], index: 0, world: [], streak: 0, phase: 'play' })
  },

  answer: (scores, opts = {}) => {
    const { rounds, index, answers, world, streak } = get()
    const round = rounds[index]
    if (!round) return
    const next: Partial<S> = { answers: [...answers, { roundId: round.id, scores, strong: opts.strong }], index: index + 1 }
    // lo que más te gustó de la ronda se construye en tu país
    const best = scores ? Object.entries(scores).sort((a, b) => b[1] - a[1])[0] : null
    if (best && best[1] >= 0.5) {
      bid++
      next.world = [...world, { id: bid, item: proposalById(best[0]).world, x: opts.x ?? 6 + Math.random() * 88, scale: best[1] >= 1 ? 1.3 : 1, color: PALETTE[bid % PALETTE.length] }]
      next.streak = streak + 1
    } else next.streak = 0
    if (index + 1 >= rounds.length) next.phase = 'reveal'
    set(next)
  },

  restart: () => set({ phase: 'topics', answers: [], index: 0, world: [], streak: 0 }),

  toggleMute: () => {
    const m = !get().muted
    setMuted(m)
    try { localStorage.setItem('espectro.muted', m ? '1' : '0') } catch { /* */ }
    set({ muted: m })
  },
}))

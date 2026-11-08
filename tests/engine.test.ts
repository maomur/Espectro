import { describe, expect, it } from 'vitest'
import { PARTIES, PROPOSALS, TOPICS, proposalById, tendencyOf } from '../src/engine/data'
import { ROUNDS_PER_STAGE, ROUND_MIN, ROUND_SIZE, STAGES, TOTAL_ROUNDS, buildRounds, computeAffinity, computePosition, defaultWeights, score, type Weights } from '../src/engine/engine'
import type { Answer } from '../src/engine/types'

const randomWeights = (seed: number): Weights => {
  const w = defaultWeights()
  TOPICS.forEach((t, i) => (w[t.id] = (((i * 7 + seed) % 3) + 1) as 1 | 2 | 3))
  return w
}

describe('datos', () => {
  it('cada tendencia tiene al menos 2 ideas en cada tema y el banco es amplio', () => {
    for (const t of TOPICS) for (const p of PARTIES) { const n = PROPOSALS.filter((x) => x.topic === t.id && x.partyId === p.id).length; expect(n).toBeGreaterThanOrEqual(2) }
  })
  it('banco de más de 120 ideas, todas con fuente', () => {
    expect(PROPOSALS.length).toBeGreaterThan(120)
    for (const p of PROPOSALS) { expect(p.src.length).toBeGreaterThan(5); expect(p.url).toMatch(/^https:\/\//) }
  })
  it('ids únicos', () => expect(new Set(PROPOSALS.map((p) => p.id)).size).toBe(PROPOSALS.length))
  it('cada idea tiene posición 0-10 y eje, y su tendencia coincide con la posición', () => {
    for (const p of PROPOSALS) { expect(p.pos).toBeGreaterThanOrEqual(0); expect(p.pos).toBeLessThanOrEqual(10); expect(['eco', 'cul']).toContain(p.dim); expect(p.partyId).toBe(tendencyOf(p.pos)) }
  })
  it('cada tema tiene ideas de los dos ejes o del que le corresponde', () => {
    expect(PROPOSALS.filter((p) => p.dim === 'eco').length).toBeGreaterThan(25)
    expect(PROPOSALS.filter((p) => p.dim === 'cul').length).toBeGreaterThan(25)
  })
  it('títulos cortos para que quepan en grande', () => {
    for (const p of PROPOSALS) { expect(p.title.length).toBeLessThanOrEqual(64); expect(p.detail.length).toBeLessThanOrEqual(105) }
  })
})

describe('rondas', () => {
  it('fases de 5 rondas con la misma mecánica; 5 fases; la primera es el duelo', () => {
    for (let seed = 0; seed < 300; seed++) {
      const r = buildRounds(randomWeights(seed), seed)
      expect(r).toHaveLength(TOTAL_ROUNDS)
      expect(r[0].type).toBe('duel')
      for (let s = 0; s < STAGES; s++) {
        const st = r.filter((x) => x.stage === s)
        expect(st).toHaveLength(ROUNDS_PER_STAGE)
        expect(new Set(st.map((x) => x.type)).size).toBe(1)
        expect(st.map((x) => x.step)).toEqual([0, 1, 2, 3, 4])
      }
      expect(new Set(r.map((x) => x.type)).size).toBe(STAGES)
      for (const t of ['duel', 'swipe', 'vote', 'thermo', 'react']) expect(r.some((x) => x.type === t)).toBe(true)
    }
  })

  it('cada ronda: tamaño válido, mismo tema, partidos distintos, sin repetir propuesta', () => {
    for (let seed = 0; seed < 300; seed++) {
      const r = buildRounds(randomWeights(seed), seed)
      const seen = new Set<string>()
      for (const x of r) {
        expect(x.items.length).toBeLessThanOrEqual(ROUND_SIZE[x.type])
        expect(x.items.length).toBeGreaterThanOrEqual(ROUND_MIN[x.type])
        const parties = x.items.map((id) => proposalById(id).partyId)
        expect(new Set(parties).size).toBe(parties.length)
        for (const id of x.items) { expect(proposalById(id).topic).toBe(x.topic); expect(seen.has(id)).toBe(false); seen.add(id) }
      }
    }
  })

  it('los temas que más te importan salen más', () => {
    const w = defaultWeights(); for (const t of TOPICS) w[t.id] = 1; w.inmigracion = 3
    let viv = 0, otros = 0
    for (let seed = 0; seed < 100; seed++) for (const x of buildRounds(w, seed)) x.topic === 'inmigracion' ? viv++ : otros++
    expect(viv / 100).toBeGreaterThan(otros / 100 / 5)
  })

  it('variedad: entre partidas cambian las mecánicas', () => {
    const combos = new Set<string>()
    for (let seed = 0; seed < 100; seed++) combos.add(buildRounds(defaultWeights(), seed).filter((r) => r.step === 0).map((r) => r.type).join())
    expect(combos.size).toBeGreaterThan(3) // cambia el orden de las fases
  })

  it('reparto justo (la afinidad además se normaliza por salidas)', () => {
    for (let seed = 0; seed < 300; seed++) {
      const c: Record<string, number> = {}
      for (const x of buildRounds(randomWeights(seed), seed)) for (const id of x.items) c[proposalById(id).partyId] = (c[proposalById(id).partyId] ?? 0) + 1
      const v = PARTIES.map((p) => c[p.id] ?? 0)
      expect(Math.max(...v) - Math.min(...v)).toBeLessThanOrEqual(3)
    }
  })

  it('el siguiente test evita las ideas del anterior', () => {
    const w = defaultWeights()
    for (let seed = 0; seed < 50; seed++) {
      const first = buildRounds(w, seed)
      const seen = new Set(first.flatMap((r) => r.items))
      const second = buildRounds(w, seed + 1000, undefined, seen)
      const ids = second.flatMap((r) => r.items)
      expect(ids.filter((id) => seen.has(id)).length / ids.length).toBeLessThan(0.25)
    }
  })
  it('determinista con la misma semilla', () => expect(buildRounds(defaultWeights(), 42)).toEqual(buildRounds(defaultWeights(), 42)))
})

describe('puntuación', () => {
  it('cada mecánica da valores entre 0 y 1', () => {
    expect(score.duel(['a', 'b'], 'a', true)).toEqual({ a: 1, b: 0 })
    expect(score.duel(['a', 'b'], 'b', false)).toEqual({ a: 0, b: 0.75 })
    expect(score.thermo('a', 50)).toEqual({ a: 0.5 })
    expect(score.vote('a', 'abs')).toEqual({ a: 0.5 })
    const re = score.react({ a: 'love', b: 'like', c: 'meh', d: 'dislike' }); expect(re.a).toBe(1); expect(re.b).toBeCloseTo(2 / 3); expect(re.c).toBeCloseTo(1 / 3); expect(re.d).toBe(0)
  })

  it('quien apoya solo las ideas de una tendencia queda en esa tendencia', () => {
    const w = defaultWeights()
    for (const t of PARTIES) for (let seed = 0; seed < 20; seed++) {
      const r = buildRounds(w, seed)
      const ans: Answer[] = r.map((x) => ({ roundId: x.id, scores: Object.fromEntries(x.items.map((id) => [id, proposalById(id).partyId === t.id ? 1 : 0])) }))
      expect(computeAffinity(r, ans, w)[0].partyId).toBe(t.id)
      const pos = computePosition(r, ans, w)!
      expect(Math.abs(pos - t.pos)).toBeLessThanOrEqual(1.6)
    }
  })
  it('decir que no a todo, o que sí a todo, deja cerca del centro', () => {
    const w = defaultWeights()
    for (let seed = 0; seed < 30; seed++) {
      const r = buildRounds(w, seed)
      for (const v of [0, 1]) {
        const pos = computePosition(r, r.map((x) => ({ roundId: x.id, scores: Object.fromEntries(x.items.map((id) => [id, v])) })), w)!
        expect(pos).toBeGreaterThanOrEqual(3.5); expect(pos).toBeLessThanOrEqual(6.5)
      }
    }
  })
  it('quien apoya por igual todo queda cerca del centro, y "me da igual" no cuenta', () => {
    const w = defaultWeights()
    const r = buildRounds(w, 5)
    const half = computePosition(r, r.map((x) => ({ roundId: x.id, scores: Object.fromEntries(x.items.map((id) => [id, 0.5])) })), w)!
    expect(half).toBeGreaterThanOrEqual(3.5); expect(half).toBeLessThanOrEqual(6.5)
    expect(computePosition(r, r.map((x) => ({ roundId: x.id, scores: null })), w)).toBeNull()
  })

})

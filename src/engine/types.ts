export type TopicId = 'economia' | 'impuestos' | 'servicios' | 'trabajo' | 'inmigracion' | 'seguridad' | 'valores' | 'pais'

/** Elementos que aparecen en "tu país" cuando eliges una propuesta */
export type WorldItem =
  | 'casa' | 'torre' | 'arbol' | 'panel' | 'molino' | 'fabrica'
  | 'hospital' | 'escuela' | 'moneda' | 'tren' | 'grua' | 'farola'

export interface Party {
  id: string
  name: string
  short: string
  color: string
  /** etiqueta corta para la insignia */
  glyph: string
  /** posición de referencia en la escala 0 (izquierda) – 10 (derecha) */
  pos: number
  /** qué suele defender, en una frase */
  about: string
}

export interface Topic {
  id: TopicId
  name: string
  emoji: string
  color: string
}

export interface Proposal {
  id: string
  partyId: string
  topic: TopicId
  title: string
  detail: string
  world: WorldItem
  /** posición de la afirmación en la escala 0 (izquierda) – 10 (derecha) */
  pos: number
  /** eje: económico (Estado y mercado) o social y cultural (valores, identidad, orden) */
  dim: 'eco' | 'cul'
  /** encuesta o estudio en el que se basa la pregunta */
  src: string
  /** enlace para comprobarlo */
  url: string
}

export type Weight = 1 | 2 | 3

/** Mecánicas de juego: cada ronda usa una */
export type RoundType = 'duel' | 'swipe' | 'thermo' | 'react' | 'vote'

export interface Round {
  id: string
  topic: TopicId
  type: RoundType
  items: string[] // ids de propuestas, de partidos distintos
  stage: number // fase (0, 1, 2…)
  step: number // ronda dentro de la fase
}

/** Puntuación de 0 a 1 por propuesta; null = "me da igual" (no cuenta) */
export type Scores = Record<string, number>

export interface Answer {
  roundId: string
  scores: Scores | null
  strong?: boolean
}

export interface Affinity {
  partyId: string
  points: number
  max: number
  pct: number
}

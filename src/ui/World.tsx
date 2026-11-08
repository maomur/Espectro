import type { WorldItem } from '../engine/types'
import type { Built } from '../store'

/** Glifos de "tu país": dibujados con la base en (0,0) y ~40 de alto */
export function Glyph({ item, color }: { item: WorldItem; color: string }) {
  const s = '#0d0a24'
  switch (item) {
    case 'casa': return <g><rect x={-12} y={-18} width={24} height={18} fill={color} /><path d="M-15 -17 L0 -31 L15 -17Z" fill="#fb7185" /><rect x={-3} y={-9} width={6} height={9} fill={s} /><rect x={-10} y={-14} width={5} height={4} fill="#fff8" /></g>
    case 'torre': return <g><rect x={-10} y={-44} width={20} height={44} rx={2} fill={color} />{[0, 1, 2, 3, 4].map((r) => [0, 1].map((k) => <rect key={`${r}${k}`} x={-6 + k * 7} y={-40 + r * 8} width={5} height={5} fill={(r + k) % 3 ? '#fff9' : '#fde047'} />))}</g>
    case 'arbol': return <g className="sway"><rect x={-2} y={-12} width={4} height={12} fill="#92400e" /><circle cy={-20} r={11} fill="#4ade80" /><circle cx={-6} cy={-15} r={7} fill="#22c55e" /><circle cx={6} cy={-16} r={7} fill="#86efac" /></g>
    case 'panel': return <g><rect x={-1.5} y={-10} width={3} height={10} fill="#94a3b8" /><g transform="translate(0 -12) skewX(-20)"><rect x={-14} y={-8} width={28} height={10} fill="#1e3a8a" stroke="#93c5fd" strokeWidth={1} /><path d="M-7 -8 V2 M0 -8 V2 M7 -8 V2" stroke="#93c5fd" strokeWidth={.8} /></g><circle cx={14} cy={-34} r={4} fill="#fde047" opacity={.8} /></g>
    case 'molino': return <g><path d="M-2 0 L-1 -38 L1 -38 L2 0Z" fill="#e2e8f0" /><g transform="translate(0 -38)"><g className="spin">{[0, 120, 240].map((a) => <path key={a} transform={`rotate(${a})`} d="M0 0 L-2 -18 L0 -20 L2 -18Z" fill="#f8fafc" />)}<circle r={2} fill="#94a3b8" /></g></g></g>
    case 'fabrica': return <g><path d="M-16 0 V-16 L-8 -22 V-16 L0 -22 V-16 L8 -22 V0Z" fill={color} /><rect x={9} y={-34} width={6} height={34} fill="#64748b" /><circle cx={14} cy={-40} r={4} fill="#fff4" className="float" /><rect x={-12} y={-10} width={5} height={5} fill="#fde047" /></g>
    case 'hospital': return <g><rect x={-15} y={-26} width={30} height={26} fill="#f8fafc" /><rect x={-3} y={-22} width={6} height={14} fill="#ef4444" /><rect x={-7} y={-18} width={14} height={6} fill="#ef4444" /><rect x={-4} y={-6} width={8} height={6} fill="#93c5fd" /></g>
    case 'escuela': return <g><rect x={-16} y={-20} width={32} height={20} fill={color} /><path d="M-18 -19 L0 -30 L18 -19Z" fill="#8b5cf6" /><circle cy={-24} r={3} fill="#fde047" /><rect x={-11} y={-14} width={5} height={5} fill={s} /><rect x={6} y={-14} width={5} height={5} fill={s} /><rect x={-3} y={-9} width={6} height={9} fill={s} /><path d="M18 -30 V-42 L26 -39 L18 -36" stroke="#e2e8f0" fill="#f472b6" strokeWidth={1} /></g>
    case 'moneda': return <g className="float"><circle cy={-14} r={10} fill="#fde047" stroke="#ca8a04" strokeWidth={2} /><text y={-10} textAnchor="middle" fontSize={11} fontWeight={900} fill="#a16207">€</text></g>
    case 'tren': return <g><rect x={-18} y={-14} width={36} height={12} rx={5} fill={color} /><rect x={-14} y={-11} width={6} height={4} fill={s} /><rect x={-4} y={-11} width={6} height={4} fill={s} /><rect x={6} y={-11} width={6} height={4} fill={s} /><circle cx={-10} cy={-1} r={2.5} fill="#334155" /><circle cx={10} cy={-1} r={2.5} fill="#334155" /></g>
    case 'grua': return <g><rect x={-1.5} y={-42} width={3} height={42} fill="#facc15" /><rect x={-14} y={-44} width={30} height={3} fill="#facc15" /><path d="M12 -41 V-30" stroke="#e2e8f0" /><rect x={9} y={-30} width={6} height={5} fill="#fb923c" /></g>
    case 'farola': return <g><rect x={-1.2} y={-30} width={2.4} height={30} fill="#94a3b8" /><circle cy={-32} r={4} fill="#fef08a" /><circle cy={-32} r={10} fill="#fef08a" opacity={.25} /></g>
  }
}

/**
 * Tu país: el cielo amanece según avanzas. Cada idea que eliges construye algo.
 * Los colores son neutros: nunca delatan de qué partido es la idea.
 */
export function World({ built, progress, height, id = 'world' }: { built: Built[]; progress: number; height?: number; id?: string }) {
  const p = Math.max(0, Math.min(1, progress))
  const sunY = 95 - p * 70
  const top = mix('#140f3a', '#38bdf8', p)
  const bottom = mix('#3b1d6e', '#fdba74', p)
  return (
    <svg id={id} viewBox="0 0 400 110" preserveAspectRatio={height ? 'xMidYMax slice' : 'xMidYMax meet'} style={{ height: height ?? 'auto', width: '100%', display: 'block' }} aria-label="Tu país">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={bottom} /></linearGradient>
        <radialGradient id={`${id}-sun`}><stop offset="0" stopColor="#fff7d6" /><stop offset=".4" stopColor="#fde047" /><stop offset="1" stopColor="#fde04700" /></radialGradient>
      </defs>
      <rect width="400" height="110" fill={`url(#${id}-sky)`} style={{ transition: 'fill 1s' }} />
      <circle cx="320" cy={sunY} r="36" fill={`url(#${id}-sun)`} style={{ transition: 'cy 1.2s cubic-bezier(.2,.85,.25,1)' }} />
      {p < .5 && [30, 90, 150, 210, 260, 370].map((x, i) => <circle key={x} cx={x} cy={12 + (i * 17) % 40} r={.9} fill="#fff" opacity={1 - p * 2} />)}
      <path d="M0 92 Q60 78 120 88 T240 86 T400 84 V110 H0Z" fill="#1e1b4b" opacity=".55" />
      <path d="M0 98 Q80 88 170 96 T330 94 T400 96 V110 H0Z" fill={mix('#312e81', '#16a34a', p)} style={{ transition: 'fill 1s' }} />
      {[...built].sort((a, b) => a.scale - b.scale).map((b) => (
        <g key={b.id} transform={`translate(${b.x * 4} 100) scale(${b.scale * .9})`}>
          <g className="pop-in"><Glyph item={b.item} color={b.color} /></g>
        </g>
      ))}
    </svg>
  )
}

function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('')
}

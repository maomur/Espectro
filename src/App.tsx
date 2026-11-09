import { useMemo } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { useGame } from './store'
import { partyById } from './engine/data'
import { computePosition, tendencyOf } from './engine/engine'
import { Intro } from './ui/Intro'
import { Topics } from './ui/Topics'
import { Play } from './ui/Play'
import { Reveal } from './ui/Reveal'

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')

/**
 * Estadísticas (Vercel Web Analytics, sin cookies): cada paso del test cuenta como una
 * "página" virtual, así el panel de Vercel muestra cuántos entran, empiezan y terminan,
 * y cuántos resultados hay de cada tendencia. Solo totales anónimos, nada personal.
 *   /              → portada
 *   /temas         → elige temas
 *   /test          → empieza el test
 *   /resultado/... → termina el test (con la tendencia que le ha salido)
 */
function useVirtualPath() {
  const { phase, rounds, answers, weights } = useGame()
  return useMemo(() => {
    if (phase === 'topics') return { route: '/temas', path: '/temas' }
    if (phase === 'play') return { route: '/test', path: '/test' }
    if (phase === 'reveal') {
      const pos = computePosition(rounds, answers, weights)
      const t = pos === null ? 'sin-respuestas' : slug(partyById(tendencyOf(pos)).name)
      return { route: '/resultado/[tendencia]', path: `/resultado/${t}` }
    }
    return { route: '/', path: '/' }
    // solo cambia al cambiar de fase: las respuestas ya están completas al llegar al resultado
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps
}

export default function App() {
  const phase = useGame((s) => s.phase)
  const { route, path } = useVirtualPath()
  return (
    <>
      <div className="aurora" aria-hidden><i /><i /><i /><div className="stars" /><div className="grain" /></div>
      <main className="relative h-full" key={phase}>
        {phase === 'intro' && <Intro />}
        {phase === 'topics' && <Topics />}
        {phase === 'play' && <Play />}
        {phase === 'reveal' && <Reveal />}
      </main>
      <Analytics route={route} path={path} />
    </>
  )
}

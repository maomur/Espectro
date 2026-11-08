import { useGame } from './store'
import { Intro } from './ui/Intro'
import { Topics } from './ui/Topics'
import { Play } from './ui/Play'
import { Reveal } from './ui/Reveal'

export default function App() {
  const phase = useGame((s) => s.phase)
  return (
    <>
      <div className="aurora" aria-hidden><i /><i /><i /><div className="stars" /><div className="grain" /></div>
      <main className="relative h-full" key={phase}>
        {phase === 'intro' && <Intro />}
        {phase === 'topics' && <Topics />}
        {phase === 'play' && <Play />}
        {phase === 'reveal' && <Reveal />}
      </main>
    </>
  )
}

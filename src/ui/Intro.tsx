import { useEffect, useRef, useState } from 'react'
import { useGame } from '../store'
import { sfx, haptic } from '../audio/sfx'
import { burst, ring } from './fx'

export function Intro() {
  const go = useGame((s) => s.go)
  const ref = useRef<HTMLDivElement>(null)
  const [lit, setLit] = useState(false)
  const touched = useRef(false)

  // La linterna se mueve sola hasta que el usuario toca la pantalla
  useEffect(() => {
    let raf = 0
    const t0 = performance.now()
    const tick = (t: number) => {
      if (!touched.current && ref.current) {
        const k = (t - t0) / 1000
        ref.current.style.setProperty('--tx', `${50 + Math.sin(k * 1.1) * 32}%`)
        ref.current.style.setProperty('--ty', `${42 + Math.sin(k * 1.7) * 14}%`)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const auto = setTimeout(() => setLit(true), 3600)
    return () => { cancelAnimationFrame(raf); clearTimeout(auto) }
  }, [])

  const move = (e: React.PointerEvent) => {
    touched.current = true
    const r = ref.current!.getBoundingClientRect()
    ref.current!.style.setProperty('--tx', `${e.clientX - r.left}px`)
    ref.current!.style.setProperty('--ty', `${e.clientY - r.top}px`)
  }

  const start = (e: React.MouseEvent) => {
    sfx.whoosh(); haptic(20)
    burst(e.clientX, e.clientY, ['#fde68a', '#f9a8d4', '#a5b4fc', '#5eead4'], 50, 9)
    ring(e.clientX, e.clientY, '#fde68a', 220)
    setTimeout(() => go('topics'), 350)
  }

  const word = (w: string, d: number, g: string) => w.split('').map((ch, i) => (
    <span key={i} className="letter grad" style={{ animationDelay: `${d + i * 0.07}s`, ['--g' as string]: g }}>{ch}</span>
  ))

  return (
    <div ref={ref} onPointerMove={move} onPointerDown={move} className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
      <span className="screen-in mb-6 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-extrabold tracking-[.2em] text-violet-200 uppercase">
        Test de ideología política
      </span>

      <h1 className="title-xl relative text-[clamp(3.3rem,16.5vw,7rem)]">
        {'ESPECTRO'.split('').map((ch, i) => {
          const c = ['#f87171', '#fb7185', '#f472b6', '#c084fc', '#a78bfa', '#7dd3fc', '#38bdf8', '#4ade80'][i]
          return <span key={i} className="letter grad" style={{ animationDelay: `${.2 + i * 0.07}s`, ['--g' as string]: `linear-gradient(160deg, #fff, ${c} 55%)` }}>{ch}</span>
        })}
      </h1>
      <div className="intro-spectrum screen-in mt-4" style={{ animationDelay: '1.2s' }} aria-hidden><span /></div>

      <p className="screen-in mt-7 max-w-xs text-xl leading-snug font-bold text-violet-100/90" style={{ animationDelay: '2s' }}>
        ¿Eres de <span className="text-rose-300">izquierdas</span>, de <span className="text-sky-300">derechas</span> o de <span className="text-violet-300">centro</span>?
        <span className="mt-2 block text-base font-semibold text-violet-200/85">Contesta 25 preguntas sencillas y descubre dónde te sitúas, de la extrema izquierda a la extrema derecha.</span>
      </p>

      <div className="screen-in mt-9" style={{ animationDelay: '2.5s' }}>
        <button className="btn-main float" onClick={start}>Descubrir dónde estoy 🧭</button>
      </div>

      <p className="screen-in mt-6 max-w-xs text-[13px] font-bold text-violet-200/60" style={{ animationDelay: '2.8s' }}>
        Preguntas basadas en el CIS, la Encuesta Social Europea, la Encuesta Mundial de Valores y el ISSP
      </p>

      <div className="torch" style={{ opacity: lit ? 0 : 1 }} />
    </div>
  )
}

/* Sintetizador WebAudio estilo "interfaz IA" (método BCN Tycoon): cristal FM, colchones con reverb, aire filtrado. */
let ctx: AudioContext | null = null, dry: GainNode | null = null, wet: GainNode | null = null
let noiseBuf: AudioBuffer | null = null, muted = false, stale = false
export function setMuted(m: boolean) { muted = m }
export function isMuted() { return muted }

function makeImpulse(c: AudioContext, seconds = 2.2, decay = 3.2) {
  const len = Math.floor(c.sampleRate * seconds), buf = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay) }
  return buf
}
function audio() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; if (!AC) return null
    ctx = new AC()
    const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 9000
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 3
    const out = ctx.createGain(); out.gain.value = 0.9
    tone.connect(comp).connect(out).connect(ctx.destination)
    dry = ctx.createGain(); dry.gain.value = 0.8; dry.connect(tone)
    const verb = ctx.createConvolver(); verb.buffer = makeImpulse(ctx)
    const verbOut = ctx.createGain(); verbOut.gain.value = 0.32
    wet = ctx.createGain(); wet.connect(verb).connect(verbOut).connect(tone)
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  return ctx
}
function reset() { const o = ctx; ctx = dry = wet = null; stale = false; if (o) void o.close().catch(() => {}) }
function unlock() {
  if (ctx && (stale || ctx.state === 'closed' || (ctx.state as string) === 'interrupted')) reset()
  const c = audio(); if (!c) return
  const s = (navigator as unknown as { audioSession?: { type: string } }).audioSession; if (s && s.type !== 'playback') try { s.type = 'playback' } catch { /* */ }
  if (c.state !== 'running') void c.resume()
  const src = c.createBufferSource(); src.buffer = c.createBuffer(1, 1, c.sampleRate); src.connect(c.destination); src.start(0)
}
if (typeof window !== 'undefined') {
  for (const ev of ['pointerdown', 'touchend', 'click', 'keydown']) window.addEventListener(ev, unlock, { capture: true, passive: true })
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') stale = true })
  window.addEventListener('pagehide', () => { stale = true })
}
function ready() {
  if (muted) return null
  const c = audio(); if (!c || !dry || !wet) return null
  if (c.state !== 'running') { void c.resume(); return null }
  return c
}
function route(c: AudioContext, node: AudioNode, reverb: number) {
  const d = c.createGain(); const w = c.createGain(); w.gain.value = reverb
  node.connect(d).connect(dry!); node.connect(w).connect(wet!)
}
function env(g: GainNode, start: number, attack: number, dur: number, vol: number) {
  g.gain.setValueAtTime(0.0001, start); g.gain.exponentialRampToValueAtTime(vol, start + attack); g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
}
function soft(c: AudioContext, o: { f: number; to?: number; t?: number; dur: number; vol?: number; attack?: number; reverb?: number; type?: OscillatorType }) {
  const start = c.currentTime + (o.t ?? 0), osc = c.createOscillator(), g = c.createGain()
  osc.type = o.type ?? 'sine'; osc.frequency.setValueAtTime(o.f, start)
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, start + o.dur * 0.9)
  env(g, start, o.attack ?? 0.008, o.dur, o.vol ?? 0.12); osc.connect(g); route(c, g, o.reverb ?? 0.35)
  osc.start(start); osc.stop(start + o.dur + 0.05)
}
function glass(c: AudioContext, o: { f: number; t?: number; dur?: number; vol?: number; reverb?: number; ratio?: number; index?: number }) {
  const start = c.currentTime + (o.t ?? 0), dur = o.dur ?? 1.1
  const car = c.createOscillator(), mod = c.createOscillator(), mg = c.createGain(), g = c.createGain()
  car.frequency.value = o.f; mod.frequency.value = o.f * (o.ratio ?? 3.5)
  const idx = o.f * (o.index ?? 1.4); mg.gain.setValueAtTime(idx, start); mg.gain.exponentialRampToValueAtTime(idx * 0.02, start + dur * 0.5)
  mod.connect(mg).connect(car.frequency); env(g, start, 0.004, dur, o.vol ?? 0.07); car.connect(g); route(c, g, o.reverb ?? 0.6)
  car.start(start); mod.start(start); car.stop(start + dur + 0.05); mod.stop(start + dur + 0.05)
}
function pad(c: AudioContext, freqs: number[], o: { t?: number; dur: number; vol?: number; attack?: number; reverb?: number }) {
  for (const f of freqs) for (const det of [-6, 6]) {
    const start = c.currentTime + (o.t ?? 0), osc = c.createOscillator(), g = c.createGain()
    osc.frequency.value = f; osc.detune.value = det
    env(g, start, o.attack ?? 0.12, o.dur, (o.vol ?? 0.05) / freqs.length); osc.connect(g); route(c, g, o.reverb ?? 0.8)
    osc.start(start); osc.stop(start + o.dur + 0.05)
  }
}
function air(c: AudioContext, o: { t?: number; dur: number; vol?: number; f: number; to?: number; q?: number; attack?: number; type?: BiquadFilterType; reverb?: number }) {
  const start = c.currentTime + (o.t ?? 0), src = c.createBufferSource(); src.buffer = noiseBuf
  const bq = c.createBiquadFilter(); bq.type = o.type ?? 'bandpass'; bq.Q.value = o.q ?? 0.9
  bq.frequency.setValueAtTime(o.f, start); if (o.to) bq.frequency.exponentialRampToValueAtTime(o.to, start + o.dur)
  const g = c.createGain(); env(g, start, o.attack ?? o.dur * 0.4, o.dur, o.vol ?? 0.05)
  src.connect(bq).connect(g); route(c, g, o.reverb ?? 0.4); src.start(start, Math.random()); src.stop(start + o.dur + 0.05)
}
function tick(c: AudioContext, o: { t?: number; f?: number; vol?: number }) {
  const start = c.currentTime + (o.t ?? 0), osc = c.createOscillator(), g = c.createGain()
  osc.frequency.value = o.f ?? 1900; env(g, start, 0.001, 0.035, o.vol ?? 0.05); osc.connect(g); route(c, g, 0.1)
  osc.start(start); osc.stop(start + 0.05)
}
const PENTA = [62, 64, 66, 69, 71]
const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12)
const penta = (s: number, oct = 0) => hz(PENTA[((s % 5) + 5) % 5] + 12 * (oct + Math.floor(s / 5)))

let combo = 0
let charge: { osc: OscillatorNode; g: GainNode } | null = null

export const sfx = {
  tap() { const c = ready(); if (!c) return; tick(c, { f: 2100, vol: .04 }); glass(c, { f: penta(2, 2), dur: .4, vol: .025 }) },
  bubble(level: number) { const c = ready(); if (!c) return; soft(c, { f: 220 + level * 90, to: 520 + level * 160, dur: .16, vol: .12, reverb: .3 }); glass(c, { t: .05, f: penta(level * 2, 2), dur: .8, vol: .04 }) },
  whoosh() { const c = ready(); if (!c) return; air(c, { dur: .42, vol: .05, f: 400, to: 4200, q: .7 }); glass(c, { t: .18, f: penta(4, 2), dur: 1, vol: .03 }) },
  cardIn() { const c = ready(); if (!c) return; air(c, { dur: .3, vol: .035, f: 900, to: 3800, q: .8 }); soft(c, { t: .22, f: 240, to: 160, dur: .14, vol: .07, reverb: .2 }) },
  chargeStart() {
    const c = ready(); if (!c) return
    const osc = c.createOscillator(), g = c.createGain(); osc.type = 'triangle'
    osc.frequency.setValueAtTime(penta(0, 1), c.currentTime); osc.frequency.exponentialRampToValueAtTime(penta(0, 3), c.currentTime + .75)
    g.gain.setValueAtTime(.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(.05, c.currentTime + .4)
    osc.connect(g); route(c, g, .5); osc.start(); charge = { osc, g }
  },
  chargeStop() { const c = ctx; if (!c || !charge) return; const { osc, g } = charge; charge = null; g.gain.cancelScheduledValues(c.currentTime); g.gain.setTargetAtTime(.0001, c.currentTime, .03); osc.stop(c.currentTime + .2) },
  pick(strong: boolean) {
    const c = ready(); if (!c) return; combo++
    const base = combo % 5
    glass(c, { f: penta(base, 2), dur: 1.1, vol: .06 }); glass(c, { t: .08, f: penta(base + 2, 2), dur: 1.2, vol: .05 })
    if (strong) { pad(c, [penta(0, 1), penta(2, 1), penta(4, 1)], { dur: 1.3, vol: .09 }); soft(c, { f: 90, to: 45, dur: .4, vol: .25, reverb: .3 }); [0, 2, 4, 5].forEach((s, i) => glass(c, { t: .1 + i * .06, f: penta(s, 3), dur: 1, vol: .03 })) }
  },
  shatter() { const c = ready(); if (!c) return; air(c, { dur: .5, vol: .06, f: 5000, to: 900, q: 1.4, attack: .005 }); for (let i = 0; i < 7; i++) tick(c, { t: .02 + i * .04 + Math.random() * .03, f: 2500 + Math.random() * 3000, vol: .025 }) },
  none() { const c = ready(); if (!c) return; combo = 0; soft(c, { f: penta(3, 1), dur: .3, vol: .08, reverb: .4 }); soft(c, { t: .14, f: penta(1, 1), to: penta(0, 1), dur: .45, vol: .08, reverb: .4 }); air(c, { dur: .5, vol: .04, f: 1800, to: 300 }) },
  build() { const c = ready(); if (!c) return; soft(c, { f: 300, to: 900, dur: .12, vol: .07, reverb: .3 }); soft(c, { t: .1, f: 420, to: 1100, dur: .12, vol: .06, reverb: .3 }); glass(c, { t: .2, f: penta(4, 2), dur: .9, vol: .035 }) },
  streak(n: number) { const c = ready(); if (!c) return; for (let i = 0; i < Math.min(n, 6); i++) glass(c, { t: i * .055, f: penta(i + 2, 2), dur: .9, vol: .04 }) },
  flip(i: number) { const c = ready(); if (!c) return; air(c, { dur: .22, vol: .04, f: 1200, to: 5000, q: .6 }); glass(c, { t: .12, f: penta(i, 2), dur: .9, vol: .045 }) },
  drum() { const c = ready(); if (!c) return; for (let i = 0; i < 14; i++) soft(c, { t: i * .09, f: 110, to: 70, dur: .1, vol: .05 + i * .006, reverb: .2 }) },
  fanfare() { const c = ready(); if (!c) return; pad(c, [penta(0, 0), penta(3, 0), penta(0, 1), penta(2, 1)], { dur: 2, vol: .1, attack: .15 }); [0, 1, 2, 3, 4, 5, 7].forEach((s, i) => glass(c, { t: i * .06, f: penta(s, 2), dur: 1.4, vol: .045 })); air(c, { t: .3, dur: 1, vol: .025, f: 6000, to: 12000, q: 1.5 }) },
  deny() { const c = ready(); if (!c) return; soft(c, { f: 170, to: 120, dur: .12, vol: .12, reverb: .05 }) },
  resetCombo() { combo = 0 },
  yes() { const c = ready(); if (!c) return; air(c, { dur: .3, vol: .04, f: 800, to: 4000, q: .7 }); glass(c, { t: .05, f: penta(2, 2), dur: .9, vol: .055 }); glass(c, { t: .13, f: penta(4, 2), dur: 1, vol: .05 }) },
  no() { const c = ready(); if (!c) return; air(c, { dur: .3, vol: .04, f: 3000, to: 500, q: .7 }); soft(c, { f: penta(2, 1), to: penta(0, 1), dur: .3, vol: .08, reverb: .3 }) },
  coin(n: number) { const c = ready(); if (!c) return; glass(c, { f: penta(n, 2), dur: .9, vol: .055, ratio: 2.7 }); tick(c, { t: .02, f: 3200, vol: .03 }) },
  coinBack() { const c = ready(); if (!c) return; soft(c, { f: penta(3, 1), to: penta(0, 1), dur: .2, vol: .07, reverb: .2, type: 'triangle' }) },
  drop() { const c = ready(); if (!c) return; soft(c, { f: 240, to: 150, dur: .16, vol: .12, reverb: .25 }); glass(c, { t: .03, f: penta(1, 2), dur: .6, vol: .035 }) },
  slide(v: number) { const c = ready(); if (!c) return; tick(c, { f: 1200 + v * 18, vol: .035 }); soft(c, { f: penta(Math.round(v / 20), 1), dur: .08, vol: .02, reverb: .1 }) },
  stamp(ok: boolean) { const c = ready(); if (!c) return; soft(c, { f: 120, to: 55, dur: .22, vol: .3, reverb: .25 }); air(c, { dur: .18, vol: .06, f: 1800, to: 400, q: .5, attack: .003 }); tick(c, { f: 900, vol: .06 })
             if (ok) { glass(c, { t: .12, f: penta(0, 2), dur: 1, vol: .05 }); glass(c, { t: .2, f: penta(4, 2), dur: 1.1, vol: .045 }) } else soft(c, { t: .1, f: penta(1, 1), to: penta(0, 0), dur: .4, vol: .07, reverb: .4 }) },
  bell() { const c = ready(); if (!c) return; [0, .22].forEach((t) => { glass(c, { t, f: 1318, dur: 1.4, vol: .05, ratio: 2.4, index: 1.1 }); glass(c, { t: t + .01, f: 1975, dur: 1, vol: .025, ratio: 3.1 }) }) },
  intro() { const c = ready(); if (!c) return; air(c, { dur: .5, vol: .05, f: 300, to: 5000, q: .6 }); pad(c, [penta(0, 1), penta(2, 1), penta(4, 1)], { t: .1, dur: 1, vol: .06, attack: .05 }); glass(c, { t: .25, f: penta(5, 2), dur: 1, vol: .04 }) },
}

export function haptic(ms: number | number[]) { try { navigator.vibrate?.(ms) } catch { /* */ } }

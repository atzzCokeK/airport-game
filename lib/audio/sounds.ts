let ctx: AudioContext | null = null

function getCtx() {
  if (!ctx) {
    ctx = new AudioContext()
  }
  if (ctx.state === 'suspended') {
    ctx.resume()
  }
  return ctx
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainVal = 0.3,
  freqEnd?: number
) {
  try {
    const ac = getCtx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)

    osc.type = type
    osc.frequency.setValueAtTime(freq, ac.currentTime)
    if (freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, ac.currentTime + duration)
    }

    gain.gain.setValueAtTime(gainVal, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration)

    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + duration)
  } catch {
    // audio not available
  }
}

function chord(freqs: number[], duration: number, gainVal = 0.15) {
  freqs.forEach((f) => playTone(f, duration, 'sine', gainVal))
}

export const sounds = {
  unlock() {
    try {
      const ac = getCtx()
      const buf = ac.createBuffer(1, 1, 22050)
      const src = ac.createBufferSource()
      src.buffer = buf
      src.connect(ac.destination)
      src.start()
    } catch {}
  },

  click() {
    playTone(800, 0.06, 'square', 0.15)
  },

  landing() {
    playTone(440, 0.08, 'sine', 0.25, 300)
    setTimeout(() => playTone(300, 0.3, 'sine', 0.2), 80)
  },

  takeoff() {
    playTone(300, 0.08, 'sine', 0.2, 600)
    setTimeout(() => playTone(600, 0.4, 'sine', 0.2), 80)
  },

  success() {
    chord([523, 659, 784], 0.12, 0.18)
    setTimeout(() => chord([659, 784, 988], 0.15, 0.18), 150)
    setTimeout(() => chord([784, 988, 1175], 0.5, 0.2), 320)
  },

  fuelWarning() {
    playTone(880, 0.08, 'square', 0.1)
    setTimeout(() => playTone(880, 0.08, 'square', 0.1), 200)
  },

  miss() {
    playTone(300, 0.06, 'sawtooth', 0.12, 200)
    setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.1), 80)
  },
}

let bgmInterval: ReturnType<typeof setInterval> | null = null
let bgmStep = 0

const bgmNotes = [261, 329, 392, 329, 261, 220, 261, 329]

export function startBgm() {
  if (bgmInterval) return
  bgmInterval = setInterval(() => {
    playTone(bgmNotes[bgmStep % bgmNotes.length], 0.4, 'sine', 0.06)
    bgmStep++
  }, 500)
}

export function stopBgm() {
  if (bgmInterval) {
    clearInterval(bgmInterval)
    bgmInterval = null
  }
}

export function isBgmPlaying() {
  return bgmInterval !== null
}

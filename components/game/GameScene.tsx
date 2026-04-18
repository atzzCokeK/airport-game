'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/lib/game/store'
import { PlaneSprite } from './PlaneSprite'
import { Sky } from './Sky'
import { Hud } from './Hud'
import { ClearOverlay } from './ClearOverlay'
import { SignalButton } from './SignalButton'
import { sounds, startBgm, stopBgm } from '@/lib/audio/sounds'
import { saveProgress } from '@/lib/storage'
import type { PlaneData, PlaneState } from '@/lib/game/types'

const GAME_W = 390
const GAME_H = 720
// Gate is at right end of runway so departure uses the runway
const GATE_X = 332

interface RunwayLayout { id: string; y: number; h: number }
interface GameLayout {
  skyBottom: number
  runways: RunwayLayout[]
  buttonY: number
  approachY: Record<string, number>
}

const LAYOUTS: Record<number, GameLayout> = {
  1: {
    skyBottom: 305,
    runways: [{ id: 'r0', y: 368, h: 60 }],
    buttonY: 548,
    approachY: { r0: 255 },
  },
  2: {
    skyBottom: 258,
    runways: [
      { id: 'r0', y: 300, h: 55 },
      { id: 'r1', y: 395, h: 55 },
    ],
    buttonY: 510,
    approachY: { r0: 175, r1: 232 },
  },
}

function getLayout(n: number): GameLayout {
  return LAYOUTS[n] ?? LAYOUTS[2]
}

// All plane lifecycle positions are expressed as canvas pixel coords.
// Gate is on the runway (right end) so the takeoff animation uses the runway strip.
function getPlanePos(plane: PlaneData, ruY: number, approachY: number) {
  const holdX = plane.fromLeft ? 65 : 320
  switch (plane.state) {
    case 'incoming':    return { x: plane.fromLeft ? -72 : 462, y: approachY - 30 }
    case 'approaching': return { x: holdX, y: approachY }
    case 'landing':     return { x: 180, y: ruY }
    case 'taxiing':     return { x: GATE_X, y: ruY }
    case 'atGate':      return { x: GATE_X, y: ruY }   // still on runway
    case 'departing':   return { x: 462, y: ruY - 18 } // lifts off right end
    // fuel > 0 → left naturally (gate timeout or after departure anim)
    // fuel ≤ 0 → missed/crashed → back the way it came
    case 'leaving':
      return plane.fuel > 0
        ? { x: 462, y: ruY - 18 }
        : { x: plane.fromLeft ? -72 : 462, y: approachY - 30 }
    default: return { x: 180, y: ruY }
  }
}

function getPlaneFacing(plane: PlaneData): 'left' | 'right' {
  if (plane.state === 'departing' || (plane.state === 'leaving' && plane.fuel > 0)) {
    return 'right' // taking off to the right
  }
  return plane.fromLeft ? 'right' : 'left'
}

function getTransition(state: PlaneState): object {
  switch (state) {
    case 'incoming':    return { duration: 1.5, ease: [0.2, 0, 0.8, 1] }
    case 'approaching': return { duration: 0.9, ease: 'easeOut' }
    case 'landing':     return { duration: 2.0, ease: [0.4, 0, 0.2, 1] }
    case 'taxiing':     return { duration: 1.4, ease: 'linear' }
    case 'atGate':      return { duration: 0.2 }
    case 'departing':   return { duration: 2.2, ease: [0.4, 0, 0.8, 0.6] }
    case 'leaving':     return { duration: 1.3, ease: 'easeIn' }
    default:            return { duration: 0.5 }
  }
}

interface PopEffect { id: number; x: number; y: number; type: 'miss' | 'crash' }

interface Props { initialStage: number; muted: boolean; onTitle: () => void }

export function GameScene({ initialStage, muted, onTitle }: Props) {
  const store = useGameStore()
  const { phase, stage, config, planes, signals, cleared, misses } = store

  const [scale, setScale] = useState(1)
  const prevPlanesRef = useRef<PlaneData[]>([])
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showTutorial, setShowTutorial] = useState(true)
  const fuelWarnedRef = useRef<Set<string>>(new Set())
  const [popEffects, setPopEffects] = useState<PopEffect[]>([])
  const popIdRef = useRef(0)
  const layout = getLayout(config.runways.length)

  const addPop = (x: number, y: number, type: 'miss' | 'crash') => {
    const id = ++popIdRef.current
    setPopEffects((p) => [...p, { id, x, y, type }])
    setTimeout(() => setPopEffects((p) => p.filter((e) => e.id !== id)), 1300)
  }

  useEffect(() => {
    const update = () => setScale(Math.min(window.innerWidth / GAME_W, window.innerHeight / GAME_H))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    store.startStage(initialStage)
  }, [initialStage]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== 'playing') { if (tickRef.current) clearInterval(tickRef.current); return }
    tickRef.current = setInterval(() => store.tick(Date.now()), 100)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const prev = prevPlanesRef.current
    planes.forEach((p) => {
      const pp = prev.find((x) => x.id === p.id)
      if (!pp) return
      if (pp.state === p.state) {
        if (!muted && p.state === 'approaching' && p.fuel < 0.3 && !fuelWarnedRef.current.has(p.id)) {
          fuelWarnedRef.current.add(p.id)
          sounds.fuelWarning()
        }
        return
      }
      if (p.state === 'landing' && !muted) sounds.landing()
      if (p.state === 'departing' && !muted) sounds.takeoff()
      if (p.state === 'leaving' && pp.state === 'approaching') {
        if (!muted) sounds.miss()
        const ru = layout.runways.find((r) => r.id === p.runwayId)
        const ay = layout.approachY[p.runwayId] ?? 200
        const pos = getPlanePos({ ...p, state: 'approaching' }, ru?.y ?? 368, ay)
        addPop(pos.x, pos.y, p.fuel < 0 ? 'crash' : 'miss')
      }
      if (p.state === 'atGate') fuelWarnedRef.current.delete(p.id)
    })
    prevPlanesRef.current = [...planes]
  }, [planes, muted, layout]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === 'clear') { if (!muted) sounds.success(); saveProgress(stage) }
  }, [phase, stage, muted])

  useEffect(() => {
    if (stage !== 1 || cleared > 0) setShowTutorial(false)
  }, [stage, cleared])

  useEffect(() => {
    if (phase === 'playing' && !muted) startBgm(); else stopBgm()
    return () => stopBgm()
  }, [phase, muted])

  const handleToggleSignal = (runwayId: string) => {
    if (!muted) sounds.click()
    store.toggleSignal(runwayId)
  }

  // Runways that currently have a plane on them (landing / taxiing / departing)
  const busyRunways = new Set(
    planes
      .filter((p) => p.state === 'landing' || p.state === 'taxiing' || p.state === 'departing')
      .map((p) => p.runwayId)
  )
  // Runways where a plane is waiting in approach with red signal
  const waitingRunways = new Set(
    planes
      .filter((p) => p.state === 'approaching' && (signals[p.runwayId] ?? 'red') === 'red')
      .map((p) => p.runwayId)
  )
  // Planes needing the guide arrow
  const guidedPlanes = planes.filter(
    (p) => p.state === 'approaching' && (signals[p.runwayId] ?? 'red') === 'red'
  )

  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#1F2430', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ width: GAME_W, height: GAME_H, position: 'relative', transform: `scale(${scale})`, transformOrigin: 'center center', background: '#F4EADA', overflow: 'hidden' }}>

        <Hud stage={stage} cleared={cleared} target={config.target} misses={misses} allowedMisses={config.allowedMisses} />

        {/* Sky */}
        <div style={{ position: 'absolute', top: 52, left: 0, right: 0, height: layout.skyBottom - 52, overflow: 'hidden' }}>
          <Sky height={layout.skyBottom - 52} />
        </div>

        {/* Ground */}
        <div style={{ position: 'absolute', top: layout.skyBottom, left: 0, right: 0, bottom: 0, background: '#7FB069', borderTop: '2.5px solid #1F2430' }} />

        {/* Runways */}
        {layout.runways.map((ru) => {
          const busy = busyRunways.has(ru.id)
          return (
            <div key={ru.id} style={{ position: 'absolute', top: ru.y - ru.h / 2, left: 14, right: 14, height: ru.h, background: busy ? '#3A2800' : '#2E2E2E', border: '2.5px solid #1F2430', boxShadow: '3px 3px 0 #1F2430', transition: 'background 0.3s' }}>
              {/* Busy indicator stripe */}
              {busy && (
                <div style={{ position: 'absolute', inset: 0, border: '3px solid #F2B544', opacity: 0.7, pointerEvents: 'none' }} />
              )}
              <svg width="100%" height={ru.h} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <rect key={i} x={i * 38 + 10} y={ru.h / 2 - 2} width={i % 3 === 1 ? 20 : 14} height={4} fill="white" opacity={0.65} rx={1} />
                ))}
                {/* Gate marker at right end */}
                <rect x={GATE_X - 14} y={4} width={28} height={ru.h - 8} fill="#F2B544" opacity={0.18} rx={2} />
                <text x={GATE_X} y={ru.h / 2 + 4} textAnchor="middle" fill="#F2B544" fontSize={9} fontWeight={900} opacity={0.8} fontFamily="sans-serif">GATE</text>
              </svg>
              {[0, 1].map((side) => (
                <div key={side} style={{ position: 'absolute', [side === 0 ? 'left' : 'right']: 0, top: 0, bottom: 0, width: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', padding: '4px 2px' }}>
                  {[...Array(3)].map((_, i) => <div key={i} style={{ height: 6, background: 'white', opacity: 0.6, borderRadius: 1 }} />)}
                </div>
              ))}
            </div>
          )
        })}

        {/* Guide arrows: dotted path from approaching plane → runway → button */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 4 }}>
          {guidedPlanes.map((plane) => {
            const ru = layout.runways.find((r) => r.id === plane.runwayId)
            const ay = layout.approachY[plane.runwayId] ?? 200
            const sx = plane.fromLeft ? 65 : 320
            const sy = ay
            const ex = 180
            const ey = ru?.y ?? 368
            const btnX = config.runways.length === 1 ? 195 : (plane.runwayId === 'r0' ? 110 : 280)
            const btnY = layout.buttonY + 52

            return (
              <g key={plane.id}>
                <path d={`M ${sx} ${sy} Q ${(sx + ex) / 2} ${sy + (ey - sy) * 0.6} ${ex} ${ey}`}
                  fill="none" stroke="#F2B544" strokeWidth={2.5} strokeDasharray="9 6" opacity={0.8} strokeLinecap="round" />
                <polygon points={`${ex},${ey} ${ex - 7},${ey - 13} ${ex + 7},${ey - 13}`} fill="#F2B544" opacity={0.9} />
                <line x1={btnX} y1={ey + 16} x2={btnX} y2={btnY - 14}
                  stroke="#F2B544" strokeWidth={2.5} strokeDasharray="7 5" opacity={0.65} strokeLinecap="round" />
                <polygon points={`${btnX},${btnY - 10} ${btnX - 6},${btnY - 22} ${btnX + 6},${btnY - 22}`} fill="#F2B544" opacity={0.75} />
              </g>
            )
          })}
        </svg>

        {/* Planes */}
        {planes.map((plane) => {
          const ru = layout.runways.find((r) => r.id === plane.runwayId)
          const ay = layout.approachY[plane.runwayId] ?? 200
          const pos = getPlanePos(plane, ru?.y ?? 368, ay)
          const W = plane.size === 'large' ? 80 : 60
          const H = plane.size === 'large' ? 48 : 36
          const isWaiting = plane.state === 'approaching' && (signals[plane.runwayId] ?? 'red') === 'red'

          return (
            <motion.div key={plane.id} style={{ position: 'absolute', left: 0, top: 0, zIndex: 5 }} animate={{ x: pos.x - W / 2, y: pos.y - H / 2 }} transition={getTransition(plane.state)}>
              <motion.div
                animate={plane.state === 'approaching' ? { y: [0, -9, 0] } : { y: 0 }}
                transition={plane.state === 'approaching' ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : {}}
              >
                {/* Speech bubble */}
                {isWaiting && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: 'absolute', top: -34, left: '50%', transform: 'translateX(-50%)', background: '#F2B544', border: '2.5px solid #1F2430', boxShadow: '2px 2px 0 #1F2430', padding: '2px 8px', fontSize: 11, fontWeight: 900, whiteSpace: 'nowrap', zIndex: 10 }}>
                    LAND ME!
                  </motion.div>
                )}

                <PlaneSprite color={plane.color} face={plane.face} size={plane.size} fuel={plane.fuel} facing={getPlaneFacing(plane)} />

                {/* Fuel bar */}
                {plane.state === 'approaching' && (
                  <div style={{ position: 'absolute', bottom: -12, left: 4, right: 4, height: 6, background: '#1F2430', borderRadius: 2, overflow: 'hidden', border: '1.5px solid #1F2430' }}>
                    <motion.div style={{ height: '100%', background: plane.fuel < 0.3 ? '#E0644B' : '#2F6E6A' }} animate={{ width: `${Math.max(0, plane.fuel) * 100}%` }} transition={{ duration: 0.15 }} />
                  </div>
                )}
              </motion.div>
            </motion.div>
          )
        })}

        {/* MISS / CRASH pop effects */}
        <AnimatePresence>
          {popEffects.map((e) => (
            <motion.div key={e.id}
              initial={{ scale: 0.3, opacity: 1, x: e.x - 44, y: e.y - 18 }}
              animate={{ scale: 1.4, opacity: 0, y: e.y - 90 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              style={{ position: 'absolute', left: 0, top: 0, width: 88, background: e.type === 'crash' ? '#E0644B' : '#3A3A3A', border: '3px solid #1F2430', boxShadow: '3px 3px 0 #1F2430', color: '#F4EADA', fontWeight: 900, fontSize: e.type === 'crash' ? 16 : 14, letterSpacing: '-0.02em', textAlign: 'center', padding: '4px 0', zIndex: 20, pointerEvents: 'none' }}
            >
              {e.type === 'crash' ? 'CRASH!' : 'MISS!'}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Signal Buttons */}
        <div style={{ position: 'absolute', top: layout.buttonY, left: 0, right: 0, display: 'flex', justifyContent: config.runways.length === 1 ? 'center' : 'space-evenly', alignItems: 'flex-start', padding: '0 24px' }}>
          {config.runways.map((ru) => (
            <SignalButton key={ru.id} color={signals[ru.id] ?? 'red'} onToggle={() => handleToggleSignal(ru.id)}
              label={config.runways.length > 1 ? ['A', 'B'][ru.index] : undefined}
              hasWaiting={waitingRunways.has(ru.id)}
            />
          ))}
        </div>

        {/* Tutorial */}
        {showTutorial && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: [0, 1, 1, 0], y: [6, 0, 0, -4] }}
            transition={{ delay: 2.5, duration: 3, times: [0, 0.2, 0.8, 1], repeat: Infinity, repeatDelay: 2 }}
            style={{ position: 'absolute', top: layout.buttonY - 72, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}
          >
            <div style={{ background: '#F2B544', border: '2.5px solid #1F2430', boxShadow: '3px 3px 0 #1F2430', padding: '8px 20px', fontSize: 18, fontWeight: 900, color: '#1F2430' }}>
              ↓ TAP TO LAND!
            </div>
          </motion.div>
        )}

        {/* Clear overlay */}
        <ClearOverlay stage={stage} visible={phase === 'clear'} onNext={() => store.startStage(stage + 1)} onTitle={onTitle} />

        {/* Fail overlay */}
        <AnimatePresence>
          {phase === 'fail' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(244,234,218,0.94)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
            >
              <div style={{ fontSize: 52, fontWeight: 900, color: '#E0644B', letterSpacing: '-0.04em', lineHeight: 1.1, textAlign: 'center' }}>
                TOO MANY<br />MISSES!
              </div>
              <div style={{ fontSize: 18, color: '#1F2430', fontWeight: 700, marginTop: 10, marginBottom: 44 }}>
                Try again — you can do it!
              </div>
              <button onClick={() => store.startStage(stage)} style={{ background: '#E0644B', color: '#F4EADA', border: '3px solid #1F2430', boxShadow: '4px 4px 0 #1F2430', padding: '14px 36px', fontSize: 22, fontWeight: 900, cursor: 'pointer', letterSpacing: '-0.02em', touchAction: 'manipulation' }}>
                RETRY
              </button>
              <button onClick={onTitle} style={{ marginTop: 18, background: 'transparent', border: 'none', color: '#1F2430', fontSize: 15, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', touchAction: 'manipulation' }}>
                Back to title
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

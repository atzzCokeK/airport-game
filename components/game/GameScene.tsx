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

interface RunwayLayout {
  id: string
  y: number
  h: number
}

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
    approachY: { r0: 260 },
  },
  2: {
    skyBottom: 258,
    runways: [
      { id: 'r0', y: 300, h: 55 },
      { id: 'r1', y: 395, h: 55 },
    ],
    buttonY: 510,
    approachY: { r0: 178, r1: 234 },
  },
}

function getLayout(runwayCount: number): GameLayout {
  return LAYOUTS[runwayCount] ?? LAYOUTS[2]
}

function getPlanePos(
  plane: PlaneData,
  ruY: number,
  approachY: number
): { x: number; y: number } {
  const holdX = plane.fromLeft ? 68 : 322
  const GATE_X = 308
  switch (plane.state) {
    case 'incoming':
      return { x: plane.fromLeft ? -70 : 460, y: approachY - 32 }
    case 'approaching':
      return { x: holdX, y: approachY }
    case 'landing':
      return { x: 195, y: ruY }
    case 'taxiing':
      return { x: GATE_X, y: ruY }
    case 'atGate':
      return { x: GATE_X, y: ruY + 50 }
    case 'departing':
      return { x: plane.fromLeft ? -70 : 460, y: ruY }
    case 'leaving':
      return { x: plane.fromLeft ? -70 : 460, y: approachY - 32 }
    default:
      return { x: 195, y: ruY }
  }
}

function getTransition(state: PlaneState): object {
  switch (state) {
    case 'incoming':
      return { duration: 1.5, ease: [0.2, 0, 0.8, 1] }
    case 'approaching':
      return { duration: 0.9, ease: 'easeOut' }
    case 'landing':
      return { duration: 1.9, ease: [0.4, 0, 0.2, 1] }
    case 'taxiing':
      return { duration: 1.3, ease: 'linear' }
    case 'atGate':
      return { duration: 0.35, ease: 'easeOut' }
    case 'departing':
      return { duration: 1.9, ease: [0.6, 0, 1, 0.4] }
    case 'leaving':
      return { duration: 1.3, ease: 'easeIn' }
    default:
      return { duration: 0.5 }
  }
}

interface Props {
  initialStage: number
  muted: boolean
  onTitle: () => void
}

export function GameScene({ initialStage, muted, onTitle }: Props) {
  const store = useGameStore()
  const { phase, stage, config, planes, signals, cleared, misses } = store

  const [scale, setScale] = useState(1)
  const prevPlanesRef = useRef<PlaneData[]>([])
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showTutorial, setShowTutorial] = useState(true)
  const fuelWarnedRef = useRef<Set<string>>(new Set())

  const layout = getLayout(config.runways.length)

  useEffect(() => {
    const update = () => {
      const s = Math.min(window.innerWidth / GAME_W, window.innerHeight / GAME_H)
      setScale(s)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    store.startStage(initialStage)
  }, [initialStage]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== 'playing') {
      if (tickRef.current) clearInterval(tickRef.current)
      return
    }
    tickRef.current = setInterval(() => store.tick(Date.now()), 100)
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sound & tutorial
  useEffect(() => {
    const prev = prevPlanesRef.current
    planes.forEach((p) => {
      const prevP = prev.find((pp) => pp.id === p.id)
      if (!prevP) return
      if (prevP.state === p.state) {
        if (!muted && p.state === 'approaching' && p.fuel < 0.3 && !fuelWarnedRef.current.has(p.id)) {
          fuelWarnedRef.current.add(p.id)
          sounds.fuelWarning()
        }
        return
      }
      if (p.state === 'landing' && !muted) sounds.landing()
      if (p.state === 'departing' && !muted) sounds.takeoff()
      if (p.state === 'leaving' && prevP.state === 'approaching' && !muted) sounds.miss()
      if (p.state === 'atGate') fuelWarnedRef.current.delete(p.id)
    })
    prevPlanesRef.current = [...planes]
  }, [planes, muted])

  useEffect(() => {
    if (phase === 'clear') {
      if (!muted) sounds.success()
      saveProgress(stage)
    }
  }, [phase, stage, muted])

  useEffect(() => {
    if (stage !== 1 || cleared > 0) setShowTutorial(false)
  }, [stage, cleared])

  useEffect(() => {
    if (phase === 'playing' && !muted) startBgm()
    else stopBgm()
    return () => stopBgm()
  }, [phase, muted])

  const handleToggleSignal = (runwayId: string) => {
    if (!muted) sounds.click()
    store.toggleSignal(runwayId)
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100dvh',
        background: '#1F2430',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: GAME_W,
          height: GAME_H,
          position: 'relative',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          background: '#F4EADA',
          overflow: 'hidden',
        }}
      >
        <Hud
          stage={stage}
          cleared={cleared}
          target={config.target}
          misses={misses}
          allowedMisses={config.allowedMisses}
        />

        {/* Sky */}
        <div
          style={{
            position: 'absolute',
            top: 52,
            left: 0,
            right: 0,
            height: layout.skyBottom - 52,
            overflow: 'hidden',
          }}
        >
          <Sky height={layout.skyBottom - 52} />
        </div>

        {/* Ground */}
        <div
          style={{
            position: 'absolute',
            top: layout.skyBottom,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#7FB069',
            borderTop: '2.5px solid #1F2430',
          }}
        />

        {/* Runways */}
        {layout.runways.map((ru) => (
          <div
            key={ru.id}
            style={{
              position: 'absolute',
              top: ru.y - ru.h / 2,
              left: 14,
              right: 14,
              height: ru.h,
              background: '#2E2E2E',
              border: '2.5px solid #1F2430',
              boxShadow: '3px 3px 0 #1F2430',
            }}
          >
            <svg
              width="100%"
              height={ru.h}
              style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
            >
              {Array.from({ length: 9 }).map((_, i) => (
                <rect
                  key={i}
                  x={i * 40 + 12}
                  y={ru.h / 2 - 2}
                  width={i % 3 === 1 ? 20 : 16}
                  height={4}
                  fill="white"
                  opacity={0.65}
                  rx={1}
                />
              ))}
            </svg>
            {[0, 1].map((side) => (
              <div
                key={side}
                style={{
                  position: 'absolute',
                  [side === 0 ? 'left' : 'right']: 0,
                  top: 0,
                  bottom: 0,
                  width: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-evenly',
                  padding: '4px 2px',
                }}
              >
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    style={{ height: 6, background: 'white', opacity: 0.6, borderRadius: 1 }}
                  />
                ))}
              </div>
            ))}
          </div>
        ))}

        {/* Planes */}
        {planes.map((plane) => {
          const ru = layout.runways.find((r) => r.id === plane.runwayId)
          const approachY = layout.approachY[plane.runwayId] ?? 200
          const pos = getPlanePos(plane, ru?.y ?? 368, approachY)
          const W = plane.size === 'large' ? 80 : 60
          const H = plane.size === 'large' ? 48 : 36

          return (
            <motion.div
              key={plane.id}
              style={{ position: 'absolute', left: 0, top: 0, zIndex: 5 }}
              animate={{ x: pos.x - W / 2, y: pos.y - H / 2 }}
              transition={getTransition(plane.state)}
            >
              <PlaneSprite
                color={plane.color}
                face={plane.face}
                size={plane.size}
                fuel={plane.fuel}
                facing={
                  plane.state === 'departing' || plane.state === 'leaving'
                    ? plane.fromLeft ? 'left' : 'right'
                    : plane.fromLeft ? 'right' : 'left'
                }
              />
              {plane.state === 'approaching' && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: -9,
                    left: 4,
                    right: 4,
                    height: 5,
                    background: '#1F2430',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    style={{
                      height: '100%',
                      background: plane.fuel < 0.3 ? '#E0644B' : '#2F6E6A',
                    }}
                    animate={{ width: `${plane.fuel * 100}%` }}
                    transition={{ duration: 0.15 }}
                  />
                </div>
              )}
            </motion.div>
          )
        })}

        {/* Signal Buttons */}
        <div
          style={{
            position: 'absolute',
            top: layout.buttonY,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent:
              config.runways.length === 1 ? 'center' : 'space-evenly',
            alignItems: 'flex-start',
            padding: '0 24px',
          }}
        >
          {config.runways.map((ru) => (
            <SignalButton
              key={ru.id}
              color={signals[ru.id] ?? 'red'}
              onToggle={() => handleToggleSignal(ru.id)}
              label={config.runways.length > 1 ? ['A', 'B'][ru.index] : undefined}
            />
          ))}
        </div>

        {/* Tutorial hint */}
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            style={{
              position: 'absolute',
              top: layout.buttonY - 68,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                background: '#F2B544',
                border: '2.5px solid #1F2430',
                boxShadow: '3px 3px 0 #1F2430',
                padding: '7px 18px',
                fontSize: 17,
                fontWeight: 800,
                color: '#1F2430',
              }}
            >
              ↓ あおをおしてみよう！
            </div>
          </motion.div>
        )}

        {/* Clear overlay */}
        <ClearOverlay
          stage={stage}
          visible={phase === 'clear'}
          onNext={() => store.startStage(stage + 1)}
          onTitle={onTitle}
        />

        {/* Fail overlay */}
        <AnimatePresence>
          {phase === 'fail' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(244,234,218,0.94)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 50,
              }}
            >
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 900,
                  color: '#E0644B',
                  letterSpacing: '-0.04em',
                  lineHeight: 1.1,
                }}
              >
                おっと…
              </div>
              <div
                style={{
                  fontSize: 19,
                  color: '#1F2430',
                  fontWeight: 700,
                  marginTop: 10,
                  marginBottom: 44,
                }}
              >
                もういちど やってみよう！
              </div>
              <button
                onClick={() => store.startStage(stage)}
                style={{
                  background: '#E0644B',
                  color: '#F4EADA',
                  border: '3px solid #1F2430',
                  boxShadow: '4px 4px 0 #1F2430',
                  padding: '14px 36px',
                  fontSize: 22,
                  fontWeight: 900,
                  cursor: 'pointer',
                  letterSpacing: '-0.02em',
                  touchAction: 'manipulation',
                }}
              >
                もう一度
              </button>
              <button
                onClick={onTitle}
                style={{
                  marginTop: 18,
                  background: 'transparent',
                  border: 'none',
                  color: '#1F2430',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  touchAction: 'manipulation',
                }}
              >
                タイトルへもどる
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

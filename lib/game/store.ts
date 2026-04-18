'use client'
import { create } from 'zustand'
import type { PlaneData, PlaneState, SignalColor, StageConfig } from './types'
import { STAGES } from './stages'

const PLANE_COLORS = ['#E0644B', '#2F6E6A', '#F2B544', '#6B4FBB']

let _id = 0
const uid = () => `p${++_id}`

function randOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export interface GameStore {
  phase: 'title' | 'playing' | 'clear' | 'fail'
  stage: number
  config: StageConfig
  planes: PlaneData[]
  signals: Record<string, SignalColor>
  cleared: number
  misses: number
  lastSpawnAt: number
  clearEffect: boolean

  startStage: (stage: number) => void
  toggleSignal: (runwayId: string) => void
  tick: (now: number) => void
  setPhase: (phase: GameStore['phase']) => void
  dismissClearEffect: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'title',
  stage: 1,
  config: STAGES[0],
  planes: [],
  signals: {},
  cleared: 0,
  misses: 0,
  lastSpawnAt: 0,
  clearEffect: false,

  startStage: (stage) => {
    const config = STAGES[stage - 1]
    const signals: Record<string, SignalColor> = {}
    config.runways.forEach((r) => { signals[r.id] = 'red' })
    set({
      phase: 'playing',
      stage,
      config,
      planes: [],
      signals,
      cleared: 0,
      misses: 0,
      lastSpawnAt: 0,
      clearEffect: false,
    })
  },

  toggleSignal: (runwayId) => {
    set((s) => ({
      signals: {
        ...s.signals,
        [runwayId]: s.signals[runwayId] === 'red' ? 'green' : 'red',
      },
    }))
  },

  setPhase: (phase) => set({ phase }),
  dismissClearEffect: () => set({ clearEffect: false }),

  tick: (now) => {
    const s = get()
    if (s.phase !== 'playing') return

    const { config, planes, signals, lastSpawnAt } = s
    let cleared = s.cleared
    let misses = s.misses

    const activePlanes = planes.filter(
      (p) => p.state !== 'leaving'
    )

    let newPlanes = [...planes]

    // Spawn new plane
    if (
      now - lastSpawnAt > config.spawnInterval &&
      activePlanes.length < config.simultaneous
    ) {
      const runway = randOf(config.runways)
      const isDeparture =
        config.hasDepartures &&
        Math.random() < 0.35 &&
        activePlanes.some((p) => p.runwayId === runway.id && p.state === 'atGate')

      const plane: PlaneData = {
        id: uid(),
        runwayId: runway.id,
        state: 'incoming',
        fuel: 1,
        color: randOf(PLANE_COLORS),
        face: Math.floor(Math.random() * 3) as 0 | 1 | 2,
        size: config.hasLargeAircraft && Math.random() < 0.3 ? 'large' : 'normal',
        isDeparture,
        fromLeft: Math.random() < 0.5,
        stateStartedAt: now,
      }
      newPlanes = [...newPlanes, plane]
      set({ lastSpawnAt: now })
    }

    const INCOMING_DURATION = 1800
    const LANDING_DURATION = (size: PlaneData['size']) => (size === 'large' ? 2800 : 2000)
    const TAXIING_DURATION = (size: PlaneData['size']) => (size === 'large' ? 2000 : 1400)
    const GATE_LINGER = 6000
    const DEPARTING_DURATION = 2000
    const LEAVING_DURATION = 1600

    let didClear = false
    let didMiss = false

    newPlanes = newPlanes
      .map((plane): PlaneData => {
        const signal = signals[plane.runwayId] ?? 'red'
        const elapsed = now - plane.stateStartedAt

        switch (plane.state) {
          case 'incoming': {
            if (elapsed >= INCOMING_DURATION) {
              return { ...plane, state: 'approaching', stateStartedAt: now }
            }
            return plane
          }

          case 'approaching': {
            const fuelDrain = elapsed / config.fuelDuration
            const newFuel = Math.max(0, 1 - fuelDrain)

            if (newFuel <= 0) {
              didMiss = true
              misses++
              return { ...plane, state: 'leaving', fuel: 0, stateStartedAt: now }
            }

            const runwayOccupied = newPlanes.some(
              (p) =>
                p.id !== plane.id &&
                p.runwayId === plane.runwayId &&
                (p.state === 'landing' || p.state === 'taxiing')
            )

            if (signal === 'green' && !runwayOccupied) {
              return { ...plane, state: 'landing', fuel: newFuel, stateStartedAt: now }
            }

            return { ...plane, fuel: newFuel }
          }

          case 'landing': {
            if (elapsed >= LANDING_DURATION(plane.size)) {
              return { ...plane, state: 'taxiing', stateStartedAt: now }
            }
            return plane
          }

          case 'taxiing': {
            if (elapsed >= TAXIING_DURATION(plane.size)) {
              cleared++
              didClear = true
              return { ...plane, state: 'atGate', stateStartedAt: now }
            }
            return plane
          }

          case 'atGate': {
            if (plane.isDeparture) {
              const runwayOccupied = newPlanes.some(
                (p) =>
                  p.id !== plane.id &&
                  p.runwayId === plane.runwayId &&
                  (p.state === 'landing' || p.state === 'taxiing' || p.state === 'departing')
              )
              if (signal === 'green' && !runwayOccupied) {
                return { ...plane, state: 'departing', stateStartedAt: now }
              }
            } else if (elapsed >= GATE_LINGER) {
              return { ...plane, state: 'leaving', stateStartedAt: now }
            }
            return plane
          }

          case 'departing': {
            if (elapsed >= DEPARTING_DURATION) {
              cleared++
              didClear = true
              return { ...plane, state: 'leaving', stateStartedAt: now }
            }
            return plane
          }

          case 'leaving': {
            return plane
          }

          default:
            return plane
        }
      })
      .filter((p) => {
        if (p.state === 'leaving') {
          return now - p.stateStartedAt < LEAVING_DURATION
        }
        return true
      })

    const updates: Partial<GameStore> = {
      planes: newPlanes,
      cleared,
      misses,
    }

    if (cleared >= config.target) {
      updates.phase = 'clear'
      updates.clearEffect = true
    } else if (misses >= config.allowedMisses) {
      updates.phase = 'fail'
    }

    set(updates)
  },
}))

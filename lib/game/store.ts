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

  startStage: (stage: number) => void
  toggleSignal: (runwayId: string) => void
  tick: (now: number) => void
  setPhase: (phase: GameStore['phase']) => void
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
      // first plane arrives after ~3s
      lastSpawnAt: Date.now() - config.spawnInterval + 3200,
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

  tick: (now) => {
    const s = get()
    if (s.phase !== 'playing') return

    const { config, planes, signals, lastSpawnAt } = s
    let cleared = s.cleared
    let misses = s.misses

    const activePlanes = planes.filter((p) => p.state !== 'leaving')
    let newPlanes = [...planes]

    // Spawn
    if (now - lastSpawnAt > config.spawnInterval && activePlanes.length < config.simultaneous) {
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

    const INCOMING_MS = 1800
    const LANDING_MS = (p: PlaneData) => (p.size === 'large' ? 2800 : 2000)
    const TAXIING_MS = (p: PlaneData) => (p.size === 'large' ? 2000 : 1400)
    const GATE_LINGER_MS = 6000
    const DEPARTING_MS = 2000
    const LEAVING_MS = 1600

    // Track signals that need auto-reset to red (when landing begins)
    const autoResetSignals: Record<string, SignalColor> = {}

    newPlanes = newPlanes
      .map((plane): PlaneData => {
        const signal = signals[plane.runwayId] ?? 'red'
        const elapsed = now - plane.stateStartedAt

        // Check if any other plane is currently using this runway
        const runwayOccupied = planes.some(
          (p) =>
            p.id !== plane.id &&
            p.runwayId === plane.runwayId &&
            (p.state === 'landing' || p.state === 'taxiing' || p.state === 'departing')
        )

        switch (plane.state) {
          case 'incoming': {
            if (elapsed >= INCOMING_MS) {
              return { ...plane, state: 'approaching', stateStartedAt: now }
            }
            return plane
          }

          case 'approaching': {
            const newFuel = Math.max(0, 1 - elapsed / config.fuelDuration)

            // CRASH: signal is green but runway is occupied — collision!
            if (signal === 'green' && runwayOccupied) {
              misses += 2  // crash is a heavy penalty
              return { ...plane, state: 'leaving', fuel: -1, stateStartedAt: now }
            }

            // Fuel ran out → missed
            if (newFuel <= 0) {
              misses++
              return { ...plane, state: 'leaving', fuel: 0, stateStartedAt: now }
            }

            // Clear runway + green → start landing, auto-reset signal to red
            if (signal === 'green' && !runwayOccupied) {
              autoResetSignals[plane.runwayId] = 'red'
              return { ...plane, state: 'landing', fuel: newFuel, stateStartedAt: now }
            }

            return { ...plane, fuel: newFuel }
          }

          case 'landing': {
            if (elapsed >= LANDING_MS(plane)) {
              return { ...plane, state: 'taxiing', stateStartedAt: now }
            }
            return plane
          }

          case 'taxiing': {
            if (elapsed >= TAXIING_MS(plane)) {
              cleared++
              return { ...plane, state: 'atGate', stateStartedAt: now }
            }
            return plane
          }

          case 'atGate': {
            if (plane.isDeparture) {
              if (signal === 'green' && !runwayOccupied) {
                return { ...plane, state: 'departing', stateStartedAt: now }
              }
            } else if (elapsed >= GATE_LINGER_MS) {
              return { ...plane, state: 'leaving', stateStartedAt: now }
            }
            return plane
          }

          case 'departing': {
            if (elapsed >= DEPARTING_MS) {
              cleared++
              return { ...plane, state: 'leaving', stateStartedAt: now }
            }
            return plane
          }

          case 'leaving':
            return plane

          default:
            return plane
        }
      })
      .filter((p) => {
        if (p.state === 'leaving') return now - p.stateStartedAt < LEAVING_MS
        return true
      })

    const updatedSignals =
      Object.keys(autoResetSignals).length > 0
        ? { ...signals, ...autoResetSignals }
        : signals

    const updates: Partial<GameStore> = {
      planes: newPlanes,
      cleared,
      misses,
      signals: updatedSignals,
    }

    if (cleared >= config.target) {
      updates.phase = 'clear'
    } else if (misses >= config.allowedMisses) {
      updates.phase = 'fail'
    }

    set(updates)
  },
}))

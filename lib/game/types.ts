export type PlaneState =
  | 'incoming'
  | 'approaching'
  | 'landing'
  | 'taxiing'
  | 'atGate'
  | 'departing'
  | 'leaving'

export type SignalColor = 'red' | 'green'
export type PlaneSize = 'normal' | 'large'
export type PlaneFace = 0 | 1 | 2

export interface PlaneData {
  id: string
  runwayId: string
  state: PlaneState
  fuel: number
  color: string
  face: PlaneFace
  size: PlaneSize
  isDeparture: boolean
  fromLeft: boolean
  stateStartedAt: number
}

export interface RunwayConfig {
  id: string
  index: number
}

export interface StageConfig {
  id: number
  runways: RunwayConfig[]
  target: number
  simultaneous: number
  speed: number
  spawnInterval: number
  hasDepartures: boolean
  hasLargeAircraft: boolean
  allowedMisses: number
  fuelDuration: number
}

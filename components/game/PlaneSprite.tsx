'use client'
import type { PlaneFace, PlaneSize } from '@/lib/game/types'

const FACES: Array<{ eyes: [number, number][]; mouth: string }> = [
  {
    eyes: [
      [15, 10],
      [25, 10],
    ],
    mouth: 'M 13 16 Q 20 21 27 16',
  },
  {
    eyes: [
      [15, 10],
      [25, 10],
    ],
    mouth: 'M 13 18 Q 20 14 27 18',
  },
  {
    eyes: [
      [14, 10],
      [26, 10],
    ],
    mouth: 'M 14 17 L 26 17',
  },
]

interface Props {
  color: string
  face: PlaneFace
  size: PlaneSize
  fuel: number
  facing?: 'left' | 'right'
}

export function PlaneSprite({ color, face, size, fuel, facing = 'right' }: Props) {
  const W = size === 'large' ? 80 : 60
  const H = size === 'large' ? 48 : 36
  const faceData = FACES[face]
  const lowFuel = fuel < 0.3
  const stroke = '#1F2430'
  const strokeW = 2.5

  return (
    <svg
      width={W}
      height={H}
      viewBox="0 0 40 24"
      style={{
        overflow: 'visible',
        transform: facing === 'left' ? 'scaleX(-1)' : undefined,
        filter: `drop-shadow(3px 3px 0 ${stroke})`,
        animation: lowFuel ? 'blink 0.5s step-start infinite' : undefined,
      }}
    >
      {/* fuselage */}
      <ellipse
        cx="20"
        cy="12"
        rx="18"
        ry="7"
        fill="white"
        stroke={stroke}
        strokeWidth={strokeW}
      />
      {/* color stripe */}
      <clipPath id={`clip-${color}-${face}`}>
        <ellipse cx="20" cy="12" rx="18" ry="7" />
      </clipPath>
      <rect
        x="7"
        y="9"
        width="26"
        height="6"
        fill={color}
        clipPath={`url(#clip-${color}-${face})`}
      />
      {/* nose */}
      <ellipse
        cx="36"
        cy="12"
        rx="4"
        ry="4"
        fill={color}
        stroke={stroke}
        strokeWidth={strokeW}
      />
      {/* wings */}
      <polygon
        points="22,12 28,2 32,2 30,12"
        fill={color}
        stroke={stroke}
        strokeWidth={strokeW}
        strokeLinejoin="round"
      />
      <polygon
        points="22,12 28,22 32,22 30,12"
        fill={color}
        stroke={stroke}
        strokeWidth={strokeW}
        strokeLinejoin="round"
      />
      {/* tail */}
      <polygon
        points="4,12 2,5 8,9"
        fill={color}
        stroke={stroke}
        strokeWidth={strokeW}
        strokeLinejoin="round"
      />
      {/* windows */}
      {[18, 24, 30].map((cx) => (
        <circle
          key={cx}
          cx={cx}
          cy="10"
          r="2"
          fill="#D4EDFA"
          stroke={stroke}
          strokeWidth={1.5}
        />
      ))}
      {/* face */}
      <g style={{ transform: 'translate(0, 2)' }}>
        {faceData.eyes.map(([ex, ey], i) => (
          <circle key={i} cx={ex} cy={ey} r="1.8" fill={stroke} />
        ))}
        <path d={faceData.mouth} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
      </g>
      {/* fuel dots */}
      {lowFuel && (
        <>
          <circle cx="8" cy="3" r="2" fill="#F2B544" stroke={stroke} strokeWidth={1} />
          <circle cx="14" cy="3" r="2" fill="#F2B544" stroke={stroke} strokeWidth={1} />
        </>
      )}
    </svg>
  )
}

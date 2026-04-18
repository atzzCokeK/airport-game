'use client'
import { useEffect, useState } from 'react'

interface Cloud {
  id: number
  x: number
  y: number
  speed: number
  scale: number
}

export function Sky({ height }: { height: number }) {
  const [clouds, setClouds] = useState<Cloud[]>([
    { id: 1, x: 20, y: 15, speed: 0.008, scale: 1 },
    { id: 2, x: 65, y: 30, speed: 0.005, scale: 1.3 },
    { id: 3, x: 80, y: 10, speed: 0.007, scale: 0.8 },
    { id: 4, x: 40, y: 45, speed: 0.006, scale: 1.1 },
  ])

  useEffect(() => {
    let raf: number
    const tick = () => {
      setClouds((prev) =>
        prev.map((c) => ({
          ...c,
          x: c.x > 110 ? -20 : c.x + c.speed,
        }))
      )
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #7EC8E3 0%, #B8DCE8 60%, #D8EEF6 100%)',
        borderBottom: '2.5px solid #1F2430',
      }}
    >
      {clouds.map((c) => (
        <CloudShape key={c.id} x={c.x} y={c.y} scale={c.scale} />
      ))}
    </div>
  )
}

function CloudShape({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <svg
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: `scale(${scale})`,
        transformOrigin: 'left top',
        opacity: 0.85,
      }}
      width="80"
      height="40"
      viewBox="0 0 80 40"
    >
      <polygon
        points="0,38 8,20 18,28 26,12 38,22 50,8 62,18 72,14 80,38"
        fill="white"
        stroke="#1F2430"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

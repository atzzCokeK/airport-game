'use client'
import { motion } from 'framer-motion'
import type { SignalColor } from '@/lib/game/types'

interface Props {
  color: SignalColor
  onToggle: () => void
  label?: string
}

export function SignalButton({ color, onToggle, label }: Props) {
  const isGreen = color === 'green'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {label && (
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: '#F4EADA',
            letterSpacing: '0.04em',
            background: '#1F2430',
            padding: '2px 8px',
          }}
        >
          {label}
        </span>
      )}
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={onToggle}
        style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          background: isGreen ? '#2F6E6A' : '#E0644B',
          border: '4px solid #1F2430',
          boxShadow: isGreen
            ? '5px 5px 0 #1A4240'
            : '5px 5px 0 #8B3020',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.15s, box-shadow 0.15s',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <svg width="44" height="44" viewBox="0 0 44 44">
          {isGreen ? (
            /* plane landing arrow */
            <>
              <path
                d="M22 8 L22 36 M14 28 L22 36 L30 28"
                stroke="#F4EADA"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </>
          ) : (
            /* stop hand */
            <>
              <rect
                x="14"
                y="14"
                width="16"
                height="16"
                rx="2"
                fill="#F4EADA"
              />
              <path
                d="M22 10 L22 18 M16 14 L16 22 M28 14 L28 22"
                stroke="#F4EADA"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </>
          )}
        </svg>
      </motion.button>
      <span
        style={{
          fontSize: 14,
          fontWeight: 900,
          color: isGreen ? '#2F6E6A' : '#E0644B',
          letterSpacing: '-0.02em',
        }}
      >
        {isGreen ? 'ちゃくりく OK' : 'まちあわせ'}
      </span>
    </div>
  )
}

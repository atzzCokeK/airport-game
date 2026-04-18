'use client'
import { motion } from 'framer-motion'
import type { SignalColor } from '@/lib/game/types'

interface Props {
  color: SignalColor
  onToggle: () => void
  label?: string
  hasWaiting?: boolean
}

export function SignalButton({ color, onToggle, label, hasWaiting = false }: Props) {
  const isGreen = color === 'green'
  const showPulse = hasWaiting && !isGreen

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

      <div style={{ position: 'relative' }}>
        {/* Pulsing ring when a plane is waiting */}
        {showPulse && (
          <>
            <motion.div
              animate={{ scale: [1, 1.55], opacity: [0.6, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                inset: -6,
                borderRadius: '50%',
                border: '4px solid #F2B544',
                pointerEvents: 'none',
              }}
            />
            <motion.div
              animate={{ scale: [1, 1.3], opacity: [0.4, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeOut', delay: 0.2 }}
              style={{
                position: 'absolute',
                inset: -6,
                borderRadius: '50%',
                border: '3px solid #F2B544',
                pointerEvents: 'none',
              }}
            />
          </>
        )}

        <motion.button
          whileTap={{ scale: 0.88 }}
          animate={showPulse ? { scale: [1, 1.06, 1] } : { scale: 1 }}
          transition={showPulse ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } : {}}
          onClick={onToggle}
          style={{
            width: 104,
            height: 104,
            borderRadius: '50%',
            background: isGreen ? '#2F6E6A' : '#E0644B',
            border: '4px solid #1F2430',
            boxShadow: isGreen ? '5px 5px 0 #1A4240' : '5px 5px 0 #8B3020',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s, box-shadow 0.15s',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            position: 'relative',
          }}
        >
          <svg width="44" height="44" viewBox="0 0 44 44">
            {isGreen ? (
              <path
                d="M22 8 L22 36 M14 28 L22 36 L30 28"
                stroke="#F4EADA"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ) : (
              <path
                d="M22 10 L22 26 M22 30 L22 34"
                stroke="#F4EADA"
                strokeWidth="4"
                strokeLinecap="round"
              />
            )}
          </svg>
        </motion.button>
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 900,
          color: isGreen ? '#2F6E6A' : '#E0644B',
          letterSpacing: '0.02em',
          background: '#1F2430',
          padding: '3px 10px',
          border: isGreen ? '2px solid #2F6E6A' : '2px solid #E0644B',
        }}
      >
        {isGreen ? 'LAND' : 'HOLD'}
      </div>
    </div>
  )
}

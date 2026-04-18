'use client'
import { motion, AnimatePresence } from 'framer-motion'

interface Spark {
  id: number
  x: number
  y: number
  color: string
  size: number
  angle: number
}

const COLORS = ['#E0644B', '#F2B544', '#2F6E6A', '#6B4FBB', '#F4EADA']
const TOTAL_STAGES = 5

function makeSparkles(n = 20): Spark[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: 30 + Math.random() * 40,
    y: 20 + Math.random() * 60,
    color: COLORS[i % COLORS.length],
    size: 6 + Math.random() * 10,
    angle: Math.random() * 360,
  }))
}

interface Props {
  stage: number
  visible: boolean
  onNext: () => void
  onTitle: () => void
}

export function ClearOverlay({ stage, visible, onNext, onTitle }: Props) {
  const sparks = makeSparkles(18)
  const isLast = stage >= TOTAL_STAGES

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(244,234,218,0.92)',
            zIndex: 50,
          }}
        >
          {/* Sparkles */}
          {sparks.map((s) => (
            <motion.div
              key={s.id}
              initial={{ x: '50vw', y: '50vh', scale: 0, rotate: 0 }}
              animate={{
                x: `${s.x}vw`,
                y: `${s.y}vh`,
                scale: [0, 1.4, 0.8],
                rotate: s.angle,
              }}
              transition={{ duration: 0.6 + Math.random() * 0.4, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: s.size,
                height: s.size,
                background: s.color,
                border: '2px solid #1F2430',
              }}
            />
          ))}

          {/* Hanazeru (花丸) */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: [0, 1.2, 1], rotate: [-20, 10, 0] }}
            transition={{ duration: 0.5, ease: 'backOut' }}
            style={{ position: 'relative', zIndex: 2, marginBottom: 24 }}
          >
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="52"
                fill="#F2B544"
                stroke="#1F2430"
                strokeWidth="4"
              />
              <path
                d="M30 64 L50 82 L90 38"
                fill="none"
                stroke="#1F2430"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              fontSize: 36,
              fontWeight: 900,
              letterSpacing: '-0.04em',
              color: '#1F2430',
              margin: 0,
              position: 'relative',
              zIndex: 2,
            }}
          >
            {isLast ? 'ぜんぶ クリア！' : 'クリア！'}
          </motion.h2>

          <motion.p
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45 }}
            style={{
              fontSize: 18,
              color: '#2F6E6A',
              fontWeight: 700,
              marginTop: 8,
              position: 'relative',
              zIndex: 2,
            }}
          >
            {isLast ? 'すごい！かんぺき！' : `ステージ ${stage} をクリアしたよ`}
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ display: 'flex', gap: 16, marginTop: 40, position: 'relative', zIndex: 2 }}
          >
            {!isLast && (
              <button
                onClick={onNext}
                style={{
                  background: '#2F6E6A',
                  color: '#F4EADA',
                  border: '3px solid #1F2430',
                  boxShadow: '4px 4px 0 #1F2430',
                  padding: '14px 28px',
                  fontSize: 20,
                  fontWeight: 900,
                  cursor: 'pointer',
                  letterSpacing: '-0.02em',
                }}
              >
                つぎへ！
              </button>
            )}
            <button
              onClick={onTitle}
              style={{
                background: '#F4EADA',
                color: '#1F2430',
                border: '3px solid #1F2430',
                boxShadow: '4px 4px 0 #1F2430',
                padding: '14px 28px',
                fontSize: 18,
                fontWeight: 900,
                cursor: 'pointer',
                letterSpacing: '-0.02em',
              }}
            >
              タイトルへ
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

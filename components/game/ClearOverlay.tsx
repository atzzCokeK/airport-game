'use client'
import { motion, AnimatePresence } from 'framer-motion'

interface Spark { id: number; x: number; y: number; color: string; size: number; angle: number }
const COLORS = ['#E0644B', '#F2B544', '#2F6E6A', '#6B4FBB', '#F4EADA']
const TOTAL_STAGES = 5

function makeSparks(n = 18): Spark[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: 25 + Math.random() * 50,
    y: 15 + Math.random() * 65,
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
  const sparks = makeSparks()
  const isLast = stage >= TOTAL_STAGES

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(244,234,218,0.92)', zIndex: 50 }}
        >
          {sparks.map((s) => (
            <motion.div key={s.id}
              initial={{ x: '50vw', y: '50vh', scale: 0, rotate: 0 }}
              animate={{ x: `${s.x}vw`, y: `${s.y}vh`, scale: [0, 1.4, 0.8], rotate: s.angle }}
              transition={{ duration: 0.5 + Math.random() * 0.4, ease: 'easeOut' }}
              style={{ position: 'absolute', width: s.size, height: s.size, background: s.color, border: '2px solid #1F2430' }}
            />
          ))}

          {/* Medal */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }} animate={{ scale: [0, 1.2, 1], rotate: [-20, 8, 0] }}
            transition={{ duration: 0.5, ease: 'backOut' }}
            style={{ position: 'relative', zIndex: 2, marginBottom: 24 }}
          >
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="48" fill="#F2B544" stroke="#1F2430" strokeWidth="4" />
              <circle cx="55" cy="55" r="36" fill="none" stroke="#1F2430" strokeWidth="2" opacity="0.3" />
              <path d="M30 58 L48 76 L80 36" fill="none" stroke="#1F2430" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-0.04em', color: '#1F2430', margin: 0, position: 'relative', zIndex: 2, lineHeight: 1 }}
          >
            {isLast ? 'ALL CLEAR!' : 'CLEAR!'}
          </motion.div>

          <motion.p initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.45 }}
            style={{ fontSize: 17, color: '#2F6E6A', fontWeight: 800, marginTop: 8, position: 'relative', zIndex: 2 }}
          >
            {isLast ? 'Amazing — all stages done!' : `Stage ${stage} complete!`}
          </motion.p>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}
            style={{ display: 'flex', gap: 14, marginTop: 44, position: 'relative', zIndex: 2 }}
          >
            {!isLast && (
              <button onClick={onNext} style={{ background: '#2F6E6A', color: '#F4EADA', border: '3px solid #1F2430', boxShadow: '4px 4px 0 #1F2430', padding: '14px 28px', fontSize: 20, fontWeight: 900, cursor: 'pointer', letterSpacing: '-0.02em', touchAction: 'manipulation' }}>
                NEXT STAGE
              </button>
            )}
            <button onClick={onTitle} style={{ background: '#F4EADA', color: '#1F2430', border: '3px solid #1F2430', boxShadow: '4px 4px 0 #1F2430', padding: '14px 28px', fontSize: 18, fontWeight: 900, cursor: 'pointer', letterSpacing: '-0.02em', touchAction: 'manipulation' }}>
              TITLE
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

'use client'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getMaxClearedStage, resetProgress } from '@/lib/storage'
import { sounds } from '@/lib/audio/sounds'

const TOTAL_STAGES = 5

interface Props { muted: boolean; onToggleMute: () => void }

export function TitleScene({ muted, onToggleMute }: Props) {
  const router = useRouter()
  const [maxCleared, setMaxCleared] = useState(0)

  useEffect(() => { setMaxCleared(getMaxClearedStage()) }, [])

  const startStage = (stage: number) => {
    sounds.unlock()
    if (!muted) sounds.click()
    router.push(`/play?stage=${stage}`)
  }

  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#F4EADA', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>

      {/* Mute button */}
      <button onClick={onToggleMute} style={{ position: 'absolute', top: 20, right: 20, background: muted ? '#3A3A3A' : '#2F6E6A', border: '2.5px solid #1F2430', boxShadow: '3px 3px 0 #1F2430', width: 48, height: 48, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}>
        <MuteIcon muted={muted} />
      </button>

      {/* Animated plane */}
      <motion.div
        initial={{ x: -120, y: -40 }} animate={{ x: 120, y: -40 }}
        transition={{ duration: 6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '12%', pointerEvents: 'none', opacity: 0.6 }}
      >
        <svg width="56" height="34" viewBox="0 0 40 24" style={{ filter: 'drop-shadow(3px 3px 0 #1F2430)' }}>
          <ellipse cx="20" cy="12" rx="18" ry="7" fill="white" stroke="#1F2430" strokeWidth={2.5} />
          <clipPath id="cp-title"><ellipse cx="20" cy="12" rx="18" ry="7" /></clipPath>
          <rect x="7" y="9" width="26" height="6" fill="#E0644B" clipPath="url(#cp-title)" />
          <ellipse cx="36" cy="12" rx="4" ry="4" fill="#E0644B" stroke="#1F2430" strokeWidth={2.5} />
          <polygon points="22,12 28,2 32,2 30,12" fill="#E0644B" stroke="#1F2430" strokeWidth={2.5} strokeLinejoin="round" />
          <polygon points="22,12 28,22 32,22 30,12" fill="#E0644B" stroke="#1F2430" strokeWidth={2.5} strokeLinejoin="round" />
          <polygon points="4,12 2,5 8,9" fill="#E0644B" stroke="#1F2430" strokeWidth={2.5} strokeLinejoin="round" />
        </svg>
      </motion.div>

      {/* Tower */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: 'backOut' }} style={{ marginBottom: 20 }}>
        <TowerSVG />
      </motion.div>

      {/* Title */}
      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} style={{ textAlign: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 48, fontWeight: 900, color: '#1F2430', letterSpacing: '-0.05em', lineHeight: 1 }}>
          AIRPORT
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#2F6E6A', letterSpacing: '-0.02em' }}>
          CONTROL
        </div>
      </motion.div>

      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 32, width: '80%', maxWidth: 320 }}
      >
        <button onClick={() => startStage(1)} style={{ background: '#2F6E6A', color: '#F4EADA', border: '3px solid #1F2430', boxShadow: '5px 5px 0 #1F2430', padding: '18px 0', fontSize: 24, fontWeight: 900, cursor: 'pointer', letterSpacing: '-0.02em', width: '100%', touchAction: 'manipulation' }}>
          START
        </button>

        {maxCleared > 0 && (
          <button onClick={() => startStage(Math.min(maxCleared + 1, TOTAL_STAGES))} style={{ background: '#F2B544', color: '#1F2430', border: '3px solid #1F2430', boxShadow: '5px 5px 0 #1F2430', padding: '16px 0', fontSize: 20, fontWeight: 900, cursor: 'pointer', letterSpacing: '-0.02em', width: '100%', touchAction: 'manipulation' }}>
            CONTINUE (Stage {Math.min(maxCleared + 1, TOTAL_STAGES)})
          </button>
        )}

        {maxCleared > 0 && (
          <button onClick={() => { resetProgress(); setMaxCleared(0) }} style={{ background: 'transparent', border: 'none', color: '#3A3A3A', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 4, touchAction: 'manipulation' }}>
            Reset progress
          </button>
        )}
      </motion.div>

      {/* Stage progress dots */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ display: 'flex', gap: 10, marginTop: 36 }}>
        {Array.from({ length: TOTAL_STAGES }).map((_, i) => (
          <div key={i} style={{ width: i < maxCleared ? 22 : 18, height: i < maxCleared ? 22 : 18, borderRadius: i < maxCleared ? 4 : '50%', background: i < maxCleared ? '#2F6E6A' : '#D4C4A8', border: '2px solid #1F2430', transition: 'all 0.3s' }} />
        ))}
      </motion.div>

      {/* Runway decoration */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: '#2E2E2E', borderTop: '2.5px solid #1F2430', overflow: 'hidden' }}>
        <svg width="100%" height="48">
          {Array.from({ length: 14 }).map((_, i) => (
            <rect key={i} x={i * 28 + 8} y={20} width={14} height={8} fill="white" opacity={0.5} rx={1} />
          ))}
        </svg>
      </div>
    </div>
  )
}

function TowerSVG() {
  return (
    <svg width="130" height="160" viewBox="0 0 130 160" style={{ filter: 'drop-shadow(4px 4px 0 #1F2430)' }}>
      <rect x="35" y="100" width="60" height="55" fill="#E0644B" stroke="#1F2430" strokeWidth={2.5} />
      {[45, 60, 75].map((x) => <rect key={x} x={x} y={112} width={12} height={10} rx={1} fill="#D4EDFA" stroke="#1F2430" strokeWidth={1.5} />)}
      {[45, 60, 75].map((x) => <rect key={x + 100} x={x} y={130} width={12} height={10} rx={1} fill="#D4EDFA" stroke="#1F2430" strokeWidth={1.5} />)}
      <rect x="57" y="55" width="16" height="50" fill="#F4EADA" stroke="#1F2430" strokeWidth={2.5} />
      <rect x="42" y="35" width="46" height="28" rx={2} fill="#2F6E6A" stroke="#1F2430" strokeWidth={2.5} />
      {[46, 58, 70].map((x) => <rect key={x} x={x} y={39} width={10} height={16} rx={1} fill="#D4EDFA" stroke="#1F2430" strokeWidth={1.5} />)}
      <rect x="63" y="20" width="4" height="18" fill="#F2B544" stroke="#1F2430" strokeWidth={2} />
      <circle cx="65" cy="18" r="5" fill="#E0644B" stroke="#1F2430" strokeWidth={2} />
      <path d="M85 38 Q95 30 100 38" fill="none" stroke="#F2B544" strokeWidth={2.5} strokeLinecap="round" />
      <line x1="92" y1="34" x2="88" y2="42" stroke="#F2B544" strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
}

function MuteIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F4EADA" strokeWidth={2.5} strokeLinecap="round">
      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="#F4EADA" stroke="#F4EADA" />
      {muted ? (<><line x1="17" y1="9" x2="23" y2="15" /><line x1="23" y1="9" x2="17" y2="15" /></>) : (<><path d="M15 9 Q19 12 15 15" /><path d="M18 7 Q24 12 18 17" /></>)}
    </svg>
  )
}

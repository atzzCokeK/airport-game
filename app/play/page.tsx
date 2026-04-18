'use client'
import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { GameScene } from '@/components/game/GameScene'
import { GrainOverlay } from '@/components/ui/GrainOverlay'
import { sounds } from '@/lib/audio/sounds'

function MuteButton({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        right: 'calc(env(safe-area-inset-right, 0px) + 12px)',
        background: muted ? '#3A3A3A' : '#2F6E6A',
        border: '2.5px solid #F4EADA',
        boxShadow: '3px 3px 0 #1F2430',
        width: 44,
        height: 44,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        touchAction: 'manipulation',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F4EADA" strokeWidth={2.5} strokeLinecap="round">
        <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="#F4EADA" stroke="#F4EADA" />
        {muted ? (
          <>
            <line x1="17" y1="9" x2="23" y2="15" />
            <line x1="23" y1="9" x2="17" y2="15" />
          </>
        ) : (
          <>
            <path d="M15 9 Q19 12 15 15" />
            <path d="M18 7 Q24 12 18 17" />
          </>
        )}
      </svg>
    </button>
  )
}

function PlayInner() {
  const params = useSearchParams()
  const router = useRouter()
  const [muted, setMuted] = useState(false)

  const stage = Math.max(1, Math.min(5, parseInt(params.get('stage') ?? '1', 10) || 1))

  const handleToggleMute = () => {
    sounds.unlock()
    setMuted((v) => !v)
  }

  const handleTitle = () => {
    router.push('/')
  }

  return (
    <>
      <GrainOverlay />
      <MuteButton muted={muted} onToggle={handleToggleMute} />
      <GameScene initialStage={stage} muted={muted} onTitle={handleTitle} />
    </>
  )
}

export default function PlayPage() {
  return (
    <Suspense>
      <PlayInner />
    </Suspense>
  )
}

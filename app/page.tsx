'use client'
import { useState } from 'react'
import { TitleScene } from '@/components/title/TitleScene'
import { GrainOverlay } from '@/components/ui/GrainOverlay'
import { sounds } from '@/lib/audio/sounds'

export default function Home() {
  const [muted, setMuted] = useState(false)

  const handleToggleMute = () => {
    sounds.unlock()
    setMuted((v) => !v)
  }

  return (
    <>
      <GrainOverlay />
      <TitleScene muted={muted} onToggleMute={handleToggleMute} />
    </>
  )
}

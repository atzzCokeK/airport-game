'use client'

interface HudProps {
  stage: number
  cleared: number
  target: number
  misses: number
  allowedMisses: number
}

export function Hud({ stage, cleared, target, misses, allowedMisses }: HudProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: '#1F2430',
        zIndex: 10,
        borderBottom: '2.5px solid #1F2430',
      }}
    >
      {/* Stage badge */}
      <div
        style={{
          background: '#F2B544',
          color: '#1F2430',
          padding: '4px 14px',
          fontSize: 15,
          fontWeight: 900,
          letterSpacing: '-0.03em',
          border: '2px solid #1F2430',
          boxShadow: '2px 2px 0 #1F2430',
        }}
      >
        ステージ {stage}
      </div>

      {/* Progress: planes landed */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {Array.from({ length: target }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 20,
              height: 20,
              borderRadius: 3,
              background: i < cleared ? '#2F6E6A' : '#3A3A3A',
              border: '2px solid #F4EADA',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>

      {/* Misses */}
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: allowedMisses }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: i < misses ? '#E0644B' : '#3A3A3A',
              border: '1.5px solid #F4EADA',
              transition: 'background 0.2s',
            }}
          />
        ))}
      </div>
    </div>
  )
}

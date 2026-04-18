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
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 52,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', background: '#1F2430', zIndex: 10,
      borderBottom: '2.5px solid #1F2430',
    }}>
      {/* Stage badge */}
      <div style={{
        background: '#F2B544', color: '#1F2430',
        padding: '4px 14px', fontSize: 14, fontWeight: 900,
        letterSpacing: '-0.02em', border: '2px solid #1F2430',
        boxShadow: '2px 2px 0 #F2B544',
      }}>
        STAGE {stage}
      </div>

      {/* Planes landed */}
      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        {Array.from({ length: target }).map((_, i) => (
          <div key={i} style={{
            width: 20, height: 20, borderRadius: 3,
            background: i < cleared ? '#2F6E6A' : '#3A3A3A',
            border: '2px solid #F4EADA',
            transition: 'background 0.2s',
            boxShadow: i < cleared ? '0 0 0 2px #2F6E6A44' : 'none',
          }} />
        ))}
      </div>

      {/* Misses — shown as X marks */}
      <div style={{ display: 'flex', gap: 5 }}>
        {Array.from({ length: allowedMisses }).map((_, i) => (
          <div key={i} style={{
            width: 22, height: 22,
            background: i < misses ? '#E0644B' : '#3A3A3A',
            border: '2px solid #F4EADA',
            borderRadius: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}>
            {i < misses && (
              <svg width="12" height="12" viewBox="0 0 12 12">
                <line x1="2" y1="2" x2="10" y2="10" stroke="#F4EADA" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="10" y1="2" x2="2" y2="10" stroke="#F4EADA" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

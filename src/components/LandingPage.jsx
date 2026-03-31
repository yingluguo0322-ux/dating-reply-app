import { useState } from 'react'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;700&family=Instrument+Serif:ital@1&display=swap');

  @keyframes letterUp {
    from { opacity: 0; transform: translateY(40px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes dotPop {
    from { opacity: 0; transform: scale(0); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`

export default function LandingPage({ onNext }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div style={{
      background: '#8E2A8A',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      <style>{STYLES}</style>

      {/* Right-top blob */}
      <div style={{
        position: 'absolute',
        width: 320, height: 320,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)',
        top: -80, right: -80,
        pointerEvents: 'none',
      }} />

      {/* Left-bottom blob */}
      <div style={{
        position: 'absolute',
        width: 200, height: 200,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.04)',
        bottom: -60, left: -60,
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* JUST MY */}
        <p style={{
          fontWeight: 400,
          fontSize: '0.7rem',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.4)',
          margin: '0 0 0.4rem',
          animation: 'slideDown 0.6s ease 0.1s both',
        }}>
          JUST MY
        </p>

        {/* TYPE■ */}
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          {[['T', 0.25], ['Y', 0.32], ['P', 0.39], ['E', 0.46]].map(([letter, delay]) => (
            <span key={letter} style={{
              fontWeight: 700,
              fontSize: '5.2rem',
              color: 'white',
              letterSpacing: '-0.03em',
              display: 'inline-block',
              animation: `letterUp 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
            }}>
              {letter}
            </span>
          ))}
          {/* Square dot */}
          <span style={{
            display: 'inline-block',
            width: '0.10em',
            height: '0.10em',
            background: '#F5C8F0',
            borderRadius: 0,
            marginBottom: '0.18em',
            fontSize: '5.2rem',
            animation: 'dotPop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.62s both',
          }} />
        </div>

        {/* YOUR REPLY, PERFECTLY YOU */}
        <p style={{
          fontWeight: 400,
          fontSize: '0.7rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.45)',
          margin: '0.75rem 0 0',
          animation: 'fadeUp 0.5s ease 0.8s both',
        }}>
          YOUR REPLY, PERFECTLY YOU
        </p>

        {/* Divider */}
        <div style={{
          width: 28,
          height: 1,
          background: 'rgba(255,255,255,0.18)',
          margin: '1.1rem auto',
          animation: 'fadeUp 0.5s ease 0.95s both',
        }} />

        {/* Instrument Serif copy */}
        <p
          style={{
            fontFamily: "'Instrument Serif', serif",
            fontStyle: 'italic',
            fontSize: '1.15rem',
            color: 'rgba(255,255,255,0.9)',
            lineHeight: 1.6,
            margin: '0 0 0.6rem',
            animation: 'fadeUp 0.5s ease 1.05s both',
          }}
          dangerouslySetInnerHTML={{ __html: 'Every message you send<br/>should feel exactly like you.' }}
        />

        {/* Subtitle */}
        <p style={{
          fontWeight: 300,
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.38)',
          margin: '0 0 2rem',
          animation: 'fadeUp 0.5s ease 1.2s both',
        }}>
          Your AI dating reply assistant
        </p>

        {/* CTA */}
        <button
          style={{
            background: hovered ? 'white' : 'transparent',
            border: '1.5px solid rgba(255,255,255,0.85)',
            borderRadius: 100,
            padding: '0.85rem 2.4rem',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 500,
            fontSize: '0.85rem',
            letterSpacing: '0.08em',
            color: hovered ? '#8E2A8A' : 'white',
            cursor: 'pointer',
            marginBottom: '2rem',
            animation: 'fadeUp 0.5s ease 1.35s both',
            transition: 'background 0.2s ease, color 0.2s ease',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={onNext}
        >
          GET STARTED →
        </button>

        {/* Progress dots */}
        <div style={{
          display: 'flex',
          gap: 6,
          marginBottom: '1rem',
          animation: 'fadeUp 0.5s ease 1.5s both',
        }}>
          <span style={{ width: 18, height: 6, borderRadius: 3, background: 'white', display: 'inline-block' }} />
          <span style={{ width: 6,  height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.2)', display: 'inline-block' }} />
          <span style={{ width: 6,  height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.2)', display: 'inline-block' }} />
        </div>

        {/* Page number */}
        <span style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.25)',
          letterSpacing: '0.1em',
          animation: 'fadeUp 0.5s ease 1.6s both',
        }}>
          1 / 3
        </span>
      </div>
    </div>
  )
}

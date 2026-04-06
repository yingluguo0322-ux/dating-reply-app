import { useState } from 'react'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&family=Instrument+Serif:ital@1&display=swap');

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
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    12%     { transform: translateX(-7px); }
    25%     { transform: translateX(7px); }
    37%     { transform: translateX(-5px); }
    50%     { transform: translateX(5px); }
    62%     { transform: translateX(-3px); }
    75%     { transform: translateX(3px); }
    87%     { transform: translateX(-1px); }
  }
  .lp-shake {
    animation: shake 0.55s cubic-bezier(0.36,0.07,0.19,0.97) both !important;
  }

  .lp-name-input {
    width: 100%;
    background: white;
    border: 1.5px solid transparent;
    border-radius: 14px;
    padding: 1rem 1.2rem;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 16px;
    font-weight: 400;
    color: #1A1A1A;
    text-align: center;
    outline: none;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  }
  .lp-name-input::placeholder {
    color: rgba(0,0,0,0.28);
  }
  .lp-name-input:focus {
    border-color: #8E2A8A;
    box-shadow: 0 0 0 4px rgba(142,42,138,0.10);
  }

  .lp-gender-card {
    background: white;
    border-radius: 18px;
    padding: 1.6rem 1.2rem 1.3rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
    cursor: pointer;
    border: 2px solid transparent;
    box-shadow: 0 1px 6px rgba(0,0,0,0.07);
    transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.15s ease;
    user-select: none;
    flex: 1;
  }
  .lp-gender-card:hover {
    box-shadow: 0 4px 14px rgba(0,0,0,0.11);
    transform: translateY(-1px);
  }
  .lp-gender-card.selected {
    border-color: #8E2A8A;
    box-shadow: 0 4px 14px rgba(142,42,138,0.15);
  }
  .lp-gender-card-error {
    border-color: rgba(229,62,62,0.5) !important;
    box-shadow: 0 0 0 3px rgba(229,62,62,0.10) !important;
  }

  .lp-prefer-btn {
    width: 100%;
    background: white;
    border: 2px solid transparent;
    border-radius: 14px;
    padding: 0.95rem 1.5rem;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.95rem;
    font-weight: 500;
    color: #4A4A4A;
    cursor: pointer;
    box-shadow: 0 1px 6px rgba(0,0,0,0.07);
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
    letter-spacing: 0.01em;
  }
  .lp-prefer-btn:hover {
    box-shadow: 0 4px 14px rgba(0,0,0,0.11);
  }
  .lp-prefer-btn.selected {
    border-color: #8E2A8A;
    box-shadow: 0 4px 14px rgba(142,42,138,0.15);
  }
  .lp-prefer-btn-error {
    border-color: rgba(229,62,62,0.5) !important;
    box-shadow: 0 0 0 3px rgba(229,62,62,0.10) !important;
  }
`

const USER_PROFILE_KEY = 'user_profile'

function FemaleIcon() {
  return (
    <svg width="30" height="34" viewBox="0 0 30 34" fill="none">
      <circle cx="15" cy="9" r="5.5" stroke="#9B4DCA" strokeWidth="1.6"/>
      <line x1="15" y1="14.5" x2="15" y2="26" stroke="#9B4DCA" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="10.5" y1="20" x2="19.5" y2="20" stroke="#9B4DCA" strokeWidth="1.6" strokeLinecap="round"/>
      <line x1="10.5" y1="26" x2="19.5" y2="26" stroke="#9B4DCA" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  )
}

function MaleIcon() {
  return (
    <svg width="30" height="34" viewBox="0 0 30 34" fill="none">
      <circle cx="13" cy="20" r="7" stroke="#4B7CF3" strokeWidth="1.6"/>
      <line x1="18.5" y1="14.5" x2="27" y2="6" stroke="#4B7CF3" strokeWidth="1.6" strokeLinecap="round"/>
      <polyline points="21,6 27,6 27,12" stroke="#4B7CF3" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function LandingPage({ onNext }) {
  const [step, setStep] = useState(1)
  const [hovered, setHovered] = useState(false)
  const [hoveredContinue, setHoveredContinue] = useState(false)
  const [name, setName] = useState('')
  const [gender, setGender] = useState(null) // 'female' | 'male' | 'prefer_not'
  const [shakeName, setShakeName] = useState(false)
  const [shakeGender, setShakeGender] = useState(false)

  function triggerShake(setFn) {
    setFn(true)
    setTimeout(() => setFn(false), 600)
  }

  function handleContinue() {
    const missingName = name.trim().length === 0
    const missingGender = gender === null
    if (missingName || missingGender) {
      if (missingName) triggerShake(setShakeName)
      if (missingGender) triggerShake(setShakeGender)
      return
    }
    try {
      localStorage.setItem(USER_PROFILE_KEY, JSON.stringify({
        name: name.trim(),
        gender,
        createdAt: Date.now(),
      }))
    } catch {
      // Ignore localStorage errors in onboarding.
    }
    setStep(3)
  }

  // ── Screen 1 ────────────────────────────────────────────────────────────────
  if (step === 1) {
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

        <div style={{ position:'absolute', width:320, height:320, borderRadius:'50%', background:'rgba(255,255,255,0.04)', top:-80, right:-80, pointerEvents:'none' }} />
        <div style={{ position:'absolute', width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.04)', bottom:-60, left:-60, pointerEvents:'none' }} />

        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', position:'relative', zIndex:1, padding: '0 1.5rem' }}>
          <p style={{ fontWeight:400, fontSize:'0.7rem', letterSpacing:'0.28em', textTransform:'uppercase', color:'#F5C8F0', margin:'0 0 0.4rem', animation:'slideDown 0.6s ease 0.1s both' }}>
          JUST MY
        </p>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
            {[
              ['T', 0.25],
              ['Y', 0.32],
              ['P', 0.39],
            ].map(([letter, delay]) => (
              <span
                key={letter}
                style={{
                  fontWeight: 700,
                  fontSize: '5.2rem',
                  color: 'white',
                  letterSpacing: '-0.03em',
                  display: 'inline-block',
                  animation: `letterUp 0.5s cubic-bezier(0.22,1,0.36,1) ${delay}s both`,
                  lineHeight: 1,
                }}
              >
                {letter}
              </span>
            ))}
            <span
              style={{
                position: 'relative',
                display: 'inline-block',
                fontWeight: 700,
                fontSize: '5.2rem',
                color: 'white',
                letterSpacing: '-0.03em',
                lineHeight: 1,
                animation: 'letterUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.46s both',
              }}
            >
              E
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  right: '-0.16em',
                  bottom: '0.11em',
                  width: '0.095em',
                  height: '0.095em',
                  background: '#F5C8F0',
                  borderRadius: 0,
                  pointerEvents: 'none',
                  animation: 'dotPop 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.62s both',
                }}
              />
            </span>
          </div>

          <p style={{ fontWeight:400, fontSize:'0.7rem', letterSpacing:'0.22em', textTransform:'uppercase', color:'#F5C8F0', margin:'0.75rem 0 0', animation:'fadeUp 0.5s ease 0.8s both' }}>
          YOUR REPLY, PERFECTLY YOU
        </p>

          <div style={{ width:28, height:1, background:'rgba(255,255,255,0.18)', margin:'1.1rem auto', animation:'fadeUp 0.5s ease 0.95s both' }} />

          <p
            style={{ fontFamily:"'Instrument Serif', serif", fontStyle:'italic', fontSize:'1.55rem', fontWeight:400, color:'rgba(255,255,255,0.92)', lineHeight:1.35, margin:'0 0 0.6rem', animation:'fadeUp 0.5s ease 1.05s both' }}
          dangerouslySetInnerHTML={{ __html: 'Every message you send<br/>should feel exactly like you.' }}
        />

          <p style={{ fontFamily:"'Space Grotesk', sans-serif", fontWeight:300, fontSize:'0.7rem', letterSpacing:'0.22em', color:'#F5C8F0', margin:'0 0 2rem', animation:'fadeUp 0.5s ease 1.2s both' }}>
          Your AI dating reply assistant
        </p>

        <button
          style={{
            background: hovered ? 'white' : 'transparent',
            border: '1.5px solid rgba(255,255,255,0.85)',
            borderRadius: 100,
            padding: '0.85rem 2.4rem',
            fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
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
            onClick={() => setStep(2)}
        >
          GET STARTED →
        </button>

          <div style={{ display:'flex', gap:6, marginBottom:'1rem', animation:'fadeUp 0.5s ease 1.5s both', alignItems:'center' }}>
            <span style={{ width:18, height:6, borderRadius:3, background:'white', display:'inline-block' }} />
            <span style={{ width:6, height:6, borderRadius:3, background:'rgba(255,255,255,0.2)', display:'inline-block' }} />
            <span style={{ width:6, height:6, borderRadius:3, background:'rgba(255,255,255,0.2)', display:'inline-block' }} />
          </div>

          <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)', letterSpacing:'0.1em', animation:'fadeUp 0.5s ease 1.6s both' }}>
            1 / 3
          </span>
        </div>
      </div>
    )
  }

  // ── Screen 3 ────────────────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <>
        <style>{STYLES}</style>
        <Screen3
          onDone={onNext}
          onBack1={() => setStep(1)}
          onBack2={() => setStep(2)}
        />
      </>
    )
  }

  // ── Screen 2 ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      background: '#F3F0FB',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Space Grotesk', sans-serif",
      padding: '2rem 1.5rem',
    }}>
      <style>{STYLES}</style>

        <div style={{
        width: '100%',
        maxWidth: 420,
          display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}>

        {/* Progress dots; dot 1 is clickable to go back */}
        <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:'2.4rem', animation:'slideDown 0.5s ease 0s both' }}>
          <span
            onClick={() => setStep(1)}
            title="Back to start"
            style={{
              width:6, height:6, borderRadius:3,
              background:'rgba(142,42,138,0.3)',
              display:'inline-block',
              cursor:'pointer',
              transition:'background 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(142,42,138,0.65)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(142,42,138,0.3)'}
          />
          <span style={{ width:18, height:6, borderRadius:3, background:'#8E2A8A', display:'inline-block' }} />
          <span style={{ width:6, height:6, borderRadius:3, background:'rgba(0,0,0,0.15)', display:'inline-block' }} />
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: 'italic',
          fontSize: '2.2rem',
          fontWeight: 400,
          color: '#1A1A1A',
          margin: '0 0 0.5rem',
          lineHeight: 1.2,
          animation: 'fadeUp 0.5s ease 0.1s both',
        }}>
          Tell us about you
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '0.88rem',
          fontWeight: 400,
          color: 'rgba(0,0,0,0.4)',
          margin: '0 0 2rem',
          letterSpacing: '0.01em',
          animation: 'fadeUp 0.5s ease 0.18s both',
        }}>
          Helps us tailor your reply style
        </p>

        {/* Name input; shakes if empty on submit */}
        <div
          key={shakeName ? 'shake-name' : 'name'}
          className={shakeName ? 'lp-shake' : ''}
          style={{ width:'100%', marginBottom:'1.2rem', animation: shakeName ? undefined : 'fadeUp 0.5s ease 0.26s both' }}
        >
          <input
            className="lp-name-input"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleContinue() }}
            style={shakeName ? { borderColor: '#E53E3E', boxShadow: '0 0 0 3px rgba(229,62,62,0.15)' } : {}}
          />
        </div>

        {/* Gender cards; shake wrapper if none selected on submit */}
        <div
          key={shakeGender ? 'shake-gender' : 'gender'}
          className={shakeGender ? 'lp-shake' : ''}
          style={{ width:'100%', animation: shakeGender ? undefined : 'fadeUp 0.5s ease 0.34s both' }}
        >
          <div style={{ display:'flex', gap:12, width:'100%', marginBottom:'0.9rem' }}>
            <div
              className={`lp-gender-card${gender === 'female' ? ' selected' : ''}${shakeGender ? ' lp-gender-card-error' : ''}`}
              onClick={() => setGender(g => g === 'female' ? null : 'female')}
            >
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: '#F5E6FC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FemaleIcon />
              </div>
              <span style={{ fontSize:'0.95rem', fontWeight:500, color:'#1A1A1A' }}>Female</span>
            </div>

            <div
              className={`lp-gender-card${gender === 'male' ? ' selected' : ''}${shakeGender ? ' lp-gender-card-error' : ''}`}
              onClick={() => setGender(g => g === 'male' ? null : 'male')}
            >
              <div style={{
                width: 60, height: 60, borderRadius: '50%',
                background: '#E6EEFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MaleIcon />
              </div>
              <span style={{ fontSize:'0.95rem', fontWeight:500, color:'#1A1A1A' }}>Male</span>
            </div>
          </div>

          {/* Prefer not to say */}
          <div style={{ width:'100%', marginBottom:'1.6rem' }}>
            <button
              className={`lp-prefer-btn${gender === 'prefer_not' ? ' selected' : ''}${shakeGender ? ' lp-prefer-btn-error' : ''}`}
              onClick={() => setGender(g => g === 'prefer_not' ? null : 'prefer_not')}
            >
              Prefer not to say
            </button>
          </div>
        </div>

        {/* CONTINUE button */}
        <div style={{ width:'100%', animation:'fadeUp 0.5s ease 0.5s both' }}>
          <button
            style={{
              width: '100%',
              background: '#8E2A8A',
              border: '1.5px solid #8E2A8A',
              borderRadius: 100,
              padding: '0.85rem 2.4rem',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.08em',
              color: 'white',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
              marginBottom: '0.6rem',
              opacity: hoveredContinue ? 0.88 : 1,
            }}
            onMouseEnter={() => setHoveredContinue(true)}
            onMouseLeave={() => setHoveredContinue(false)}
            onClick={handleContinue}
          >
            CONTINUE →
          </button>
        </div>

        {/* Bottom row: back left, page number right */}
        <div style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', animation:'fadeUp 0.5s ease 0.58s both', padding:'0 4px' }}>
          <button
            onClick={() => setStep(1)}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:'0.72rem', color:'rgba(0,0,0,0.28)', letterSpacing:'0.05em', padding:'8px 4px', fontFamily:"'Space Grotesk', sans-serif" }}
          >
            ← back
          </button>
          <span style={{ fontSize:11, color:'rgba(0,0,0,0.25)', letterSpacing:'0.1em' }}>
            2 / 3
          </span>
          <span style={{ width: 40 }} />
        </div>
      </div>
    </div>
  )
}

// ─── Feature card icons ───────────────────────────────────────────────────────

function IconChat() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M3 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7.5L3 17V4z" stroke="#7C3AED" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  )
}
function IconStar() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 2l2.3 6.3H20l-5.4 3.9 2 6.3L11 14.5l-5.6 4 2-6.3L2 8.3h6.7L11 2z" stroke="#D97706" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  )
}
function IconPeople() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="8" cy="7" r="3.3" stroke="#4B6FBF" strokeWidth="1.5"/>
      <path d="M2 19c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#4B6FBF" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="16.5" cy="7.5" r="2.5" stroke="#4B6FBF" strokeWidth="1.4"/>
      <path d="M19 19c0-2.3-1.1-4.3-2.8-5.4" stroke="#4B6FBF" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}
function IconRefresh() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M4.5 11a6.5 6.5 0 1 0 1.6-4.3L4.5 8.3" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M4.5 4.5v4h4" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const FEATURES = [
  {
    icon: <IconChat />,
    bg: '#EDE9FE',
    title: 'Paste their message',
    desc: 'Copy what they sent, or upload a screenshot',
  },
  {
    icon: <IconStar />,
    bg: '#FEF3C7',
    title: 'Pick your reply style',
    desc: 'Playful, Flirty, Witty, Chic, Sincere',
  },
  {
    icon: <IconPeople />,
    bg: '#E0E7FF',
    title: 'Link a Flame profile',
    desc: 'Saves chat history, gets smarter over time',
  },
  {
    icon: <IconRefresh />,
    bg: '#DCFCE7',
    title: 'Not feeling it? Regenerate',
    desc: 'Each reply can be refreshed independently',
  },
]

function Screen3({ onDone, onBack1, onBack2 }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div style={{
      background: '#F3F0FB',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Space Grotesk', sans-serif",
      padding: '2rem 1.5rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}>

        {/* Progress dots */}
        <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:'2.4rem', animation:'slideDown 0.5s ease 0s both' }}>
          <span
            onClick={onBack1}
            title="Back to start"
            style={{ width:6, height:6, borderRadius:3, background:'rgba(142,42,138,0.3)', display:'inline-block', cursor:'pointer', transition:'background 0.15s ease' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(142,42,138,0.65)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(142,42,138,0.3)'}
          />
          <span
            onClick={onBack2}
            title="Back"
            style={{ width:6, height:6, borderRadius:3, background:'rgba(142,42,138,0.3)', display:'inline-block', cursor:'pointer', transition:'background 0.15s ease' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(142,42,138,0.65)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(142,42,138,0.3)'}
          />
          <span style={{ width:18, height:6, borderRadius:3, background:'#8E2A8A', display:'inline-block' }} />
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Instrument Serif', serif",
          fontStyle: 'italic',
          fontSize: '2.1rem',
          fontWeight: 400,
          color: '#1A1A1A',
          margin: '0 0 0.5rem',
          lineHeight: 1.25,
          animation: 'fadeUp 0.5s ease 0.1s both',
        }}>
          Your personal<br />dating reply assistant
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '0.88rem',
          fontWeight: 400,
          color: 'rgba(0,0,0,0.4)',
          margin: '0 0 1.8rem',
          letterSpacing: '0.01em',
          animation: 'fadeUp 0.5s ease 0.18s both',
        }}>
          Three steps to make them fall for you
        </p>

        {/* Feature cards */}
        <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:10, marginBottom:'1.8rem' }}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              style={{
                background: 'white',
                borderRadius: 16,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                textAlign: 'left',
                animation: `fadeUp 0.5s ease ${0.26 + i * 0.08}s both`,
              }}
            >
              <div style={{
                width: 48, height: 48,
                borderRadius: 13,
                background: f.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontSize:'0.94rem', fontWeight:600, color:'#1A1A1A', marginBottom:3 }}>
                  {f.title}
                </div>
                <div style={{ fontSize:'0.75rem', color:'rgba(0,0,0,0.42)', lineHeight:1.4, fontWeight:400, whiteSpace:'nowrap' }}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* GET STARTED button */}
        <div style={{ width:'100%', animation:'fadeUp 0.5s ease 0.62s both' }}>
          <button
            style={{
              width: '100%',
              background: '#8E2A8A',
              border: '1.5px solid #8E2A8A',
              borderRadius: 100,
              padding: '0.85rem 2.4rem',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.08em',
              color: 'white',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
              marginBottom: '0.6rem',
              opacity: hovered ? 0.88 : 1,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onDone}
          >
            GET STARTED →
          </button>
        </div>

        {/* Bottom row: back left, page number right */}
        <div style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', animation:'fadeUp 0.5s ease 0.7s both', padding:'0 4px' }}>
          <button
            onClick={onBack2}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:'0.72rem', color:'rgba(0,0,0,0.28)', letterSpacing:'0.05em', padding:'8px 4px', fontFamily:"'Space Grotesk', sans-serif" }}
          >
            ← back
          </button>
          <span style={{ fontSize:11, color:'rgba(0,0,0,0.25)', letterSpacing:'0.1em' }}>
            3 / 3
        </span>
          <span style={{ width: 40 }} />
        </div>
      </div>
    </div>
  )
}

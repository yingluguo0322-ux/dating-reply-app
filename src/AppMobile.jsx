import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './AppMobile.css'
import LandingPage from './components/LandingPage'
import { STAGE_OPTIONS } from '../lib/stageLabels.js'

const FLAME_KEY = 'flame_profiles'

const STYLE_KEYS = ['playful', 'flirty', 'witty', 'charming', 'sincere']
const STYLE_LABELS = {
  playful: 'Playful',
  flirty: 'Flirty',
  witty: 'Witty',
  charming: 'Chic',
  sincere: 'Sincere',
}

const STYLE_COLORS = {
  playful: { macaron: '#F5C97A', chipBorder: '#D4A840', text: '#7A5500', phoneBg: '#FDF3D9' },
  flirty: { macaron: '#F2A8A8', chipBorder: '#D07878', text: '#8B2020', phoneBg: '#FDEAEA' },
  witty: { macaron: '#C4B5F4', chipBorder: '#9E88E0', text: '#3D2080', phoneBg: '#F0ECFD' },
  charming: { macaron: '#A8D5C2', chipBorder: '#78BFAA', text: '#1A5C42', phoneBg: '#E8F7F1' },
  sincere: { macaron: '#A8C5E8', chipBorder: '#78A8D0', text: '#1A3D6B', phoneBg: '#E8F1FA' },
}

// Fallback replies when API is unavailable.
const MOCK_REPLY = {
  playful: 'Okay I was NOT expecting that but honestly... same energy 😭',
  flirty: "You can't just say that and expect me to act normal about it",
  witty: 'Bold of you to assume I know how to respond without overthinking it for 20 minutes',
  charming: "That's genuinely one of the nicest things anyone's said to me in a while",
  sincere: 'I really appreciate you saying that — means more than you know',
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Read image file → base64 + media type for vision API (prefer this over blob: URLs). */
function fileToImagePayload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result
      if (typeof dataUrl !== 'string' || !dataUrl.includes(',')) {
        reject(new Error('Could not read screenshot'))
        return
      }
      const [, b64] = dataUrl.split(',')
      const t = (file.type || '').toLowerCase()
      if (t.includes('heic') || t.includes('heif')) {
        reject(
          new Error(
            'This photo format (HEIC) is not supported for auto-read. Export as JPEG/PNG or paste text instead.'
          )
        )
        return
      }
      const mediaType =
        file.type && /^image\/(jpeg|png|gif|webp)$/i.test(file.type) ? file.type : 'image/jpeg'
      resolve({ base64: b64, mediaType })
    }
    reader.onerror = () => reject(reader.error || new Error('Could not read screenshot'))
    reader.readAsDataURL(file)
  })
}

/** Fallback if we only have an object URL (e.g. legacy state). */
function blobUrlToImagePayload(blobUrl) {
  return fetch(blobUrl)
    .then((r) => {
      if (!r.ok) throw new Error('Could not read screenshot')
      return r.blob()
    })
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const dataUrl = reader.result
            if (typeof dataUrl !== 'string' || !dataUrl.includes(',')) {
              reject(new Error('Could not read screenshot'))
              return
            }
            const [, b64] = dataUrl.split(',')
            const t = (blob.type || '').toLowerCase()
            if (t.includes('heic') || t.includes('heif')) {
              reject(
                new Error(
                  'This photo format (HEIC) is not supported for auto-read. Export as JPEG/PNG or paste text instead.'
                )
              )
              return
            }
            const mediaType =
              blob.type && /^image\/(jpeg|png|gif|webp)$/i.test(blob.type)
                ? blob.type
                : 'image/jpeg'
            resolve({ base64: b64, mediaType })
          }
          reader.onerror = () => reject(reader.error || new Error('Could not read screenshot'))
          reader.readAsDataURL(blob)
        })
    )
}

const MOCK_PROFILES = []

function loadProfiles() {
  try {
    const raw = localStorage.getItem(FLAME_KEY)
    const parsed = raw ? JSON.parse(raw) : MOCK_PROFILES
    // Remove old seeded demo profiles while keeping user-created data.
    return parsed.filter((p) => p.id !== 'alex' && p.id !== 'mia')
  } catch {
    return MOCK_PROFILES
  }
}

function TLogoButton({ onClick }) {
  return (
    <button className="m-t-btn" onClick={onClick} aria-label="Open Flame Files">
      <span className="m-t-letter">T</span>
    </button>
  )
}

function SliderIcon3Lines() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="3.2" cy="3.2" r="1.4" fill="#8A8A8A" />
      <rect x="5.1" y="2.2" width="7" height="2" rx="1" fill="#8A8A8A" />
      <circle cx="3.2" cy="7" r="1.4" fill="#8A8A8A" />
      <rect x="5.1" y="6" width="7" height="2" rx="1" fill="#8A8A8A" />
      <circle cx="3.2" cy="10.8" r="1.4" fill="#8A8A8A" />
      <rect x="5.1" y="9.8" width="7" height="2" rx="1" fill="#8A8A8A" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A070B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  )
}

function PencilIconMuted() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#A070B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  )
}

/** Chat bubble + plus — same metaphor as drawer “new flame”, but outlined style on main screen */
function NewChatSameFlameIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="12" y1="9" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="9" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2D9C7A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function AiBubble({ styleKey, text, color, animDelayMs, onCopy }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

  return (
    <div
      className="m-ai-bubble"
      style={{
        background: color.macaron,
        color: color.text,
        animationDelay: `${animDelayMs}ms`,
      }}
    >
      <div className="m-ai-bubble-label">{STYLE_LABELS[styleKey].toUpperCase()}</div>
      <p className="m-ai-bubble-text">{text}</p>
      <button
        className="m-ai-bubble-copy"
        onClick={(e) => {
          e.stopPropagation()
          navigator.clipboard.writeText(text).then(() => {
            setCopied(true)
            onCopy?.(text)
          })
        }}
        aria-label="Copy reply"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
    </div>
  )
}

function FlameDrawer({ open, profiles, activeProfileId, onSelectProfile, onClose, onAddProfile, onDeleteProfile, onRenameProfile, onToggleStar, userProfile }) {
  const [menuState, setMenuState] = useState(null) // { id, x, y }
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const longPressTimer = useRef(null)
  const renameRef = useRef(null)

  useEffect(() => {
    if (renamingId) renameRef.current?.focus()
  }, [renamingId])

  if (!open) return null

  const sortedProfiles = [...profiles].sort((a, b) => {
    if (a.starred && !b.starred) return -1
    if (!a.starred && b.starred) return 1
    return (a.createdAt ?? 0) - (b.createdAt ?? 0)
  })

  const startPress = (id) => (e) => {
    const src = e.touches?.[0] || e
    longPressTimer.current = setTimeout(() => {
      const x = Math.min((src.clientX || 0) + 8, window.innerWidth - 220)
      const y = Math.min(src.clientY || 0, window.innerHeight - 160)
      setMenuState({ id, x, y })
    }, 500)
  }
  const cancelPress = () => clearTimeout(longPressTimer.current)

  const closeMenu = () => setMenuState(null)

  const handleStar = (id) => { onToggleStar(id); closeMenu() }

  const handleRename = (id) => {
    const p = profiles.find((x) => x.id === id)
    setRenameValue(p?.name ?? '')
    setRenamingId(id)
    closeMenu()
  }

  const commitRename = () => {
    const v = renameValue.trim()
    if (v && renamingId) onRenameProfile(renamingId, v)
    setRenamingId(null)
  }

  const handleDelete = (id) => { setDeleteConfirmId(id); closeMenu() }

  const handleFAB = () => {
    onAddProfile('Unknown')
    onClose()
  }

  const menuProfile = menuState ? profiles.find((p) => p.id === menuState.id) : null

  return (
    <>
      <div className="m-flame-overlay" onClick={onClose} />
      <div className="m-flame-drawer" role="dialog" aria-modal="true">

        {/* Header */}
        <div className="m-drawer-head">
          <div className="m-drawer-title">Flames</div>
          <button className="m-drawer-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {/* Profile list */}
        <div className="m-flame-list">

          {/* Default profile entry */}
          <div
            className={`m-flame-item${activeProfileId === null ? ' selected' : ''}`}
            onClick={() => onSelectProfile(null)}
          >
            <div className="m-flame-avatar m-flame-avatar-anon">N</div>
            <div className="m-flame-name">New Flame</div>
          </div>

          {/* Flame profiles */}
          {sortedProfiles.map((p) => {
            const selected = p.id === activeProfileId
            const initial = (p.name?.[0] ?? '?').toUpperCase()
            const isRenaming = renamingId === p.id

            return (
              <div
                key={p.id}
                className={`m-flame-item${selected ? ' selected' : ''}`}
                onClick={() => { if (!isRenaming) onSelectProfile(p.id) }}
                onPointerDown={startPress(p.id)}
                onPointerUp={cancelPress}
                onPointerLeave={cancelPress}
                onContextMenu={(e) => {
                  e.preventDefault()
                  const x = Math.min(e.clientX + 8, window.innerWidth - 220)
                  const y = Math.min(e.clientY, window.innerHeight - 160)
                  setMenuState({ id: p.id, x, y })
                }}
              >
                <div className="m-flame-avatar">{initial}</div>
                {isRenaming ? (
                  <input
                    ref={renameRef}
                    className="m-flame-rename-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename()
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                    onBlur={commitRename}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="m-flame-name">
                    {p.name}
                    {p.starred && <span className="m-flame-star">★</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom user card */}
        {userProfile?.name && (
          <div className="m-drawer-user-card">
            <div className="m-drawer-user-avatar">{userProfile.name[0].toUpperCase()}</div>
            <div className="m-drawer-user-info">
              <div className="m-drawer-user-name">{userProfile.name}</div>
              <div className="m-drawer-user-sub">My account</div>
            </div>
            <button className="m-drawer-user-fab" onClick={handleFAB} aria-label="New flame">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="9" x2="12" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <line x1="9" y1="12" x2="15" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Long-press context menu */}
      {menuState && menuProfile && (
        <>
          <div className="m-menu-overlay" onClick={closeMenu} />
          <div className="m-flame-menu" style={{ top: menuState.y, left: menuState.x }}>
            <div className="m-flame-menu-item" onClick={() => handleStar(menuState.id)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={menuProfile.starred ? '#F5A623' : 'none'} stroke={menuProfile.starred ? '#F5A623' : '#1A1A1A'} strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>{menuProfile.starred ? 'Unstar' : 'Star'}</span>
            </div>
            <div className="m-flame-menu-item" onClick={() => handleRename(menuState.id)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
              <span>Rename</span>
            </div>
            <div className="m-flame-menu-item m-flame-menu-delete" onClick={() => handleDelete(menuState.id)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E53E3E" strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              <span>Delete</span>
            </div>
          </div>
        </>
      )}

      {/* Delete confirmation */}
      {deleteConfirmId && (
        <>
          <div className="m-menu-overlay" onClick={() => setDeleteConfirmId(null)} />
          <div className="m-delete-confirm">
            <div className="m-delete-confirm-text">Delete this flame?</div>
            <div className="m-delete-confirm-actions">
              <button className="m-delete-cancel" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
              <button className="m-delete-ok" onClick={() => {
                onDeleteProfile(deleteConfirmId)
                setDeleteConfirmId(null)
              }}>Delete</button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

function StageBottomSheet({ open, draft, onChange, onApply, onClose }) {
  if (!open) return null

  const lastIdx = STAGE_OPTIONS.length - 1

  return (
    <>
      <div className="m-overlay" onClick={onClose} />
      <div className="m-sheet">
        <div className="m-sheet-drag" />
        <div className="m-sheet-title">Stage</div>
        <div className="m-sheet-subtitle">Where are you two right now? (1 … 5 = deeper commitment)</div>
        <div className="m-sheet-body">
          {STAGE_OPTIONS.map((label, idx) => {
            const value = idx + 1
            const selected = draft === value
            return (
              <div
                key={value}
                className={`m-radio-card ${selected ? 'selected' : ''}`}
                onClick={() => onChange(value)}
                role="button"
              >
                <span className="m-radio-card-label">
                  {idx === lastIdx ? <strong className="m-stage-final">{label}</strong> : label}
                </span>
                <span className="m-radio-dot" />
              </div>
            )
          })}
          <button className="m-apply-btn" onClick={onApply}>
            Apply
          </button>
        </div>
      </div>
    </>
  )
}

function InterestBottomSheet({ open, draft, onChange, onApply, onClose }) {
  const desc = {
    0: 'Not really feeling it',
    1: 'Still figuring out',
    2: 'Curious',
    3: 'Interested',
    4: 'Really into it',
    5: 'Catching feelings',
  }
  if (!open) return null

  const fillPct = (draft / 5) * 100

  return (
    <>
      <div className="m-overlay" onClick={onClose} />
      <div className="m-sheet">
        <div className="m-sheet-drag" />
        <div className="m-sheet-title">Interest level</div>
        <div className="m-sheet-subtitle">How much are you feeling this person?</div>
        <div className="m-sheet-body">
          <div className="m-interest-desc">{draft} → {desc[draft]}</div>

          <div className="m-track-row">
            <div className="m-track">
              <div className="m-track-fill" style={{ width: `${fillPct}%` }} />
            </div>
            <div className="m-dots-row m-dots-row-6">
              {Array.from({ length: 6 }).map((_, idx) => {
                const value = idx
                const selected = value === draft
                return (
                  <div key={value} className={`m-dot-wrap${selected ? ' selected' : ''}`} onClick={() => onChange(value)} role="button">
                    <div className={`m-dot${selected ? ' selected' : ''}`} />
                    <div className="m-dot-num">{value}</div>
                  </div>
                )
              })}
            </div>
            <div className="m-interest-ends">
              <span>Not feeling it</span>
              <span>Catching feelings</span>
            </div>
          </div>

          <button className="m-apply-btn" onClick={onApply}>
            Apply
          </button>
        </div>
      </div>
    </>
  )
}

export default function AppMobile() {
  const [showLanding, setShowLanding] = useState(() => {
    try {
      const profile = JSON.parse(localStorage.getItem('user_profile') || 'null')
      return !(profile && profile.name && profile.name.trim().length > 0)
    } catch {
      return true
    }
  })

  const userProfile = (() => {
    try { return JSON.parse(localStorage.getItem('user_profile') || 'null') } catch { return null }
  })()
  const [phase, setPhase] = useState('input') // input | results

  const [profiles, setProfiles] = useState(() => loadProfiles())
  const [activeProfileId, setActiveProfileId] = useState(null)

  const [drawerOpen, setDrawerOpen] = useState(false)

  // Context chips (Stage / Interest)
  const [stageApplied, setStageApplied] = useState(false)
  const [stageLevel, setStageLevel] = useState(1)
  const [stageDraft, setStageDraft] = useState(1)

  const [interestApplied, setInterestApplied] = useState(false)
  const [interestLevel, setInterestLevel] = useState(3)
  const [interestDraft, setInterestDraft] = useState(3)

  const [sheet, setSheet] = useState(null) // 'stage' | 'interest' | null

  // Input
  const [replyMsg, setReplyMsg] = useState('')
  const [myIdea, setMyIdea] = useState('')
  const [replyStyles, setReplyStyles] = useState(['playful']) // initial: at least 1
  const [replyLoading, setReplyLoading] = useState(false)
  const [generatedReplies, setGeneratedReplies] = useState(MOCK_REPLY)
  const [generationError, setGenerationError] = useState('')

  const [screenshotOpen, setScreenshotOpen] = useState(false)
  const [screenshotPreview, setScreenshotPreview] = useState(null)
  const fileInputRef = useRef(null)
  /** Keep original File for vision API — avoids broken blob: URLs after revoke / React StrictMode. */
  const screenshotFileRef = useRef(null)

  const handleScreenshotFile = useCallback((file) => {
    if (!file) return
    setGenerationError('')
    screenshotFileRef.current = file
    const nextUrl = URL.createObjectURL(file)
    setScreenshotPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return nextUrl
    })
    setScreenshotOpen(false)
  }, [])

  const activeText = replyMsg
  const activeStyles = replyStyles
  const activeLoading = replyLoading
  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null

  const hasTheirContent = activeText.trim().length > 0 || !!screenshotPreview
  const canGenerate = hasTheirContent && activeStyles.length > 0 && activeStyles.length <= 3

  const genReqIdRef = useRef(0)

  const onToggleStyle = useCallback(
    (styleKey) => {
      const current = new Set(replyStyles)
      const isSelected = current.has(styleKey)

      if (isSelected) {
        // Keep at least 1 selected.
        if (current.size === 1) return
        current.delete(styleKey)
      } else {
        // Up to 3.
        if (current.size >= 3) return
        current.add(styleKey)
      }

      const next = Array.from(current)
      setReplyStyles(next)
    },
    [replyStyles]
  )

  const fetchAiReplies = useCallback(
    async ({ theirMessage, imageBase64, imageMediaType }) => {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theirMessage,
          myIdea,
          imageBase64: imageBase64 || undefined,
          imageMediaType: imageMediaType || undefined,
          styles: STYLE_KEYS,
          stageLevel,
          interestLevel,
          systemPrompt: '',
        }),
      })

      if (!response.ok) {
        const text = await response.text()
        let parsed = null
        try {
          parsed = JSON.parse(text)
        } catch {
          // not JSON
        }
        if (parsed?.error === 'theirMessage is required') {
          throw new Error(
            'API is an old build (ignores screenshots). Stop and run `npm run dev` once so the server loads vision support.'
          )
        }
        if (parsed?.error) {
          throw new Error(String(parsed.error))
        }
        throw new Error(text || 'Failed to generate replies')
      }

      const data = await response.json()
      if (!data?.replies) throw new Error('API returned invalid reply format')

      return {
        ...MOCK_REPLY,
        ...data.replies,
      }
    },
    [interestLevel, myIdea, stageLevel]
  )

  const runGenerate = useCallback(
    async (textForValidation) => {
      setGenerationError('')
      const hasImage = Boolean(screenshotPreview)
      const textOk = textForValidation.trim().length > 0
      const ok = (textOk || hasImage) && replyStyles.length > 0 && replyStyles.length <= 3
      if (!ok) return

      let imageBase64
      let imageMediaType
      if (hasImage) {
        try {
          const file = screenshotFileRef.current
          const img = file
            ? await fileToImagePayload(file)
            : await blobUrlToImagePayload(screenshotPreview)
          imageBase64 = img.base64
          imageMediaType = img.mediaType
          if (!String(imageBase64 || '').trim()) {
            throw new Error('Screenshot encoded empty; try re-uploading the image.')
          }
        } catch (e) {
          console.error('Screenshot read failed:', e)
          setGenerationError(
            String(e?.message || 'Could not read your screenshot. Try again or paste text instead.')
          )
          return
        }
      }

      const reqId = ++genReqIdRef.current
      setPhase('results')
      setReplyLoading(true)
      setGenerationError('')

      const startedAt = Date.now()
      try {
        const replies = await fetchAiReplies({
          theirMessage: textForValidation.trim(),
          imageBase64,
          imageMediaType,
        })
        if (reqId !== genReqIdRef.current) return
        setGeneratedReplies(replies)
      } catch (error) {
        if (reqId !== genReqIdRef.current) return
        // Keep UI usable even when API fails.
        setGeneratedReplies(MOCK_REPLY)
        const errMsg = String(error?.message || 'Unknown error')
        setGenerationError(`Fallback: ${errMsg}`)
        console.error('AI generation failed:', error)
      } finally {
        const elapsed = Date.now() - startedAt
        if (elapsed < 1500) await sleep(1500 - elapsed)
        if (reqId === genReqIdRef.current) setReplyLoading(false)
      }
    },
    [fetchAiReplies, replyStyles, screenshotPreview]
  )

  const startGenerate = useCallback(() => {
    runGenerate(activeText)
  }, [activeText, runGenerate])

  /** Results screen: pencil goes back to input so the user edits in the main form. */
  const backToInputForEdit = useCallback(() => {
    setPhase('input')
    setGenerationError('')
  }, [])

  /** Clear draft + results; keep the same Flame selected (not “new person” — that’s the drawer FAB). */
  const startNewChatSameFlame = useCallback(() => {
    genReqIdRef.current += 1
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview)
    screenshotFileRef.current = null
    setScreenshotPreview(null)
    setScreenshotOpen(false)
    setReplyMsg('')
    setMyIdea('')
    setGenerationError('')
    setGeneratedReplies(MOCK_REPLY)
    setReplyLoading(false)
    setPhase('input')
    setReplyStyles(['playful'])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [screenshotPreview])

  // Keep bubbles in sync with selected styles during results state.
  const displayBubbles = useMemo(() => {
    const styleTextMap = generatedReplies
    return STYLE_KEYS.filter((k) => activeStyles.includes(k)).map((styleKey) => ({
      styleKey,
      text: styleTextMap[styleKey],
    }))
  }, [activeStyles, generatedReplies])

  const onCopied = useCallback((cardText) => {
    // Keep a light "history" persistence similar to the original app.
    if (activeProfileId === null) return
    const entry = { time: new Date().toISOString(), theirMsg: replyMsg.trim(), myReply: cardText }
    setProfiles((prev) =>
      prev.map((p) => (p.id === activeProfileId ? { ...p, history: [...p.history, entry] } : p))
    )
  }, [activeProfileId, replyMsg])

  useEffect(() => {
    try {
      localStorage.setItem(FLAME_KEY, JSON.stringify(profiles))
    } catch {
      // Best-effort persistence; ignore storage errors.
    }
  }, [profiles])

  const addProfile = useCallback((name) => {
    const id = `p-${Date.now()}`
    setProfiles((prev) => [...prev, { id, name, starred: false, createdAt: Date.now(), history: [] }])
    setActiveProfileId(id)
  }, [])

  const deleteProfile = useCallback((id) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id))
    setActiveProfileId((prev) => (prev === id ? null : prev))
  }, [])

  const renameProfile = useCallback((id, newName) => {
    setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, name: newName } : p))
  }, [])

  const toggleStar = useCallback((id) => {
    setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, starred: !p.starred } : p))
  }, [])

  const stageChipLabel = stageApplied
    ? `Stage ${stageLevel}/5 ▾`
    : 'Stage ▾'
  const stageChipTitle = stageApplied && STAGE_OPTIONS[stageLevel - 1]
    ? STAGE_OPTIONS[stageLevel - 1]
    : undefined
  const interestChipLabel = interestApplied ? `Interest ${interestLevel}/5 ▾` : 'Interest ▾'
  // interestLevel valid range: 0–5

  const headerStageChip = (
    <button
      type="button"
      className={`m-chip m-chip-btn ${stageApplied ? 'selected' : ''}`}
      title={stageChipTitle}
      onClick={() => {
        setStageDraft(stageLevel)
        setSheet('stage')
      }}
    >
      {stageChipLabel}
    </button>
  )

  const headerInterestChip = (
    <button
      className={`m-chip m-chip-btn ${interestApplied ? 'selected' : ''}`}
      onClick={() => {
        setInterestDraft(interestLevel)
        setSheet('interest')
      }}
    >
      {interestChipLabel}
    </button>
  )

  if (showLanding) {
    return <LandingPage onNext={() => setShowLanding(false)} />
  }

  /* Show on main composer whenever overlays are closed — not only when a Flame is picked (then header can say "Add a name"). */
  const showNewChatFab = !drawerOpen && sheet === null

  return (
    <div className={`mobile-shell${showNewChatFab ? ' mobile-shell--with-new-chat-fab' : ''}`}>
      <div className="mobile-scroll">
        <div className="m-header">
          <TLogoButton
            onClick={() => {
              setDrawerOpen(true)
            }}
          />
          {phase === 'results' ? (
            activeProfile ? (
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                  color: '#1A1A1A',
                }}
              >
                {activeProfile.name}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 500,
                  fontSize: 15,
                  color: '#1A1A1A',
                  cursor: 'pointer',
                }}
              >
                Add a name
              </button>
            )
          ) : (
            <div className="m-brand">
              TYPE<span className="m-brand-dot">.</span>
            </div>
          )}
          <div className="m-header-right-placeholder" />
          <div className="m-header-divider" />
        </div>

        {phase === 'input' && (
          <div className="m-context-bar">
            <div className="m-context-left">
              <SliderIcon3Lines />
              <span>Context</span>
            </div>
            <div className="m-context-chips">
              {headerStageChip}
              {headerInterestChip}
            </div>
          </div>
        )}

        {/* results summary bar removed per spec */}

        {phase === 'input' ? (
          <div className="m-content">
            <div className="m-card">
              <div className="m-card-title-row">
                <div className="m-card-title">HIS / HER MESSAGE</div>
                <button
                  className="m-icon-btn"
                  onClick={() => {
                    setScreenshotOpen((v) => !v)
                  }}
                  aria-label="Upload screenshot"
                  title="Upload screenshot"
                >
                  <CameraIcon />
                </button>
              </div>
              {screenshotPreview ? (
                <div className="m-message-with-thumb">
                  <textarea
                    className="m-textarea m-textarea-with-thumb"
                    placeholder="Optional — we read their message from your screenshot"
                    value={replyMsg}
                    onChange={(e) => setReplyMsg(e.target.value)}
                  />
                  <div className="m-upload-thumb-side">
                    <img className="m-upload-thumb-small" src={screenshotPreview} alt="screenshot preview" />
                    <button
                      className="m-upload-remove-overlay m-upload-remove-small"
                      onClick={() => {
                        URL.revokeObjectURL(screenshotPreview)
                        screenshotFileRef.current = null
                        setScreenshotPreview(null)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      aria-label="Remove screenshot"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ) : (
                <textarea
                  className="m-textarea"
                  placeholder="Paste what they sent you..."
                  value={replyMsg}
                  onChange={(e) => setReplyMsg(e.target.value)}
                />
              )}

              {!screenshotPreview && screenshotOpen && (
                <div style={{ marginTop: 12 }}>
                  <div
                    className="m-upload"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <CameraIcon />
                    <div className="m-upload-label">Upload a screenshot</div>
                  </div>
                  <div className="m-upload-hint">
                    AI reads the chat from your screenshot. You can leave the text box empty or add a note.
                  </div>
                </div>
              )}
            </div>

            <div className="m-card m-idea-card">
              <div className="m-card-title-row">
                <div className="m-card-title">WHAT I WANT TO SAY</div>
                <div className="m-card-optional">optional</div>
              </div>
              <textarea
                className="m-textarea m-idea-textarea"
                placeholder="e.g. I also like hiking, tell me more about yours?"
                value={myIdea}
                onChange={(e) => setMyIdea(e.target.value)}
              />
              <div className="m-idea-hint">Leave blank — AI will craft something from scratch</div>
            </div>

            <div className="m-card">
              <div className="m-card-title-row">
                <div className="m-card-title">STYLE — Up to 3</div>
                <div style={{ width: 28 }} />
              </div>

              <div className="m-style-chips-grid">
                {STYLE_KEYS.map((k) => {
                  const selected = activeStyles.includes(k)
                  const c = STYLE_COLORS[k]
                  return (
                    <button
                      key={k}
                      className={`m-style-chip ${selected ? 'selected' : ''}`}
                      onClick={() => onToggleStyle(k)}
                      disabled={!selected && replyStyles.length >= 3}
                      style={{
                        background: selected ? c.macaron : c.phoneBg,
                        color: c.text,
                        borderColor: selected ? c.chipBorder : 'transparent',
                        opacity: selected ? 1 : 0.45,
                      }}
                    >
                      {STYLE_LABELS[k]}
                    </button>
                  )
                })}
              </div>
            </div>

            {generationError && (
              <div className="m-input-inline-error" role="alert">
                {generationError}
              </div>
            )}

            <button
              className="m-generate-btn"
              disabled={!canGenerate || activeLoading}
              onClick={startGenerate}
            >
              {activeLoading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        ) : (
          <div className="m-results-scroll">
              {/* Left message bubble (text or screenshot) */}
              <div className="m-results-their-message-block">
                {screenshotPreview ? (
                  <div className="m-screenshot-bubble-wrap">
                    <div className="m-screenshot-bubble">
                      <img
                        className="m-screenshot-img"
                        src={screenshotPreview}
                        alt="uploaded screenshot"
                      />
                    </div>
                    <button
                      type="button"
                      className="m-screenshot-pencil-btn"
                      onClick={backToInputForEdit}
                      aria-label="Back to edit message and screenshot"
                    >
                      <PencilIconMuted />
                    </button>
                  </div>
                ) : (
                  <div className="m-textbubble-row">
                    <div className="m-textbubble-view">{replyMsg.trim() || ' '}</div>
                    <button
                      type="button"
                      className="m-textbubble-pencil-btn"
                      onClick={backToInputForEdit}
                      aria-label="Back to edit message"
                    >
                      <PencilIconMuted />
                    </button>
                  </div>
                )}
                <p className="m-results-edit-hint">Tap the pencil to return and edit your message.</p>
              </div>

              {generationError && (
                <div style={{ fontSize: 11, color: '#8A8A8A', marginBottom: 6 }}>
                  {generationError}
                </div>
              )}

              {/* AI replies + style chips flow together (chips sit flush under last bubble) */}
              <div className="m-results-ai-stack">
                <div className="m-results-ai-bubbles">
                  {activeLoading ? (
                    <div className="m-typing" aria-label="typing">
                      <span className="m-typing-dot" />
                      <span className="m-typing-dot" />
                      <span className="m-typing-dot" />
                    </div>
                  ) : (
                    displayBubbles.map((b, idx) => (
                      <AiBubble
                        key={b.styleKey}
                        styleKey={b.styleKey}
                        text={b.text}
                        color={STYLE_COLORS[b.styleKey]}
                        animDelayMs={idx * 100}
                        onCopy={onCopied}
                      />
                    ))
                  )}
                </div>

                <div className="m-results-style-chips">
                  <div className="m-bottom-style-grid">
                    {STYLE_KEYS.map((k) => {
                      const selected = activeStyles.includes(k)
                      const c = STYLE_COLORS[k]
                      const disabled = !selected && activeStyles.length >= 3
                      return (
                        <button
                          key={k}
                          className={`m-style-chip ${selected ? 'selected' : ''}`}
                          onClick={() => onToggleStyle(k)}
                          disabled={disabled || activeLoading}
                          style={{
                            background: c.macaron,
                            color: c.text,
                            borderColor: selected ? c.chipBorder : 'transparent',
                            opacity: selected ? 1 : 0.4,
                          }}
                        >
                          {STYLE_LABELS[k]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
        )}
      </div>

      {/* Hidden file input for screenshot upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          handleScreenshotFile(file)
          // Allow re-selecting the same file.
          e.target.value = ''
        }}
      />

      <FlameDrawer
        open={drawerOpen}
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelectProfile={(id) => setActiveProfileId(id)}
        onClose={() => setDrawerOpen(false)}
        onAddProfile={addProfile}
        onDeleteProfile={deleteProfile}
        onRenameProfile={renameProfile}
        onToggleStar={toggleStar}
        userProfile={userProfile}
      />

      <StageBottomSheet
        open={sheet === 'stage'}
        draft={stageDraft}
        onChange={(v) => setStageDraft(v)}
        onApply={() => {
          setStageLevel(stageDraft)
          setStageApplied(true)
          setSheet(null)
        }}
        onClose={() => setSheet(null)}
      />

      <InterestBottomSheet
        open={sheet === 'interest'}
        draft={interestDraft}
        onChange={(v) => setInterestDraft(v)}
        onApply={() => {
          setInterestLevel(interestDraft)
          setInterestApplied(true)
          setSheet(null)
        }}
        onClose={() => setSheet(null)}
      />

      {showNewChatFab && (
        <button
          type="button"
          className="m-new-chat-fab"
          onClick={startNewChatSameFlame}
          title={
            activeProfile
              ? `New chat with ${activeProfile.name} — same person, fresh message`
              : 'New draft — pick a name in Flames when you want this tied to someone'
          }
          aria-label={
            activeProfile
              ? `New chat with ${activeProfile.name}, same person`
              : 'Start a new draft'
          }
        >
          <NewChatSameFlameIcon />
        </button>
      )}
    </div>
  )
}


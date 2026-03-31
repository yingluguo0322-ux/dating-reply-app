import { useState, useCallback, useEffect, useRef } from 'react'
import './App.css'
import LandingPage from './components/LandingPage'

// ── Constants ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'flame_profiles'
const SIDEBAR_KEY = 'sidebar_collapsed'
const STYLE_KEYS  = ['playful', 'flirty', 'witty', 'charming', 'sincere']
const MAX_STYLES  = 3

const STYLE_COLORS = {
  playful:  { macaron: '#F5C97A', chipBorder: '#D4A840', text: '#7A5500', phoneBg: '#FDF3D9' },
  flirty:   { macaron: '#F2A8A8', chipBorder: '#D07878', text: '#8B2020', phoneBg: '#FDEAEA' },
  witty:    { macaron: '#C4B5F4', chipBorder: '#9E88E0', text: '#3D2080', phoneBg: '#F0ECFD' },
  charming: { macaron: '#A8D5C2', chipBorder: '#78BFAA', text: '#1A5C42', phoneBg: '#E8F7F1' },
  sincere:  { macaron: '#A8C5E8', chipBorder: '#78A8D0', text: '#1A3D6B', phoneBg: '#E8F1FA' },
}

// ── Mock profiles ─────────────────────────────────────────────────────────────
const MOCK_PROFILES = [
  {
    id: 'alex', name: 'Alex', starred: false, createdAt: 1742400000000,
    history: [
      { time: '2026-03-20T14:23:00Z', theirMsg: '你最近在忙什么呀', myReply: '哈哈最近在学做饭！你呢？' },
      { time: '2026-03-22T19:45:00Z', theirMsg: '周末有空吗', myReply: '周末刚好有空，你有什么计划？' },
    ],
  },
  {
    id: 'mia', name: 'Mia', starred: false, createdAt: 1742400001000,
    history: [
      { time: '2026-03-21T11:10:00Z', theirMsg: '你喜欢什么类型的电影', myReply: '文艺片和悬疑片都喜欢，你呢？' },
      { time: '2026-03-23T20:30:00Z', theirMsg: '推荐一首歌给我', myReply: '推荐《Something Just Like This》！你呢？' },
    ],
  },
]

// ── i18n ──────────────────────────────────────────────────────────────────────
const t = {
  zh: {
    appTitle: 'Just My Type',
    appSubtitle: '让每一条回复，都恰到好处 💘',
    tab1: '帮我回复', tab2: '帮我改写',
    msgLabel: 'his / her message', msgPlaceholder: '粘贴对方的消息内容…',
    myTextLabel: '我想说的话', myTextPlaceholder: '例如：我也喜欢看电影',
    bgLabel: '背景信息', bgHint: '可选',
    bgPlaceholder: '你们怎么认识的？聊了多久？有什么特别的话题？',
    styleLabel: '回复风格', styleHint: '最多 3 个',
    generateBtn: '生成回复', generatingBtn: 'Generating...',
    rewriteBtn: '改写', rewritingBtn: 'Rewriting...',
    errorMsg: '请先粘贴对方的消息', errorMyText: '请先输入你想说的话',
    errorStyle: '请至少选择一种风格',
    sidebarTitle: '🔥 Flames', unboundLabel: '✦ 无绑定模式',
    newProfilePlaceholder: '输入名字，回车确认',
    historyThem: '对方', historyMe: '我回复了',
    phoneNewChat: 'New Chat',
    phonePlaceholder: '对方的消息会在这里出现...',
    aiDivider: '✦ AI 建议回复',
    phoneStatusTpl: (style) => `已选中 ${style} · 点击复制`,
    styles: { playful:'活泼', flirty:'撩人', witty:'机智', charming:'迷人', sincere:'真诚' },
  },
  en: {
    appTitle: 'Just My Type',
    appSubtitle: 'because your reply should feel like you 💘',
    tab1: 'Reply for me', tab2: 'Rewrite for me',
    msgLabel: 'his / her message', msgPlaceholder: 'Paste what they sent you…',
    myTextLabel: 'What I want to say', myTextPlaceholder: 'e.g. I like movies too',
    bgLabel: 'Background', bgHint: 'optional',
    bgPlaceholder: 'How did you meet? How long chatting? Shared interests?',
    styleLabel: 'Style', styleHint: 'Up to 3',
    generateBtn: 'Generate', generatingBtn: 'Generating...',
    rewriteBtn: 'Rewrite', rewritingBtn: 'Rewriting...',
    errorMsg: 'Please paste their message first', errorMyText: 'Please enter what you want to say',
    errorStyle: 'Please select at least one style',
    sidebarTitle: '🔥 Flames', unboundLabel: '✦ No Profile',
    newProfilePlaceholder: 'Enter name, press Enter',
    historyThem: 'Them', historyMe: 'I replied',
    phoneNewChat: 'New Chat',
    phonePlaceholder: 'Their message will appear here...',
    aiDivider: '✦ AI Suggestions',
    phoneStatusTpl: (style) => `${style} selected · click to copy`,
    styles: { playful:'Playful', flirty:'Flirty', witty:'Witty', charming:'Charming', sincere:'Sincere' },
  },
}

// ── Mock pools ────────────────────────────────────────────────────────────────
const replyPool = {
  zh: {
    playful:  ['哈哈这个我没想到，但说实话……完全能共鸣 😭', '等等我还没准备好接收这个信息 😭', '今天看到的最离谱的一条消息，但我喜欢 😭'],
    flirty:   ['你就这么说了，还指望我能正常回复吗', '好吧这感觉像是在针对我，但我不介意', '我本来挺淡定的，看完这条消息之后就不了'],
    witty:    ['你以为我能不想二十分钟就回出来？太大胆了', '我已经盯着这句话三分钟了，还在处理中', '我的大脑：正常回复。也是我的大脑：绝对不行'],
    charming: ['这是我最近听到的最好的话之一，是认真的', '这条消息让我今天好过了一点点', '我不是随便说这句话的——这真的很暖'],
    sincere:  ['谢谢你说这个，比你想象的更重要', '这对我真的意义很大，谢谢你', '很高兴你告诉我——真心的'],
  },
  en: {
    playful:  ["Okay I was NOT expecting that but honestly... same energy 😭", "Wait I'm sorry, I was NOT ready for this 😭", "This is the most chaotic thing I've read today and I'm here for it 😭"],
    flirty:   ["You can't just say that and expect me to act normal about it", "Okay but why does this feel like a personal attack", "I was doing fine until I read this, thanks for that"],
    witty:    ["Bold of you to assume I know how to respond to this without overthinking it for 20 minutes", "I've been staring at this for 3 minutes. Still processing.", "My brain: normal response. Also my brain: absolutely not."],
    charming: ["That's genuinely one of the nicest things anyone's said to me in a while", "Okay this actually made my day a little bit", "I don't say this lightly but that was really sweet"],
    sincere:  ["I really appreciate you saying that — means more than you know", "That genuinely means a lot to me, thank you", "I'm glad you told me that — honestly"],
  },
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function loadProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return MOCK_PROFILES
    const parsed = JSON.parse(raw)
    // Migrate old profiles that lack starred / createdAt fields
    return parsed.map((p, i) => ({
      starred: false,
      createdAt: Date.now() + i,
      ...p,
    }))
  } catch { return MOCK_PROFILES }
}

function buildContext(history, i18n) {
  if (!history.length) return ''
  const lines = history.map(h =>
    `${i18n.historyThem}：「${h.theirMsg}」→ ${i18n.historyMe}：「${h.myReply}」`
  ).join('\n')
  return `\n\n参考我们之前的对话风格和上下文：\n${lines}`
}

function getMockCards(styles, lang, pool) {
  const p = pool.en ?? pool[lang] ?? {}
  return styles.map((style, idx) => ({
    id: `${style}-${Date.now()}-${idx}`,
    style,
    text: p[style]?.[0] ?? '',
  }))
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

const PlusIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const CopyIconSm = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)

const CheckIconSm = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)

const StarIcon = ({ filled }) => (
  <svg width="15" height="15" viewBox="0 0 24 24"
    fill={filled ? '#F5A623' : 'none'}
    stroke={filled ? '#F5A623' : '#1A1A1A'}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

const PencilIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E53E3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ profiles, activeProfileId, collapsed, open, onToggleCollapse, onSelect, onAdd, onStar, onRename, onDelete, onClose, i18n }) {
  const [addingName, setAddingName]   = useState(false)
  const [newName, setNewName]         = useState('')
  const [contextMenu, setContextMenu] = useState(null) // { profileId, x, y }
  const [renamingId, setRenamingId]   = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null) // profileId
  const inputRef      = useRef(null)
  const renameRef     = useRef(null)
  const menuRef       = useRef(null)
  const longPressRef  = useRef(null)

  useEffect(() => { if (addingName) inputRef.current?.focus() }, [addingName])
  useEffect(() => { if (renamingId) renameRef.current?.focus() }, [renamingId])

  // Sort: starred first (preserving add-order within starred), then unstarred by createdAt
  const sortedProfiles = [...profiles].sort((a, b) => {
    if (a.starred && !b.starred) return -1
    if (!a.starred && b.starred) return 1
    return (a.createdAt || 0) - (b.createdAt || 0)
  })

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return
    function handle(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [contextMenu])

  function commitAdd() {
    const name = newName.trim()
    if (name) onAdd(name)
    setNewName(''); setAddingName(false)
  }

  function openContextMenu(profileId, clientX, clientY) {
    const menuW = 200
    const menuH = 150
    let x = clientX
    let y = clientY
    if (x + menuW > window.innerWidth - 8)  x = x - menuW
    if (y + menuH > window.innerHeight - 8) y = y - menuH
    setContextMenu({ profileId, x, y })
  }

  function handlePointerDown(profileId, e) {
    if (e.button === 2) return // right-click handled by onContextMenu
    const { clientX, clientY } = e
    longPressRef.current = setTimeout(() => {
      openContextMenu(profileId, clientX, clientY)
    }, 500)
  }

  function cancelLongPress() {
    clearTimeout(longPressRef.current)
  }

  function handleContextMenu(profileId, e) {
    e.preventDefault()
    cancelLongPress()
    openContextMenu(profileId, e.clientX, e.clientY)
  }

  function commitRename() {
    const name = renameValue.trim()
    if (name) onRename(renamingId, name)
    setRenamingId(null)
    setRenameValue('')
  }

  const ctxProfile = contextMenu ? profiles.find(p => p.id === contextMenu.profileId) : null

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar${collapsed ? ' collapsed' : ''}${open ? ' mobile-open' : ''}`}>
        <div className="sidebar-header">
          {!collapsed && <span className="sidebar-title">{i18n.sidebarTitle}</span>}
          <div className="sidebar-header-actions">
            <button className="sidebar-collapse-btn desktop-only" onClick={onToggleCollapse} title={collapsed ? 'Expand' : 'Collapse'}>
              {collapsed ? '›' : '‹'}
            </button>
            {!collapsed && (
              <button className="sidebar-add-btn" onClick={() => setAddingName(true)} title="Add person">
                <PlusIcon />
              </button>
            )}
          </div>
        </div>

        {!collapsed && addingName && (
          <div className="sidebar-add-wrap">
            <input
              ref={inputRef}
              className="sidebar-add-input"
              placeholder={i18n.newProfilePlaceholder}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitAdd()
                if (e.key === 'Escape') { setNewName(''); setAddingName(false) }
              }}
              onBlur={commitAdd}
            />
          </div>
        )}

        <div className="profile-list">
          {sortedProfiles.map(p => {
            const isActive   = activeProfileId === p.id
            const isRenaming = renamingId === p.id
            return (
              <div
                key={p.id}
                className={`profile-item${isActive ? ' active' : ''}`}
                onClick={() => { if (!isRenaming) { onSelect(p.id); onClose?.() } }}
                onContextMenu={e => handleContextMenu(p.id, e)}
                onPointerDown={e => handlePointerDown(p.id, e)}
                onPointerUp={cancelLongPress}
                onPointerLeave={cancelLongPress}
                onPointerMove={cancelLongPress}
              >
                <div
                  className={`profile-avatar${isActive ? ' avatar-active' : ''}`}
                  onClick={e => { e.stopPropagation(); openContextMenu(p.id, e.clientX, e.clientY) }}
                >{p.name[0].toUpperCase()}</div>

                {!collapsed && (
                  isRenaming ? (
                    <input
                      ref={renameRef}
                      className="profile-rename-input"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitRename()
                        if (e.key === 'Escape') { setRenamingId(null); setRenameValue('') }
                      }}
                      onBlur={commitRename}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span className="profile-name">
                      {p.name}
                      {p.starred && <span className="profile-star">★</span>}
                    </span>
                  )
                )}

                {collapsed && <span className="profile-tooltip">{p.name}</span>}
              </div>
            )
          })}
        </div>

        <div className="sidebar-divider" />
        <div
          className={`unbound-item${activeProfileId === null ? ' active' : ''}`}
          onClick={() => { onSelect(null); onClose?.() }}
        >
          <div className="unbound-icon">✦</div>
          {!collapsed && <span className="unbound-name">{i18n.unboundLabel}</span>}
          {collapsed && <span className="profile-tooltip">{i18n.unboundLabel}</span>}
        </div>
      </aside>

      {/* Context Menu */}
      {contextMenu && ctxProfile && (
        <div
          ref={menuRef}
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="context-menu-item"
            onClick={() => { onStar(ctxProfile.id); setContextMenu(null) }}
          >
            <StarIcon filled={ctxProfile.starred} />
            <span>{ctxProfile.starred ? 'Unstar' : 'Star'}</span>
          </button>
          <div className="context-menu-divider" />
          <button
            className="context-menu-item"
            onClick={() => {
              setRenamingId(ctxProfile.id)
              setRenameValue(ctxProfile.name)
              setContextMenu(null)
            }}
          >
            <PencilIcon />
            <span>Rename</span>
          </button>
          <div className="context-menu-divider" />
          <button
            className="context-menu-item danger"
            onClick={() => { setDeleteConfirm(ctxProfile.id); setContextMenu(null) }}
          >
            <TrashIcon />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {deleteConfirm && (
        <div className="confirm-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <p className="confirm-text">Delete this flame?</p>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                className="confirm-delete"
                onClick={() => { onDelete(deleteConfirm); setDeleteConfirm(null) }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── StyleSelector ─────────────────────────────────────────────────────────────
function StyleSelector({ styleLabels, selected, onToggle, i18n }) {
  return (
    <div className="input-card">
      <span className="field-label">
        {i18n.styleLabel}<span className="field-hint"> — {i18n.styleHint}</span>
      </span>
      <div className="style-grid">
        {STYLE_KEYS.map(key => {
          const isSelected = selected.includes(key)
          const isDisabled = !isSelected && selected.length >= MAX_STYLES
          const c = STYLE_COLORS[key]
          return (
            <button
              key={key}
              className={`style-chip${isSelected ? ' selected' : ''}`}
              disabled={isDisabled}
              onClick={() => onToggle(key)}
              style={isSelected
              ? { background: c.macaron, borderColor: c.chipBorder, color: c.text }
              : { background: c.phoneBg, borderColor: c.macaron + '66', color: c.text + '99' }
            }
            >
              {styleLabels[key]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── CollapsibleBgCard ─────────────────────────────────────────────────────────
function CollapsibleBgCard({ label, hint, placeholder, value, onChange, expanded, onToggle }) {
  return (
    <div className="input-card">
      <div className="input-card-header">
        <label className="field-label">
          {label}<span className="field-hint"> — {hint}</span>
        </label>
        <button className="collapse-toggle-btn" onClick={onToggle}>
          {expanded ? '∧' : '∨'}
        </button>
      </div>
      <div className={`collapsible-body${expanded ? '' : ' collapsed'}`}>
        <textarea
          className="textarea"
          style={{ height: '72px' }}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  )
}

// ── AiBubble ──────────────────────────────────────────────────────────────────
function AiBubble({ card, styleLabel, isSelected, onSelect, onCopy, onRegenerate, animDelay }) {
  const [justCopied, setJustCopied] = useState(false)
  const c = STYLE_COLORS[card.style]

  function handleCopy(e) {
    e.stopPropagation()
    navigator.clipboard.writeText(card.text).then(() => {
      setJustCopied(true)
      onCopy(card.text)
      setTimeout(() => setJustCopied(false), 1800)
    })
  }

  function handleRegenerate(e) {
    e.stopPropagation()
    onRegenerate()
  }

  return (
    <div className="bubble-ai-wrap">
      <div
        className={`bubble-ai${isSelected ? ' selected' : ''}`}
        style={{
          background: c.phoneBg,
          borderColor: isSelected ? c.chipBorder : 'transparent',
          animationDelay: `${animDelay}ms`,
        }}
        onClick={onSelect}
      >
        <span className="bubble-style-label" style={{ color: c.text }}>{styleLabel}</span>
        <p className="bubble-ai-text">{card.text}</p>
        <button
          className="bubble-regen-btn"
          onClick={handleRegenerate}
          style={{ color: c.text }}
        >
          ↺ Regenerate
        </button>
      </div>
      <button
        className="bubble-copy-icon"
        onClick={handleCopy}
        title="Copy"
        style={{ color: justCopied ? '#2D9C7A' : undefined }}
      >
        {justCopied ? <CheckIconSm /> : <CopyIconSm />}
      </button>
    </div>
  )
}

// ── PhonePreview ──────────────────────────────────────────────────────────────
function PhonePreview({
  mode,
  replyMsg, replyResults, replyLoading,
  rwText, rwResults, rwLoading,
  activeProfile, i18n,
  onCopied, onRegenerate,
}) {
  const [replySelectedId, setReplySelectedId] = useState(null)
  const [rwSelectedId,    setRwSelectedId]    = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [replyResults, rwResults, replyMsg, rwText, replyLoading, rwLoading])

  const results    = mode === 'reply' ? replyResults : rwResults
  const loading    = mode === 'reply' ? replyLoading : rwLoading
  const selectedId = mode === 'reply' ? replySelectedId : rwSelectedId
  const setSelectedId = mode === 'reply' ? setReplySelectedId : setRwSelectedId
  const selectedCard  = results.find(c => c.id === selectedId) ?? null

  const profileName    = activeProfile?.name || i18n.phoneNewChat
  const profileInitial = activeProfile ? activeProfile.name[0].toUpperCase() : '✦'

  function handleSelectCard(id) {
    setSelectedId(prev => prev === id ? null : id)
  }

  function handleStatusCopy() {
    if (!selectedCard) return
    navigator.clipboard.writeText(selectedCard.text).then(() => onCopied?.(selectedCard.text))
  }

  return (
    <div className="phone-wrapper">
      <div className="phone-frame">
        <div className="phone-notch-row">
          <div className="phone-notch-pill" />
        </div>

        <div className="phone-inner">
          <div className="phone-header">
            <button className="phone-back">‹</button>
            <div className="phone-avatar-sm">{profileInitial}</div>
            <span className="phone-name">{profileName}</span>
          </div>

          <div className="phone-messages" key={mode}>
            {mode === 'reply' && (
              replyMsg.trim() ? (
                <div className="bubble-them">{replyMsg}</div>
              ) : (
                <div className="bubble-placeholder">{i18n.phonePlaceholder}</div>
              )
            )}

            {mode === 'rewrite' && rwText.trim() && results.length === 0 && !loading && (
              <div className="bubble-me">{rwText}</div>
            )}

            {loading && (
              <div className="typing-indicator">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            )}

            {results.length > 0 && !loading && (
              <>
                <div className="ai-divider">
                  <span className="ai-divider-line" />
                  <span className="ai-divider-text">{i18n.aiDivider}</span>
                  <span className="ai-divider-line" />
                </div>
                {results.map((card, idx) => (
                  <AiBubble
                    key={card.id}
                    card={card}
                    styleLabel={i18n.styles[card.style]}
                    isSelected={selectedId === card.id}
                    onSelect={() => handleSelectCard(card.id)}
                    onCopy={onCopied ?? (() => {})}
                    onRegenerate={() => onRegenerate?.(card.id, card.style)}
                    animDelay={idx * 100}
                  />
                ))}
              </>
            )}

            <div ref={messagesEndRef} />
          </div>

          {selectedCard && (
            <div className="phone-status" onClick={handleStatusCopy}>
              {i18n.phoneStatusTpl(i18n.styles[selectedCard.style])}
            </div>
          )}
        </div>

        <div className="phone-bottom">
          <div className="phone-home-bar" />
        </div>
      </div>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('jmt_onboarded') === 'true')
  const [lang, setLang] = useState('zh')
  const [mode, setMode] = useState('reply')

  // Profiles / sidebar
  const [profiles,        setProfiles]        = useState(loadProfiles)
  const [activeProfileId, setActiveProfileId] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) === 'true' } catch { return false }
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Reply tab
  const [replyMsg,     setReplyMsg]     = useState('')
  const [replyBg,      setReplyBg]      = useState('')
  const [replyStyles,  setReplyStyles]  = useState([])
  const [replyResults, setReplyResults] = useState([])
  const [replyLoading, setReplyLoading] = useState(false)
  const [replyError,   setReplyError]   = useState('')

  // Screenshot upload (reply tab)
  const [screenshotOpen,    setScreenshotOpen]    = useState(false)
  const [screenshotPreview, setScreenshotPreview] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview)
    setScreenshotPreview(URL.createObjectURL(file))
  }, [screenshotPreview])

  const handleRemoveScreenshot = useCallback(() => {
    if (screenshotPreview) URL.revokeObjectURL(screenshotPreview)
    setScreenshotPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [screenshotPreview])

  // Rewrite tab
  const [rwText,    setRwText]    = useState('')
  const [rwBg,      setRwBg]      = useState('')
  const [rwStyles,  setRwStyles]  = useState([])
  const [rwResults, setRwResults] = useState([])
  const [rwLoading, setRwLoading] = useState(false)
  const [rwError,   setRwError]   = useState('')

  // Shared UI
  const [bgExpanded, setBgExpanded] = useState(true)

  const i = t[lang]
  const activeProfile = profiles.find(p => p.id === activeProfileId) ?? null
  const activeHistory = activeProfile?.history ?? []

  // Persist profiles
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles)) }, [profiles])

  const toggleSidebarCollapse = useCallback(() => {
    setSidebarCollapsed(v => {
      const next = !v
      localStorage.setItem(SIDEBAR_KEY, String(next))
      return next
    })
  }, [])

  const addProfile = useCallback((name) => {
    const id = `p-${Date.now()}`
    setProfiles(prev => [...prev, { id, name, starred: false, createdAt: Date.now(), history: [] }])
    setActiveProfileId(id)
  }, [])

  const deleteProfile = useCallback((id) => {
    setProfiles(prev => prev.filter(p => p.id !== id))
    setActiveProfileId(prev => prev === id ? null : prev)
  }, [])

  const starProfile = useCallback((id) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, starred: !p.starred } : p))
  }, [])

  const renameProfile = useCallback((id, name) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, name } : p))
  }, [])

  const handleCopied = useCallback((cardText) => {
    if (!activeProfileId) return
    const theirMsg = mode === 'reply' ? replyMsg : rwText
    if (!theirMsg.trim()) return
    const entry = { time: new Date().toISOString(), theirMsg: theirMsg.trim(), myReply: cardText }
    setProfiles(prev => prev.map(p =>
      p.id === activeProfileId ? { ...p, history: [...p.history, entry] } : p
    ))
  }, [activeProfileId, mode, replyMsg, rwText])

  const handleRegenerate = useCallback((cardId, style) => {
    const pool = replyPool[lang][style]
    const setter = mode === 'reply' ? setReplyResults : setRwResults
    setter(prev => prev.map(card => {
      if (card.id !== cardId) return card
      const others = pool.filter(t => t !== card.text)
      const next = others.length ? others[Math.floor(Math.random() * others.length)] : pool[Math.floor(Math.random() * pool.length)]
      return { ...card, text: next }
    }))
  }, [mode, lang])

  const toggleReplyStyle = useCallback((key) => {
    setReplyStyles(prev => prev.includes(key) ? prev.filter(s => s !== key) : prev.length >= MAX_STYLES ? prev : [...prev, key])
    setReplyError('')
  }, [])

  const toggleRwStyle = useCallback((key) => {
    setRwStyles(prev => prev.includes(key) ? prev.filter(s => s !== key) : prev.length >= MAX_STYLES ? prev : [...prev, key])
    setRwError('')
  }, [])

  const handleReplyGenerate = useCallback(() => {
    if (!replyMsg.trim()) { setReplyError(i.errorMsg); return }
    if (!replyStyles.length) { setReplyError(i.errorStyle); return }
    setReplyError(''); setReplyLoading(true); setReplyResults([])
    // eslint-disable-next-line no-unused-vars
    const _ctx = buildContext(activeHistory, i)
    setTimeout(() => { setReplyResults(getMockCards(replyStyles, lang, replyPool)); setReplyLoading(false) }, 1500)
  }, [replyMsg, replyStyles, lang, i, activeHistory])

  const handleRwGenerate = useCallback(() => {
    if (!rwText.trim()) { setRwError(i.errorMyText); return }
    if (!rwStyles.length) { setRwError(i.errorStyle); return }
    setRwError(''); setRwLoading(true); setRwResults([])
    // eslint-disable-next-line no-unused-vars
    const _ctx = buildContext(activeHistory, i)
    setTimeout(() => { setRwResults(getMockCards(rwStyles, lang, replyPool)); setRwLoading(false) }, 1500)
  }, [rwText, rwStyles, lang, i, activeHistory])

  if (!onboarded) {
    return (
      <LandingPage onNext={() => {
        localStorage.setItem('jmt_onboarded', 'true')
        setOnboarded(true)
      }} />
    )
  }

  return (
    <div className="shell">
      <Sidebar
        profiles={profiles}
        activeProfileId={activeProfileId}
        collapsed={sidebarCollapsed}
        open={sidebarOpen}
        onToggleCollapse={toggleSidebarCollapse}
        onSelect={setActiveProfileId}
        onAdd={addProfile}
        onStar={starProfile}
        onRename={renameProfile}
        onDelete={deleteProfile}
        onClose={() => setSidebarOpen(false)}
        i18n={i}
      />

      <div className="main-content">
        <div className="app">
          <header className="header">
            <div className="title-row">
              <button
                className="mobile-sidebar-btn"
                onClick={() => setSidebarOpen(v => !v)}
                aria-label="Open menu"
              >
                <MenuIcon />
              </button>
              <h1>{i.appTitle}</h1>
              <div className="lang-switch">
                <button className={`lang-link${lang === 'zh' ? ' active' : ''}`} onClick={() => setLang('zh')}>中文</button>
                <span className="lang-dot">·</span>
                <button className={`lang-link${lang === 'en' ? ' active' : ''}`} onClick={() => setLang('en')}>EN</button>
              </div>
            </div>
            <p className="header-subtitle">
              {activeProfile ? `💬 ${activeProfile.name}` : i.appSubtitle}
            </p>
          </header>

          <div className="layout">
            {/* Left: form */}
            <div className="col-left">
              <div className="mode-tabs">
                <button className={`mode-tab${mode === 'reply' ? ' active' : ''}`} onClick={() => setMode('reply')}>{i.tab1}</button>
                <button className={`mode-tab${mode === 'rewrite' ? ' active' : ''}`} onClick={() => setMode('rewrite')}>{i.tab2}</button>
              </div>

              {mode === 'reply' && (
                <div className="form">
                  <div className="input-card">
                    <div className="msg-label-row">
                      <label className="field-label">{i.msgLabel}</label>
                      <button
                        className={`camera-btn${screenshotOpen ? ' active' : ''}`}
                        onClick={() => setScreenshotOpen(v => !v)}
                        title="Upload screenshot"
                      >
                        <CameraIcon />
                      </button>
                    </div>
                    {screenshotOpen && (
                      <div className="screenshot-zone">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleFileChange}
                        />
                        {screenshotPreview ? (
                          <div className="screenshot-preview">
                            <img src={screenshotPreview} alt="screenshot preview" style={{ maxHeight: '80px' }} />
                            <button className="screenshot-remove" onClick={handleRemoveScreenshot}>×</button>
                          </div>
                        ) : (
                          <div className="screenshot-upload-area" onClick={() => fileInputRef.current?.click()}>
                            <CameraIcon />
                            <span>Upload a screenshot</span>
                          </div>
                        )}
                        <p className="screenshot-hint">AI will read the chat and fill in the message for you</p>
                      </div>
                    )}
                    <textarea className="textarea" style={{ height: '110px' }} placeholder={i.msgPlaceholder} value={replyMsg}
                      onChange={e => { setReplyMsg(e.target.value); setReplyError('') }} />
                  </div>
                  <CollapsibleBgCard label={i.bgLabel} hint={i.bgHint} placeholder={i.bgPlaceholder}
                    value={replyBg} onChange={e => setReplyBg(e.target.value)}
                    expanded={bgExpanded} onToggle={() => setBgExpanded(v => !v)} />
                  <StyleSelector styleLabels={i.styles} selected={replyStyles} onToggle={toggleReplyStyle} i18n={i} />
                  {replyError && <p className="form-error">{replyError}</p>}
                  <button className="generate-btn" disabled={replyLoading} onClick={handleReplyGenerate}>
                    {replyLoading ? i.generatingBtn : i.generateBtn}
                  </button>
                </div>
              )}

              {mode === 'rewrite' && (
                <div className="form">
                  <div className="input-card">
                    <label className="field-label">{i.myTextLabel}</label>
                    <textarea className="textarea" style={{ height: '110px' }} placeholder={i.myTextPlaceholder} value={rwText}
                      onChange={e => { setRwText(e.target.value); setRwError(''); setRwResults([]) }} />
                  </div>
                  <CollapsibleBgCard label={i.bgLabel} hint={i.bgHint} placeholder={i.bgPlaceholder}
                    value={rwBg} onChange={e => setRwBg(e.target.value)}
                    expanded={bgExpanded} onToggle={() => setBgExpanded(v => !v)} />
                  <StyleSelector styleLabels={i.styles} selected={rwStyles} onToggle={toggleRwStyle} i18n={i} />
                  {rwError && <p className="form-error">{rwError}</p>}
                  <button className="generate-btn" disabled={rwLoading} onClick={handleRwGenerate}>
                    {rwLoading ? i.rewritingBtn : i.rewriteBtn}
                  </button>
                </div>
              )}
            </div>

            {/* Right: phone preview */}
            <div className="col-right">
              <PhonePreview
                mode={mode}
                replyMsg={replyMsg}
                replyResults={replyResults}
                replyLoading={replyLoading}
                rwText={rwText}
                rwResults={rwResults}
                rwLoading={rwLoading}
                activeProfile={activeProfile}
                lang={lang}
                i18n={i}
                onCopied={handleCopied}
                onRegenerate={handleRegenerate}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

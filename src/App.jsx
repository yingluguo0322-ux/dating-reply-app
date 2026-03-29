import { useState, useCallback, useEffect, useRef } from 'react'
import './App.css'

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
    id: 'alex', name: 'Alex',
    history: [
      { time: '2026-03-20T14:23:00Z', theirMsg: '你最近在忙什么呀', myReply: '哈哈最近在学做饭！你呢？' },
      { time: '2026-03-22T19:45:00Z', theirMsg: '周末有空吗', myReply: '周末刚好有空，你有什么计划？' },
    ],
  },
  {
    id: 'mia', name: 'Mia',
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
    generateBtn: '生成回复', generatingBtn: '生成中…',
    rewriteBtn: '改写', rewritingBtn: '改写中…',
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
    generateBtn: 'Generate', generatingBtn: 'Generating…',
    rewriteBtn: 'Rewrite', rewritingBtn: 'Rewriting…',
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
    playful:  ['哈哈你这个问题太可爱了！说说你是怎么想到这个的？','哇你也喜欢这个吗？！感觉咱俩是同一频道的人，要不要继续聊聊？','这个问题问得好！我的答案有点出乎意料，你猜猜看？'],
    flirty:   ['你这是在故意撩我吗？因为效果相当不错。','嗯…想了好久，不过想到的都是和你有关的答案。','好吧你赢了，我承认我有点期待你的下一条消息。'],
    witty:    ['有趣的问题！我的第一反应是……说出来你可能要笑。不过笑了也好，笑起来好看。','结论是：答案取决于你接下来说什么。','正确答案有三种，但最有意思的那种需要你来配合。'],
    charming: ['你好像特别擅长问到点子上，这让我想多了解你一点。','说真的，不是每个人都能让我这么快就想继续聊下去的。','我喜欢你这个问题，简单但有深度——就像你给我的感觉。'],
    sincere:  ['我认真想了想，其实我更想先听听你的看法？','谢谢你问这个，说明你在认真了解我。我也想更了解你。','这让我想起了一件小事……不知道你有没有过类似的感受？'],
  },
  en: {
    playful:  ["Haha I literally laughed out loud. How did you even come up with that?","Wait, you're into that too?! I feel like we're on the same wavelength — wanna keep going?","Great question! My answer might surprise you… want to guess first?"],
    flirty:   ["Are you intentionally trying to get my attention? Because it's working.","I thought about this for a while and somehow all my answers kept coming back to you.","Okay fine — I'll admit I'm looking forward to what you say next."],
    witty:    ["Interesting! My first thought was… okay this might make you laugh. But hey, laughing looks good on you.","I analyzed this. Conclusion: the answer depends entirely on what you say next.","Logically three possible answers. The most interesting one requires your participation."],
    charming: ["You have this way of asking exactly the right things — makes me want to know more about you.","Honestly, not many people can get me this engaged this quickly.","I love that question — simple but deep. Kind of like the vibe I get from you."],
    sincere:  ["I genuinely thought about this… but I'd love to hear your take first?","Thanks for asking — it shows you're paying real attention. I want to know you better too.","That actually reminded me of something… have you ever felt the same way?"],
  },
}

const rewritePool = {
  zh: {
    playful:  ['这也是我啊！感觉找到同类了，笑死。你最近在……？','说到这个我就来劲了——你最喜欢哪种？！快说！','哈！！这个我太有共鸣了。你还喜欢什么？'],
    flirty:   ['嗯……这种事要两个人一起才更有意思，你说呢？','感觉你挺好约的？不是，我是说挺好聊的。','有些事一个人做总差点意思……你懂我意思吗？'],
    witty:    ['哦有意思，看来你是个有品位的人。品位好的人通常还有一个共同点，你知道是什么吗？','真正喜欢这个的人，通常隐藏着很有意思的故事。你呢？','你这句话让我想到了一个问题：如果只能留一个，你会怎么选？'],
    charming: ['这让我们有了第一个共同点。我猜不会是最后一个。','发现一个共同的东西，然后突然觉得对方更立体了。','你说这个的时候，我感觉我们之间多了一条细细的线。'],
    sincere:  ['真的吗，我也是！有时候就是这种小小的共同点让人感觉特别踏实。','听到你说这个，我莫名松了口气——感觉你是个很真实的人。','喜欢同一件事的两个人，聊起来都会很自然。'],
  },
  en: {
    playful:  ["Same!! I feel like we might be the same person, this is suspicious.","Okay now I need to know everything — what's your favorite kind?!","No way, me too! What else are you into?"],
    flirty:   ["Mmm… some things are just better with the right company, don't you think?","So what you're saying is you're easy to make plans with? I mean — easy to talk to.","There's a version of this that's way more fun with two people involved."],
    witty:    ["Interesting. People who like that tend to have one surprisingly good story. What's yours?","I've done research on this. People who say that usually mean something else entirely.","Follow-up question — I feel like there's a whole personality behind that statement."],
    charming: ["That's our first thing in common. Something tells me it won't be the last.","There's something really nice about finding a small overlap — suddenly the other person feels more real.","Simple things said genuinely say a lot."],
    sincere:  ["Really? Me too — funny how something small can make someone feel more familiar.","That actually made me smile. I feel like you're a pretty genuine person.","The easiest conversations always start like this — one honest little thing in common."],
  },
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function loadProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : MOCK_PROFILES
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
  const p = pool[lang]
  return styles.map((style, idx) => ({
    id: `${style}-${Date.now()}-${idx}`,
    style,
    text: p[style][Math.floor(Math.random() * p[style].length)],
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

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ profiles, activeProfileId, collapsed, onToggleCollapse, onSelect, onAdd, onDelete, i18n }) {
  const [addingName, setAddingName] = useState(false)
  const [newName, setNewName]       = useState('')
  const inputRef = useRef(null)

  useEffect(() => { if (addingName) inputRef.current?.focus() }, [addingName])

  function commitAdd() {
    const name = newName.trim()
    if (name) onAdd(name)
    setNewName(''); setAddingName(false)
  }

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <span className="sidebar-title">{i18n.sidebarTitle}</span>}
        <div className="sidebar-header-actions">
          <button className="sidebar-collapse-btn" onClick={onToggleCollapse} title={collapsed ? 'Expand' : 'Collapse'}>
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
        {profiles.map(p => {
          const isActive = activeProfileId === p.id
          return (
            <div key={p.id} className={`profile-item${isActive ? ' active' : ''}`} onClick={() => onSelect(p.id)}>
              <div className={`profile-avatar${isActive ? ' avatar-active' : ''}`}>{p.name[0].toUpperCase()}</div>
              {!collapsed && <span className="profile-name">{p.name}</span>}
              {!collapsed && (
                <button className="profile-delete" onClick={e => { e.stopPropagation(); onDelete(p.id) }} title="Delete">
                  ×
                </button>
              )}
              {collapsed && <span className="profile-tooltip">{p.name}</span>}
            </div>
          )
        })}
      </div>

      <div className="sidebar-divider" />
      <div className={`unbound-item${activeProfileId === null ? ' active' : ''}`} onClick={() => onSelect(null)}>
        <div className="unbound-icon">✦</div>
        {!collapsed && <span className="unbound-name">{i18n.unboundLabel}</span>}
        {collapsed && <span className="profile-tooltip">{i18n.unboundLabel}</span>}
      </div>
    </aside>
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
function AiBubble({ card, styleLabel, isSelected, onSelect, onCopy, animDelay }) {
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
  activeProfile, lang, i18n,
  onCopied,
}) {
  const [replySelectedId, setReplySelectedId] = useState(null)
  const [rwSelectedId,    setRwSelectedId]    = useState(null)
  const messagesEndRef = useRef(null)

  // Reset selection when results change
  useEffect(() => setReplySelectedId(null), [replyResults])
  useEffect(() => setRwSelectedId(null),    [rwResults])

  // Scroll to bottom on updates
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
        {/* Notch */}
        <div className="phone-notch-row">
          <div className="phone-notch-pill" />
        </div>

        {/* Screen */}
        <div className="phone-inner">
          {/* Header */}
          <div className="phone-header">
            <button className="phone-back">‹</button>
            <div className="phone-avatar-sm">{profileInitial}</div>
            <span className="phone-name">{profileName}</span>
          </div>

          {/* Messages — key=mode triggers fade on tab switch */}
          <div className="phone-messages" key={mode}>
            {/* Reply mode: their message or placeholder */}
            {mode === 'reply' && (
              replyMsg.trim() ? (
                <div className="bubble-them">{replyMsg}</div>
              ) : (
                <div className="bubble-placeholder">{i18n.phonePlaceholder}</div>
              )
            )}

            {/* Rewrite mode: my original text (only before AI results appear) */}
            {mode === 'rewrite' && rwText.trim() && results.length === 0 && !loading && (
              <div className="bubble-me">{rwText}</div>
            )}

            {/* Typing dots */}
            {loading && (
              <div className="typing-indicator">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            )}

            {/* AI results */}
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
                    animDelay={idx * 100}
                  />
                ))}
              </>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Status bar */}
          {selectedCard && (
            <div className="phone-status" onClick={handleStatusCopy}>
              {i18n.phoneStatusTpl(i18n.styles[selectedCard.style])}
            </div>
          )}
        </div>

        {/* Home bar */}
        <div className="phone-bottom">
          <div className="phone-home-bar" />
        </div>
      </div>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState('zh')
  const [mode, setMode] = useState('reply')

  // Profiles / sidebar
  const [profiles,        setProfiles]        = useState(loadProfiles)
  const [activeProfileId, setActiveProfileId] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) === 'true' } catch { return false }
  })

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
    setProfiles(prev => [...prev, { id, name, history: [] }])
    setActiveProfileId(id)
  }, [])

  const deleteProfile = useCallback((id) => {
    setProfiles(prev => prev.filter(p => p.id !== id))
    setActiveProfileId(prev => prev === id ? null : prev)
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
    setTimeout(() => { setReplyResults(getMockCards(replyStyles, lang, replyPool)); setReplyLoading(false) }, 900)
  }, [replyMsg, replyStyles, lang, i, activeHistory])

  const handleRwGenerate = useCallback(() => {
    if (!rwText.trim()) { setRwError(i.errorMyText); return }
    if (!rwStyles.length) { setRwError(i.errorStyle); return }
    setRwError(''); setRwLoading(true); setRwResults([])
    // eslint-disable-next-line no-unused-vars
    const _ctx = buildContext(activeHistory, i)
    setTimeout(() => { setRwResults(getMockCards(rwStyles, lang, rewritePool)); setRwLoading(false) }, 900)
  }, [rwText, rwStyles, lang, i, activeHistory])

  return (
    <div className="shell">
      <Sidebar
        profiles={profiles}
        activeProfileId={activeProfileId}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        onSelect={setActiveProfileId}
        onAdd={addProfile}
        onDelete={deleteProfile}
        i18n={i}
      />

      <div className="main-content">
        <div className="app">
          <header className="header">
            <div className="title-row">
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
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

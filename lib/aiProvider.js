/* global process */

import { stageLevelToLabel } from './stageLabels.js'
import { VISION_SCREENSHOT_REPLY_GUIDANCE } from './visionPrompts.js'

const STYLE_KEYS = ['playful', 'flirty', 'witty', 'charming', 'sincere']

const STYLE_DISPLAY = {
  playful: 'Playful',
  flirty: 'Flirty',
  witty: 'Witty',
  charming: 'Chic',
  sincere: 'Sincere',
}

const DATING_SYSTEM_PROMPT =
  process.env.SYSTEM_PROMPT_BASE ||
  `You are a witty, emotionally intelligent dating reply assistant. Help the user craft replies that feel 100% human: natural, confident, never robotic.

Rules:
- Do not use hyphens, em dashes (—), or en dashes (–) to join phrases; use a comma, period, or line break instead
- No cheesy lines or clichés
- Match the energy of the conversation
- Keep replies short: max 2 sentences, under 20 words
- Never start with "I" (sounds too formal)
- No exclamation marks unless the style truly calls for it
- Sound like a real person texting, not an AI writing an essay
- Leave a little mystery; don't over-explain
- You can use slang naturally to express emotion (e.g. ngl, lowkey, fr, omg, oop)
- You can occasionally use 1-2 emojis if it fits the vibe; don't overdo it
- Adapt tone based on interest level: 0 = polite but distant, 3 = warm and engaged, 5 = bold and flirty`

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest'
const ANTHROPIC_FALLBACK_MODELS = [
  ANTHROPIC_MODEL,
  'claude-3-7-sonnet-latest',
  'claude-sonnet-4-20250514',
  'claude-3-5-sonnet-latest',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-latest',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-latest',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
]

const SINCERE_STOPWORDS = new Set([
  'you',
  'the',
  'and',
  'for',
  'are',
  'but',
  'not',
  'that',
  'this',
  'with',
  'your',
  'what',
  'how',
  'was',
  'can',
  'too',
  'just',
  'like',
  'its',
  'got',
  'one',
  'all',
  'any',
  'our',
  'out',
  'who',
  'why',
])

/** Stock lines that ignore context; reject and retry. */
const SINCERE_BOILERPLATE_SNIPPETS = [
  'that actually meant a lot',
  'meant a lot, fr',
  'meant a lot fr',
  'meant a lot to hear',
  'genuinely appreciate you saying',
  'appreciate you saying that',
  'thank you, that landed',
  'that landed softer',
  'stuck with me more than i expected',
  'thank you so much for saying',
]

function hasSubstantiveTokens(theirMessage) {
  const parts = String(theirMessage || '')
    .toLowerCase()
    .split(/\s+/)
  for (const p of parts) {
    const w = p.replace(/[^\p{L}\p{N}]/gu, '')
    if (w.length >= 3 && !SINCERE_STOPWORDS.has(w)) return true
  }
  return false
}

function replyTouchesTheirMessage(reply, theirMessage) {
  const r = reply.toLowerCase()
  const parts = String(theirMessage || '')
    .toLowerCase()
    .split(/\s+/)
  for (const p of parts) {
    const w = p.replace(/[^\p{L}\p{N}]/gu, '')
    if (w.length < 3 || SINCERE_STOPWORDS.has(w)) continue
    if (r.includes(w)) return true
  }
  return false
}

const CJK_RE = /[\u3000-\u9fff\u3040-\u30ff\uac00-\ud7af]/u

/** True = bad (generic / boilerplate when we expect grounding). */
function sincereFailsGrounding(reply, theirMessage, hasImage) {
  const r = String(reply || '').toLowerCase()
  for (const s of SINCERE_BOILERPLATE_SNIPPETS) {
    if (r.includes(s)) return true
  }
  const tm = String(theirMessage || '').trim()
  if (!tm && hasImage) return false
  if (!tm) return false
  if (CJK_RE.test(tm)) return false
  if (!hasSubstantiveTokens(tm)) return false
  return !replyTouchesTheirMessage(reply, tm)
}

function buildUserPromptSingleStyle({
  theirMessage,
  myIdea,
  stageLabel,
  interestLevel,
  styleDisplayName,
  hasImage,
  styleKey,
}) {
  const text = String(theirMessage || '').trim()
  const imageOnly = hasImage && !text

  const theirLine = imageOnly
    ? `The person I'm texting just sent what's in the attached chat screenshot. Read it and reply to that.`
    : `The person I'm texting just sent: "${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`

  const ideaBlock = String(myIdea || '').trim()
    ? `\n\nWhat I'd like to get across (optional): ${String(myIdea).trim()}`
    : ''

  const sincereBlock =
    styleKey === 'sincere'
      ? `\n\nSincere (mandatory): React to the specifics of THEIR message above (echo a word, detail, feeling, or situation from it). Generic thank-you lines that could apply to anyone without referencing what they said are wrong. If you use "thanks" or similar, it must clearly follow from their content.`
      : ''

  return `${theirLine}

My interest level: ${interestLevel ?? 'N/A'}/5
Stage: ${stageLabel || 'N/A'}
Style: ${styleDisplayName}

Write ONE reply in the ${styleDisplayName} style. Just the reply, nothing else. Max 2 sentences, under 20 words. No em dash (—), no en dash (–), no spaced hyphen as a pause; commas are fine. Sound like a real human texting. Slang and 1-2 emojis are okay if it fits.${sincereBlock}${ideaBlock}`
}

function normalizeReply(text) {
  let t = String(text || '').trim()
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1).trim()
  }
  // Enforce "no dash as connector": em dash / en dash → comma (matches product rule).
  t = t
    .replace(/\s*[\u2014\u2013]\s*/g, ', ')
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/^\s*,\s*/, '')
    .replace(/\s*,\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return t
}

function buildReplySystem(extraSystem, image) {
  const vision = image?.base64 && image?.mediaType ? VISION_SCREENSHOT_REPLY_GUIDANCE : ''
  return [DATING_SYSTEM_PROMPT, extraSystem, vision].filter(Boolean).join('\n\n').trim()
}

async function generateViaAnthropic(userPrompt, extraSystem, modelId, image) {
  const system = buildReplySystem(extraSystem, image)

  const userContent =
    image?.base64 && image?.mediaType
      ? [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: image.mediaType,
              data: image.base64,
            },
          },
          { type: 'text', text: userPrompt },
        ]
      : userPrompt

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 256,
      temperature: 0.85,
      system,
      messages: [{ role: 'user', content: userContent }],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Anthropic API error (model=${modelId}): ${errText}`)
  }

  const data = await response.json()
  return data?.content?.find((b) => b?.type === 'text')?.text || ''
}

async function generateViaAnthropicWithFallback(userPrompt, extraSystem, image) {
  let lastError = null
  const tried = []

  for (const modelId of ANTHROPIC_FALLBACK_MODELS) {
    if (!modelId || tried.includes(modelId)) continue
    tried.push(modelId)
    try {
      return await generateViaAnthropic(userPrompt, extraSystem, modelId, image)
    } catch (error) {
      lastError = error
      const msg = String(error?.message || '')
      const notFound = msg.includes('not_found_error') || msg.includes('"model:')
      if (!notFound) throw error
    }
  }

  throw lastError || new Error('Anthropic API error: no model succeeded')
}

async function generateViaOpenAI(userPrompt, extraSystem, image) {
  const system = buildReplySystem(extraSystem, image)

  const userMessage =
    image?.base64 && image?.mediaType
      ? {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            {
              type: 'image_url',
              image_url: { url: `data:${image.mediaType};base64,${image.base64}` },
            },
          ],
        }
      : {
          role: 'user',
          content: userPrompt,
        }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.85,
      max_tokens: 256,
      messages: [{ role: 'system', content: system }, userMessage],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenAI API error: ${errText}`)
  }

  const data = await response.json()
  return data?.choices?.[0]?.message?.content || ''
}

async function generateOneStyle({
  styleKey,
  theirMessage,
  myIdea,
  stageLevel,
  interestLevel,
  extraSystem,
  hasImage,
  image,
  promptSuffix = '',
}) {
  const stageLabel = stageLevelToLabel(stageLevel) || 'N/A'
  const styleDisplayName = STYLE_DISPLAY[styleKey] || styleKey
  let userPrompt = buildUserPromptSingleStyle({
    theirMessage,
    myIdea,
    stageLabel,
    interestLevel,
    styleDisplayName,
    hasImage,
    styleKey,
  })
  if (promptSuffix) userPrompt += promptSuffix

  const raw = ANTHROPIC_API_KEY
    ? await generateViaAnthropicWithFallback(userPrompt, extraSystem, image)
    : await generateViaOpenAI(userPrompt, extraSystem, image)

  return normalizeReply(raw)
}

/** Retries; Sincere gets extra attempts and drops boilerplate / non-grounded drafts. */
async function generateOneStyleWithRetry(args) {
  const { styleKey, theirMessage, hasImage } = args
  const maxAttempts = styleKey === 'sincere' ? 3 : 2
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const suffix =
        styleKey === 'sincere' && i > 0
          ? '\n\nREGENERATE: Your last draft was rejected for being too generic. Tie at least one concrete detail from THEIR message (or, if screenshot-only, from what you see in the chat). Never use stock lines like "meant a lot" / "thanks for saying that" without naming what they said or did.'
          : ''
      const t = await generateOneStyle({ ...args, promptSuffix: suffix })
      if (!t) continue
      if (styleKey === 'sincere' && sincereFailsGrounding(t, theirMessage, hasImage)) {
        continue
      }
      return t
    } catch (e) {
      if (i === maxAttempts - 1) console.error('[generateOneStyle]', styleKey, e)
    }
  }
  return ''
}

export function getProvider() {
  return ANTHROPIC_API_KEY ? 'anthropic' : OPENAI_API_KEY ? 'openai' : 'none'
}

export async function generateReplies(payload) {
  const {
    theirMessage = '',
    myIdea = '',
    stageLevel = null,
    interestLevel = null,
    systemPrompt = '',
    imageBase64 = '',
    imageMediaType = '',
    styles: stylesFromClient = null,
  } = payload || {}

  if (!ANTHROPIC_API_KEY && !OPENAI_API_KEY) {
    throw new Error('No API key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env')
  }

  const hasImage = Boolean(String(imageBase64 || '').trim())
  const textOk = String(theirMessage || '').trim().length > 0
  if (!textOk && !hasImage) {
    throw new Error('theirMessage or screenshot image is required')
  }

  let mediaType = String(imageMediaType || 'image/jpeg').toLowerCase()
  if (!mediaType.startsWith('image/')) mediaType = 'image/jpeg'
  const visionOk = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
  if (hasImage && !visionOk.has(mediaType)) {
    throw new Error('Screenshot must be JPEG, PNG, GIF, or WebP for vision.')
  }
  const image = hasImage
    ? { base64: String(imageBase64).replace(/\s/g, ''), mediaType }
    : null

  let stylesToRun = Array.isArray(stylesFromClient)
    ? [...new Set(stylesFromClient.filter((s) => STYLE_KEYS.includes(s)))]
    : [...STYLE_KEYS]
  if (stylesToRun.length === 0) stylesToRun = ['playful']

  const extraSystem = String(systemPrompt || '').trim()

  const settled = await Promise.allSettled(
    stylesToRun.map((styleKey) =>
      generateOneStyleWithRetry({
        styleKey,
        theirMessage,
        myIdea,
        stageLevel,
        interestLevel,
        extraSystem,
        hasImage,
        image,
      })
    )
  )

  const replies = {}
  stylesToRun.forEach((key, i) => {
    const r = settled[i]
    if (r.status === 'fulfilled') {
      replies[key] = r.value || ''
    } else {
      console.error('[generateReplies] style failed:', key, r.reason)
      replies[key] = ''
    }
  })

  return { replies }
}

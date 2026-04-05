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
- Never use hyphens (-) as connectors in replies
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

function buildUserPromptSingleStyle({
  theirMessage,
  myIdea,
  stageLabel,
  interestLevel,
  styleDisplayName,
  hasImage,
}) {
  const text = String(theirMessage || '').trim()
  const imageOnly = hasImage && !text

  const theirLine = imageOnly
    ? `The person I'm texting just sent what's in the attached chat screenshot. Read it and reply to that.`
    : `The person I'm texting just sent: "${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`

  const ideaBlock = String(myIdea || '').trim()
    ? `\n\nWhat I'd like to get across (optional): ${String(myIdea).trim()}`
    : ''

  return `${theirLine}

My interest level: ${interestLevel ?? 'N/A'}/5
Stage: ${stageLabel || 'N/A'}
Style: ${styleDisplayName}

Write ONE reply in the ${styleDisplayName} style. Just the reply, nothing else. Max 2 sentences, under 20 words. No hyphens. Sound like a real human texting. Slang and 1-2 emojis are okay if it fits.${ideaBlock}`
}

function normalizeReply(text) {
  let t = String(text || '').trim()
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1).trim()
  }
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
}) {
  const stageLabel = stageLevelToLabel(stageLevel) || 'N/A'
  const styleDisplayName = STYLE_DISPLAY[styleKey] || styleKey
  const userPrompt = buildUserPromptSingleStyle({
    theirMessage,
    myIdea,
    stageLabel,
    interestLevel,
    styleDisplayName,
    hasImage,
  })

  const raw = ANTHROPIC_API_KEY
    ? await generateViaAnthropicWithFallback(userPrompt, extraSystem, image)
    : await generateViaOpenAI(userPrompt, extraSystem, image)

  return normalizeReply(raw)
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

  const texts = await Promise.all(
    stylesToRun.map((styleKey) =>
      generateOneStyle({
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
    replies[key] = texts[i]
  })

  return { replies }
}

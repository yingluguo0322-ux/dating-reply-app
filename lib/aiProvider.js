/* global process */

import { stageLevelToLabel } from './stageLabels.js'

const STYLE_KEYS = ['playful', 'flirty', 'witty', 'charming', 'sincere']

const BASE_SYSTEM_PROMPT = process.env.SYSTEM_PROMPT_BASE || [
  'You are a dating reply assistant.',
  'Return concise, natural, modern messages.',
  'Do not output explanations.',
].join(' ')

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

function buildPrompt({
  theirMessage,
  myIdea,
  stageLevel,
  interestLevel,
  systemPrompt,
  hasImage,
}) {
  const text = String(theirMessage || '').trim()
  const imageOnly = hasImage && !text

  const theirBlock = imageOnly
    ? 'Their message: The user only attached a chat screenshot (no typed text). Read the image, identify what the other person said that the user should reply to, and base all replies on that.'
    : `Their message: ${text}`

  const extraImageHint =
    hasImage && text
      ? 'A chat screenshot is also attached — use it together with the typed message when helpful.'
      : null

  const stageLine =
    stageLevel != null && stageLevel >= 1 && stageLevel <= 5
      ? `Relationship stage (1=just matched … 5=in a relationship): ${stageLevel} — ${stageLevelToLabel(stageLevel)}`
      : `Relationship stage (1-5): ${stageLevel ?? 'N/A'}`

  return [
    `System context: ${BASE_SYSTEM_PROMPT}`,
    systemPrompt ? `Additional system prompt: ${systemPrompt}` : null,
    stageLine,
    `Interest level (0-5, higher = stronger feelings): ${interestLevel ?? 'N/A'}`,
    theirBlock,
    extraImageHint,
    `My idea (optional): ${myIdea || ''}`,
    'Generate exactly one reply for each style key:',
    STYLE_KEYS.join(', '),
    'For style key "charming", use a chic tone (stylish, classy, modern).',
    'Return ONLY JSON with this exact shape:',
    '{"playful":"...","flirty":"...","witty":"...","charming":"...","sincere":"..."}',
  ].filter(Boolean).join('\n')
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1))
      } catch {
        return null
      }
    }
    return null
  }
}

async function generateViaAnthropic(promptText, systemPrompt, modelId, image) {
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
          { type: 'text', text: promptText },
        ]
      : promptText

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 900,
      temperature: 0.8,
      system: `${BASE_SYSTEM_PROMPT}\n${systemPrompt ? `Additional system prompt: ${systemPrompt}` : ''}`.trim(),
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

async function generateViaAnthropicWithFallback(promptText, systemPrompt, image) {
  let lastError = null
  const tried = []

  for (const modelId of ANTHROPIC_FALLBACK_MODELS) {
    if (!modelId || tried.includes(modelId)) continue
    tried.push(modelId)
    try {
      return await generateViaAnthropic(promptText, systemPrompt, modelId, image)
    } catch (error) {
      lastError = error
      const msg = String(error?.message || '')
      const notFound = msg.includes('not_found_error') || msg.includes('"model:')
      if (!notFound) throw error
    }
  }

  throw lastError || new Error('Anthropic API error: no model succeeded')
}

async function generateViaOpenAI(promptText, systemPrompt, image) {
  const userMessage =
    image?.base64 && image?.mediaType
      ? {
          role: 'user',
          content: [
            { type: 'text', text: `${systemPrompt ? `Additional system prompt: ${systemPrompt}\n` : ''}${promptText}` },
            {
              type: 'image_url',
              image_url: { url: `data:${image.mediaType};base64,${image.base64}` },
            },
          ],
        }
      : {
          role: 'user',
          content: `${systemPrompt ? `Additional system prompt: ${systemPrompt}\n` : ''}${promptText}`,
        }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.8,
      messages: [
        { role: 'system', content: `You must output valid JSON only. ${BASE_SYSTEM_PROMPT}` },
        userMessage,
      ],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenAI API error: ${errText}`)
  }

  const data = await response.json()
  return data?.choices?.[0]?.message?.content || ''
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

  const promptText = buildPrompt({
    theirMessage,
    myIdea,
    stageLevel,
    interestLevel,
    systemPrompt,
    hasImage,
  })
  const raw = ANTHROPIC_API_KEY
    ? await generateViaAnthropicWithFallback(promptText, systemPrompt, image)
    : await generateViaOpenAI(promptText, systemPrompt, image)

  const parsed = safeJsonParse(raw)
  if (!parsed) throw new Error('Model returned non-JSON output')

  const replies = {}
  for (const key of STYLE_KEYS) replies[key] = String(parsed[key] || '').trim()
  return { replies }
}


/* global process */

import {
  EXTRACT_CHAT_SYSTEM_PROMPT,
  EXTRACT_CHAT_USER_PROMPT,
} from './visionPrompts.js'

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
]

function stripJsonFence(text) {
  let t = String(text || '').trim()
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t)
  if (fence) t = fence[1].trim()
  return t
}

function parseExtractPayload(raw) {
  const t = stripJsonFence(raw)
  const data = JSON.parse(t)
  const interest = Number(data.suggestedInterest0to5)
  return {
    partnerDisplayName:
      data.partnerDisplayName == null
        ? null
        : String(data.partnerDisplayName).trim() || null,
    theirLastMessage: String(data.theirLastMessage || '').trim(),
    primaryLanguage: String(data.primaryLanguage || 'other'),
    scenario: String(data.scenario || '').trim(),
    intent: String(data.intent || '').trim(),
    suggestedInterest0to5: Number.isFinite(interest)
      ? Math.max(0, Math.min(5, Math.round(interest)))
      : 3,
    isGroupChat: Boolean(data.isGroupChat),
    confidenceNote:
      data.confidenceNote == null || data.confidenceNote === ''
        ? null
        : String(data.confidenceNote).trim(),
  }
}

async function extractViaAnthropic(image, modelId) {
  const userContent = [
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: image.mediaType,
        data: image.base64,
      },
    },
    { type: 'text', text: EXTRACT_CHAT_USER_PROMPT },
  ]

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 512,
      temperature: 0.1,
      system: EXTRACT_CHAT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Anthropic extract error (model=${modelId}): ${errText}`)
  }

  const data = await response.json()
  return data?.content?.find((b) => b?.type === 'text')?.text || ''
}

async function extractViaAnthropicWithFallback(image) {
  let lastError = null
  const tried = []
  for (const modelId of ANTHROPIC_FALLBACK_MODELS) {
    if (!modelId || tried.includes(modelId)) continue
    tried.push(modelId)
    try {
      return await extractViaAnthropic(image, modelId)
    } catch (error) {
      lastError = error
      const msg = String(error?.message || '')
      const notFound = msg.includes('not_found_error') || msg.includes('"model:')
      if (!notFound) throw error
    }
  }
  throw lastError || new Error('Anthropic extract: no model succeeded')
}

async function extractViaOpenAI(image) {
  const userMessage = {
    role: 'user',
    content: [
      { type: 'text', text: EXTRACT_CHAT_USER_PROMPT },
      {
        type: 'image_url',
        image_url: { url: `data:${image.mediaType};base64,${image.base64}` },
      },
    ],
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.1,
      max_tokens: 512,
      messages: [
        { role: 'system', content: EXTRACT_CHAT_SYSTEM_PROMPT },
        userMessage,
      ],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`OpenAI extract error: ${errText}`)
  }

  const data = await response.json()
  return data?.choices?.[0]?.message?.content || ''
}

/**
 * @param {{ imageBase64: string, imageMediaType: string, theirMessage?: string }} payload
 */
export async function extractChatFromScreenshot(payload) {
  if (!ANTHROPIC_API_KEY && !OPENAI_API_KEY) {
    throw new Error('No API key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env')
  }

  const rawB64 = String(payload?.imageBase64 || '').replace(/\s/g, '')
  if (!rawB64) {
    throw new Error('imageBase64 is required for extract-chat')
  }

  let mediaType = String(payload?.imageMediaType || 'image/jpeg').toLowerCase()
  if (!mediaType.startsWith('image/')) mediaType = 'image/jpeg'
  const visionOk = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
  if (!visionOk.has(mediaType)) {
    throw new Error('Screenshot must be JPEG, PNG, GIF, or WebP for vision.')
  }

  const image = { base64: rawB64, mediaType }

  const raw = ANTHROPIC_API_KEY
    ? await extractViaAnthropicWithFallback(image)
    : await extractViaOpenAI(image)

  try {
    return parseExtractPayload(raw)
  } catch {
    throw new Error(`extract-chat: could not parse model JSON: ${String(raw).slice(0, 200)}`)
  }
}

/* global process */
import 'dotenv/config'
import express from 'express'

const app = express()
app.use(express.json({ limit: '1mb' }))

const PORT = Number(process.env.API_PORT || 8787)
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
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
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const BASE_SYSTEM_PROMPT = process.env.SYSTEM_PROMPT_BASE || [
  'You are a dating reply assistant.',
  'Return concise, natural, modern messages.',
  'Do not output explanations.',
].join(' ')

const STYLE_KEYS = ['playful', 'flirty', 'witty', 'charming', 'sincere']

function buildPrompt({
  theirMessage,
  myIdea,
  stageLevel,
  interestLevel,
  systemPrompt,
}) {
  return [
    `System context: ${BASE_SYSTEM_PROMPT}`,
    systemPrompt ? `Additional system prompt: ${systemPrompt}` : null,
    `Stage level (1-5): ${stageLevel ?? 'N/A'}`,
    `Interest level (0-5): ${interestLevel ?? 'N/A'}`,
    `Their message: ${theirMessage || ''}`,
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

async function generateViaAnthropic(promptText, systemPrompt, modelId) {
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
      messages: [{ role: 'user', content: promptText }],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Anthropic API error (model=${modelId}): ${errText}`)
  }

  const data = await response.json()
  const raw = data?.content?.find((b) => b?.type === 'text')?.text || ''
  return raw
}

async function generateViaAnthropicWithFallback(promptText, systemPrompt) {
  let lastError = null
  const tried = []

  for (const modelId of ANTHROPIC_FALLBACK_MODELS) {
    if (!modelId || tried.includes(modelId)) continue
    tried.push(modelId)
    try {
      return await generateViaAnthropic(promptText, systemPrompt, modelId)
    } catch (error) {
      lastError = error
      const msg = String(error?.message || '')
      const notFound = msg.includes('not_found_error') || msg.includes('"model:')
      // Only continue fallback if model name is the issue.
      if (!notFound) throw error
    }
  }

  throw lastError || new Error('Anthropic API error: no model succeeded')
}

async function generateViaOpenAI(promptText, systemPrompt) {
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
        {
          role: 'user',
          content: `${systemPrompt ? `Additional system prompt: ${systemPrompt}\n` : ''}${promptText}`,
        },
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

app.get('/api/health', (_, res) => {
  res.json({
    ok: true,
    provider: ANTHROPIC_API_KEY ? 'anthropic' : OPENAI_API_KEY ? 'openai' : 'none',
  })
})

app.post('/api/generate', async (req, res) => {
  if (!ANTHROPIC_API_KEY && !OPENAI_API_KEY) {
    return res.status(500).json({
      error: 'No API key found. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env',
    })
  }

  const {
    theirMessage = '',
    myIdea = '',
    stageLevel = null,
    interestLevel = null,
    systemPrompt = '',
  } = req.body || {}

  if (!String(theirMessage).trim()) {
    return res.status(400).json({ error: 'theirMessage is required' })
  }

  try {
    const promptText = buildPrompt({ theirMessage, myIdea, stageLevel, interestLevel, systemPrompt })
    const raw = ANTHROPIC_API_KEY
      ? await generateViaAnthropicWithFallback(promptText, systemPrompt)
      : await generateViaOpenAI(promptText, systemPrompt)
    const parsed = safeJsonParse(raw)

    if (!parsed) {
      return res.status(502).json({ error: 'Model returned non-JSON output' })
    }

    const replies = {}
    for (const key of STYLE_KEYS) {
      replies[key] = String(parsed[key] || '').trim()
    }

    return res.json({ replies })
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Unexpected server error' })
  }
})

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})


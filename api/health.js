/* global process */
import { getProvider } from '../lib/aiProvider.js'

export default async function handler(_req, res) {
  const provider = getProvider()
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY
  const hasOpenAI = !!process.env.OPENAI_API_KEY

  return res.status(200).json({
    ok: provider !== 'none',
    provider,
    keys: {
      ANTHROPIC_API_KEY: hasAnthropic ? 'set' : 'missing',
      OPENAI_API_KEY: hasOpenAI ? 'set' : 'missing',
    },
    node: process.version,
    timestamp: new Date().toISOString(),
  })
}

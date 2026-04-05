import { extractChatFromScreenshot } from '../lib/extractChat.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const result = await extractChatFromScreenshot(req.body || {})
    return res.status(200).json(result)
  } catch (error) {
    const msg = String(error?.message || 'Unexpected server error')
    console.error('[extract-chat] error:', msg)
    const status = msg.includes('required') ? 400 : msg.includes('No API key') ? 500 : 502
    return res.status(status).json({ error: msg })
  }
}

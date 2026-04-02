/* global process */
import 'dotenv/config'
import express from 'express'
import { generateReplies, getProvider } from '../lib/aiProvider.js'

const app = express()
app.use(express.json({ limit: '1mb' }))

const PORT = Number(process.env.API_PORT || 8787)

app.get('/api/health', (_, res) => {
  res.json({
    ok: true,
    provider: getProvider(),
  })
})

app.post('/api/generate', async (req, res) => {
  try {
    const result = await generateReplies(req.body || {})
    return res.json(result)
  } catch (error) {
    const msg = String(error?.message || 'Unexpected server error')
    const status = msg.includes('required') ? 400 : msg.includes('No API key') ? 500 : 502
    return res.status(status).json({ error: msg })
  }
})

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})


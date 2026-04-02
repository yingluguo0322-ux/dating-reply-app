import { getProvider } from '../lib/aiProvider.js'

export default async function handler(_req, res) {
  return res.status(200).json({
    ok: true,
    provider: getProvider(),
  })
}


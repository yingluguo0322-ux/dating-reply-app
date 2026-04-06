const DB_NAME = 'type-reply-history'
const DB_VERSION = 1
const STORE_META = 'sessions'
const STORE_BLOBS = 'screenshots'
/** Keep ~30 entries so storage stays light; oldest auto-removed after saves; user can delete anytime. */
export const MAX_REPLY_HISTORY_SESSIONS = 32

function txComplete(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed'))
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'))
  })
}

function getAllMeta(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_META, 'readonly')
    const req = tx.objectStore(STORE_META).getAll()
    req.onerror = () => reject(req.error || new Error('IndexedDB read failed'))
    req.onsuccess = () => resolve(req.result || [])
  })
}

export function openReplyHistoryDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error || new Error('Could not open history DB'))
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS)
      }
    }
  })
}

async function trimAfterSave(db) {
  const all = await getAllMeta(db)
  if (all.length <= MAX_REPLY_HISTORY_SESSIONS) return
  all.sort((a, b) => a.createdAt - b.createdAt)
  const toRemove = all.slice(0, all.length - MAX_REPLY_HISTORY_SESSIONS)
  const tx = db.transaction([STORE_META, STORE_BLOBS], 'readwrite')
  for (const row of toRemove) {
    tx.objectStore(STORE_META).delete(row.id)
    tx.objectStore(STORE_BLOBS).delete(row.id)
  }
  await txComplete(tx)
}

/**
 * @param {object} meta — must include id, createdAt, plus session fields (no Blob)
 * @param {File | Blob | null} screenshot
 */
export async function saveReplySession(meta, screenshot) {
  const db = await openReplyHistoryDb()
  try {
    const tx = db.transaction([STORE_META, STORE_BLOBS], 'readwrite')
    tx.objectStore(STORE_META).put(meta)
    if (screenshot && screenshot.size > 0) {
      const mediaType =
        screenshot.type && screenshot.type.startsWith('image/')
          ? screenshot.type
          : 'image/jpeg'
      tx.objectStore(STORE_BLOBS).put({ blob: screenshot, mediaType }, meta.id)
    }
    await txComplete(tx)
    await trimAfterSave(db)
  } finally {
    db.close()
  }
}

export async function listReplySessions() {
  const db = await openReplyHistoryDb()
  try {
    const all = await getAllMeta(db)
    return all.sort((a, b) => b.createdAt - a.createdAt)
  } finally {
    db.close()
  }
}

export async function deleteReplySession(id) {
  if (!id) return
  const db = await openReplyHistoryDb()
  try {
    const tx = db.transaction([STORE_META, STORE_BLOBS], 'readwrite')
    tx.objectStore(STORE_META).delete(id)
    tx.objectStore(STORE_BLOBS).delete(id)
    await txComplete(tx)
  } finally {
    db.close()
  }
}

/** @returns {Promise<{ blob: Blob, mediaType: string } | null>} */
export async function getReplyScreenshot(sessionId) {
  const db = await openReplyHistoryDb()
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BLOBS, 'readonly')
      const req = tx.objectStore(STORE_BLOBS).get(sessionId)
      req.onerror = () => reject(req.error || new Error('IndexedDB read failed'))
      req.onsuccess = () => {
        const row = req.result
        if (!row?.blob) {
          resolve(null)
          return
        }
        resolve({ blob: row.blob, mediaType: row.mediaType || 'image/jpeg' })
      }
    })
  } finally {
    db.close()
  }
}

export function formatRelativeSessionTime(ts) {
  const diff = Math.max(0, Date.now() - ts)
  const sec = Math.floor(diff / 1000)
  if (sec < 45) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day === 1) return 'yesterday'
  if (day < 7) return `${day} days ago`
  return new Date(ts).toLocaleDateString(undefined, { weekday: 'short' })
}

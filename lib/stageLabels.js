/** 1 = earliest connection, 5 = most committed — keep in sync UI + AI prompt */
export const STAGE_OPTIONS = [
  'Just matched',
  'Chatting a few days',
  'Gone on a date',
  'Dating regularly',
  'In a relationship —',
]

export function stageLevelToLabel(level) {
  const n = Number(level)
  if (!Number.isFinite(n) || n < 1 || n > STAGE_OPTIONS.length) return null
  return STAGE_OPTIONS[n - 1]
}

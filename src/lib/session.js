const KEY = 'saarthi.session.v2'

export const PROFILE_FIELDS = ['work_type', 'age_band', 'family_size']

export const emptySession = {
  lang: null,
  corridorId: null,
  profile: {},
  query: '',
  docs: {},
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...emptySession }
    const parsed = JSON.parse(raw)
    return { ...emptySession, ...parsed, profile: parsed.profile || {}, docs: parsed.docs || {} }
  } catch {
    return { ...emptySession }
  }
}

export function saveSession(patch) {
  const next = { ...loadSession(), ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // storage full or blocked — the app still works for this visit
  }
  return next
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
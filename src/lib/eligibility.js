// Deterministic eligibility. No LLM, no guessing: a state is only reached when
// the scheme's own declared rules can be evaluated against what the worker told us.

export const STATES = {
  LIKELY: 'LIKELY_FITS',
  CHECK: 'CHECK_FIRST',
  PAPER: 'ONE_PAPER_NEEDED',
  NOT_HERE: 'NOT_HERE',
  NO_FIT: 'DOES_NOT_FIT',
}

export const PROFILE_FIELDS = ['work_type', 'age_band', 'family_size']

export const FIELD_LABELS = {
  work_type: { en: 'Work type', hi: 'काम का प्रकार', bn: 'কাজের ধরন', mr: 'कामाचा प्रकार' },
  age_band: { en: 'Age', hi: 'उम्र', bn: 'বয়স', mr: 'वय' },
  family_size: { en: 'Family size', hi: 'परिवार का आकार', bn: 'পরিবারের আকার', mr: 'कुटुंबाचा आकार' },
  has_uan: { en: 'UAN / PF number', hi: 'UAN / PF नंबर', bn: 'UAN / PF নম্বর', mr: 'UAN / PF क्रमांक' },
  card_type: { en: 'Ration / e-Shram card', hi: 'राशन / ई-श्रम कार्ड', bn: 'রেশন / ই-শ্রম কার্ড', mr: 'रेशन / ई-श्रम कार्ड' },
  employer_type: { en: 'Employer type', hi: 'मालिक का प्रकार', bn: 'নিয়োগকর্তার ধরন', mr: 'नियोक्ता प्रकार' },
}

export const fieldLabel = (field, lang = 'en') => (FIELD_LABELS[field] && (FIELD_LABELS[field][lang] || FIELD_LABELS[field].en)) || field

const isKnown = (value) => value !== undefined && value !== null && value !== ''

/** Pass = true, fail = false, unknown = null. Deterministic operators only. */
export function ruleResult(rule, profile = {}) {
  const value = profile[rule.field]
  if (!isKnown(value)) return null
  const target = rule.value
  switch (rule.op) {
    case 'eq':
      return String(value) === String(target)
    case 'neq':
      return String(value) !== String(target)
    case 'in':
      return String(target)
        .split('|')
        .map((item) => item.trim())
        .includes(String(value))
    case 'nin':
      return !String(target)
        .split('|')
        .map((item) => item.trim())
        .includes(String(value))
    default:
      return null
  }
}

/**
 * evaluate(scheme, profile) -> { state, rules_fired, missing_fields, papers_missing }
 * rules_fired entries: { field, op, value, label, status: 'pass' | 'fail' | 'unknown' | 'paper', kind }
 */
export function evaluate(scheme, profile = {}) {
  const rules = scheme?.eligibility_rules || []
  const required = scheme?.required_fields || []
  const rules_fired = []

  if (scheme?.portability === 'routed_out') {
    return {
      state: STATES.NOT_HERE,
      rules_fired: [
        {
          field: 'portability',
          kind: 'blocker',
          status: 'fail',
          label: scheme.portability_note_en || 'This scheme runs in the home state only, not where you now work.',
        },
      ],
      missing_fields: [],
      papers_missing: [],
    }
  }

  const missing = []
  const papersMissing = []
  let blocker = null

  for (const rule of rules) {
    const result = ruleResult(rule, profile)
    const kind = rule.kind || 'profile'
    if (result === null) {
      missing.push(rule.field)
      rules_fired.push({ ...rule, kind, status: 'unknown' })
      continue
    }
    if (result) {
      rules_fired.push({ ...rule, kind, status: 'pass' })
      continue
    }
    rules_fired.push({ ...rule, kind, status: kind === 'document' ? 'paper' : 'fail' })
    if (kind === 'document') {
      papersMissing.push(rule)
      continue
    }
    blocker = rule
    break
  }

  if (blocker) {
    return { state: STATES.NO_FIT, rules_fired, missing_fields: [], papers_missing: [], blocker }
  }

  const unknownRequired = required.filter((field) => !isKnown(profile[field]))
  const stillMissing = Array.from(new Set([...missing, ...unknownRequired]))

  if (stillMissing.length > 0) {
    return { state: STATES.CHECK, rules_fired, missing_fields: stillMissing, papers_missing: papersMissing }
  }
  if (papersMissing.length > 0) {
    return { state: STATES.PAPER, rules_fired, missing_fields: [], papers_missing: papersMissing }
  }
  return { state: STATES.LIKELY, rules_fired, missing_fields: [], papers_missing: [] }
}

/** Deterministic confidence. Unknown fields always pull it down; it never reaches 100. */
export function confidence(profile = {}, extras = {}) {
  let score = 28
  const answered = PROFILE_FIELDS.filter((field) => isKnown(profile[field])).length
  score += answered * 18
  if (isKnown(profile.has_uan)) score += 3
  if (isKnown(profile.card_type)) score += 3
  if (extras.hasCorridor) score += 6
  if (extras.verifiedSchemes) score += Math.min(4, extras.verifiedSchemes)
  return Math.max(0, Math.min(96, Math.round(score)))
}

export function countStates(evaluated = []) {
  return evaluated.reduce(
    (acc, item) => {
      acc.total += 1
      if (item.state === STATES.LIKELY) acc.likely += 1
      else if (item.state === STATES.CHECK) acc.check += 1
      else if (item.state === STATES.PAPER) acc.paper += 1
      else if (item.state === STATES.NOT_HERE) acc.nothere += 1
      else acc.nofit += 1
      return acc
    },
    { total: 0, likely: 0, check: 0, paper: 0, nothere: 0, nofit: 0 }
  )
}

export const STATE_ORDER = [STATES.LIKELY, STATES.PAPER, STATES.CHECK, STATES.NOT_HERE]

/** Verified benefit amounts only, LIKELY_FITS only — an honest floor, not a promise. */
export function coverTotal(evaluated = []) {
  const withAmount = evaluated.filter(
    (item) => item.state === STATES.LIKELY && Number(item.scheme?.benefit_amount) > 0
  )
  const total = withAmount.reduce((sum, item) => sum + Number(item.scheme.benefit_amount), 0)
  return { total, schemes: withAmount.map((item) => item.scheme) }
}

export function daysSince(isoDate, today = new Date()) {
  if (!isoDate) return null
  const then = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(then.getTime())) return null
  const diff = today.getTime() - then.getTime()
  return Math.floor(diff / 86400000)
}

export function isStale(isoDate, today = new Date(), staleDays = 120) {
  const age = daysSince(isoDate, today)
  if (age === null) return true
  return age > staleDays
}
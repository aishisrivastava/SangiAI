// Wage diary. Everything lives in this browser only — never on a server.
// The optional name/phone exist only in memory while a letter is generated.

const KEY = 'saarthi.ledger.v1'

export function loadLedger() {
  try {
    const raw = localStorage.getItem(KEY)
    const rows = raw ? JSON.parse(raw) : []
    return Array.isArray(rows) ? rows : []
  } catch {
    return []
  }
}

function persist(rows) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rows))
  } catch {
    // storage blocked — this session still works
  }
  return rows
}

export function addEntry(entry) {
  const row = {
    id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()),
    date: entry.date,
    hours: Number(entry.hours) || 0,
    paid: Number(entry.paid) || 0,
  }
  return persist([row, ...loadLedger()])
}

export function removeEntry(id) {
  return persist(loadLedger().filter((row) => row.id !== id))
}

export function clearLedger() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
  return []
}

export function summarize(rows) {
  return rows.reduce(
    (acc, row) => {
      acc.days += 1
      acc.hours += Number(row.hours) || 0
      acc.paid += Number(row.paid) || 0
      return acc
    },
    { days: 0, hours: 0, paid: 0 }
  )
}

const INDIC_DIGITS = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  '୦': '0', '୧': '1', '୨': '2', '୩': '3', '୪': '4', '୫': '5', '୬': '6', '୭': '7', '୮': '8', '୯': '9',
}

const WORD_NUMBERS = {
  एक: 1, दो: 2, तीन: 3, चार: 4, पांच: 5, पाँच: 5, छह: 6, सात: 7, आठ: 8, नौ: 9, दस: 10, बारह: 12,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12,
  एकदम: 1,
}

const normaliseNumbers = (text) =>
  String(text)
    .split('')
    .map((char) => INDIC_DIGITS[char] || char)
    .join('')

/** Deterministic first pass: "aaj 8 ghante kaam kiya, 400 rupaye mile" -> {hours: 8, paid: 400} */
export function parseEntry(rawText) {
  const text = normaliseNumbers(rawText || '').toLowerCase()
  if (!text) return null

  let hours = null
  let paid = null

  const hoursMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(ghant\w*|hours?|hrs?|घंट\w*|তাস|ঘণ্টা)/)
  if (hoursMatch) hours = Number(String(hoursMatch[1]).replace(',', '.'))

  const paidMatch =
    text.match(/(?:₹|rs\.?|rupees?|rupaye?|रुपय\w*|rupay|টাকা)\s*(\d{2,6})/) ||
    text.match(/(\d{2,6})\s*(?:₹|rs\.?|rupees?|rupaye?|रुपय\w*|rupay|টাকা)/)
  if (paidMatch) paid = Number(paidMatch[1])

  if (hours === null) {
    const wordMatch = text.match(new RegExp(`(${Object.keys(WORD_NUMBERS).join('|')})\\s*(ghant|hour|घंट)`))
    if (wordMatch) hours = WORD_NUMBERS[wordMatch[1]]
  }

  if (hours === null || paid === null) {
    const numbers = (text.match(/\d+(?:[.,]\d+)?/g) || []).map((value) => Number(String(value).replace(',', '.')))
    if (hours === null && numbers.length) hours = numbers.find((value) => value > 0 && value <= 16) ?? null
    if (paid === null && numbers.length > 1) paid = Math.max(...numbers)
    if (paid === null && numbers.length === 1 && hours === null) paid = numbers[0]
  }

  if (hours !== null && (hours <= 0 || hours > 24)) hours = null
  if (paid !== null && paid > 1000000) paid = null
  if (hours === null && paid === null) return null
  return { hours, paid }
}

const ledgerLines = (rows, lang) =>
  rows
    .slice(0, 12)
    .map((row) =>
      lang === 'hi'
        ? `${row.date}: ${row.hours} घंटे, मिले ₹${row.paid}`
        : `${row.date}: ${row.hours} hours, paid ₹${row.paid}`
    )
    .join('\n')

export function buildLetter({ lang = 'en', rows = [], months = '', amount = '', name = '', phone = '', destination = '' }) {
  const totals = summarize(rows)
  const today = new Date().toISOString().slice(0, 10)
  const place = destination || 'the city where I work'

  if (lang === 'hi') {
    return [
      `दिनांक: ${today}`,
      '',
      'सेवा में,',
      `ज़िला श्रम अधिकारी, ${place}`,
      '',
      'विषय: मज़दूरी न मिलने की शिकायत',
      '',
      'महोदय / महोदया,',
      '',
      `मैं, ${name || 'एक श्रमिक'}, श्रमिक हूँ। मैंने ${totals.days} दिन काम किया है और मुझे ₹${totals.paid} मिले हैं।${months ? ` पिछले ${months} महीने से मेरी मज़दूरी नहीं दी गई है।` : ''}${amount ? ` मेरा बकाया ₹${amount} है।` : ''}`,
      '',
      'मेरे काम का हिसाब:',
      ledgerLines(rows, 'hi') || '(कोई प्रविष्टि दर्ज नहीं)',
      '',
      'कृपया इस मामले की जाँच कर मेरी मज़दूरी दिलाने में सहायता करें।',
      '',
      'भवदीय,',
      name || '',
      phone ? `संपर्क: ${phone}` : '',
      '',
      'यह पत्र संगी एआई से तैयार हुआ है। यह जानकारी है, कानूनी सलाह नहीं।',
    ]
      .filter((line) => line !== '')
      .join('\n')
  }

  return [
    `Date: ${today}`,
    '',
    'To,',
    `The District Labour Officer, ${place}`,
    '',
    'Subject: Complaint regarding unpaid wages',
    '',
    'Respected Sir/Madam,',
    '',
    `I, ${name || 'a worker'}, work as a migrant worker. I have worked ${totals.days} days and received ₹${totals.paid}.${months ? ` My wages have been unpaid for ${months} months.` : ''}${amount ? ` The amount I am claiming is ₹${amount}.` : ''}`,
    '',
    'My record of work:',
    ledgerLines(rows, 'en') || '(no entries recorded)',
    '',
    'I request you to look into this matter and help me recover my wages.',
    '',
    'Yours sincerely,',
    name || '',
    phone ? `Contact: ${phone}` : '',
    '',
    'Prepared with Sangi AI. This is information, not legal advice.',
  ]
    .filter((line) => line !== '')
    .join('\n')
}

export const toCsv = (rows) =>
  ['date,hours,paid', ...rows.map((row) => `${row.date},${row.hours},${row.paid}`)].join('\n')
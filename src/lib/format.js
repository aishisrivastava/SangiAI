const LOCALES = { hi: 'hi-IN', bn: 'bn-IN', mr: 'mr-IN', te: 'te-IN', ta: 'ta-IN', gu: 'gu-IN', or: 'or-IN', en: 'en-IN' }

export function fmtDate(isoDate, lang = 'en') {
  if (!isoDate) return ''
  const date = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(date.getTime())) return String(isoDate)
  try {
    return new Intl.DateTimeFormat(LOCALES[lang] || 'en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
  } catch {
    return String(isoDate)
  }
}

export const rupees = (amount) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(amount) || 0)}`

export function waShareLink(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)
  const area = document.createElement('textarea')
  area.value = text
  document.body.appendChild(area)
  area.select()
  document.execCommand('copy')
  document.body.removeChild(area)
  return Promise.resolve()
}

export function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function timeAgoLabel(days) {
  if (days === null || days === undefined) return 'date unknown'
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}
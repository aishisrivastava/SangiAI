import React from 'react'
import { CheckCircle2, AlertTriangle, FileText, MapPinOff, XCircle } from 'lucide-react'
import { STATES } from '@/lib/eligibility'
import { t } from '@/lib/i18n'

const CONFIG = {
  [STATES.LIKELY]: {
    icon: CheckCircle2,
    key: 'statusLikely',
    wrap: 'border-likely/25 bg-likely/8',
    text: 'text-likely',
    dot: 'bg-likely',
    ring: 'ring-likely/20',
  },
  [STATES.PAPER]: {
    icon: FileText,
    key: 'statusPaper',
    wrap: 'border-paper/25 bg-paper/8',
    text: 'text-paper',
    dot: 'bg-paper',
    ring: 'ring-paper/20',
  },
  [STATES.CHECK]: {
    icon: AlertTriangle,
    key: 'statusCheck',
    wrap: 'border-check/30 bg-check/8',
    text: 'text-check',
    dot: 'bg-check',
    ring: 'ring-check/20',
  },
  [STATES.NOT_HERE]: {
    icon: MapPinOff,
    key: 'statusNotHere',
    wrap: 'border-nothere/25 bg-nothere/8',
    text: 'text-nothere',
    dot: 'bg-nothere',
    ring: 'ring-nothere/20',
  },
  [STATES.NO_FIT]: {
    icon: XCircle,
    key: 'statusCheck',
    wrap: 'border-border bg-muted',
    text: 'text-muted-foreground',
    dot: 'bg-nothere',
    ring: 'ring-border',
  },
}

export default function StatusPill({ state, lang, size = 'sm' }) {
  const config = CONFIG[state] || CONFIG[STATES.CHECK]
  const Icon = config.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ring-1 ${config.wrap} ${config.ring} ${
        size === 'lg' ? 'text-[12.5px] font-semibold' : 'text-[11.5px] font-semibold'
      }`}
    >
      <Icon className={`h-3.5 w-3.5 ${config.text}`} strokeWidth={2.4} />
      <span className={`${config.text} whitespace-nowrap`}>{t(lang, config.key)}</span>
    </span>
  )
}

export const stateAccent = (state) => (CONFIG[state] || CONFIG[STATES.CHECK]).dot
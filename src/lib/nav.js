import { Languages, ListChecks, NotebookPen, ShieldAlert } from 'lucide-react'

export const NAV = [
  { to: '/plan', icon: ListChecks, key: 'quickPlan' },
  { to: '/counter', icon: Languages, key: 'quickCounter' },
  { to: '/hisaab', icon: NotebookPen, key: 'quickHisaab' },
  { to: '/emergency', icon: ShieldAlert, key: 'quickEmergency' },
]
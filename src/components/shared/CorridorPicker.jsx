import React from 'react'
import { MapPin, Route } from 'lucide-react'
import { t } from '@/lib/i18n'

export default function CorridorPicker({ lang, corridors, value, onChange }) {
  if (!corridors?.length) return null
  return (
    <section className="mt-4">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <Route className="h-3.5 w-3.5" /> {t(lang, 'corridor')}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {corridors.map((corridor) => {
          const active = corridor.id === value
          return (
            <button
              key={corridor.id}
              type="button"
              onClick={() => onChange(corridor.id)}
              className={`tap shrink-0 rounded-2xl border px-3 py-2 text-left transition ${
                active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card'
              }`}
            >
              <span className="flex items-center gap-1 text-[12.5px] font-semibold leading-tight">
                <MapPin className="h-3 w-3" />
                {corridor.destination_city}
              </span>
              <span className={`mt-0.5 block text-[10.5px] ${active ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}>
                from {corridor.origin_state}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
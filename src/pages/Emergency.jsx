import React, { useEffect, useState } from 'react'
import { Phone, ShieldAlert, MapPin, ExternalLink, Info } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { base44 } from '@/api/base44Client'
import { loadSession } from '@/lib/session'
import { t } from '@/lib/i18n'

const GO_TYPES = ['labour_office', 'police', 'hospital']

export default function Emergency() {
  const session = loadSession()
  const lang = session.lang || 'hi'
  const [lines, setLines] = useState([])
  const [offices, setOffices] = useState([])

  useEffect(() => {
    base44.entities.Helpline
      .list()
      .then((rows) => {
        setLines((rows || []).filter((row) => (row.tags || []).includes('emergency')))
      })
      .catch(() => setLines([]))

    base44.entities.Corridor
      .list()
      .then((rows) => {
        const match = (rows || []).find((row) => row.id === session.corridorId) || (rows || [])[0]
        setOffices((match?.offices || []).filter((office) => GO_TYPES.includes(office.type)))
      })
      .catch(() => setOffices([]))
  }, [session.corridorId])

  const others = lines.filter((line) => line.number !== '112')

  return (
    <AppShell lang={lang} onOpenLang={() => {}}>
      <header>
        <h1 className="font-heading text-[clamp(22px,3vw,30px)] leading-tight">{t(lang, 'emergencyTitle')}</h1>
        <p className="mt-1 max-w-[60ch] text-[13px] leading-relaxed text-muted-foreground">{t(lang, 'emergencySub')}</p>
      </header>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
        <div className="space-y-3">
          <section className="rounded-3xl border border-destructive/25 bg-destructive/5 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-destructive">
              <ShieldAlert className="h-4 w-4" /> {t(lang, 'emergencyTitle')}
            </p>
            <a
              href="tel:112"
              className="mt-2 flex min-h-[72px] items-center justify-center gap-2 rounded-2xl bg-destructive px-4 text-[26px] font-bold text-destructive-foreground shadow-lift transition-transform active:scale-[0.99]"
            >
              <Phone className="h-6 w-6" /> {t(lang, 'callNow')} 112
            </a>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
              Police, ambulance and fire. One number across India, 24 hours.
            </p>
          </section>

          <section className="space-y-2">
            {others.map((line) => (
              <a
                key={line.number}
                href={`tel:${line.number}`}
                className="flex min-h-[64px] items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 shadow-soft transition-colors hover:border-primary/40"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10">
                  <Phone className="h-4 w-4 text-primary" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold leading-tight">{line.name}</span>
                  <span className="block text-[12px] leading-snug text-muted-foreground">{line.note_en}</span>
                </span>
                <span className="font-mono text-[14px] font-semibold text-primary">{line.number}</span>
              </a>
            ))}
            {others.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-muted/40 p-3 text-[12.5px] text-muted-foreground">
                Emergency numbers could not load. Dial 112 — it works without data.
              </p>
            ) : null}
          </section>
        </div>

        <section className="space-y-2">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t(lang, 'offices')}</h2>
          {offices.map((office) => (
            <div key={office.name} className="rounded-2xl border border-border bg-card p-3.5 shadow-soft">
              <p className="flex items-start gap-1.5 text-[13.5px] font-medium leading-snug">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {office.name}
              </p>
              {office.maps_query ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.maps_query)}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-1.5 inline-flex min-h-[40px] items-center gap-1 text-[12.5px] font-semibold text-primary"
                >
                  {t(lang, 'map')} <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
          ))}
          {offices.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-muted/40 p-3 text-[12.5px] text-muted-foreground">
              Pick your corridor on the plan screen and the nearest offices will appear here.
            </p>
          ) : null}
        </section>
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-2xl bg-muted/60 p-3 text-[12px] leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        Numbers come from an official, dated list. Scheme helplines are shown on the scheme cards, not here.
      </p>
    </AppShell>
  )
}
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Cpu, Database, EyeOff, Scale, TriangleAlert } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { base44 } from '@/api/base44Client'
import { loadSession } from '@/lib/session'
import { t } from '@/lib/i18n'

const SECTIONS = [
  {
    icon: Database,
    title: 'What is fixed data, not model output',
    body: 'Eligibility state, dates, source links, office lists, helpline numbers and the "how sure am I" score are computed in code from a stored dataset. A language model never writes a phone number, a URL, a date or a rule.',
  },
  {
    icon: Cpu,
    title: 'What the model does',
    body: 'Sarvam-105B turns the retrieved scheme facts into a short, calm explanation in your language. If retrieval is thin or the model reply fails validation, Sangi AI falls back to a fixed template and says so.',
  },
  {
    icon: EyeOff,
    title: 'What is never stored',
    body: 'No Aadhaar or ID numbers, no audio, no photos and no phone numbers are written to storage or logs. Your wage diary lives in this browser only, and the name and phone on a complaint letter exist in memory for that one letter.',
  },
  {
    icon: TriangleAlert,
    title: 'What we cannot promise',
    body: 'Scheme rules change without notice. Every entry carries a verified date and shows an amber "confirm at the office" badge once it is older than 120 days. This app gives information — it does not approve claims and is not legal advice.',
  },
  {
    icon: Scale,
    title: 'What we have not verified yet',
    body: 'Scheme entries in this build are curated from official portals and marked curated_sample until a person re-checks each fact against the portal. Those cards say so. Nothing is presented as officially verified when it is not.',
  },
]

export default function Trust() {
  const session = loadSession()
  const lang = session.lang || 'hi'
  const [stats, setStats] = useState(null)

  useEffect(() => {
    base44.entities.AnalyticsEvent
      .count({})
      .then((count) => setStats({ events: count }))
      .catch(() => setStats(null))
  }, [])

  return (
    <AppShell lang={lang} onOpenLang={() => {}}>
      <Link to="/" className="tap inline-flex items-center gap-1 text-[12px] font-semibold text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> {t(lang, 'back')}
      </Link>

      <h1 className="mt-2 font-heading text-[25px] leading-tight">{t(lang, 'trustTitle')}</h1>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
        Judge every claim here. This page explains exactly which parts are deterministic, which parts a model writes, and what remains unverified.
      </p>

      <div className="mt-4 space-y-2.5">
        {SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <section key={section.title} className="rounded-2xl border border-border bg-card p-3.5 shadow-soft">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold">
                <Icon className="h-4 w-4 text-primary" /> {section.title}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          )
        })}
      </div>

      <section className="mt-4 rounded-2xl border border-dashed border-border bg-muted/40 p-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Live counters</p>
        <p className="mt-1 text-[12.5px] leading-relaxed">
          {stats ? `${stats.events} anonymous events recorded on this app.` : 'Counters are unavailable right now.'}
        </p>
        <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
          Events carry only a kind, a language code and a corridor id. No question text, no identifiers.
        </p>
      </section>

      <section className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Sources used</p>
        <ul className="mt-1.5 space-y-1 text-[12px] leading-relaxed">
          {[
            ['e-Shram', 'https://eshram.gov.in'],
            ['PM-JAY (Ayushman Bharat)', 'https://pmjay.gov.in'],
            ['PM-SYM / Shram Yogi Maandhan', 'https://maandhan.in'],
            ['Atal Pension Yojana', 'https://www.npscra.nsdl.co.in'],
            ['Jan Suraksha (PMJJBY / PMSBY)', 'https://www.jansuraksha.gov.in'],
            ['Ministry of Labour & Employment', 'https://labour.gov.in'],
            ['Emergency response (ERSS)', 'https://112.gov.in'],
            ['Tele-MANAS', 'https://telemanas.mohfw.gov.in'],
          ].map(([name, url]) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noreferrer noopener" className="font-medium text-primary underline decoration-primary/30 underline-offset-2">
                {name}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground">
          A human must re-check every entry and date before this build is used to make a real claim.
        </p>
      </section>
    </AppShell>
  )
}
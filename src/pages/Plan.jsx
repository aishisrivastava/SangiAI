import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Sparkles,
  Volume2,
  Square,
  Share2,
  Printer,
  RotateCcw,
  ChevronDown,
  Loader2,
  Cpu,
  FileText,
  MapPin,
  TriangleAlert,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import PlanSummary from '@/components/plan/PlanSummary'
import SchemeCard from '@/components/plan/SchemeCard'
import StatusPill from '@/components/plan/StatusPill'
import LanguageSheet from '@/components/home/LanguageSheet'
import ProfileQuestions from '@/components/home/ProfileQuestions'
import CorridorPicker from '@/components/shared/CorridorPicker'
import JudgeDrawer from '@/components/judge/JudgeDrawer'
import { useJudge } from '@/lib/judge'
import { base44 } from '@/api/base44Client'
import { useVoice } from '@/lib/useVoice'
import { loadSession, saveSession, clearSession, PROFILE_FIELDS } from '@/lib/session'
import { STATES, STATE_ORDER, confidence, countStates, coverTotal, evaluate, isStale } from '@/lib/eligibility'
import { copyText, fmtDate, waShareLink } from '@/lib/format'
import { t } from '@/lib/i18n'

const STALE_DAYS = 120

export default function Plan() {
  const [params] = useSearchParams()
  const session = loadSession()

  const [lang, setLang] = useState(session.lang || 'hi')
  const [langOpen, setLangOpen] = useState(false)
  const [profile, setProfile] = useState(session.profile || {})
  const [corridorId, setCorridorId] = useState(session.corridorId || null)
  const [schemes, setSchemes] = useState(null)
  const [corridors, setCorridors] = useState([])
  const [helplines, setHelplines] = useState([])
  const [answer, setAnswer] = useState(null)
  const [answerState, setAnswerState] = useState('loading')
  const [showProfile, setShowProfile] = useState(false)
  const [showNofit, setShowNofit] = useState(false)
  const [copied, setCopied] = useState(false)
  const [judgeOpen, setJudgeOpen] = useState(false)
  const { judge } = useJudge()

  const query = params.get('q') || session.query || ''
  const voice = useVoice({ lang })
  const spokenRef = useRef(false)
  const today = useMemo(() => new Date(), [])

  useEffect(() => {
    let alive = true
    Promise.all([base44.entities.Scheme.list(), base44.entities.Corridor.list(), base44.entities.Helpline.list()])
      .then(([schemeRows, corridorRows, helplineRows]) => {
        if (!alive) return
        setSchemes(schemeRows || [])
        setCorridors(corridorRows || [])
        setHelplines(helplineRows || [])
      })
      .catch(() => {
        if (alive) setSchemes([])
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!corridorId && corridors.length) setCorridorId(corridors[0].id)
  }, [corridors, corridorId])

  useEffect(() => {
    if (!schemes) return
    let alive = true
    setAnswerState('loading')
    base44.functions
      .invoke('saarthiAnswer', { query, lang, corridor_id: corridorId, profile })
      .then((res) => {
        if (!alive) return
        setAnswer(res?.data || null)
        setAnswerState('ready')
      })
      .catch(() => {
        if (!alive) return
        setAnswer(null)
        setAnswerState('failed')
      })
    return () => {
      alive = false
    }
  }, [schemes, query, lang, corridorId, profile])

  useEffect(() => {
    if (answer?.answer && !spokenRef.current) {
      spokenRef.current = true
      voice.speak(answer.answer)
    }
  }, [answer, voice])

  const corridor = corridors.find((row) => row.id === corridorId) || null

  const evaluated = useMemo(() => {
    if (!schemes) return []
    return schemes.map((scheme) => {
      const result = evaluate(scheme, profile)
      return { scheme, ...result, stale: isStale(scheme.verified_date, today, STALE_DAYS) }
    })
  }, [schemes, profile, today])

  const counts = useMemo(() => countStates(evaluated), [evaluated])
  const cover = useMemo(() => coverTotal(evaluated), [evaluated])
  const score = confidence(profile, {
    hasCorridor: !!corridor,
    verifiedSchemes: evaluated.filter((item) => item.scheme.provenance === 'verified').length,
  })
  const answeredCount = PROFILE_FIELDS.filter((field) => profile[field]).length

  const grouped = useMemo(() => {
    return STATE_ORDER.map((state) => ({
      state,
      items: evaluated
        .filter((item) => item.state === state)
        .sort((a, b) => a.scheme.name_en.localeCompare(b.scheme.name_en)),
    })).filter((group) => group.items.length > 0)
  }, [evaluated])

  const noFit = evaluated.filter((item) => item.state === STATES.NO_FIT)

  const offices = corridor?.offices || []
  const RIGHTS_INTENT = /wage|salary|unpaid|contractor|मज़दूरी|मजदूरी|तनख्वाह|वेतन|ठेकेदार|बकाया/i
  const rightsIntent = RIGHTS_INTENT.test(query)
  const labourOffice = offices.find((office) => office.type === 'labour_office') || null
  const staleItem = evaluated
    .filter((item) => item.stale && item.scheme.verified_date)
    .sort((a, b) => String(a.scheme.verified_date).localeCompare(String(b.scheme.verified_date)))[0]
  const schemeHelplines = (scheme) =>
    (scheme.helpline_ids || [])
      .map((id) => helplines.find((line) => line.helpline_id === id))
      .filter(Boolean)

  const buildShareText = () => {
    const lines = [`Sangi AI · My plan${corridor ? ` (${corridor.origin_state} → ${corridor.destination_city})` : ''}`, '']
    grouped.forEach((group) => {
      group.items.forEach((item) => {
        lines.push(`• ${item.scheme.name_en} — ${t(lang, `status${group.state === STATES.LIKELY ? 'Likely' : group.state === STATES.PAPER ? 'Paper' : group.state === STATES.CHECK ? 'Check' : 'NotHere'}`)}`)
      })
    })
    if (offices.length) {
      lines.push('', 'Where to go:')
      offices.slice(0, 3).forEach((office) => lines.push(`• ${office.name}`))
    }
    lines.push('', 'Sources: eshram.gov.in · pmjay.gov.in · maandhan.in · labour.gov.in')
    lines.push('Confirm at the office. Sangi AI gives information, not approval.')
    return lines.join('\n')
  }

  const handleShare = async () => {
    const text = buildShareText()
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Sangi AI plan', text })
        return
      } catch {
        // fall through to copy
      }
    }
    await copyText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  const reset = () => {
    clearSession()
    window.location.href = '/'
  }

  return (
    <AppShell
      lang={lang}
      onOpenLang={() => setLangOpen(true)}
      aside={
        <>
          <PlanSummary
            lang={lang}
            counts={counts}
            score={score}
            cover={cover}
            corridor={corridor}
            profile={profile}
            onOpenProfile={() => setShowProfile(true)}
          />
          <CorridorPicker
            lang={lang}
            corridors={corridors}
            value={corridorId}
            onChange={(id) => {
              setCorridorId(id)
              saveSession({ corridorId: id })
            }}
          />
        </>
      }
    >
      {query ? (
        <button
          type="button"
          onClick={() => {
            window.location.href = '/'
          }}
          className="mb-3 w-full rounded-2xl border border-border bg-card px-3 py-2 text-left text-[12.5px] text-muted-foreground"
        >
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em]">You asked</span>
          <span className="mt-0.5 block text-[13px] text-foreground">“{query}”</span>
        </button>
      ) : null}

      <div className="xl:hidden">
        <PlanSummary
          lang={lang}
          counts={counts}
          score={score}
          cover={cover}
          corridor={corridor}
          profile={profile}
          onOpenProfile={() => setShowProfile((value) => !value)}
        />

        <CorridorPicker
          lang={lang}
          corridors={corridors}
          value={corridorId}
          onChange={(id) => {
            setCorridorId(id)
            saveSession({ corridorId: id })
          }}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-3 shadow-soft">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/10">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Sangi says
            </p>
            {answerState === 'loading' ? (
              <div className="mt-1.5 space-y-1.5">
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
                <div className="h-3 w-8/12 animate-pulse rounded bg-muted" />
              </div>
            ) : answer?.answer ? (
              <p className="mt-1 text-[13.5px] leading-relaxed">{answer.answer}</p>
            ) : (
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                I could not reach the answer service. The cards below are still computed from the saved scheme rules and are safe to use.
              </p>
            )}
          </div>
        </div>

        {answer?.answer ? (
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => (voice.status === 'speaking' ? voice.stopSpeaking() : voice.speak(answer.answer))}
              className="tap flex items-center gap-1.5 rounded-full bg-secondary px-3 text-[12px] font-semibold text-secondary-foreground"
            >
              {voice.status === 'speaking' ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              {t(lang, 'listen')}
            </button>
            {judge ? (
              <button
                type="button"
                onClick={() => setJudgeOpen(true)}
                className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-border px-3 text-[12px] font-semibold text-muted-foreground"
              >
                <Cpu className="h-3.5 w-3.5" /> Under the hood
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {rightsIntent ? (
        <section className="mt-4 grid gap-2 md:grid-cols-2">
          <a
            href="/hisaab"
            className="flex min-h-[48px] items-center gap-2 rounded-2xl bg-primary px-4 text-[14px] font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
          >
            <FileText className="h-4 w-4" /> Make my complaint letter
          </a>
          <div className="rounded-2xl border border-border bg-card p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Where to go</p>
            <p className="mt-0.5 flex items-start gap-1.5 text-[13px] font-medium leading-snug">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              {labourOffice?.name || 'District Labour Office'}
            </p>
            {labourOffice?.maps_query ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(labourOffice.maps_query)}`}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-1 inline-flex min-h-[40px] items-center gap-1 text-[12.5px] font-semibold text-primary"
              >
                Open in Maps
              </a>
            ) : null}
          </div>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setShowProfile((value) => !value)}
        className="mt-4 flex w-full items-center justify-between rounded-2xl border border-dashed border-border bg-muted/40 px-3 py-2.5 text-left"
      >
        <span className="text-[12.5px] font-semibold text-foreground">
          {answeredCount}/3 answered — change answers to see cards move
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showProfile ? 'rotate-180' : ''}`} />
      </button>

      {showProfile ? (
        <ProfileQuestions
          lang={lang}
          profile={profile}
          onChange={(next) => {
            setProfile(next)
            saveSession({ profile: next })
          }}
          compact
        />
      ) : null}

      {schemes === null ? (
        <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-6 text-[13px] text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {t(lang, 'loading')}
        </div>
      ) : null}

      {staleItem ? (
        <div className="mt-5 flex items-start gap-2 rounded-2xl border border-stale/30 bg-stale/10 px-3 py-2.5 text-[12.5px] leading-relaxed text-stale">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Some details were last checked on {fmtDate(staleItem.scheme.verified_date, lang)}. Please confirm at the office.
          </span>
        </div>
      ) : null}

      <div className="mt-5 space-y-5">
        {grouped.map((group) => (
          <section key={group.state}>
            <div className="mb-2 flex items-center justify-between">
              <StatusPill state={group.state} lang={lang} size="lg" />
              <span className="text-[11px] text-muted-foreground">{group.items.length}</span>
            </div>
            <div className="grid gap-2.5 md:grid-cols-2 2xl:grid-cols-3">
              {group.items.map((item) => (
                <SchemeCard
                  key={item.scheme.scheme_id}
                  item={item}
                  lang={lang}
                  today={today}
                  staleDays={STALE_DAYS}
                  helplines={schemeHelplines(item.scheme)}
                  officeHint={offices.filter((office) => (item.scheme.office_types || []).includes(office.type)).slice(0, 2)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {noFit.length ? (
        <div className="mt-5 rounded-2xl border border-border bg-muted/40 p-3">
          <button type="button" onClick={() => setShowNofit((value) => !value)} className="flex w-full items-center justify-between">
            <span className="text-[12.5px] font-semibold">{noFit.length} schemes do not fit what you told me</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showNofit ? 'rotate-180' : ''}`} />
          </button>
          {showNofit ? (
            <ul className="mt-2 space-y-1.5">
              {noFit.map((item) => (
                <li key={item.scheme.scheme_id} className="text-[12px] leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground/80">{lang === 'hi' && item.scheme.name_hi ? item.scheme.name_hi : item.scheme.name_en}</span>
                  {' — '}
                  {(item.blocker?.label_hi && lang === 'hi' ? item.blocker.label_hi : item.blocker?.label_en) || 'a rule did not match'}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {answer?.followups?.length ? (
        <section className="mt-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t(lang, 'askNext')}</p>
          <div className="flex flex-wrap gap-2">
            {answer.followups.slice(0, 3).map((followup) => (
              <button
                key={followup}
                type="button"
                onClick={() => {
                  window.location.href = `/plan?q=${encodeURIComponent(followup)}`
                }}
                className="rounded-full border border-border bg-card px-3 py-2 text-left text-[12px] leading-snug shadow-soft"
              >
                {followup}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-5 grid grid-cols-2 gap-2 no-print lg:sticky lg:bottom-0 lg:z-20 lg:rounded-t-2xl lg:border-t lg:border-border lg:bg-background/95 lg:py-3 lg:backdrop-blur">
        <button
          type="button"
          onClick={handleShare}
          className="tap flex items-center justify-center gap-2 rounded-2xl bg-primary px-3 text-[13px] font-semibold text-primary-foreground"
        >
          <Share2 className="h-4 w-4" /> {copied ? t(lang, 'copied') : t(lang, 'sharePlan')}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="tap flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-3 text-[13px] font-semibold"
        >
          <Printer className="h-4 w-4" /> {t(lang, 'printPlan')}
        </button>
        <a
          href={waShareLink(buildShareText())}
          target="_blank"
          rel="noreferrer noopener"
          className="tap col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-whatsapp px-3 text-[13px] font-semibold text-white transition-colors hover:opacity-90"
        >
          Send on WhatsApp
        </a>
      </section>

      <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {corridor?.notes_en || 'Offices and helplines are fixed data, not model output.'}
          {corridor?.destination_city ? ` · ${fmtDate(new Date().toISOString().slice(0, 10), lang)}` : ''}
        </span>
        <button type="button" onClick={reset} className="flex items-center gap-1 font-semibold text-primary">
          <RotateCcw className="h-3 w-3" /> {t(lang, 'startOver')}
        </button>
      </div>

      <JudgeDrawer open={judgeOpen} onClose={() => setJudgeOpen(false)} trace={{ answer, query }} />

      <LanguageSheet
        open={langOpen}
        onClose={() => setLangOpen(false)}
        lang={lang}
        onPick={(code) => {
          setLang(code)
          document.documentElement.lang = code
          saveSession({ lang: code })
        }}
      />
    </AppShell>
  )
}
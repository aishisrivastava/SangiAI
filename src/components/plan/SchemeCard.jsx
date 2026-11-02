import React from 'react'
import { ChevronDown, ExternalLink, CalendarClock, ShieldAlert, MapPin, Stethoscope, Phone } from 'lucide-react'
import StatusPill from '@/components/plan/StatusPill'
import { STATES, fieldLabel } from '@/lib/eligibility'
import { fmtDate } from '@/lib/format'
import { t } from '@/lib/i18n'

function RuleRow({ rule, lang }) {
  const label = (rule.label_hi && lang !== 'en' ? rule.label_hi : rule.label_en) || fieldLabel(rule.field, lang)
  const tone =
    rule.status === 'pass'
      ? 'text-likely'
      : rule.status === 'unknown'
        ? 'text-check'
        : rule.status === 'paper'
          ? 'text-paper'
          : 'text-destructive'
  const mark = rule.status === 'pass' ? '✓' : rule.status === 'unknown' ? '?' : rule.status === 'paper' ? '▣' : '✕'
  return (
    <li className="flex items-start gap-2 py-1.5">
      <span className={`mt-[1px] w-3 shrink-0 text-center text-[12px] font-bold ${tone}`}>{mark}</span>
      <span className="text-[12.5px] leading-relaxed text-foreground/85">{label}</span>
    </li>
  )
}

export default function SchemeCard({ item, lang, today, staleDays, helplines, officeHint }) {
  const [open, setOpen] = React.useState(false)
  const scheme = item.scheme
  const stale = item.stale
  const isLikely = item.state === STATES.LIKELY
  const name = lang === 'hi' && scheme.name_hi ? scheme.name_hi : scheme.name_en
  const summary = lang === 'hi' && scheme.summary_hi ? scheme.summary_hi : scheme.summary_en
  const title = lang === 'hi' && scheme.summary_hi ? scheme.summary_hi : summary

  return (
    <div
      className={`flex h-full flex-col rounded-2xl border bg-card shadow-soft transition hover:shadow-lift ${
        isLikely ? 'border-likely/30' : 'border-border'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full cursor-pointer p-3.5 text-left"
        aria-expanded={open}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {scheme.category || 'scheme'}
            </p>
            <h3 className="mt-1 text-[15.5px] font-semibold leading-snug">{name}</h3>
          </div>
          <ChevronDown className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>

        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">{title}</p>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <StatusPill state={item.state} lang={lang} />
          {stale ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-stale/35 bg-stale/10 px-2 py-1 text-[10.5px] font-semibold text-stale">
              <CalendarClock className="h-3 w-3" />
              {t(lang, 'stale')}
            </span>
          ) : null}
          {scheme.provenance === 'curated_sample' ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-1 text-[10.5px] font-semibold text-muted-foreground">
              <ShieldAlert className="h-3 w-3" />
              {t(lang, 'notVerified')}
            </span>
          ) : null}
        </div>

        {item.state === STATES.CHECK && item.missing_fields.length > 0 ? (
          <p className="mt-2 text-[11.5px] leading-relaxed text-check">
            {t(lang, 'missing')}: {item.missing_fields.map((field) => fieldLabel(field, lang)).join(' · ')}
          </p>
        ) : null}
        {item.state === STATES.PAPER && item.papers_missing.length > 0 ? (
          <p className="mt-2 text-[11.5px] leading-relaxed text-paper">
            {item.papers_missing.map((rule) => (lang === 'hi' && rule.label_hi ? rule.label_hi : rule.label_en)).join(' · ')}
          </p>
        ) : null}
      </button>

      {open ? (
        <div className="border-t border-border px-3.5 pb-3.5 pt-3">
          <p className="text-[12.5px] leading-relaxed text-foreground/80">{summary}</p>

          <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/40 p-2.5">
            <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {t(lang, 'why')}
            </p>
            <ul className="divide-y divide-border/60">
              {item.rules_fired.map((rule, index) => (
                <RuleRow key={`${rule.field}-${index}`} rule={rule} lang={lang} />
              ))}
            </ul>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted-foreground">
              {t(lang, 'confidence')}: {item.state === STATES.LIKELY ? 'rules passed on known facts' : 'some facts are still unknown'}
            </p>
          </div>

          {scheme.documents?.length ? (
            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t(lang, 'papers')}</p>
              <ul className="mt-1 space-y-1">
                {scheme.documents.map((doc) => (
                  <li key={doc} className="flex items-start gap-1.5 text-[12.5px] leading-relaxed">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    {doc}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {scheme.steps_en?.length ? (
            <div className="mt-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t(lang, 'steps')}</p>
              <ol className="mt-1 space-y-1.5">
                {scheme.steps_en.map((step, index) => (
                  <li key={step} className="flex items-start gap-2 text-[12.5px] leading-relaxed">
                    <span className="mt-[1px] grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {scheme.benefit_amount ? (
            <p className="mt-3 rounded-xl bg-primary/5 px-2.5 py-2 text-[12px] leading-relaxed text-primary">
              {t(lang, 'cover')}: up to ₹{new Intl.NumberFormat('en-IN').format(scheme.benefit_amount)} —{' '}
              {lang === 'hi' && scheme.benefit_note_hi ? scheme.benefit_note_hi : scheme.benefit_note_en}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px]">
            <span className="text-muted-foreground">
              {scheme.verified_date ? t(lang, 'verifiedOn', { date: fmtDate(scheme.verified_date, lang) }) : t(lang, 'notVerified')}
            </span>
            {scheme.official_portal ? (
              <a
                href={scheme.official_portal}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 font-semibold text-primary underline decoration-primary/30 underline-offset-2"
              >
                {t(lang, 'source')} <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </div>

          {helplines?.length ? (
            <div className="mt-2.5 space-y-1">
              {helplines.map((line) => (
                <a
                  key={line.number}
                  href={`tel:${line.number}`}
                  className="tap flex items-center gap-2 rounded-xl border border-border bg-background px-2.5 py-2 text-[12.5px]"
                >
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold">{line.name}</span>
                  <span className="ml-auto font-mono text-[12px] text-primary">{line.number}</span>
                </a>
              ))}
            </div>
          ) : null}

          {officeHint?.length ? (
            <div className="mt-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t(lang, 'offices')}</p>
              <ul className="mt-1 space-y-1">
                {officeHint.map((office) => (
                  <li key={office.name} className="flex items-start gap-1.5 text-[12.5px] leading-relaxed">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>
                      {office.name}
                      {office.maps_query ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.maps_query)}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="ml-1.5 font-semibold text-primary underline decoration-primary/30 underline-offset-2"
                        >
                          {t(lang, 'map')}
                        </a>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {scheme.provenance === 'curated_sample' ? (
            <p className="mt-2.5 flex items-start gap-1.5 rounded-xl border border-stale/30 bg-stale/8 p-2 text-[11px] leading-relaxed text-stale">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Facts in this entry are curated, not yet re-checked against the portal by a person. Confirm at the office.
            </p>
          ) : null}

          <p className="mt-2.5 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-muted-foreground">
            <Stethoscope className="mt-0.5 h-3 w-3 shrink-0" />
            This is information from published rules, not an approval. Only the office can confirm eligibility.
          </p>
        </div>
      ) : null}
    </div>
  )
}
import React from 'react'
import { ArrowUpRight, Gauge, IndianRupee, Route, ShieldCheck } from 'lucide-react'
import { t } from '@/lib/i18n'
import { PROFILE_FIELDS, STATES } from '@/lib/eligibility'
import { rupees } from '@/lib/format'

export default function PlanSummary({ lang, counts, score, cover, corridor, profile, onOpenProfile }) {
  const answered = PROFILE_FIELDS.filter((field) => profile?.[field]).length
  const summary = answered
    ? t(lang, 'summary', {
        likely: counts.likely,
        check: counts.check,
        paper: counts.paper,
        nothere: counts.nothere,
      })
    : lang === 'hi'
      ? 'यहाँ देखने लायक बातें दी गई हैं। अपने बारे में थोड़ा बताइए, मैं इसे और साफ़ कर दूँगा।'
      : 'Here is what is worth checking. Tell me a little about you and I will sharpen this.'

  const tone = score >= 75 ? 'bg-likely' : score >= 50 ? 'bg-check' : 'bg-stale'

  return (
    <section className="rounded-3xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-heading text-[22px] leading-tight">{t(lang, 'planTitle')}</h1>
        {corridor ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
            <Route className="h-3 w-3" />
            {corridor.origin_state} → {corridor.destination_city}
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/85">{summary}</p>

      <div className="mt-3.5 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full border border-likely/25 bg-likely/8 px-2.5 py-1 text-[11px] font-semibold text-likely">
          {counts.likely} · {t(lang, 'statusLikely')}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-paper/25 bg-paper/8 px-2.5 py-1 text-[11px] font-semibold text-paper">
          {counts.paper} · {t(lang, 'statusPaper')}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-check/30 bg-check/8 px-2.5 py-1 text-[11px] font-semibold text-check">
          {counts.check} · {t(lang, 'statusCheck')}
        </span>
        {counts.nothere ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-nothere/25 bg-nothere/8 px-2.5 py-1 text-[11px] font-semibold text-nothere">
            {counts.nothere} · {t(lang, 'statusNotHere')}
          </span>
        ) : null}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-background p-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground">
            <Gauge className="h-3.5 w-3.5" /> {t(lang, 'confidence')}
          </span>
          <span className="font-heading text-lg">{score}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full ${tone} transition-all duration-500`} style={{ width: `${score}%` }} />
        </div>
        <button
          type="button"
          onClick={onOpenProfile}
          className="mt-2 flex items-center gap-1 text-[11.5px] font-semibold text-primary"
        >
          {answered < 3 ? `Answer ${3 - answered} more to raise this` : 'Based on all three answers'}
          <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>

      {cover.total > 0 ? (
        <div className="mt-3 rounded-2xl border border-primary/20 bg-primary/5 p-3">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-primary">
            <IndianRupee className="h-3.5 w-3.5" /> {t(lang, 'cover')}
          </p>
          <p className="mt-1 font-heading text-[24px] leading-none text-primary">up to {rupees(cover.total)}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-primary/80">
            {cover.schemes.map((scheme) => (lang === 'hi' && scheme.name_hi ? scheme.name_hi : scheme.name_en)).join(' · ')}
          </p>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted-foreground">{t(lang, 'coverNote')}</p>
        </div>
      ) : (
        <p className="mt-3 flex items-start gap-1.5 rounded-2xl bg-muted/60 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          We only total amounts that are recorded with a source. Nothing is estimated.
        </p>
      )}
    </section>
  )
}
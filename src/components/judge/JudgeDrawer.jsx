import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Cpu, Clock, ShieldCheck, Route, Volume2, Database } from 'lucide-react'

const PROVIDERS = {
  'sarvam-105b': 'Sarvam-105B · primary',
  'base44-fallback': 'Base44 fallback',
  'rules-only': 'Rules only, no model',
}

const Row = ({ icon: Icon, label, value, mono }) => {
  const Component = Icon
  return (
    <div className="flex items-start gap-2 border-b border-border/70 py-2 last:border-0">
      <Component className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
        <p className={`text-[13px] leading-snug ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
      </div>
    </div>
  )
}

/**
 * Everything here comes from the real response of this request — nothing is
 * hard-coded. This is the only place dev-style diagnostics are allowed.
 */
export default function JudgeDrawer({ open, onClose, trace }) {
  const answer = trace?.answer || null
  const provider = answer?.provider || null
  const seconds = answer?.latency_ms ? (answer.latency_ms / 1000).toFixed(2) : null

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[420px]">
        <SheetHeader>
          <SheetTitle className="font-heading text-[18px]">Under the hood</SheetTitle>
        </SheetHeader>

        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
          Live pipeline for this answer. Nothing on this panel is written by the model.
        </p>

        <div className="mt-3">
          <Row icon={Route} label="Intent route" value={answer?.route || trace?.route} mono />
          <Row
            icon={Cpu}
            label="Language model"
            value={provider ? PROVIDERS[provider] || provider : 'not reached'}
            mono
          />
          <Row
            icon={ShieldCheck}
            label="Guardrail"
            value={
              answer
                ? answer.fell_back
                  ? 'primary failed — fallback used'
                  : 'primary passed validation'
                : 'no answer returned'
            }
            mono
          />
          <Row icon={Clock} label="Model latency" value={seconds ? `${seconds} s` : '—'} mono />
          <Row
            icon={Database}
            label="Retrieved scheme records"
            value={answer?.scheme_ids?.length ? answer.scheme_ids.join(', ') : '—'}
            mono
          />
          <Row icon={Volume2} label="Speech out" value="Sarvam Bulbul via sarvamVoice" mono />
        </div>

        {trace?.query ? (
          <div className="mt-4 rounded-xl bg-muted/60 p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Question used</p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed">{trace.query}</p>
          </div>
        ) : null}

        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          Eligibility states, dates, helplines, office lists and amounts are computed in code from the stored
          dataset. The model only writes the sentence above them.
        </p>
      </SheetContent>
    </Sheet>
  )
}
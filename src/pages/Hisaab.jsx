import React, { useEffect, useMemo, useState } from 'react'
import { Mic, Plus, Trash2, Download, FileText, Copy, Printer, ShieldCheck, MicOff } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import LanguageSheet from '@/components/home/LanguageSheet'
import { useVoice } from '@/lib/useVoice'
import { loadSession, saveSession } from '@/lib/session'
import { addEntry, buildLetter, clearLedger, loadLedger, parseEntry, removeEntry, summarize, toCsv } from '@/lib/ledger'
import { copyText, downloadText, rupees, waShareLink } from '@/lib/format'
import { t } from '@/lib/i18n'

const todayIso = () => new Date().toISOString().slice(0, 10)

const QUICK = [
  { label: '8 hrs', hours: '8' },
  { label: '10 hrs', hours: '10' },
  { label: 'Half day', hours: '5' },
  { label: 'Day off', hours: '0' },
]

export default function Hisaab() {
  const session = loadSession()
  const [lang, setLang] = useState(session.lang || 'hi')
  const [langOpen, setLangOpen] = useState(false)
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ date: todayIso(), hours: '', paid: '' })
  const [entryErrors, setEntryErrors] = useState({})
  const [spoken, setSpoken] = useState('')
  const [claim, setClaim] = useState({ months: '', amount: '', name: '', phone: '' })
  const [claimErrors, setClaimErrors] = useState({})
  const [letter, setLetter] = useState(null)
  const [copied, setCopied] = useState(false)

  const voice = useVoice({ lang })
  const totals = useMemo(() => summarize(rows), [rows])

  useEffect(() => {
    setRows(loadLedger())
  }, [])

  const validateNumber = (value, { min = 0, max = 1000000, allowEmpty = true } = {}) => {
    if (!String(value).trim()) return allowEmpty ? null : t(lang, 'invalidNumber')
    if (!/^\d+$/.test(String(value).trim())) return t(lang, 'invalidNumber')
    const numeric = Number(value)
    if (numeric < min || numeric > max) return t(lang, 'invalidNumber')
    return null
  }

  const saveEntry = () => {
    const errors = {}
    const hoursError = validateNumber(form.hours, { min: 0, max: 24, allowEmpty: false })
    const paidError = validateNumber(form.paid, { min: 0, max: 200000, allowEmpty: false })
    if (hoursError) errors.hours = hoursError
    if (paidError) errors.paid = paidError
    setEntryErrors(errors)
    if (Object.keys(errors).length) return
    setRows(addEntry(form))
    setForm({ date: todayIso(), hours: '', paid: '' })
  }

  const handleVoiceEntry = async () => {
    if (voice.status === 'listening') {
      voice.stopRecording()
      return
    }
    const text = await voice.record()
    if (!text) return
    setSpoken(text)
    const parsed = parseEntry(text)
    if (parsed) {
      setForm((current) => ({
        ...current,
        hours: parsed.hours !== null ? String(parsed.hours) : current.hours,
        paid: parsed.paid !== null ? String(parsed.paid) : current.paid,
      }))
    }
  }

  const generateLetter = () => {
    const errors = {}
    const monthsError = validateNumber(claim.months, { min: 1, max: 36 })
    const amountError = validateNumber(claim.amount, { min: 100, max: 1000000 })
    if (monthsError) errors.months = monthsError
    if (amountError) errors.amount = amountError
    setClaimErrors(errors)
    if (Object.keys(errors).length) return

    // name and phone live only in this render — never stored, never logged
    setLetter(
      buildLetter({
        lang,
        rows,
        months: claim.months,
        amount: claim.amount,
        name: claim.name.trim(),
        phone: claim.phone.trim(),
      })
    )
  }

  return (
    <AppShell lang={lang} onOpenLang={() => setLangOpen(true)}>
      <header>
        <h1 className="font-heading text-[clamp(22px,3vw,30px)] leading-tight">{t(lang, 'hisaabTitle')}</h1>
        <p className="mt-1 max-w-[60ch] text-[13px] leading-relaxed text-muted-foreground">{t(lang, 'hisaabSub')}</p>
      </header>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
        <div className="space-y-4">
          <section className="rounded-3xl border border-border bg-card p-4 shadow-soft">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: lang === 'hi' ? 'दिन' : 'Days', value: totals.days },
                { label: lang === 'hi' ? 'घंटे' : 'Hours', value: totals.hours },
                { label: lang === 'hi' ? 'मिले' : 'Paid', value: rupees(totals.paid) },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-muted/60 px-2 py-2.5">
                  <p className="font-heading text-[20px] leading-none">{stat.value}</p>
                  <p className="mt-1 text-[11.5px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <label className="col-span-2 block text-[12.5px] font-semibold text-foreground/80">
                {t(lang, 'dateLabel')}
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                  className="mt-1 min-h-[48px] w-full rounded-xl border-[1.5px] border-input bg-card px-3 text-[14px] font-normal text-foreground outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </label>
              <label className="block text-[12.5px] font-semibold text-foreground/80">
                {t(lang, 'hoursLabel')}
                <input
                  inputMode="numeric"
                  value={form.hours}
                  onChange={(event) => setForm({ ...form, hours: event.target.value })}
                  placeholder="8"
                  className="mt-1 min-h-[48px] w-full rounded-xl border-[1.5px] border-input bg-card px-3 text-[14px] font-normal text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </label>
              <label className="block text-[12.5px] font-semibold text-foreground/80">
                {t(lang, 'paidLabel')}
                <input
                  inputMode="numeric"
                  value={form.paid}
                  onChange={(event) => setForm({ ...form, paid: event.target.value })}
                  placeholder="400"
                  className="mt-1 min-h-[48px] w-full rounded-xl border-[1.5px] border-input bg-card px-3 text-[14px] font-normal text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </label>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, hours: chip.hours }))}
                  className="min-h-[40px] rounded-full border border-border bg-background px-3 text-[12.5px] font-medium text-foreground/85 transition-colors hover:border-primary/40"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {entryErrors.hours || entryErrors.paid ? (
              <p className="mt-1 text-[12px] text-destructive">{entryErrors.hours || entryErrors.paid}</p>
            ) : null}

            {spoken ? (
              <p className="mt-2 rounded-xl bg-muted px-2.5 py-1.5 text-[12px] leading-relaxed text-muted-foreground">
                Heard: “{spoken}” — check the numbers before saving.
              </p>
            ) : null}

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={saveEntry}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-[13.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> {t(lang, 'addEntry')}
              </button>
              <button
                type="button"
                onClick={handleVoiceEntry}
                aria-label={t(lang, 'micIdle')}
                className={`grid min-h-[48px] w-12 place-items-center rounded-xl transition-colors ${
                  voice.status === 'listening'
                    ? 'bg-accent text-accent-foreground'
                    : 'border-[1.5px] border-border bg-card text-primary hover:border-primary/40'
                }`}
              >
                {voice.status === 'listening' ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">{t(lang, 'duesNote')}</p>
          </section>

          <section className="space-y-2">
            {rows.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-muted/40 p-3 text-[13px] text-muted-foreground">
                {t(lang, 'ledgerEmpty')}
              </p>
            ) : (
              <>
                <div className="space-y-2 lg:hidden">
                  {rows.map((row) => (
                    <div key={row.id} className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
                      <span className="text-[12px] text-muted-foreground">{row.date}</span>
                      <span className="text-[13px] font-medium">{row.hours}h</span>
                      <span className="ml-auto text-[13px] font-semibold text-primary">{rupees(row.paid)}</span>
                      <button
                        type="button"
                        onClick={() => setRows(removeEntry(row.id))}
                        aria-label="Delete entry"
                        className="grid h-11 w-9 place-items-center rounded-lg text-muted-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <table className="hidden w-full border-separate border-spacing-y-1 text-left lg:table">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">
                      <th className="px-2 py-1 font-semibold">Date</th>
                      <th className="px-2 py-1 font-semibold">Hours</th>
                      <th className="px-2 py-1 font-semibold">Paid</th>
                      <th className="px-2 py-1" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="bg-card">
                        <td className="rounded-l-xl border border-r-0 border-border px-2 py-2 text-[13px]">{row.date}</td>
                        <td className="border-y border-border px-2 py-2 text-[13px]">{row.hours}</td>
                        <td className="border-y border-border px-2 py-2 text-[13px] font-semibold text-primary">
                          {rupees(row.paid)}
                        </td>
                        <td className="rounded-r-xl border border-l-0 border-border px-2 py-2">
                          <button
                            type="button"
                            onClick={() => setRows(removeEntry(row.id))}
                            aria-label="Delete entry"
                            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-3 text-[12px] leading-relaxed text-muted-foreground">
            <strong className="text-foreground/80">Minimum wage check:</strong> no verified rate is stored for your state
            yet, so we do not calculate a shortfall from a guess. Ask the labour office for the current notified rate.
          </div>

          <section className="rounded-3xl border border-border bg-card p-4 shadow-soft">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold">
              <FileText className="h-4 w-4 text-primary" /> {t(lang, 'makeLetter')}
            </h2>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="block text-[12.5px] font-semibold text-foreground/80">
                {t(lang, 'monthsLabel')}
                <input
                  inputMode="numeric"
                  value={claim.months}
                  onChange={(event) => setClaim({ ...claim, months: event.target.value })}
                  placeholder="2"
                  className="mt-1 min-h-[48px] w-full rounded-xl border-[1.5px] border-input bg-card px-3 text-[14px] font-normal outline-none placeholder:text-muted-foreground/60 focus:border-primary"
                />
              </label>
              <label className="block text-[12.5px] font-semibold text-foreground/80">
                {t(lang, 'amountLabel')}
                <input
                  inputMode="numeric"
                  value={claim.amount}
                  onChange={(event) => setClaim({ ...claim, amount: event.target.value })}
                  placeholder="12000"
                  className="mt-1 min-h-[48px] w-full rounded-xl border-[1.5px] border-input bg-card px-3 text-[14px] font-normal outline-none placeholder:text-muted-foreground/60 focus:border-primary"
                />
              </label>
              <label className="col-span-2 block text-[12.5px] font-semibold text-foreground/80">
                {t(lang, 'nameOptional')}
                <input
                  value={claim.name}
                  onChange={(event) => setClaim({ ...claim, name: event.target.value })}
                  autoComplete="off"
                  className="mt-1 min-h-[48px] w-full rounded-xl border-[1.5px] border-input bg-card px-3 text-[14px] font-normal outline-none focus:border-primary"
                />
              </label>
              <label className="col-span-2 block text-[12.5px] font-semibold text-foreground/80">
                {t(lang, 'phoneOptional')}
                <input
                  inputMode="numeric"
                  value={claim.phone}
                  onChange={(event) => setClaim({ ...claim, phone: event.target.value })}
                  autoComplete="off"
                  className="mt-1 min-h-[48px] w-full rounded-xl border-[1.5px] border-input bg-card px-3 text-[14px] font-normal outline-none focus:border-primary"
                />
              </label>
            </div>

            {claimErrors.months || claimErrors.amount ? (
              <p className="mt-1 text-[12px] text-destructive">{claimErrors.months || claimErrors.amount}</p>
            ) : null}

            <button
              type="button"
              onClick={generateLetter}
              className="mt-3 min-h-[48px] w-full rounded-xl bg-primary px-3 text-[13.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t(lang, 'makeLetter')}
            </button>
            <p className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
              {t(lang, 'letterNote')}
            </p>
          </section>

          {letter ? (
            <section className="rounded-2xl border border-border bg-card p-3 shadow-soft">
              <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-muted/50 p-3 text-[12.5px] leading-relaxed">
                {letter}
              </pre>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await copyText(letter)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1800)
                  }}
                  className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-border text-[12px] font-semibold"
                >
                  <Copy className="h-3.5 w-3.5" /> {copied ? t(lang, 'copied') : t(lang, 'copy')}
                </button>
                <a
                  href={waShareLink(letter)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl bg-whatsapp text-[12px] font-semibold text-white"
                >
                  WhatsApp
                </a>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex min-h-[44px] items-center justify-center gap-1 rounded-xl border border-border text-[12px] font-semibold"
                >
                  <Printer className="h-3.5 w-3.5" /> PDF
                </button>
              </div>
            </section>
          ) : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => downloadText('sangi-wage-diary.csv', toCsv(rows))}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card text-[12.5px] font-semibold"
            >
              <Download className="h-3.5 w-3.5" /> {t(lang, 'exportData')}
            </button>
            <button
              type="button"
              onClick={() => {
                setRows(clearLedger())
                setLetter(null)
              }}
              className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-destructive/25 bg-destructive/5 text-[12.5px] font-semibold text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> {t(lang, 'clearData')}
            </button>
          </div>
        </div>
      </div>

      <LanguageSheet
        open={langOpen}
        onClose={() => setLangOpen(false)}
        lang={lang}
        onPick={(code) => {
          setLang(code)
          saveSession({ lang: code })
        }}
      />
    </AppShell>
  )
}
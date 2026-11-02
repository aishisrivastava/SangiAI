import React, { useEffect, useState } from 'react'
import { ArrowLeftRight, Maximize2, Mic, RotateCw, Square, Loader2, Info, MapPin, Play, X } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import LanguageSheet from '@/components/home/LanguageSheet'
import { base44 } from '@/api/base44Client'
import { useVoice } from '@/lib/useVoice'
import { loadSession, saveSession } from '@/lib/session'
import { t, LANGS, langMeta } from '@/lib/i18n'

const PHRASES = [
  { en: 'Which document is missing?', hi: 'कौन सा काग़ज़ कम है?' },
  { en: 'How much is the fee?', hi: 'फ़ीस कितनी है?' },
  { en: 'Where do I sign?', hi: 'मुझे कहाँ हस्ताक्षर करने हैं?' },
  { en: 'What is my token number?', hi: 'मेरा टोकन नंबर क्या है?' },
  { en: 'How many days will it take?', hi: 'कितने दिन लगेंगे?' },
  { en: 'Please write it down for me.', hi: 'कृपया मेरे लिए लिख दीजिए।' },
  { en: 'I do not understand.', hi: 'मुझे समझ नहीं आया।' },
  { en: 'Can I talk to a supervisor?', hi: 'क्या मैं सुपरवाइज़र से बात कर सकता हूँ?' },
  { en: 'Thank you.', hi: 'धन्यवाद।' },
]

export default function Counter() {
  const session = loadSession()
  const [lang, setLang] = useState(session.lang || 'hi')
  const [langOpen, setLangOpen] = useState(false)
  const [corridor, setCorridor] = useState(null)
  const [clerkLang, setClerkLang] = useState('gu')
  const [line, setLine] = useState(null)
  const [busySide, setBusySide] = useState(null)
  const [problem, setProblem] = useState(null)
  const [rotated, setRotated] = useState(false)
  const [showClerk, setShowClerk] = useState(null)

  const workerVoice = useVoice({ lang })
  const clerkVoice = useVoice({ lang: clerkLang })

  useEffect(() => {
    base44.entities.Corridor
      .list()
      .then((rows) => {
        const match = (rows || []).find((row) => row.id === session.corridorId) || (rows || [])[0]
        if (match) {
          setCorridor(match)
          if (match.clerk_lang) setClerkLang(match.clerk_lang)
        }
      })
      .catch(() => {})
  }, [session.corridorId])

  const translate = async (text, source, target) => {
    const res = await base44.functions.invoke('sarvamVoice', {
      action: 'translate',
      text,
      source_language_code: source,
      target_language_code: target,
    })
    const translated = res?.data?.translated
    if (!translated) throw new Error('translate_unavailable')
    return translated
  }

  const speakSide = async (side) => {
    const isWorker = side === 'worker'
    const voice = isWorker ? workerVoice : clerkVoice
    const other = isWorker ? clerkVoice : workerVoice
    if (voice.status === 'listening') {
      voice.stopRecording()
      return
    }
    if (voice.status === 'speaking') {
      voice.stopSpeaking()
      return
    }
    other.stopSpeaking()
    setProblem(null)
    const heard = await voice.record()
    if (!heard) {
      setProblem(
        isWorker
          ? 'Could not hear that. Try again, or tap a phrase below.'
          : 'Could not hear that. Ask them to speak again.'
      )
      return
    }
    setBusySide(side)
    try {
      const from = isWorker ? langMeta(lang).sarvam : langMeta(clerkLang).sarvam
      const to = isWorker ? langMeta(clerkLang).sarvam : langMeta(lang).sarvam
      const translated = await translate(heard, from, to)
      setLine({ side, original: heard, translated, failed: false })
      if (isWorker) clerkVoice.speak(translated)
      else workerVoice.speak(translated)
    } catch {
      setLine({ side, original: heard, translated: null, failed: true })
      setProblem('Live translation did not answer. Show the original on screen, then retry.')
    } finally {
      setBusySide(null)
    }
  }

  const sendPhrase = async (phrase) => {
    const text = lang === 'hi' ? phrase.hi : phrase.en
    setBusySide('worker')
    setProblem(null)
    try {
      const from = lang === 'hi' ? 'hi-IN' : 'en-IN'
      const to = langMeta(clerkLang).sarvam
      const translated = lang === clerkLang ? text : await translate(text, from, to)
      setLine({ side: 'worker', original: text, translated, failed: false })
      workerVoice.stopSpeaking()
      clerkVoice.speak(translated)
    } catch {
      setLine({ side: 'worker', original: text, translated: null, failed: true })
      setProblem('Live translation did not answer. Show this phrase to the clerk instead.')
    } finally {
      setBusySide(null)
    }
  }

  const swapLanguages = () => {
    setClerkLang(lang)
    setLang(clerkLang)
    saveSession({ lang: clerkLang })
    setLine(null)
    setProblem(null)
  }

  const Panel = ({ side }) => {
    const isWorker = side === 'worker'
    const voice = isWorker ? workerVoice : clerkVoice
    const panelLang = isWorker ? lang : clerkLang
    const tone = isWorker ? 'border-primary/25' : 'border-paper/25'
    const active = line?.side === side

    return (
      <section className={`flex min-w-0 flex-col rounded-3xl border bg-card p-4 shadow-soft ${tone}`}>
        <div className="flex items-center justify-between gap-2">
          <p className={`text-[11.5px] font-semibold uppercase tracking-[0.1em] ${isWorker ? 'text-primary' : 'text-paper'}`}>
            {isWorker ? t(lang, 'counterWorker') : `${t(lang, 'counterClerk')}`}
          </p>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11.5px] font-semibold text-secondary-foreground">
            {langMeta(panelLang).native}
          </span>
        </div>

        <button
          type="button"
          onClick={() => speakSide(side)}
          className={`mt-3 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl px-4 text-[14px] font-semibold transition-colors ${
            voice.status === 'listening'
              ? 'bg-accent text-accent-foreground'
              : isWorker
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'border-[1.5px] border-border bg-background text-foreground hover:border-primary/40'
          }`}
        >
          {voice.status === 'listening' ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          {voice.status === 'listening' ? t(lang, 'micListening') : t(lang, 'counterHold')}
        </button>

        {active ? (
          <div className="mt-3 flex-1 space-y-2">
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">“{line.original}”</p>
            <p className="rounded-2xl bg-muted/70 px-3 py-2.5 text-[15.5px] font-medium leading-relaxed">
              {busySide ? (
                <span className="flex items-center gap-2 text-[13px] font-normal text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> translating…
                </span>
              ) : (
                line.translated || '—'
              )}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowClerk(line.translated || line.original)}
                className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[12px] font-semibold"
              >
                <Maximize2 className="h-3.5 w-3.5" /> {t(lang, 'counterShowClerk')}
              </button>
              {line.failed ? (
                <button
                  type="button"
                  onClick={() => speakSide(side)}
                  className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[12px] font-semibold text-primary"
                >
                  <RotateCw className="h-3.5 w-3.5" /> Retry
                </button>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">{t(lang, 'sayExample')}</p>
        )}
      </section>
    )
  }

  return (
    <AppShell lang={lang} onOpenLang={() => setLangOpen(true)}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-[clamp(22px,3vw,30px)] leading-tight">{t(lang, 'counterTitle')}</h1>
          <p className="mt-1 max-w-[60ch] text-[13px] leading-relaxed text-muted-foreground">{t(lang, 'counterSub')}</p>
          {corridor ? (
            <p className="mt-1 flex items-center gap-1 text-[12px] text-muted-foreground">
              <MapPin className="h-3 w-3" /> {corridor.destination_city}, {corridor.destination_state}
            </p>
          ) : null}
        </div>

        <div className="flex items-end gap-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Clerk
            <select
              value={clerkLang}
              onChange={(event) => setClerkLang(event.target.value)}
              className="mt-1 block min-h-[44px] w-[124px] rounded-xl border-[1.5px] border-input bg-card px-2 text-[13px] font-medium text-foreground outline-none focus:border-primary"
            >
              {LANGS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.native}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={swapLanguages}
            aria-label="Swap languages"
            className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-card text-primary transition-colors hover:border-primary/40"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setRotated((value) => !value)}
            aria-pressed={rotated}
            className="grid h-11 w-11 place-items-center rounded-xl border border-border bg-card text-primary transition-colors hover:border-primary/40 lg:hidden"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="mt-4 grid gap-3 lg:grid-cols-2 lg:items-stretch">
        <Panel side="worker" />
        <div className="lg:hidden">
          <div className={`transition-transform duration-200 ${rotated ? 'rotate-180' : ''}`}>
            <Panel side="clerk" />
          </div>
        </div>
        <div className="hidden lg:block lg:col-span-1 lg:row-start-1 lg:col-start-2">
          <Panel side="clerk" />
        </div>
      </div>

      {problem ? (
        <p className="mt-2 rounded-xl border border-stale/30 bg-stale/10 px-3 py-2 text-[12px] leading-relaxed text-stale">
          {problem}
        </p>
      ) : null}

      <section className="mt-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {t(lang, 'counterPhrases')}
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PHRASES.map((phrase) => (
            <button
              key={phrase.en}
              type="button"
              onClick={() => sendPhrase(phrase)}
              className="min-h-[52px] rounded-xl border border-border bg-card px-3 py-2.5 text-left shadow-soft transition-colors hover:border-primary/40"
            >
              <span className="block text-[13px] font-medium leading-snug">{lang === 'hi' ? phrase.hi : phrase.en}</span>
              <span className="mt-0.5 block text-[11.5px] leading-snug text-muted-foreground">
                {lang === 'hi' ? phrase.en : phrase.hi}
              </span>
            </button>
          ))}
        </div>
      </section>

      <p className="mt-3 flex items-start gap-2 rounded-2xl bg-muted/60 p-3 text-[11.5px] leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        {t(lang, 'counterNote')}
      </p>

      {showClerk ? (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex flex-col bg-background p-5">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-secondary px-3 py-1 text-[12px] font-semibold text-secondary-foreground">
              {langMeta(clerkLang).native}
            </span>
            <button
              type="button"
              onClick={() => setShowClerk(null)}
              aria-label="Close"
              className="grid h-12 w-12 place-items-center rounded-full border border-border"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-6 flex-1 overflow-y-auto font-heading text-[clamp(22px,5vw,44px)] leading-[1.45]">{showClerk}</p>
          <button
            type="button"
            onClick={() => (clerkVoice.status === 'speaking' ? clerkVoice.stopSpeaking() : clerkVoice.speak(showClerk))}
            className="mt-4 flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-[15px] font-semibold text-primary-foreground"
          >
            {clerkVoice.status === 'speaking' ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {clerkVoice.status === 'speaking' ? t(lang, 'micSpeaking') : t(lang, 'listen')}
          </button>
        </div>
      ) : null}

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
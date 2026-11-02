import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronRight, FileCheck, Info, Lock, Mic, Send, Sparkles } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import LanguageSheet from '@/components/home/LanguageSheet'
import MicOrb from '@/components/home/MicOrb'
import TranscriptCard from '@/components/home/TranscriptCard'
import ProfileQuestions from '@/components/home/ProfileQuestions'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useVoice } from '@/lib/useVoice'
import { loadSession, saveSession } from '@/lib/session'
import { BRAND, brandTagline } from '@/brand'
import { t } from '@/lib/i18n'

const GREETING = { hi: 'नमस्ते', bn: 'নমস্কার', mr: 'नमस्कार', te: 'నమస్కారం', ta: 'வணக்கம்', gu: 'નમસ્તે', or: 'ନମସ୍କାର', en: 'Hello' }

const EXAMPLES = {
  hi: ['सूरत में मुझे क्या मिल सकता है?', 'मेरा राशन कार्ड यहाँ चलेगा?', 'मज़दूरी नहीं मिली, क्या करूँ?'],
  bn: ['সুরাটে আমি কী পেতে পারি?', 'আমার রেশন কার্ড এখানে চলবে?', 'মজুরি পাইনি, কী করব?'],
  mr: ['पुण्यात मला काय मिळू शकते?', 'माझे रेशन कार्ड इथे चालेल?', 'मजुरी मिळाली नाही, काय करू?'],
  en: ['What can I claim in Surat?', 'Will my ration card work here?', 'My wages are unpaid — what can I do?'],
}

const PROMISES = {
  hi: [
    { icon: Mic, title: 'अपनी भाषा में बोलिए', line: 'हिंदी, मराठी, बांग्ला और पाँच और भाषाएँ' },
    { icon: FileCheck, title: 'सरकारी स्रोतों से जवाब', line: 'हर कार्ड पर तारीख और आधिकारिक लिंक' },
    { icon: Lock, title: 'डेटा आपके फ़ोन में', line: 'कोई आईडी नंबर, ऑडियो या फ़ोटो सेव नहीं होती' },
  ],
  en: [
    { icon: Mic, title: 'Speak in your language', line: 'Hindi, Marathi, Bengali and five more' },
    { icon: FileCheck, title: 'Answers from official sources', line: 'Every card carries its date and source link' },
    { icon: Lock, title: 'Your data stays on your phone', line: 'No ID numbers, audio or photos are stored' },
  ],
}

export default function Home() {
  const navigate = useNavigate()
  const session = loadSession()
  const [lang, setLang] = useState(session.lang || 'hi')
  const [langOpen, setLangOpen] = useState(!session.lang)
  const [profile, setProfile] = useState(session.profile || {})
  const [profileOpen, setProfileOpen] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [original, setOriginal] = useState('')
  const [typed, setTyped] = useState('')

  const voice = useVoice({ lang })
  const examples = EXAMPLES[lang] || EXAMPLES.en
  const promises = PROMISES[lang === 'hi' ? 'hi' : 'en']
  const answered = ['work_type', 'age_band', 'family_size'].filter((field) => profile[field]).length

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const pickLang = (code) => {
    setLang(code)
    saveSession({ lang: code })
  }

  const updateProfile = (next) => {
    setProfile(next)
    saveSession({ profile: next })
  }

  const goToPlan = (text) => {
    const clean = String(text || '').trim()
    if (!clean) return
    saveSession({ lang, query: clean, profile })
    navigate(`/plan?q=${encodeURIComponent(clean)}`)
  }

  const handleMic = async () => {
    if (voice.status === 'listening') {
      voice.stopRecording()
      return
    }
    if (voice.status === 'speaking') {
      voice.stopSpeaking()
      return
    }
    const text = await voice.record()
    if (text) {
      setTranscript(text)
      setOriginal(text)
      goToPlan(text)
    }
  }

  const micLabel =
    voice.status === 'listening'
      ? t(lang, 'micListening')
      : voice.status === 'thinking'
        ? t(lang, 'micThinking')
        : voice.status === 'speaking'
          ? t(lang, 'micSpeaking')
          : t(lang, 'micIdle')

  const micHint =
    voice.error === 'mic_blocked'
      ? 'Microphone permission is needed. You can type your question below.'
      : voice.error === 'stt_failed'
        ? 'Speech service did not respond. Type below — the same answer works.'
        : t(lang, 'sayExample')

  return (
    <AppShell lang={lang} onOpenLang={() => setLangOpen(true)}>
      <div className="rise grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-start lg:gap-10">
        <section className="min-w-0">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {BRAND.devanagari} · {BRAND.name}
          </div>
          <h1 className="mt-2 font-heading text-[clamp(26px,4vw,40px)] leading-[1.15]">
            {GREETING[lang] || GREETING.en} — <span className="text-primary">{brandTagline(lang)}</span>
          </h1>
          <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-muted-foreground">
            {lang === 'hi'
              ? 'कौन सी योजना आपके साथ चलती है, और क्लेम के लिए क्या करना है — बोलकर पूछिए।'
              : 'Which welfare schemes travel with you, and the exact steps to claim them. Ask by voice.'}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setTranscript(example)
                  setOriginal(example)
                  goToPlan(example)
                }}
                className="min-h-[44px] rounded-full border border-border bg-card px-3.5 text-[13px] text-foreground/90 shadow-soft transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {example}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-card/60 px-3.5 py-3 text-left transition-colors hover:border-primary/40"
          >
            <span>
              <span className="block text-[13.5px] font-semibold">Personalise your plan (optional)</span>
              <span className="block text-[12px] text-muted-foreground">{answered}/3 answered — sharper answers</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/trust')}
            className="mt-4 flex max-w-[58ch] items-start gap-2 text-left text-[12.5px] leading-relaxed text-muted-foreground transition-colors hover:text-foreground"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              How this works: eligibility, dates, offices and helplines come from a fixed, sourced dataset — never written by a
              language model.
              <span className="ml-1 inline-flex items-center gap-0.5 font-semibold text-primary">
                {t(lang, 'trustTitle')} <ArrowRight className="h-3 w-3" />
              </span>
            </span>
          </button>
        </section>

        <section className="min-w-0 rounded-[28px] border border-border bg-card p-5 shadow-soft">
          <MicOrb status={voice.status} level={voice.level} onPress={handleMic} label={micLabel} hint={micHint} />

          <div className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>{BRAND.poweredBy}</span>
          </div>

          <form
            className="mt-4 flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              if (!typed.trim()) return
              setTranscript(typed.trim())
              setOriginal(typed.trim())
              goToPlan(typed)
            }}
          >
            <input
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              placeholder={t(lang, 'typeInstead')}
              aria-label={t(lang, 'typeInstead')}
              className="min-h-[48px] w-full rounded-2xl border-[1.5px] border-input bg-card px-3.5 text-[15px] outline-none placeholder:text-muted-foreground/70 focus:border-primary focus-visible:ring-2 focus-visible:ring-ring/40"
            />
            <button
              type="submit"
              aria-label={t(lang, 'send')}
              className="grid min-h-[48px] w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98]"
            >
              <Send className="h-[18px] w-[18px]" />
            </button>
          </form>
        </section>
      </div>

      <TranscriptCard lang={lang} text={transcript} original={original} busy={voice.status === 'thinking'} onResend={goToPlan} />

      <section className="mt-8 grid gap-3 border-t border-border pt-5 md:grid-cols-3">
        {promises.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.title} className="flex items-start gap-2.5">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-[13.5px] font-semibold leading-tight">{item.title}</p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">{item.line}</p>
              </div>
            </div>
          )
        })}
      </section>

      <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-[28px]">
          <SheetHeader>
            <SheetTitle className="text-left font-heading text-[19px]">A little about you</SheetTitle>
          </SheetHeader>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
            Two or three taps, and the plan stops guessing. Nothing here is sent anywhere but this phone.
          </p>
          <div className="mt-3">
            <ProfileQuestions lang={lang} profile={profile} onChange={updateProfile} />
          </div>
          <button
            type="button"
            onClick={() => setProfileOpen(false)}
            className="mt-4 min-h-[48px] w-full rounded-2xl bg-primary px-4 text-[14px] font-semibold text-primary-foreground"
          >
            Done
          </button>
        </SheetContent>
      </Sheet>

      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} lang={lang} onPick={pickLang} />
    </AppShell>
  )
}
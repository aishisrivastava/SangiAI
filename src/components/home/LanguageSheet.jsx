import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Volume2, X } from 'lucide-react'
import { LANGS, t } from '@/lib/i18n'
import { useVoice } from '@/lib/useVoice'

export default function LanguageSheet({ open, onClose, lang, onPick }) {
  const [preview, setPreview] = React.useState(lang || 'hi')
  const voice = useVoice({ lang: preview })

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-label={t(lang, 'chooseLang')}
            className="w-full max-w-[560px] rounded-t-[28px] border border-border bg-card p-4 pb-6 shadow-lift safe-bottom sm:rounded-[28px]"
            initial={{ y: 60, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t(lang, 'chooseLang')}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={t(lang, 'close')}
                className="tap grid place-items-center rounded-full text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {LANGS.map((option) => {
                const active = option.code === lang
                return (
                  <div
                    key={option.code}
                    className={`flex items-center justify-between gap-1 rounded-2xl border px-3 py-2 transition ${
                      active ? 'border-primary bg-primary/5' : 'border-border bg-background'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onPick(option.code)
                        onClose()
                      }}
                      className="tap flex flex-1 flex-col items-start justify-center text-left"
                    >
                      <span className="text-[17px] font-semibold leading-tight">{option.native}</span>
                      <span className="text-[11px] text-muted-foreground">{option.english}</span>
                    </button>
                    <button
                      type="button"
                      aria-label={`${t(lang, 'listen')} — ${option.english}`}
                      onClick={() => {
                        setPreview(option.code)
                        setTimeout(() => voice.speak(option.native), 60)
                      }}
                      className="tap grid w-10 place-items-center rounded-full text-primary"
                    >
                      {active ? <Check className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                  </div>
                )
              })}
            </div>

            <p className="mt-3 rounded-2xl bg-muted px-3 py-2.5 text-[12px] leading-relaxed text-muted-foreground">
              {t(lang, 'langNote')}
            </p>
            <p className="mt-2 px-1 text-[11px] leading-relaxed text-muted-foreground/80">
              Translations are machine-drafted and awaiting human spot-check. English is the source of truth.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
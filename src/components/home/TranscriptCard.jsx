import React from 'react'
import { Pencil, Send, X } from 'lucide-react'
import { t } from '@/lib/i18n'

export default function TranscriptCard({ lang, text, original, onResend, busy }) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(text || '')

  React.useEffect(() => {
    setDraft(text || '')
    setEditing(false)
  }, [text])

  if (!text) return null
  const changed = draft.trim() && draft.trim() !== original

  return (
    <div className="mt-5 rounded-2xl border border-border bg-card p-3 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t(lang, 'youSaid')}
        </p>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="tap -my-2 flex items-center gap-1 rounded-full px-2 text-[12px] font-medium text-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
            {t(lang, 'sendAgain').split(' ')[0]}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(original || text)
              setEditing(false)
            }}
            aria-label={t(lang, 'close')}
            className="tap -my-2 grid w-9 place-items-center rounded-full text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={2}
            className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-[15px] leading-relaxed outline-none focus:border-primary"
          />
          <button
            type="button"
            disabled={!draft.trim() || busy}
            onClick={() => {
              setEditing(false)
              onResend(draft.trim())
            }}
            className="tap mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {t(lang, 'sendAgain')}
          </button>
          {changed ? (
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Your correction is used for this answer. The original recognition text was kept only for accuracy scoring and is not stored.
            </p>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-1 w-full text-left text-[15.5px] leading-relaxed"
        >
          “{text}”
        </button>
      )}
    </div>
  )
}
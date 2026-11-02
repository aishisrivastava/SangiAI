import React from 'react'
import { Link } from 'react-router-dom'
import { Languages, PhoneCall } from 'lucide-react'
import SideNav from '@/components/layout/SideNav'
import TopTabs from '@/components/layout/TopTabs'
import BottomTabs from '@/components/layout/BottomTabs'
import { BRAND } from '@/brand'
import { t, langMeta } from '@/lib/i18n'
import { useJudge } from '@/lib/judge'

/**
 * Responsive app shell.
 *  - phone  (<640): single column, bottom tab bar
 *  - tablet (640–1023): centred column, slim top tab row
 *  - desktop (>=1024): sticky sidebar + content column (max 1100px)
 *  - wide    (>=1280): optional right context panel via the `aside` prop
 */
export default function AppShell({ children, lang, onOpenLang, aside }) {
  const meta = langMeta(lang)
  const { tapLogo } = useJudge()

  return (
    <div className="min-h-[100dvh] bg-background lg:grid lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="no-print sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-primary focus:px-4 focus:py-3 focus:text-[14px] focus:font-semibold focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <SideNav lang={lang} meta={meta} onOpenLang={onOpenLang} onLogoTap={tapLogo} />

      <div className="flex min-h-[100dvh] min-w-0 flex-col">
        <header className="no-print sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-2.5 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex w-full max-w-[720px] items-center justify-between gap-2">
            <Link to="/" onClick={tapLogo} className="flex min-h-[48px] items-center gap-2.5 rounded-xl">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary font-heading text-[15px] font-semibold text-primary-foreground">
                {BRAND.monogram}
              </span>
              <span className="leading-tight">
                <span className="block font-heading text-[17px] font-semibold tracking-tight">{BRAND.name}</span>
                <span className="block text-[12px] text-muted-foreground">{BRAND.devanagari}</span>
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenLang}
                aria-label={t(lang, 'chooseLang')}
                className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[13px] font-medium text-foreground shadow-soft transition-colors hover:border-primary/40 active:scale-[0.98]"
              >
                <Languages className="h-4 w-4 text-primary" />
                <span className="max-w-[84px] truncate">{meta.native}</span>
              </button>
              <Link
                to="/emergency"
                aria-label="Get help now"
                className="grid h-12 w-12 place-items-center rounded-full bg-destructive text-destructive-foreground shadow-soft transition-transform active:scale-95"
              >
                <PhoneCall className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </header>

        <TopTabs lang={lang} />

        <main
          id="main-content"
          className="mx-auto w-full max-w-[var(--content-max)] flex-1 px-[var(--gutter)] pt-4 pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+1.5rem)] md:pb-10 lg:px-8 lg:pt-8"
        >
          <div className="flex min-w-0 gap-6">
            <div className="min-w-0 flex-1">{children}</div>
            {aside ? (
              <aside aria-label="Context" className="no-print hidden w-[320px] shrink-0 xl:block">
                <div className="sticky top-8 space-y-4">{aside}</div>
              </aside>
            ) : null}
          </div>
        </main>

        <BottomTabs lang={lang} />
      </div>
    </div>
  )
}
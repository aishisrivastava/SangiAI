import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Languages, PhoneCall } from 'lucide-react'
import { BRAND } from '@/brand'
import { NAV } from '@/lib/nav'
import { t } from '@/lib/i18n'

export default function SideNav({ lang, meta, onOpenLang, onLogoTap }) {
  const location = useLocation()

  const onKeyDown = (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const links = Array.from(event.currentTarget.querySelectorAll('a'))
    const index = links.indexOf(document.activeElement)
    if (index === -1) return
    event.preventDefault()
    const step = event.key === 'ArrowDown' ? 1 : -1
    links[(index + step + links.length) % links.length].focus()
  }

  return (
    <aside className="no-print hidden border-r border-border bg-secondary lg:sticky lg:top-0 lg:flex lg:h-[100dvh] lg:flex-col">
      <div className="px-5 pb-3 pt-6">
        <Link to="/" onClick={onLogoTap} className="flex items-center gap-2.5 rounded-xl">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary font-heading text-[16px] font-semibold text-primary-foreground">
            {BRAND.monogram}
          </span>
          <span className="leading-tight">
            <span className="block font-heading text-[18px] font-semibold tracking-tight">{BRAND.name}</span>
            <span className="block text-[12px] text-muted-foreground">{BRAND.devanagari}</span>
          </span>
        </Link>
      </div>

      <nav aria-label="Main" onKeyDown={onKeyDown} className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV.map((item) => {
          const active = location.pathname === item.to
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-[48px] items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active
                  ? 'bg-card text-primary shadow-soft'
                  : 'text-foreground/80 hover:bg-card/70 hover:text-foreground'
              }`}
            >
              <Icon className={`h-[19px] w-[19px] ${active ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
              <span className="truncate">{t(lang, item.key)}</span>
            </Link>
          )
        })}
      </nav>

      <div className="space-y-3 px-3 pb-5">
        <button
          type="button"
          onClick={onOpenLang}
          className="flex min-h-[48px] w-full items-center gap-2 rounded-xl border border-border bg-card px-3 text-[13.5px] font-medium shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Languages className="h-4 w-4 text-primary" />
          <span className="truncate">{meta.native}</span>
        </button>

        <p className="px-1 text-[12px] text-muted-foreground">{BRAND.poweredBy}</p>

        <Link
          to="/emergency"
          className="flex min-h-[48px] items-center gap-2 rounded-xl bg-destructive px-3 text-[14px] font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-destructive"
        >
          <PhoneCall className="h-4 w-4" /> {t(lang, 'quickEmergency')}
        </Link>
      </div>
    </aside>
  )
}
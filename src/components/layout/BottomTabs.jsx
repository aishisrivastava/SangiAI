import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { NAV } from '@/lib/nav'
import { t } from '@/lib/i18n'

export default function BottomTabs({ lang }) {
  const location = useLocation()

  return (
    <nav
      aria-label="Sections"
      className="no-print fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto grid w-full max-w-[var(--content-max)] grid-cols-4">
        {NAV.map((item) => {
          const active = location.pathname === item.to
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium leading-tight transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-[21px] w-[21px] ${active ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              <span className="max-w-[86px] truncate">{t(lang, item.key)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
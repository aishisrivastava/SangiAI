import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { NAV } from '@/lib/nav'
import { t } from '@/lib/i18n'

export default function TopTabs({ lang }) {
  const location = useLocation()

  return (
    <nav
      aria-label="Sections"
      className="no-print sticky top-[65px] z-20 hidden border-b border-border bg-background/90 backdrop-blur-md md:block lg:hidden"
    >
      <div className="mx-auto flex w-full max-w-[720px] gap-1 px-6 py-2">
        {NAV.map((item) => {
          const active = location.pathname === item.to
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl px-2 text-[13px] font-medium transition-colors ${
                active ? 'bg-secondary text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{t(lang, item.key)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
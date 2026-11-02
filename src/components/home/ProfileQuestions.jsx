import React from 'react'
import { HardHat, Home, Factory, Bike, Sprout, Wrench, Check } from 'lucide-react'
import { t } from '@/lib/i18n'

const WORK = [
  { value: 'construction', icon: HardHat, label: 'construction' },
  { value: 'domestic', icon: Home, label: 'domestic' },
  { value: 'factory', icon: Factory, label: 'factory' },
  { value: 'gig', icon: Bike, label: 'gig' },
  { value: 'farm', icon: Sprout, label: 'farm' },
  { value: 'other', icon: Wrench, label: 'other' },
]

const WORK_LABELS = {
  hi: { construction: 'मज़दूरी / निर्माण', domestic: 'घरेलू काम', factory: 'कारख़ाना', gig: 'डिलीवरी / गिग', farm: 'खेती', other: 'कुछ और' },
  bn: { construction: 'নির্মাণ শ্রম', domestic: 'গৃহকর্ম', factory: 'কারখানা', gig: 'ডেলিভারি', farm: 'কৃষি', other: 'অন্য' },
  mr: { construction: 'बांधकाम मजुरी', domestic: 'घरगुती काम', factory: 'कारखाना', gig: 'डिलिव्हरी', farm: 'शेती', other: 'इतर' },
  en: { construction: 'Construction', domestic: 'Domestic work', factory: 'Factory', gig: 'Delivery / gig', farm: 'Farming', other: 'Something else' },
}

const AGE = [
  { value: '18-40', label: { en: '18–40', hi: '18–40', bn: '18–40', mr: '18–40' } },
  { value: '41-59', label: { en: '41–59', hi: '41–59', bn: '41–59', mr: '41–59' } },
  { value: '60+', label: { en: '60+', hi: '60+', bn: '60+', mr: '60+' } },
]

const FAMILY = [
  { value: '1-2', label: { en: '1–2', hi: '1–2', bn: '১–২', mr: '१–२' } },
  { value: '3-4', label: { en: '3–4', hi: '3–4', bn: '৩–৪', mr: '३–४' } },
  { value: '5+', label: { en: '5+', hi: '5+', bn: '৫+', mr: '५+' } },
]

function Chip({ active, onClick, children, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tap flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[13px] font-medium transition ${
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-foreground'
      }`}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
      {active ? <Check className="h-3.5 w-3.5" /> : null}
    </button>
  )
}

export default function ProfileQuestions({ lang, profile, onChange, compact }) {
  const workLabels = WORK_LABELS[lang] || WORK_LABELS.en
  const set = (field, value) => onChange({ ...profile, [field]: profile[field] === value ? undefined : value })

  return (
    <section className="mt-6 rounded-3xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-[17px] font-semibold">{t(lang, 'profileTitle')}</h2>
          {!compact ? (
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{t(lang, 'profileBody')}</p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {t(lang, 'profileNote')}
        </span>
      </div>

      <div className="mt-3.5">
        <p className="mb-1.5 text-[12px] font-semibold text-muted-foreground">{t(lang, 'workQ')}</p>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {WORK.map((option) => (
            <Chip
              key={option.value}
              icon={option.icon}
              active={profile.work_type === option.value}
              onClick={() => set('work_type', option.value)}
            >
              {workLabels[option.value]}
            </Chip>
          ))}
          <Chip active={!profile.work_type} onClick={() => set('work_type', undefined)}>
            {t(lang, 'skip')}
          </Chip>
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-muted-foreground">{t(lang, 'ageQ')}</p>
          <div className="flex flex-wrap gap-2">
            {AGE.map((option) => (
              <Chip
                key={option.value}
                active={profile.age_band === option.value}
                onClick={() => set('age_band', option.value)}
              >
                {option.label[lang] || option.label.en}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-muted-foreground">{t(lang, 'familyQ')}</p>
          <div className="flex flex-wrap gap-2">
            {FAMILY.map((option) => (
              <Chip
                key={option.value}
                active={profile.family_size === option.value}
                onClick={() => set('family_size', option.value)}
              >
                {option.label[lang] || option.label.en}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
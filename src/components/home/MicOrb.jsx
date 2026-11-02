import React from 'react'
import { Mic, Square, Volume2, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

const BARS = 17

export default function MicOrb({ status, level, onPress, label, hint }) {
  const listening = status === 'listening'
  const thinking = status === 'thinking'
  const speaking = status === 'speaking'

  return (
    <div className="flex flex-col items-center">
      <div className="relative grid place-items-center">
        {listening && (
          <>
            <span className="absolute h-[132px] w-[132px] rounded-full bg-accent/30 animate-pulse-ring" />
            <span className="absolute h-[132px] w-[132px] rounded-full bg-accent/20 animate-pulse-ring [animation-delay:0.6s]" />
          </>
        )}
        <motion.button
          type="button"
          onClick={onPress}
          aria-label={label}
          aria-pressed={listening}
          whileTap={{ scale: 0.96 }}
          className={`relative grid h-[132px] w-[132px] place-items-center rounded-full text-primary-foreground shadow-lift transition-colors ${
            listening
              ? 'bg-accent text-accent-foreground'
              : speaking
                ? 'bg-primary'
                : 'bg-primary hover:bg-primary/92'
          }`}
        >
          <span className="absolute inset-[7px] rounded-full border border-white/20" />
          {thinking ? (
            <Loader2 className="h-11 w-11 animate-spin" />
          ) : listening ? (
            <Square className="h-10 w-10" strokeWidth={2.4} />
          ) : speaking ? (
            <Volume2 className="h-12 w-12" strokeWidth={2} />
          ) : (
            <Mic className="h-12 w-12" strokeWidth={2} />
          )}
        </motion.button>
      </div>

      <div className="mt-4 flex h-9 items-end gap-[3px]" aria-hidden="true">
        {Array.from({ length: BARS }).map((_, index) => {
          const mid = Math.abs(index - (BARS - 1) / 2) / ((BARS - 1) / 2)
          const baseline = listening ? 0.18 : 0.08
          const height = Math.max(3, (baseline + level * (1 - mid * 0.55)) * 34)
          return (
            <span
              key={index}
              className={`w-[3px] rounded-full transition-[height] duration-100 ${
                listening ? 'bg-accent' : speaking ? 'bg-primary/70' : 'bg-border'
              }`}
              style={{ height: `${height}px` }}
            />
          )
        })}
      </div>

      <p className="mt-1 text-center text-[15px] font-semibold">{label}</p>
      {hint ? <p className="mt-1 text-center text-[12.5px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
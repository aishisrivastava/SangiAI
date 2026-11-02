import { useCallback, useEffect, useRef, useState } from 'react'

const KEY = 'sangi.judge'

// Judge mode is for the demo table only: ?judge=1, or five taps on the wordmark.
export function useJudge() {
  const [on, setOn] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('judge') === '1'
    if (fromUrl) return true
    try {
      return sessionStorage.getItem(KEY) === '1'
    } catch {
      return false
    }
  })
  const taps = useRef(0)

  useEffect(() => {
    try {
      if (on) sessionStorage.setItem(KEY, '1')
      else sessionStorage.removeItem(KEY)
    } catch {
      // storage blocked — judge mode is per page anyway
    }
  }, [on])

  const tapLogo = useCallback(() => {
    taps.current += 1
    if (taps.current >= 5) {
      taps.current = 0
      setOn(true)
    }
  }, [])

  return { judge: on, setJudge: setOn, tapLogo }
}
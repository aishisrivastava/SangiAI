import { useCallback, useEffect, useRef, useState } from 'react'
import { base44 } from '@/api/base44Client'
import { langMeta } from '@/lib/i18n'

// TTS cache keyed by (text | language | speaker) — keeps repeat answers instant
// and cuts Sarvam calls. In-memory only: audio never touches disk or the server.
const TTS_CACHE = new Map()
const CACHE_LIMIT = 30

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

const splitSentences = (text) => {
  const parts = String(text)
    .replace(/\s+/g, ' ')
    .split(/(?<=[।.!?|])\s+/)
    .filter(Boolean)
  const chunks = []
  let buf = ''
  for (const part of parts) {
    if ((buf + ' ' + part).trim().length > 320) {
      if (buf) chunks.push(buf.trim())
      buf = part
    } else {
      buf = `${buf} ${part}`.trim()
    }
  }
  if (buf.trim()) chunks.push(buf.trim())
  return chunks.length ? chunks : [String(text).slice(0, 320)]
}

export function useVoice({ lang = 'hi' } = {}) {
  const [status, setStatus] = useState('idle') // idle | listening | thinking | speaking
  const [level, setLevel] = useState(0)
  const [error, setError] = useState(null)
  const [voiceSource, setVoiceSource] = useState(null) // 'sarvam' | 'browser' | null

  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const audioCtxRef = useRef(null)
  const rafRef = useRef(0)
  const resolveRef = useRef(null)
  const queueRef = useRef([])
  const audioRef = useRef(null)
  const statusRef = useRef('idle')

  const setStatusSafe = (next) => {
    statusRef.current = next
    setStatus(next)
  }

  const stopMeter = () => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
    setLevel(0)
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {})
    }
    audioCtxRef.current = null
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const stopSpeaking = useCallback(() => {
    queueRef.current = []
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
    if (statusRef.current === 'speaking') setStatusSafe('idle')
  }, [])

  useEffect(() => () => {
    stopMeter()
    stopSpeaking()
  }, [stopSpeaking])

  const transcribe = async (blob, mime) => {
    const audioBase64 = await blobToBase64(blob)
    const meta = langMeta(lang)
    const res = await base44.functions.invoke('sarvamVoice', {
      action: 'stt',
      audio_base64: audioBase64,
      mime: mime.split(';')[0],
      language_code: meta.sarvam,
    })
    const data = res?.data || {}
    if (data.error) throw new Error(data.error)
    return { text: (data.transcript || '').trim(), detected: data.language_code || meta.sarvam }
  }

  /** Records one utterance and resolves with the transcript (or null). */
  const record = useCallback(async () => {
    if (statusRef.current === 'listening') return null
    stopSpeaking()
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        const ctx = new AudioCtx()
        audioCtxRef.current = ctx
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        const data = new Uint8Array(analyser.frequencyBinCount)
        const tick = () => {
          analyser.getByteFrequencyData(data)
          const avg = data.reduce((sum, v) => sum + v, 0) / data.length
          setLevel(Math.min(1, avg / 60))
          rafRef.current = requestAnimationFrame(tick)
        }
        tick()
      }

      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType: mime })
      recorderRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data)
      }

      const promise = new Promise((resolve) => {
        resolveRef.current = resolve
      })

      recorder.onstop = async () => {
        stopMeter()
        setStatusSafe('thinking')
        try {
          const blob = new Blob(chunksRef.current, { type: mime })
          if (blob.size < 1200) {
            setError('empty')
            resolveRef.current?.(null)
            setStatusSafe('idle')
            return
          }
          const { text } = await transcribe(blob, mime)
          setVoiceSource('sarvam')
          resolveRef.current?.(text || null)
        } catch (err) {
          setError('stt_failed')
          resolveRef.current?.(null)
        } finally {
          resolveRef.current = null
          setStatusSafe('idle')
        }
      }

      recorder.start()
      setStatusSafe('listening')
      return promise
    } catch (err) {
      setError('mic_blocked')
      setStatusSafe('idle')
      return null
    }
  }, [lang, stopSpeaking])

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop()
    }
  }, [])

  const playBrowser = (text) =>
    new Promise((resolve) => {
      if (!window.speechSynthesis) return resolve(false)
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = langMeta(lang).sarvam
      utterance.rate = 0.92
      utterance.onend = () => resolve(true)
      utterance.onerror = () => resolve(false)
      window.speechSynthesis.speak(utterance)
    })

  const speak = useCallback(
    async (text) => {
      const clean = String(text || '').trim()
      if (!clean) return
      stopSpeaking()
      const meta = langMeta(lang)
      const chunks = splitSentences(clean).slice(0, 8)
      setStatusSafe('speaking')

      let sarvamWorked = false
      for (const chunk of chunks) {
        if (statusRef.current !== 'speaking' && statusRef.current !== 'idle') break
        const key = `${meta.sarvam}|${meta.speaker}|${chunk}`
        let audioBase64 = TTS_CACHE.get(key)
        let mime = 'audio/wav'
        if (!audioBase64) {
          try {
            const res = await base44.functions.invoke('sarvamVoice', {
              action: 'tts',
              text: chunk,
              language_code: meta.sarvam,
              speaker: meta.speaker,
            })
            const data = res?.data || {}
            if (data.error) throw new Error(data.error)
            audioBase64 = data.audio_base64
            mime = data.mime || 'audio/wav'
            if (audioBase64) {
              if (TTS_CACHE.size >= CACHE_LIMIT) TTS_CACHE.delete(TTS_CACHE.keys().next().value)
              TTS_CACHE.set(key, audioBase64)
            }
          } catch (err) {
            audioBase64 = null
          }
        }
        if (!audioBase64) break
        sarvamWorked = true
        setVoiceSource('sarvam')
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          const audio = new Audio(`data:${mime};base64,${audioBase64}`)
          audioRef.current = audio
          audio.onended = () => resolve()
          audio.onerror = () => resolve()
          audio.play().catch(() => resolve())
        })
        if (statusRef.current !== 'speaking') break
      }

      if (!sarvamWorked) {
        setVoiceSource('browser')
        await playBrowser(clean)
      }
      if (statusRef.current === 'speaking') setStatusSafe('idle')
    },
    [lang, stopSpeaking]
  )

  const isRecordingSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices && !!window.MediaRecorder

  return {
    status,
    level,
    error,
    voiceSource,
    record,
    stopRecording,
    stopSpeaking,
    speak,
    isRecordingSupported,
    clearError: () => setError(null),
  }
}
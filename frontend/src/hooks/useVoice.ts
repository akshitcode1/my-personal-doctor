import { useCallback, useEffect, useRef } from 'react'
import { useAgentStore } from '../stores/agentStore'
import { useVoiceStore } from '../stores/voiceStore'
import client from '../api/client'

const VAD_THRESHOLD = 0.015   // RMS silence threshold
const VAD_SILENCE_MS = 1500   // ms of silence → auto-stop
const VAD_MIN_RECORD_MS = 700 // minimum recording before VAD kicks in

interface UseVoiceOptions {
  onSendMessage: (text: string) => void  // conversation mode: auto-sends
}

export function useVoice({ onSendMessage }: UseVoiceOptions) {
  const { voiceMode, voiceStatus, setVoiceMode, setVoiceStatus, setLiveTranscript, setMicTranscript } = useVoiceStore()
  const { phase, finalResponse } = useAgentStore()

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const vadRafRef = useRef<number | null>(null)
  const silenceStartRef = useRef<number | null>(null)
  const recordingStartRef = useRef<number>(0)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const conversationActiveRef = useRef(false)

  // ── Cleanup ────────────────────────────────────────────────────────────────

  const stopVAD = useCallback(() => {
    if (vadRafRef.current) {
      cancelAnimationFrame(vadRafRef.current)
      vadRafRef.current = null
    }
    silenceStartRef.current = null
  }, [])

  const releaseStream = useCallback(() => {
    stopVAD()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyserRef.current = null
  }, [stopVAD])

  const stopAudio = useCallback(() => {
    if (audioElRef.current) {
      audioElRef.current.pause()
      audioElRef.current.src = ''
      audioElRef.current = null
    }
  }, [])

  // ── Transcription ──────────────────────────────────────────────────────────

  const transcribeBlob = useCallback(async (blob: Blob): Promise<string> => {
    const form = new FormData()
    form.append('audio', blob, 'recording.webm')
    try {
      const { data } = await client.post('/voice/transcribe', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data.transcript ?? ''
    } catch {
      return ''
    }
  }, [])

  // ── TTS ────────────────────────────────────────────────────────────────────

  const synthesizeAndPlay = useCallback(async (text: string): Promise<void> => {
    setVoiceStatus('speaking')
    try {
      const resp = await client.post('/voice/synthesize', { text }, { responseType: 'arraybuffer' })
      const blob = new Blob([resp.data], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioElRef.current = audio

      await new Promise<void>((resolve) => {
        audio.onended = () => { URL.revokeObjectURL(url); resolve() }
        audio.onerror = () => { URL.revokeObjectURL(url); resolve() }
        audio.play().catch(() => resolve())
      })
    } catch {
      // TTS failed — continue conversation loop silently
    }
    audioElRef.current = null
  }, [setVoiceStatus])

  // ── VAD ────────────────────────────────────────────────────────────────────

  const startVAD = useCallback((onSilence: () => void) => {
    const analyser = analyserRef.current
    if (!analyser) return

    const data = new Uint8Array(analyser.fftSize)

    const tick = () => {
      analyser.getByteTimeDomainData(data)
      let sum = 0
      for (const v of data) {
        const n = (v - 128) / 128
        sum += n * n
      }
      const rms = Math.sqrt(sum / data.length)
      const elapsed = Date.now() - recordingStartRef.current

      if (elapsed > VAD_MIN_RECORD_MS) {
        if (rms < VAD_THRESHOLD) {
          if (!silenceStartRef.current) silenceStartRef.current = Date.now()
          else if (Date.now() - silenceStartRef.current > VAD_SILENCE_MS) {
            stopVAD()
            onSilence()
            return
          }
        } else {
          silenceStartRef.current = null
        }
      }

      vadRafRef.current = requestAnimationFrame(tick)
    }

    vadRafRef.current = requestAnimationFrame(tick)
  }, [stopVAD])

  // ── Recording ──────────────────────────────────────────────────────────────

  const startRecording = useCallback(async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const ctx = new AudioContext()
      audioContextRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      analyserRef.current = analyser

      chunksRef.current = []
      const mr = new MediaRecorder(stream)
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.start(100)
      mediaRecorderRef.current = mr
      recordingStartRef.current = Date.now()
    } catch {
      setVoiceStatus('idle')
    }
  }, [setVoiceStatus])

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mr = mediaRecorderRef.current
      if (!mr || mr.state === 'inactive') { resolve(null); return }

      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        chunksRef.current = []
        resolve(blob)
      }
      mr.stop()
      mediaRecorderRef.current = null
      releaseStream()
    })
  }, [releaseStream])

  // ── Mic-only mode (fills textarea) ────────────────────────────────────────

  const startMicRecording = useCallback(async () => {
    if (voiceStatus !== 'idle') return
    setVoiceStatus('listening')
    setLiveTranscript('')
    await startRecording()

    startVAD(async () => {
      setVoiceStatus('processing')
      const blob = await stopRecording()
      if (!blob) { setVoiceStatus('idle'); return }
      const text = await transcribeBlob(blob)
      if (text) setMicTranscript(text)
      setVoiceStatus('idle')
      setLiveTranscript('')
    })
  }, [voiceStatus, setVoiceStatus, setLiveTranscript, setMicTranscript, startRecording, startVAD, stopRecording, transcribeBlob])

  const stopMicManually = useCallback(async () => {
    stopVAD()
    setVoiceStatus('processing')
    const blob = await stopRecording()
    if (!blob) { setVoiceStatus('idle'); return }
    const text = await transcribeBlob(blob)
    if (text) setMicTranscript(text)
    setVoiceStatus('idle')
    setLiveTranscript('')
  }, [stopVAD, setVoiceStatus, stopRecording, transcribeBlob, setMicTranscript, setLiveTranscript])

  // ── Conversation loop ──────────────────────────────────────────────────────

  const startListeningCycle = useCallback(async () => {
    if (!conversationActiveRef.current) return
    setVoiceStatus('listening')
    setLiveTranscript('')
    await startRecording()

    startVAD(async () => {
      if (!conversationActiveRef.current) return
      setVoiceStatus('processing')
      const blob = await stopRecording()
      if (!blob || !conversationActiveRef.current) { setVoiceStatus('idle'); return }

      const text = await transcribeBlob(blob)
      if (!text || !conversationActiveRef.current) { setVoiceStatus('idle'); return }

      setLiveTranscript(text)
      setVoiceStatus('thinking')
      onSendMessage(text)
      // synthesis_complete fires → useEffect below picks it up
    })
  }, [setVoiceStatus, setLiveTranscript, startRecording, startVAD, stopRecording, transcribeBlob, onSendMessage])

  // Watch for synthesis_complete when in conversation mode
  useEffect(() => {
    if (voiceMode !== 'conversation') return
    if (!conversationActiveRef.current) return
    if (phase !== 'complete' || !finalResponse) return
    if (voiceStatus !== 'thinking') return

    ;(async () => {
      await synthesizeAndPlay(finalResponse)
      if (conversationActiveRef.current) {
        // Short pause so mic doesn't pick up room echo
        await new Promise((r) => setTimeout(r, 400))
        startListeningCycle()
      }
    })()
  }, [phase, finalResponse, voiceMode, voiceStatus, synthesizeAndPlay, startListeningCycle])

  // ── Mode toggle ────────────────────────────────────────────────────────────

  const enterConversationMode = useCallback(async () => {
    stopAudio()
    conversationActiveRef.current = true
    setVoiceMode('conversation')
    await startListeningCycle()
  }, [stopAudio, setVoiceMode, startListeningCycle])

  const exitConversationMode = useCallback(async () => {
    conversationActiveRef.current = false
    stopVAD()
    stopAudio()
    await stopRecording()
    setVoiceMode('off')
    setVoiceStatus('idle')
    setLiveTranscript('')
  }, [stopVAD, stopAudio, stopRecording, setVoiceMode, setVoiceStatus, setLiveTranscript])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      conversationActiveRef.current = false
      stopVAD()
      stopAudio()
      releaseStream()
    }
  }, [stopVAD, stopAudio, releaseStream])

  return {
    voiceMode,
    voiceStatus,
    startMicRecording,
    stopMicManually,
    enterConversationMode,
    exitConversationMode,
  }
}

import { create } from 'zustand'

export type VoiceMode = 'off' | 'conversation'
export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'thinking' | 'speaking'

interface VoiceState {
  voiceMode: VoiceMode
  voiceStatus: VoiceStatus
  liveTranscript: string   // conversation mode: shown in overlay
  micTranscript: string    // mic-only mode: fills textarea in MessageInput
  setVoiceMode: (mode: VoiceMode) => void
  setVoiceStatus: (status: VoiceStatus) => void
  setLiveTranscript: (t: string) => void
  setMicTranscript: (t: string) => void
  clearMicTranscript: () => void
}

export const useVoiceStore = create<VoiceState>((set) => ({
  voiceMode: 'off',
  voiceStatus: 'idle',
  liveTranscript: '',
  micTranscript: '',
  setVoiceMode: (voiceMode) => set({ voiceMode }),
  setVoiceStatus: (voiceStatus) => set({ voiceStatus }),
  setLiveTranscript: (liveTranscript) => set({ liveTranscript }),
  setMicTranscript: (micTranscript) => set({ micTranscript }),
  clearMicTranscript: () => set({ micTranscript: '' }),
}))

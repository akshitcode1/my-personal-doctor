import { create } from 'zustand'
import { AgentCardState, AppPhase } from '../types/agent'
import { WSEvent } from '../types/websocket'

export type ResponseMode = 'generic' | 'multi_agent' | 'manual'

interface AgentState {
  phase: AppPhase
  selectedSpecialists: string[]
  agents: Record<string, AgentCardState>
  synthesisTokens: string
  finalResponse: string
  isGenerating: boolean
  responseMode: ResponseMode
  manualSpecialists: string[]
  handleEvent: (event: WSEvent) => void
  resetAgentState: () => void
  setGenerating: (v: boolean) => void
  startGeneration: () => void
  setResponseMode: (mode: ResponseMode) => void
  toggleManualSpecialist: (key: string) => void
  setManualSpecialists: (keys: string[]) => void
}

const INITIAL = {
  phase: 'idle' as AppPhase,
  selectedSpecialists: [] as string[],
  agents: {} as Record<string, AgentCardState>,
  synthesisTokens: '',
  finalResponse: '',
  isGenerating: false,
  responseMode: 'multi_agent' as ResponseMode,
  manualSpecialists: [] as string[],
}

export const useAgentStore = create<AgentState>((set) => ({
  ...INITIAL,

  setGenerating: (v) => set({ isGenerating: v }),

  setResponseMode: (mode) => set({ responseMode: mode }),

  setManualSpecialists: (keys) => set({ responseMode: 'manual', manualSpecialists: keys }),

  toggleManualSpecialist: (key) => set((s) => {
    const already = s.manualSpecialists.includes(key)
    const next = already
      ? s.manualSpecialists.filter((k) => k !== key)
      : [...s.manualSpecialists, key]
    return { responseMode: 'manual', manualSpecialists: next }
  }),

  startGeneration: () => set((s) => ({
    ...INITIAL,
    responseMode: s.responseMode,
    manualSpecialists: s.manualSpecialists,
    phase: 'triage',
    isGenerating: true,
  })),

  handleEvent: (event: WSEvent) =>
    set((state) => {
      switch (event.type) {
        case 'triage_start':
          return { phase: 'triage', isGenerating: true }

        case 'triage_complete': {
          const specialists = event.selected_specialists ?? []
          const agents: Record<string, AgentCardState> = {}
          for (const s of specialists) {
            agents[s] = { status: 'idle', displayName: s, thinkingStep: '', tokens: '' }
          }
          return { phase: 'consulting', selectedSpecialists: specialists, agents }
        }

        case 'agent_start': {
          const key = event.agent!
          return {
            agents: {
              ...state.agents,
              [key]: { ...state.agents[key], status: 'thinking', displayName: event.display_name ?? key },
            },
          }
        }

        case 'agent_thinking': {
          const key = event.agent!
          return {
            agents: {
              ...state.agents,
              [key]: { ...state.agents[key], thinkingStep: event.step ?? '' },
            },
          }
        }

        case 'agent_token': {
          const key = event.agent!
          const prev = state.agents[key]
          return {
            agents: {
              ...state.agents,
              [key]: { ...prev, status: 'streaming', tokens: (prev?.tokens ?? '') + (event.token ?? '') },
            },
          }
        }

        case 'agent_complete': {
          const key = event.agent!
          return {
            agents: {
              ...state.agents,
              [key]: { ...state.agents[key], status: 'complete' },
            },
          }
        }

        case 'synthesis_start':
          return { phase: 'synthesizing' }

        case 'synthesis_token':
          return { synthesisTokens: state.synthesisTokens + (event.token ?? '') }

        case 'synthesis_complete':
          return { phase: 'complete', finalResponse: event.full_response ?? '', isGenerating: false }

        case 'clarification_checking':
          return { phase: 'triage' }

        case 'clarification_needed':
          return { phase: 'idle', isGenerating: false }

        case 'error':
          return { isGenerating: false, phase: 'idle' }

        default:
          return state
      }
    }),

  resetAgentState: () => set((s) => ({
    ...INITIAL,
    responseMode: s.responseMode,
    manualSpecialists: s.manualSpecialists,
  })),
}))

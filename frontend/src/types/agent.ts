export type AgentStatus = 'idle' | 'thinking' | 'streaming' | 'complete'

export interface AgentCardState {
  status: AgentStatus
  displayName: string
  thinkingStep: string
  tokens: string
  elapsedMs?: number
  tokenCount?: number
  confidence?: number
}

export type AppPhase = 'idle' | 'triage' | 'consulting' | 'synthesizing' | 'complete' | 'clarifying'

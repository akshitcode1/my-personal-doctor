export type WSEventType =
  | 'triage_start'
  | 'triage_complete'
  | 'agent_start'
  | 'agent_thinking'
  | 'agent_token'
  | 'agent_complete'
  | 'synthesis_start'
  | 'synthesis_token'
  | 'synthesis_complete'
  | 'clarification_checking'
  | 'clarification_needed'
  | 'chat_renamed'
  | 'error'

export interface WSEvent {
  type: WSEventType
  timestamp: string
  // triage_complete
  selected_specialists?: string[]
  // agent events
  agent?: string
  display_name?: string
  step?: string
  token?: string
  response?: string
  // synthesis
  full_response?: string
  // clarification
  questions?: string[]
  // chat_renamed
  chat_id?: string
  title?: string
  // error
  message?: string
}

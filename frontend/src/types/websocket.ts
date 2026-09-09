export type WSEventType =
  | 'triage_start'
  | 'triage_complete'
  | 'agent_start'
  | 'agent_thinking'
  | 'agent_token'
  | 'agent_complete'
  | 'agent_confidence'
  | 'synthesis_start'
  | 'synthesis_token'
  | 'synthesis_complete'
  | 'clarification_checking'
  | 'clarification_needed'
  | 'chat_renamed'
  | 'health_events_extracted'
  | 'follow_up_scheduled'
  | 'lab_parsed'
  | 'error'

export interface HealthEvent {
  event_type: 'symptom' | 'diagnosis' | 'medication' | 'test_result' | 'other'
  title: string
  description: string
  severity: 'mild' | 'moderate' | 'severe' | null
}

export interface LabResult {
  name: string
  display_name: string
  value: number
  unit: string
  normal_min: number
  normal_max: number
  flag: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high'
  category: string
  description: string
}

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
  elapsed_ms?: number
  token_count?: number
  // agent_confidence
  confidence?: number
  // synthesis
  full_response?: string
  // clarification
  questions?: string[]
  // chat_renamed
  chat_id?: string
  title?: string
  // health_events_extracted
  events?: HealthEvent[]
  // follow_up_scheduled
  follow_up_id?: string
  question?: string
  days_from_now?: number
  urgency?: 'normal' | 'urgent'
  // lab_parsed
  lab_results?: LabResult[]
  // error
  message?: string
}

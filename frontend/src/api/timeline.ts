import client from './client'

export interface HealthEvent {
  id: string
  event_type: 'symptom' | 'diagnosis' | 'medication' | 'test_result' | 'other'
  title: string
  description: string
  severity: 'mild' | 'moderate' | 'severe' | null
  occurred_at: string
  chat_id: string
}

export interface HealthSummary {
  total: number
  by_type: Record<string, number>
  by_severity: Record<string, number>
  recent: HealthEvent[]
}

export async function fetchHealthTimeline(limit = 50, offset = 0): Promise<{ events: HealthEvent[] }> {
  const { data } = await client.get('/health-timeline', { params: { limit, offset } })
  return data
}

export async function fetchHealthSummary(): Promise<HealthSummary> {
  const { data } = await client.get('/health-summary')
  return data
}

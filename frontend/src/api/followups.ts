import client from './client'

export interface FollowUp {
  id: string
  chat_id: string
  follow_up_question: string
  message_summary: string
  scheduled_for: string
  urgency: 'normal' | 'urgent'
  status: 'pending' | 'sent' | 'dismissed' | 'resolved'
  created_at: string
  chats?: { title: string }
}

export async function fetchFollowUps(): Promise<{ follow_ups: FollowUp[] }> {
  const { data } = await client.get('/follow-ups')
  return data
}

export async function dismissFollowUp(id: string): Promise<void> {
  await client.post(`/follow-ups/${id}/dismiss`)
}

export async function resolveFollowUp(id: string): Promise<void> {
  await client.post(`/follow-ups/${id}/resolve`)
}

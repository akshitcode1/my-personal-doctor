export interface Chat {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  chat_id: string
  role: 'user' | 'assistant'
  content: string
  selected_specialists?: string[]
  specialist_responses?: SpecialistResponse[]
  created_at: string
}

export interface SpecialistResponse {
  specialist: string
  display_name: string
  response: string
  rag_sources: string[]
}

export interface Document {
  id: string
  filename: string
  file_size: number
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  summary?: string
  created_at: string
}

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
  image_url?: string
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

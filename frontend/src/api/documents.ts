import client from './client'
import { Document } from '../types/chat'

export const fetchDocuments = (chatId: string) =>
  client.get<Document[]>(`/chats/${chatId}/documents`).then((r) => r.data)

export const uploadDocument = (chatId: string, file: File) => {
  const form = new FormData()
  form.append('file', file)
  return client.post<Document>(`/chats/${chatId}/documents`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}

export const deleteDocument = (chatId: string, docId: string) =>
  client.delete(`/chats/${chatId}/documents/${docId}`)

import client from './client'
import { Chat, Message } from '../types/chat'

export const fetchChats = () => client.get<Chat[]>('/chats').then((r) => r.data)

export const createChat = (title?: string) =>
  client.post<Chat>('/chats', { title: title ?? 'New Consultation' }).then((r) => r.data)

export const deleteChat = (id: string) => client.delete(`/chats/${id}`)

export const updateChatTitle = (id: string, title: string) =>
  client.patch<Chat>(`/chats/${id}`, { title }).then((r) => r.data)

export const fetchMessages = (chatId: string) =>
  client.get<Message[]>(`/chats/${chatId}/messages`).then((r) => r.data)

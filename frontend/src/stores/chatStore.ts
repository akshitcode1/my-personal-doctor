import { create } from 'zustand'
import { Chat, Message, Document } from '../types/chat'

interface ChatState {
  chats: Chat[]
  activeChatId: string | null
  messages: Message[]
  documents: Document[]
  setChats: (chats: Chat[]) => void
  addChat: (chat: Chat) => void
  removeChat: (chatId: string) => void
  setActiveChat: (chatId: string | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  setDocuments: (docs: Document[]) => void
  addDocument: (doc: Document) => void
  renameChat: (chatId: string, title: string) => void
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  activeChatId: null,
  messages: [],
  documents: [],
  setChats: (chats) => set({ chats }),
  addChat: (chat) => set((s) => ({ chats: [chat, ...s.chats] })),
  removeChat: (chatId) =>
    set((s) => ({
      chats: s.chats.filter((c) => c.id !== chatId),
      activeChatId: s.activeChatId === chatId ? null : s.activeChatId,
    })),
  setActiveChat: (chatId) => set({ activeChatId: chatId, messages: [], documents: [] }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  setDocuments: (docs) => set({ documents: docs }),
  addDocument: (doc) => set((s) => ({ documents: [...s.documents, doc] })),
  renameChat: (chatId, title) =>
    set((s) => ({ chats: s.chats.map((c) => c.id === chatId ? { ...c, title } : c) })),
}))

import { useCallback, useEffect } from 'react'
import { fetchChats, createChat as apiCreateChat, deleteChat as apiDeleteChat, fetchMessages } from '../api/chats'
import { fetchDocuments } from '../api/documents'
import { useChatStore } from '../stores/chatStore'
import { useAuthStore } from '../stores/authStore'
import { useAgentStore } from '../stores/agentStore'

export function useChat() {
  const accessToken = useAuthStore(state => state.session?.access_token ?? null)
  const { chats, activeChatId, messages, documents, setChats, addChat, removeChat, setActiveChat, setMessages, setDocuments } = useChatStore()

  const loadChats = useCallback(async () => {
    if (!accessToken) return
    const data = await fetchChats()
    setChats(data)
  }, [accessToken, setChats])

  useEffect(() => { loadChats() }, [loadChats])

  const selectChat = useCallback(async (chatId: string) => {
    useAgentStore.getState().resetAgentState()
    setActiveChat(chatId)
    const [msgs, docs] = await Promise.all([
      fetchMessages(chatId).catch(() => []),
      fetchDocuments(chatId).catch(() => []),
    ])
    setMessages(msgs)
    setDocuments(docs)
  }, [setActiveChat, setMessages, setDocuments])

  const newChat = useCallback(async () => {
    const chat = await apiCreateChat()
    addChat(chat)
    await selectChat(chat.id)
    return chat
  }, [addChat, selectChat])

  const deleteChat = useCallback(async (chatId: string) => {
    await apiDeleteChat(chatId)
    removeChat(chatId)
  }, [removeChat])

  return { chats, activeChatId, messages, documents, selectChat, newChat, deleteChat, loadChats }
}

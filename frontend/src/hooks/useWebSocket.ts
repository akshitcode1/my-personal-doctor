import { useCallback, useEffect, useRef } from 'react'
import { useAgentStore } from '../stores/agentStore'
import { useChatStore } from '../stores/chatStore'
import { WSEvent } from '../types/websocket'
import { useAuthStore } from '../stores/authStore'
import { useProfileStore } from '../stores/profileStore'

export function useWebSocket(chatId: string | null) {
  const wsRef = useRef<WebSocket | null>(null)
  const { handleEvent, startGeneration, setGenerating } = useAgentStore()
  const { addMessage, renameChat } = useChatStore()

  const buildPayload = useCallback((
    content: string,
    imageData?: string,
    imageMime?: string,
  ) => {
    const token = useAuthStore.getState().session?.access_token ?? ''
    const globalContext = useProfileStore.getState().globalContext || undefined
    const { responseMode, manualSpecialists } = useAgentStore.getState()
    return JSON.stringify({
      type: 'message',
      content,
      token,
      global_context: globalContext,
      mode: responseMode,
      manual_specialists: responseMode === 'manual' && manualSpecialists.length > 0
        ? manualSpecialists
        : undefined,
      image_data: imageData || undefined,
      image_mime: imageMime || undefined,
    })
  }, [])

  const connect = useCallback((): WebSocket | null => {
    if (!chatId) return null
    if (wsRef.current?.readyState === WebSocket.OPEN) return wsRef.current
    if (wsRef.current) {
      wsRef.current.onclose = null
      wsRef.current.close()
      wsRef.current = null
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/${chatId}`)

    ws.onmessage = (event) => {
      const data: WSEvent = JSON.parse(event.data)

      if (data.type === 'synthesis_complete' && data.full_response) {
        addMessage({
          id: crypto.randomUUID(),
          chat_id: chatId,
          role: 'assistant',
          content: data.full_response,
          created_at: data.timestamp,
        })
      }

      if (data.type === 'chat_renamed' && data.chat_id && data.title) {
        renameChat(data.chat_id, data.title)
      }

      if (data.type === 'clarification_needed' && data.questions?.length) {
        const questionsText =
          '__CLARIFICATION__\nTo give you the best advice, I have a few quick questions:\n\n' +
          data.questions.map((q) => `• ${q}`).join('\n')
        addMessage({
          id: crypto.randomUUID(),
          chat_id: chatId,
          role: 'assistant',
          content: questionsText,
          created_at: data.timestamp,
        })
      }

      handleEvent(data)
    }

    ws.onerror = () => console.error('WebSocket error')
    ws.onclose = () => { wsRef.current = null }
    wsRef.current = ws
    return ws
  }, [chatId, handleEvent, addMessage, renameChat])

  const sendMessage = useCallback((
    content: string,
    imageData?: string,
    imageMime?: string,
    imagePreviewUrl?: string,
  ) => {
    if (!chatId || !content.trim()) return

    startGeneration()

    addMessage({
      id: crypto.randomUUID(),
      chat_id: chatId,
      role: 'user',
      content,
      image_url: imagePreviewUrl,
      created_at: new Date().toISOString(),
    })

    const payload = buildPayload(content, imageData, imageMime)
    const ws = connect()
    if (!ws) return

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload)
    } else {
      ws.addEventListener('open', () => ws.send(payload), { once: true })
    }
  }, [chatId, connect, startGeneration, addMessage, buildPayload])

  const stopGeneration = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onclose = null
      wsRef.current.close()
      wsRef.current = null
    }
    setGenerating(false)
    setTimeout(() => connect(), 100)
  }, [connect, setGenerating])

  useEffect(() => {
    connect()
    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  return { sendMessage, stopGeneration }
}

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

  const buildPayload = useCallback((content: string) => {
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
    })
  }, [])

  const connect = useCallback((): WebSocket | null => {
    if (!chatId) return null

    // Reuse existing OPEN connection
    if (wsRef.current?.readyState === WebSocket.OPEN) return wsRef.current

    // Close any stale connection
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

  const sendMessage = useCallback((content: string) => {
    if (!chatId || !content.trim()) return

    // Show triage spinner immediately (don't wait for backend event)
    startGeneration()

    addMessage({
      id: crypto.randomUUID(),
      chat_id: chatId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    })

    const payload = buildPayload(content)

    const ws = connect()
    if (!ws) return

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload)
    } else {
      // Connection is still opening — wait for it, then send
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
    // Reconnect silently for next message
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

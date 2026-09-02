import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useChatStore } from '../../stores/chatStore'
import { useWebSocket } from '../../hooks/useWebSocket'
import MessageBubble from './MessageBubble'
import AgentConversation from './AgentConversation'
import MessageInput from './MessageInput'
import WelcomeScreen from './WelcomeScreen'
import { useAgentStore } from '../../stores/agentStore'

export default function ChatWindow() {
  const { activeChatId, messages, documents } = useChatStore()
  const { sendMessage, stopGeneration } = useWebSocket(activeChatId)
  const { phase, isGenerating } = useAgentStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  const isEmpty = messages.length === 0 && phase === 'idle'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, phase])

  if (!activeChatId) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)',
      }}>
        <div style={{ fontSize: 52, marginBottom: 16, filter: 'drop-shadow(0 0 16px rgba(74,123,255,0.3))' }}>🩺</div>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>My Personal Doctor</p>
        <p style={{ fontSize: 13 }}>Start a new consultation from the sidebar</p>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Document banner */}
      {documents.length > 0 && (
        <div style={{
          padding: '7px 20px',
          background: 'rgba(74,123,255,0.06)',
          borderBottom: '1px solid var(--glass-border)',
          fontSize: 12,
          color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          📎 {documents.length} medical record{documents.length > 1 ? 's' : ''} attached
          {documents.some(d => d.processing_status === 'processing') && ' (processing...)'}
        </div>
      )}

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <AnimatePresence>
          {isEmpty ? (
            <WelcomeScreen key="welcome" onSuggestion={sendMessage} />
          ) : (
            <motion.div
              key="messages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ padding: '20px 24px', flex: 1 }}
            >
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <AgentConversation onStop={stopGeneration} />
              <div ref={bottomRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 20px 16px',
        borderTop: isEmpty ? 'none' : '1px solid var(--glass-border)',
        background: isEmpty ? 'transparent' : 'rgba(238,242,255,0.7)',
      }}>
        <MessageInput
          onSend={sendMessage}
          onStop={stopGeneration}
          chatId={activeChatId}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  )
}

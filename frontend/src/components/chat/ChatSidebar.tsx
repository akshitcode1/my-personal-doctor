import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, MessageCircle, Pencil, Check, X } from 'lucide-react'
import { useChat } from '../../hooks/useChat'
import client from '../../api/client'
import { useChatStore } from '../../stores/chatStore'

export default function ChatSidebar() {
  const { chats, activeChatId, newChat, selectChat, deleteChat } = useChat()
  const { renameChat } = useChatStore()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const editRef = useRef<HTMLInputElement>(null)

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeletingId(id)
    await deleteChat(id)
    setDeletingId(null)
  }

  const startEdit = (e: React.MouseEvent, chat: { id: string; title: string }) => {
    e.stopPropagation()
    setEditingId(chat.id)
    setEditValue(chat.title)
    setTimeout(() => editRef.current?.select(), 30)
  }

  const commitEdit = async (chatId: string) => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed.length > 0) {
      try {
        await client.patch(`/chats/${chatId}`, { title: trimmed })
        renameChat(chatId, trimmed)
      } catch {}
    }
    setEditingId(null)
  }

  const cancelEdit = () => setEditingId(null)

  return (
    <div style={{
      width: 248,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid rgba(74,123,255,0.12)',
      background: 'linear-gradient(180deg, rgba(225,237,255,0.98) 0%, rgba(215,230,255,0.97) 100%)',
      backdropFilter: 'blur(20px)',
      overflow: 'hidden',
    }}>
      {/* Section label */}
      <div style={{ padding: '14px 14px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>
          Consultations
        </span>
      </div>

      {/* New Chat Button */}
      <div style={{ padding: '4px 10px 8px' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={newChat}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px',
            background: 'linear-gradient(135deg, #4A7BFF, #6366f1)',
            border: 'none', borderRadius: 12,
            color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(74,123,255,0.30)',
          }}
        >
          <Plus size={15} />
          New Consultation
        </motion.button>
      </div>

      {/* Chat List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 8px' }}>
        {chats.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 16px' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>
              No consultations yet.<br />Start a new one above.
            </p>
          </div>
        )}

        <AnimatePresence>
          {chats.map((chat) => (
            <motion.div
              key={chat.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: deletingId === chat.id ? 0.4 : 1, x: 0 }}
              exit={{ opacity: 0, x: -16, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.18 }}
              onMouseEnter={() => setHoveredId(chat.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => editingId !== chat.id && selectChat(chat.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px',
                borderRadius: 11, marginBottom: 2,
                cursor: editingId === chat.id ? 'default' : 'pointer',
                background: activeChatId === chat.id
                  ? 'rgba(74,123,255,0.14)'
                  : hoveredId === chat.id ? 'rgba(74,123,255,0.06)' : 'transparent',
                border: activeChatId === chat.id
                  ? '1px solid rgba(74,123,255,0.30)'
                  : '1px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <MessageCircle size={13} style={{
                color: activeChatId === chat.id ? 'var(--accent-blue)' : 'var(--text-muted)',
                flexShrink: 0,
              }} />

              {/* Inline edit mode */}
              {editingId === chat.id ? (
                <input
                  ref={editRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); commitEdit(chat.id) }
                    if (e.key === 'Escape') cancelEdit()
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    flex: 1, background: 'rgba(74,123,255,0.08)',
                    border: '1px solid rgba(74,123,255,0.35)', borderRadius: 6,
                    color: 'var(--text-primary)', fontSize: 12, padding: '3px 7px',
                    outline: 'none', fontFamily: 'inherit',
                  }}
                  autoFocus
                />
              ) : (
                <span style={{
                  flex: 1, fontSize: 13,
                  color: activeChatId === chat.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                  fontWeight: activeChatId === chat.id ? 600 : 400,
                }}>
                  {chat.title}
                </span>
              )}

              {/* Action buttons on hover */}
              <AnimatePresence>
                {hoveredId === chat.id && editingId !== chat.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.12 }}
                    style={{ display: 'flex', gap: 4, flexShrink: 0 }}
                  >
                    <button
                      onClick={(e) => startEdit(e, chat)}
                      style={{
                        background: 'rgba(74,123,255,0.08)',
                        border: '1px solid rgba(74,123,255,0.22)',
                        borderRadius: 6, padding: '3px 5px',
                        cursor: 'pointer', color: 'var(--accent-blue)',
                        display: 'flex', alignItems: 'center',
                      }}
                      title="Rename"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, chat.id)}
                      style={{
                        background: 'rgba(220,38,38,0.08)',
                        border: '1px solid rgba(220,38,38,0.22)',
                        borderRadius: 6, padding: '3px 5px',
                        cursor: 'pointer', color: '#dc2626',
                        display: 'flex', alignItems: 'center',
                      }}
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </motion.div>
                )}

                {/* Confirm / cancel when editing */}
                {editingId === chat.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ display: 'flex', gap: 3, flexShrink: 0 }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); commitEdit(chat.id) }}
                      style={{
                        background: 'rgba(22,163,74,0.10)', border: '1px solid rgba(22,163,74,0.28)',
                        borderRadius: 6, padding: '3px 5px', cursor: 'pointer', color: '#16a34a',
                        display: 'flex', alignItems: 'center',
                      }}
                    >
                      <Check size={11} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); cancelEdit() }}
                      style={{
                        background: 'rgba(74,123,255,0.06)', border: '1px solid rgba(74,123,255,0.16)',
                        borderRadius: 6, padding: '3px 5px', cursor: 'pointer', color: 'var(--text-muted)',
                        display: 'flex', alignItems: 'center',
                      }}
                    >
                      <X size={11} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

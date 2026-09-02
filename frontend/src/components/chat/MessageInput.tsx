import { useState, useRef, KeyboardEvent } from 'react'
import { Send, Square, Paperclip, X, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../../stores/chatStore'
import { useAgentStore } from '../../stores/agentStore'
import client from '../../api/client'

interface Props {
  onSend: (content: string) => void
  onStop: () => void
  chatId: string
  isGenerating: boolean
  onDocumentSummary?: (summary: string, filename: string) => void
}

interface FilePreview {
  name: string
  size: string
  type: 'pdf' | 'image'
  previewUrl?: string
  file: File
}

const MODE_LABELS: Record<string, string> = {
  generic: 'General Doctor Agent',
  multi_agent: 'AI Council',
  manual: 'Manual Specialists',
}

export default function MessageInput({ onSend, onStop, chatId, isGenerating, onDocumentSummary }: Props) {
  const [value, setValue] = useState('')
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { addDocument, addMessage } = useChatStore()
  const { responseMode, manualSpecialists } = useAgentStore()

  const submit = () => {
    if (isGenerating) { onStop(); return }
    if (!value.trim()) return
    onSend(value.trim())
    setValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isImage = file.type.startsWith('image/')
    const sizeStr = file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / 1024 / 1024).toFixed(1)} MB`
    const preview: FilePreview = { name: file.name, size: sizeStr, type: isImage ? 'image' : 'pdf', file }
    if (isImage) preview.previewUrl = URL.createObjectURL(file)
    setFilePreview(preview)
    e.target.value = ''
  }

  const handleUpload = async () => {
    if (!filePreview) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', filePreview.file)
      const { data } = await client.post(`/chats/${chatId}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      addDocument(data)
      if (data.summary) {
        addMessage({
          id: crypto.randomUUID(),
          chat_id: chatId,
          role: 'assistant',
          content: `__DOC_SUMMARY__\n${data.summary}`,
          created_at: new Date().toISOString(),
        })
      }
      setFilePreview(null)
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setUploading(false)
    }
  }

  const canSend = value.trim() && !isGenerating

  const modeBadgeLabel = responseMode === 'manual' && manualSpecialists.length > 0
    ? `${manualSpecialists.length} Specialist${manualSpecialists.length > 1 ? 's' : ''}`
    : MODE_LABELS[responseMode] ?? 'AI Council'

  const modeBadgeColor = responseMode === 'multi_agent'
    ? { bg: 'rgba(74,123,255,0.12)', border: 'rgba(74,123,255,0.25)', color: '#7aa3ff' }
    : responseMode === 'manual'
      ? { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.28)', color: '#c084fc' }
      : { bg: 'rgba(74,123,255,0.07)', border: 'rgba(74,123,255,0.18)', color: 'var(--text-secondary)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* File preview */}
      <AnimatePresence>
        {filePreview && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            style={{
              borderRadius: 16, overflow: 'hidden',
              border: '1px solid rgba(74,123,255,0.25)',
              background: 'rgba(240,244,255,0.95)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}
          >
            {filePreview.type === 'image' && filePreview.previewUrl && (
              <div style={{ position: 'relative' }}>
                <img src={filePreview.previewUrl} alt="preview" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to top, rgba(235,240,255,0.9), transparent)' }} />
              </div>
            )}
            {filePreview.type === 'pdf' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px', background: 'rgba(74,123,255,0.06)' }}>
                <div style={{
                  width: 52, height: 64, borderRadius: 10,
                  background: 'linear-gradient(145deg, #e63946, #c1121f)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, boxShadow: '0 4px 12px rgba(230,57,70,0.35)',
                }}>
                  <FileText size={20} color="#fff" />
                  <span style={{ fontSize: 9, color: '#fff', fontWeight: 700, marginTop: 4, letterSpacing: '0.5px' }}>PDF</span>
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filePreview.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{filePreview.size} · Medical Document</div>
                  <div style={{ fontSize: 11, color: 'rgba(80,220,140,0.8)', marginTop: 4 }}>🤖 AI will summarize this document after upload</div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderTop: '1px solid rgba(74,123,255,0.10)', background: 'rgba(255,255,255,0.4)' }}>
              <div style={{ flex: 1, fontSize: 12, color: 'var(--text-muted)' }}>
                {filePreview.type === 'pdf' ? 'This document will be shared with your specialist AI doctors' : `📸 ${filePreview.name} · ${filePreview.size}`}
              </div>
              <button
                onClick={() => setFilePreview(null)}
                style={{ background: 'rgba(74,123,255,0.06)', border: '1px solid rgba(74,123,255,0.16)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <X size={12} /> Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                style={{ background: uploading ? 'rgba(74,123,255,0.3)' : 'var(--accent-blue)', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: uploading ? 'not-allowed' : 'pointer', color: '#fff', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5, minWidth: 90, justifyContent: 'center' }}
              >
                {uploading ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 10, height: 10, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                    Processing…
                  </>
                ) : '📎 Attach'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input row */}
      <div
        className="glass-card"
        style={{
          display: 'flex', alignItems: 'flex-end', gap: 8,
          padding: '10px 12px', borderRadius: 16,
          border: isGenerating ? '1px solid rgba(74,123,255,0.35)' : '1px solid var(--glass-border)',
          transition: 'border-color 0.2s',
        }}
      >
        {/* File button */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={isGenerating}
          style={{
            background: 'none', border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer',
            color: 'var(--text-muted)', padding: '6px', borderRadius: 8,
            display: 'flex', alignItems: 'center', flexShrink: 0,
            transition: 'color 0.15s', opacity: isGenerating ? 0.4 : 1,
          }}
          title="Attach PDF"
          onMouseEnter={(e) => { if (!isGenerating) e.currentTarget.style.color = 'var(--accent-blue)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <Paperclip size={17} />
        </button>
        <input ref={fileRef} type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={handleFileSelect} />

        {/* Textarea */}
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isGenerating ? 'Consulting…' : 'Describe your symptoms or ask a health question…'}
          disabled={isGenerating}
          rows={1}
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: isGenerating ? 'var(--text-muted)' : 'var(--text-primary)',
            fontSize: 14, fontFamily: 'inherit', resize: 'none',
            lineHeight: 1.5, maxHeight: 120, overflowY: 'auto',
          }}
          onInput={(e) => {
            const t = e.currentTarget
            t.style.height = 'auto'
            t.style.height = Math.min(t.scrollHeight, 120) + 'px'
          }}
        />

        {/* Mode badge */}
        {!isGenerating && (
          <div style={{
            fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap',
            padding: '3px 8px', borderRadius: 10,
            background: modeBadgeColor.bg,
            border: `1px solid ${modeBadgeColor.border}`,
            color: modeBadgeColor.color,
            flexShrink: 0, alignSelf: 'center',
          }}>
            {modeBadgeLabel}
          </div>
        )}

        {/* Send / Stop */}
        {isGenerating ? (
          <button
            onClick={onStop}
            style={{
              background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.35)',
              borderRadius: 10, padding: '8px 10px', cursor: 'pointer', color: '#f87171',
              display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, fontSize: 12, fontWeight: 600,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.25)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.15)' }}
          >
            <Square size={13} fill="#f87171" />
            Stop
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!canSend}
            style={{
              background: canSend ? 'var(--accent-blue)' : 'rgba(255,255,255,0.05)',
              border: '1px solid transparent', borderRadius: 10, padding: '8px 10px',
              cursor: canSend ? 'pointer' : 'default',
              color: canSend ? '#fff' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center',
              transition: 'all 0.18s', flexShrink: 0,
              transform: canSend ? 'scale(1)' : 'scale(0.95)',
            }}
          >
            <Send size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

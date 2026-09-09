import { useState, useRef, KeyboardEvent, useEffect } from 'react'
import { Send, Square, Paperclip, X, FileText, Mic, MicOff, Phone, FlaskConical, Eye } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../../stores/chatStore'
import { useAgentStore } from '../../stores/agentStore'
import { VoiceStatus, useVoiceStore } from '../../stores/voiceStore'
import client from '../../api/client'

interface Props {
  onSend: (content: string, imageData?: string, imageMime?: string, imagePreviewUrl?: string) => void
  onStop: () => void
  chatId: string
  isGenerating: boolean
  onDocumentSummary?: (summary: string, filename: string) => void
  voiceStatus: VoiceStatus
  onMicToggle: () => void
  onVoiceConversation: () => void
  onLabResults?: (results: unknown) => void
}

interface PendingImage {
  previewUrl: string
  base64: string
  mime: string
  name: string
  sizeStr: string
}

const MODE_LABELS: Record<string, string> = {
  generic: 'General Doctor Agent',
  multi_agent: 'AI Council',
  manual: 'Manual Specialists',
}

export default function MessageInput({
  onSend, onStop, chatId, isGenerating,
  voiceStatus, onMicToggle, onVoiceConversation, onLabResults,
}: Props) {
  const [value, setValue] = useState('')
  const [uploading, setUploading] = useState(false)
  const [pendingPdf, setPendingPdf] = useState<{ name: string; size: string; file: File } | null>(null)
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null)
  const [labUploading, setLabUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const labRef = useRef<HTMLInputElement>(null)
  const { addDocument, addMessage } = useChatStore()
  const { responseMode, manualSpecialists } = useAgentStore()
  const { micTranscript, clearMicTranscript } = useVoiceStore()

  useEffect(() => {
    if (!micTranscript) return
    setValue((prev) => prev ? `${prev} ${micTranscript}` : micTranscript)
    clearMicTranscript()
  }, [micTranscript, clearMicTranscript])

  const submit = () => {
    if (isGenerating) { onStop(); return }
    if (!value.trim()) return
    onSend(
      value.trim(),
      pendingImage?.base64,
      pendingImage?.mime,
      pendingImage?.previewUrl,
    )
    setValue('')
    setPendingImage(null)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const isImage = file.type.startsWith('image/')
    const sizeStr = file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / 1024 / 1024).toFixed(1)} MB`

    if (isImage) {
      // Encode as base64 to send through WebSocket for vision analysis
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        const base64 = dataUrl.split(',')[1]
        setPendingImage({ previewUrl: dataUrl, base64, mime: file.type, name: file.name, sizeStr })
      }
      reader.readAsDataURL(file)
    } else {
      setPendingPdf({ name: file.name, size: sizeStr, file })
    }
    e.target.value = ''
  }

  const handlePdfUpload = async () => {
    if (!pendingPdf) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', pendingPdf.file)
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
      setPendingPdf(null)
    } catch (err) {
      console.error('Upload failed', err)
    } finally {
      setUploading(false)
    }
  }

  const handleLabUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setLabUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await client.post(`/chats/${chatId}/lab-report`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (onLabResults) onLabResults(data)
      addMessage({
        id: crypto.randomUUID(),
        chat_id: chatId,
        role: 'assistant',
        content: `__LAB_RESULTS__\n${JSON.stringify(data)}`,
        created_at: new Date().toISOString(),
      })
    } catch (err) {
      console.error('Lab upload failed', err)
    } finally {
      setLabUploading(false)
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

      {/* PDF preview */}
      <AnimatePresence>
        {pendingPdf && (
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
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pendingPdf.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{pendingPdf.size} · Medical Document</div>
                <div style={{ fontSize: 11, color: 'rgba(80,220,140,0.8)', marginTop: 4 }}>🤖 AI will summarize this document after upload</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderTop: '1px solid rgba(74,123,255,0.10)', background: 'rgba(255,255,255,0.4)' }}>
              <button onClick={() => setPendingPdf(null)} style={{ background: 'rgba(74,123,255,0.06)', border: '1px solid rgba(74,123,255,0.16)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <X size={12} /> Cancel
              </button>
              <button
                onClick={handlePdfUpload}
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

      {/* Symptom photo preview — compact chip */}
      <AnimatePresence>
        {pendingImage && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.15 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
              background: 'rgba(255,255,255,0.80)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(74,123,255,0.22)', borderRadius: 12,
              padding: '5px 10px 5px 5px',
              boxShadow: '0 2px 10px rgba(74,123,255,0.10)',
            }}
          >
            {/* Thumbnail */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={pendingImage.previewUrl} alt=""
                style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, display: 'block' }}
              />
              {/* Vision badge overlay */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 8,
                background: 'rgba(74,123,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Eye size={13} color="#4A7BFF" />
              </div>
            </div>

            {/* Labels */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4A7BFF', letterSpacing: '0.04em' }}>Vision Analysis</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                {pendingImage.name.length > 18 ? pendingImage.name.slice(0, 18) + '…' : pendingImage.name} · {pendingImage.sizeStr}
              </div>
            </div>

            {/* Remove */}
            <button
              onClick={() => setPendingImage(null)}
              style={{
                marginLeft: 2, background: 'rgba(74,123,255,0.08)', border: '1px solid rgba(74,123,255,0.15)',
                borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <X size={10} />
            </button>
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
          title="Attach PDF or symptom photo"
          style={{
            background: 'none', border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer',
            color: 'var(--text-muted)', padding: '6px', borderRadius: 8,
            display: 'flex', alignItems: 'center', flexShrink: 0,
            transition: 'color 0.15s', opacity: isGenerating ? 0.4 : 1,
          }}
          onMouseEnter={(e) => { if (!isGenerating) e.currentTarget.style.color = 'var(--accent-blue)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          <Paperclip size={17} />
        </button>
        <input ref={fileRef} type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={handleFileSelect} />

        {/* Lab report button */}
        <button
          onClick={() => labRef.current?.click()}
          disabled={isGenerating || labUploading}
          title="Analyze lab report / blood test"
          style={{
            background: labUploading ? 'rgba(168,85,247,0.10)' : 'none',
            border: labUploading ? '1px solid rgba(168,85,247,0.3)' : 'none',
            cursor: isGenerating || labUploading ? 'not-allowed' : 'pointer',
            color: labUploading ? '#a855f7' : 'var(--text-muted)', padding: '6px', borderRadius: 8,
            display: 'flex', alignItems: 'center', flexShrink: 0,
            transition: 'color 0.15s', opacity: isGenerating ? 0.4 : 1,
          }}
          onMouseEnter={(e) => { if (!isGenerating && !labUploading) e.currentTarget.style.color = '#a855f7' }}
          onMouseLeave={(e) => { if (!labUploading) e.currentTarget.style.color = 'var(--text-muted)' }}
        >
          {labUploading
            ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ width: 17, height: 17, border: '2px solid rgba(168,85,247,0.3)', borderTopColor: '#a855f7', borderRadius: '50%' }} />
            : <FlaskConical size={17} />
          }
        </button>
        <input ref={labRef} type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={handleLabUpload} />

        {/* Mic button */}
        <motion.button
          onClick={onMicToggle}
          disabled={isGenerating || voiceStatus === 'processing'}
          title={voiceStatus === 'listening' ? 'Stop recording' : 'Speak your question'}
          animate={voiceStatus === 'listening' ? { scale: [1, 1.15, 1] } : { scale: 1 }}
          transition={{ duration: 0.8, repeat: voiceStatus === 'listening' ? Infinity : 0 }}
          style={{
            background: voiceStatus === 'listening' ? 'rgba(52,211,153,0.15)' : 'none',
            border: voiceStatus === 'listening' ? '1px solid rgba(52,211,153,0.4)' : 'none',
            borderRadius: 8, padding: '6px', cursor: isGenerating ? 'not-allowed' : 'pointer',
            color: voiceStatus === 'listening' ? 'rgb(52,211,153)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', flexShrink: 0,
            transition: 'color 0.15s, background 0.15s',
            opacity: isGenerating || voiceStatus === 'processing' ? 0.4 : 1,
          }}
        >
          {voiceStatus === 'listening' ? <MicOff size={17} /> : <Mic size={17} />}
        </motion.button>

        {/* Voice conversation */}
        <motion.button
          onClick={onVoiceConversation}
          disabled={isGenerating}
          title="Start voice conversation"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            background: 'rgba(74,123,255,0.1)', border: '1px solid rgba(74,123,255,0.25)',
            borderRadius: 8, padding: '6px', cursor: isGenerating ? 'not-allowed' : 'pointer',
            color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', flexShrink: 0,
            opacity: isGenerating ? 0.4 : 1,
          }}
        >
          <Phone size={15} />
        </motion.button>

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

import { motion } from 'framer-motion'
import { Message } from '../../types/chat'

interface Props { message: Message }

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}
      >
        <div style={{
          maxWidth: '75%',
          background: 'linear-gradient(135deg, #4A7BFF, #6366f1)',
          borderRadius: '18px 18px 4px 18px',
          padding: '12px 16px',
          color: '#fff',
          fontSize: 14,
          lineHeight: 1.6,
          boxShadow: '0 4px 20px rgba(74,123,255,0.30)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {message.content}
        </div>
      </motion.div>
    )
  }

  // Clarification questions card
  if (message.content.startsWith('__CLARIFICATION__')) {
    const body = message.content.replace('__CLARIFICATION__\n', '')
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-start' }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(255,195,80,0.18)',
          border: '1px solid rgba(255,195,80,0.40)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0, marginTop: 2,
        }}>
          🤔
        </div>
        <div style={{
          flex: 1,
          background: 'rgba(255,195,80,0.06)',
          border: '1px solid rgba(255,195,80,0.22)',
          borderRadius: '4px 18px 18px 18px',
          padding: '14px 18px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 12px rgba(74,123,255,0.06)',
        }}>
          <div style={{ fontSize: 11, color: 'rgba(180,120,0,0.9)', fontWeight: 600, marginBottom: 8, letterSpacing: '0.3px' }}>
            FOLLOW-UP QUESTIONS
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
            {body}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, borderTop: '1px solid rgba(74,123,255,0.08)', paddingTop: 8 }}>
            Please answer these questions in your next message for a more accurate consultation
          </div>
        </div>
      </motion.div>
    )
  }

  // Document summary card
  if (message.content.startsWith('__DOC_SUMMARY__')) {
    const body = message.content.replace('__DOC_SUMMARY__\n', '')
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-start' }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(80,220,140,0.15)',
          border: '1px solid rgba(80,220,140,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0, marginTop: 2,
        }}>
          📄
        </div>
        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.72)',
          border: '1px solid rgba(80,220,140,0.22)',
          borderRadius: '4px 18px 18px 18px',
          padding: '14px 18px',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 12px rgba(80,220,140,0.08)',
        }}>
          <div style={{ fontSize: 11, color: 'rgba(22,163,74,0.9)', fontWeight: 600, marginBottom: 8, letterSpacing: '0.3px' }}>
            DOCUMENT SUMMARY
          </div>
          <div
            style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text-secondary)' }}
            dangerouslySetInnerHTML={{
              __html: body
                .replace(/\*\*(.*?)\*\*/g, `<strong style="color:var(--text-primary)">$1</strong>`)
                .replace(/^• (.+)$/gm, '<div style="padding-left:4px;margin:4px 0">• $1</div>')
            }}
          />
        </div>
      </motion.div>
    )
  }

  // Normal assistant message
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-start' }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: '50%',
        background: 'rgba(74,123,255,0.12)',
        border: '1px solid rgba(74,123,255,0.28)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, flexShrink: 0, marginTop: 2,
      }}>
        🩺
      </div>

      <div style={{
        flex: 1,
        background: 'rgba(255,255,255,0.72)',
        border: '1px solid rgba(74,123,255,0.14)',
        borderRadius: '4px 18px 18px 18px',
        padding: '14px 18px',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 12px rgba(74,123,255,0.07)',
      }}>
        <div style={{ fontSize: 11, color: 'var(--accent-blue)', fontWeight: 600, marginBottom: 8, letterSpacing: '0.3px' }}>
          MY PERSONAL DOCTOR
        </div>
        <div
          className="prose"
          style={{ fontSize: 14, lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{
            __html: message.content
              .replace(/\*\*(.*?)\*\*/gs, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/gs, '<em>$1</em>')
              .replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid rgba(74,123,255,0.12);margin:10px 0">')
              .replace(/^# (.+)$/gm, `<h2 style="color:rgba(13,22,64,0.92);font-size:15px;font-weight:700;margin:14px 0 6px">$1</h2>`)
              .replace(/^## (.+)$/gm, `<h3 style="color:rgba(13,22,64,0.92);font-size:14px;font-weight:600;margin:12px 0 6px">$1</h3>`)
              .replace(/^### (.+)$/gm, `<h4 style="color:rgba(13,22,64,0.70);font-size:13px;font-weight:600;margin:10px 0 4px">$1</h4>`)
              .replace(/^- (.+)$/gm, '<div style="padding-left:4px;margin:2px 0">• $1</div>')
          }}
        />
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, borderTop: '1px solid rgba(74,123,255,0.08)', paddingTop: 8 }}>
          For informational purposes only — not a substitute for professional medical advice
        </div>
      </div>
    </motion.div>
  )
}

import { motion } from 'framer-motion'

interface Props {
  tokens: string
  isComplete: boolean
}

export default function SynthesisPanel({ tokens, isComplete }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      style={{
        marginTop: 14,
        background: isComplete
          ? 'rgba(80,220,140,0.05)'
          : 'rgba(74,123,255,0.05)',
        border: isComplete
          ? '1px solid rgba(80,220,140,0.28)'
          : '1px solid rgba(74,123,255,0.30)',
        borderRadius: 18,
        padding: '16px 20px',
        backdropFilter: 'blur(12px)',
        boxShadow: isComplete
          ? '0 2px 20px rgba(80,220,140,0.07)'
          : '0 2px 24px rgba(74,123,255,0.10)',
        transition: 'border-color 0.4s, box-shadow 0.4s',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        {/* Icon circle — no emoji */}
        <div style={{
          width: 30, height: 30, borderRadius: 9, flexShrink: 0,
          background: isComplete ? 'rgba(80,220,140,0.15)' : 'rgba(74,123,255,0.13)',
          border: isComplete ? '1.5px solid rgba(80,220,140,0.35)' : '1.5px solid rgba(74,123,255,0.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isComplete ? (
            /* Green check circle */
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6.5" fill="rgba(80,220,140,0.9)" />
              <path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            /* Animated pulse ring */
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-blue)' }}
            />
          )}
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {isComplete ? 'Clinical Summary' : 'Synthesizing findings…'}
          </div>
          <div style={{ fontSize: 11, color: isComplete ? 'rgba(80,180,120,0.9)' : 'var(--accent-blue)', marginTop: 1 }}>
            {isComplete ? 'All specialists consulted' : 'Combining specialist opinions'}
          </div>
        </div>

        {!isComplete && (
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-blue)' }}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Content */}
      {tokens ? (
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.75,
            color: 'var(--text-secondary)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
          dangerouslySetInnerHTML={{
            __html: tokens
              .replace(/\*\*(.*?)\*\*/gs, '<strong style="color:rgba(13,22,64,0.92)">$1</strong>')
              .replace(/\*(.*?)\*/gs, '<em>$1</em>')
              .replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid rgba(74,123,255,0.12);margin:10px 0">')
              .replace(/^# (.+)$/gm, '<div style="color:rgba(13,22,64,0.92);font-size:15px;font-weight:700;margin:14px 0 6px">$1</div>')
              .replace(/^## (.+)$/gm, '<div style="color:rgba(13,22,64,0.92);font-size:14px;font-weight:600;margin:14px 0 6px">$1</div>')
              .replace(/^### (.+)$/gm, '<div style="color:rgba(13,22,64,0.70);font-size:13px;font-weight:600;margin:10px 0 4px">$1</div>')
              .replace(/^- (.+)$/gm, '<div style="padding-left:12px;margin:3px 0">• $1</div>')
          }}
        />
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Preparing your clinical summary…
        </div>
      )}

      {/* Cursor when streaming */}
      {!isComplete && tokens && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          style={{
            display: 'inline-block', width: 2, height: 14,
            background: 'var(--accent-blue)',
            marginLeft: 2, verticalAlign: 'middle', borderRadius: 1,
          }}
        />
      )}

      {/* Disclaimer */}
      {isComplete && (
        <div style={{
          fontSize: 11, color: 'var(--text-muted)',
          borderTop: '1px solid rgba(74,123,255,0.10)',
          marginTop: 12, paddingTop: 10,
        }}>
          For informational purposes only — always consult a licensed healthcare provider
        </div>
      )}
    </motion.div>
  )
}

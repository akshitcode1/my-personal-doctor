import { motion, AnimatePresence } from 'framer-motion'
import { AgentCardState } from '../../types/agent'

const ICONS: Record<string, string> = {
  general_practitioner: '🩺',
  cardiologist: '🫀',
  orthopedist: '🦴',
  gynecologist: '⚕️',
  neurologist: '🧠',
  dermatologist: '🔬',
  gastroenterologist: '🍃',
  pulmonologist: '🫁',
  pediatrician: '👶',
  psychiatrist: '🧬',
  dentist: '🦷',
}

const STATUS_COLORS = {
  idle:      { border: 'rgba(74,123,255,0.10)', glow: 'none',                             dot: 'rgba(74,123,255,0.3)',  label: 'Idle' },
  thinking:  { border: 'rgba(255,195,80,0.45)',  glow: '0 0 20px rgba(255,195,80,0.12)',  dot: '#ffc350',               label: 'Thinking…' },
  streaming: { border: 'rgba(74,123,255,0.55)',  glow: '0 0 24px rgba(74,123,255,0.18)',  dot: '#4A7BFF',               label: 'Writing…' },
  complete:  { border: 'rgba(80,220,140,0.40)',  glow: '0 0 16px rgba(80,220,140,0.10)', dot: '#50dc8c',               label: 'Done' },
}

interface Props {
  agentKey: string
  state: AgentCardState
  isParallel?: boolean
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100)
  const color = pct >= 75 ? '#50dc8c' : pct >= 50 ? '#4A7BFF' : '#ffc350'
  return (
    <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(74,123,255,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.3px' }}>CONTRIBUTION</span>
        <span style={{ fontSize: 10, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
      </div>
      <div style={{ height: 3, background: 'rgba(74,123,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 99 }}
        />
      </div>
    </div>
  )
}

export default function AgentCard({ agentKey, state, isParallel }: Props) {
  const { status, displayName, thinkingStep, tokens, elapsedMs, tokenCount, confidence } = state
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.idle
  const icon = ICONS[agentKey] ?? '👨‍⚕️'
  const isActive = status === 'streaming' || status === 'thinking'
  const isDone = status === 'complete'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={{
        flex: '1 1 240px', minWidth: 210, maxWidth: 360,
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(14px)',
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        padding: '14px 16px',
        boxShadow: colors.glow !== 'none'
          ? `0 2px 16px rgba(74,123,255,0.08), ${colors.glow}`
          : '0 2px 16px rgba(74,123,255,0.06)',
        transition: 'border-color 0.35s, box-shadow 0.35s',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Shimmer on streaming */}
      {status === 'streaming' && (
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(74,123,255,0.06) 50%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Parallel badge */}
      {isParallel && (
        <div style={{
          position: 'absolute', top: 10, right: 12,
          fontSize: 9, fontWeight: 700, letterSpacing: '0.5px',
          color: isActive ? '#4A7BFF' : isDone ? '#16a34a' : 'var(--text-muted)',
          textTransform: 'uppercase',
          background: isActive ? 'rgba(74,123,255,0.10)' : isDone ? 'rgba(22,163,74,0.08)' : 'rgba(74,123,255,0.05)',
          border: `1px solid ${isActive ? 'rgba(74,123,255,0.28)' : isDone ? 'rgba(22,163,74,0.22)' : 'rgba(74,123,255,0.10)'}`,
          padding: '2px 6px', borderRadius: 6,
          transition: 'all 0.3s',
        }}>
          {isDone ? '✓ Done' : isActive ? 'Live' : 'Standby'}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: isActive
            ? status === 'thinking' ? 'rgba(255,195,80,0.10)' : 'rgba(74,123,255,0.10)'
            : isDone ? 'rgba(80,220,140,0.10)' : 'rgba(74,123,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 19, flexShrink: 0,
          border: `1px solid ${colors.border}`,
          transition: 'all 0.3s',
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingRight: isParallel ? 56 : 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
            <motion.div
              animate={isActive
                ? { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }
                : { scale: 1, opacity: 1 }
              }
              transition={{ duration: 1, repeat: Infinity }}
              style={{ width: 6, height: 6, borderRadius: '50%', background: colors.dot, flexShrink: 0 }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {status === 'streaming'
                ? 'Writing response…'
                : status === 'thinking'
                  ? (thinkingStep || 'Thinking…')
                  : colors.label}
            </span>
          </div>
        </div>
      </div>

      {/* Streaming text */}
      <AnimatePresence>
        {tokens && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{
              fontSize: 12.5,
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              maxHeight: 130,
              overflowY: 'auto',
              borderTop: '1px solid rgba(74,123,255,0.08)',
              paddingTop: 10,
              marginTop: 4,
            }}
          >
            {tokens}
            {status === 'streaming' && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                style={{
                  display: 'inline-block', width: 2, height: 12,
                  background: 'var(--accent-blue)',
                  marginLeft: 2, verticalAlign: 'middle', borderRadius: 1,
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timing + token count (shown when complete) */}
      {isDone && (elapsedMs !== undefined || tokenCount !== undefined) && (
        <div style={{
          display: 'flex', gap: 10, marginTop: tokens ? 8 : 4,
          paddingTop: tokens ? 6 : 0,
          borderTop: tokens ? '1px solid rgba(74,123,255,0.08)' : 'none',
        }}>
          {elapsedMs !== undefined && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
              ⏱ {(elapsedMs / 1000).toFixed(1)}s
            </span>
          )}
          {tokenCount !== undefined && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
              ≈ {tokenCount} tokens
            </span>
          )}
        </div>
      )}

      {/* Confidence bar (shown after synthesis completes) */}
      <AnimatePresence>
        {isDone && confidence !== undefined && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <ConfidenceBar confidence={confidence} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

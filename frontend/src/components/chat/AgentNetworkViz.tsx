import { motion, AnimatePresence } from 'framer-motion'
import { AgentCardState, AppPhase } from '../../types/agent'

const ICONS: Record<string, string> = {
  general_practitioner: '🩺', cardiologist: '🫀', orthopedist: '🦴',
  gynecologist: '⚕️', neurologist: '🧠', dermatologist: '🔬',
  gastroenterologist: '🍃', pulmonologist: '🫁', pediatrician: '👶',
  psychiatrist: '🧬', dentist: '🦷',
}

interface Props {
  specialists: string[]
  agents: Record<string, AgentCardState>
  visible: boolean
  phase: AppPhase
}

function Signal({ x1, y1, x2, y2, delay, color }: {
  x1: number; y1: number; x2: number; y2: number; delay: number; color: string
}) {
  return (
    <motion.circle
      r={3.5}
      fill={color}
      filter="url(#dot-glow)"
      initial={{ cx: x1, cy: y1, opacity: 0 }}
      animate={{ cx: [x1, x1, x2, x2], cy: [y1, y1, y2, y2], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 2, delay, repeat: Infinity, ease: 'linear' }}
    />
  )
}

export default function AgentNetworkViz({ specialists, agents, visible, phase }: Props) {
  const N = specialists.length
  if (N < 2) return null

  // Layout: [Triage] → [Spec1 Spec2 ...] → [Synthesis]
  const W = 520
  const H = 110
  const nodeR = 22
  const midY = H / 2

  // Triage node: left anchor
  const triageX = 40
  // Synthesis node: right anchor
  const synthX = W - 40
  // Specialist nodes: evenly spaced in the middle
  const midStart = 110
  const midEnd = W - 110
  const specSpacing = N > 1 ? (midEnd - midStart) / (N - 1) : 0
  const specPositions = specialists.map((_, i) => ({
    x: N === 1 ? (midStart + midEnd) / 2 : midStart + i * specSpacing,
    y: midY,
  }))

  const activeCount = specialists.filter(
    (k) => agents[k]?.status === 'thinking' || agents[k]?.status === 'streaming'
  ).length
  const allDone = specialists.every((k) => agents[k]?.status === 'complete')

  const triageDone = phase !== 'triage' && phase !== 'idle'
  const synthActive = phase === 'synthesizing'
  const synthDone = phase === 'complete'

  const signalColors = ['#4A7BFF', '#7aa3ff', '#a78bfa', '#60d4f7']

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="network-viz"
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            marginBottom: 12,
            borderRadius: 14,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(235,240,255,0.92) 0%, rgba(230,225,255,0.88) 100%)',
            border: '1px solid rgba(74,123,255,0.18)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(74,123,255,0.08)',
          }}
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: '100%', display: 'block' }}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <filter id="dot-glow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="ring-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Triage → Specialist edges */}
            {specPositions.map((p, i) => (
              <line
                key={`triage-edge-${i}`}
                x1={triageX} y1={midY} x2={p.x} y2={p.y}
                stroke={triageDone ? 'rgba(74,123,255,0.25)' : 'rgba(74,123,255,0.10)'}
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
            ))}

            {/* Specialist → Synthesis edges */}
            {specPositions.map((p, i) => (
              <line
                key={`synth-edge-${i}`}
                x1={p.x} y1={p.y} x2={synthX} y2={midY}
                stroke={allDone ? 'rgba(80,220,140,0.30)' : 'rgba(74,123,255,0.10)'}
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
            ))}

            {/* Animated signals: triage → specialists (while consulting) */}
            {triageDone && !allDone && specPositions.map((p, i) => (
              <Signal
                key={`ts-${i}`}
                x1={triageX} y1={midY} x2={p.x} y2={p.y}
                delay={i * 0.3}
                color={signalColors[i % signalColors.length]}
              />
            ))}

            {/* Animated signals: specialists → synthesis (when synthesizing) */}
            {(synthActive || synthDone) && specPositions.map((p, i) => (
              <Signal
                key={`ss-${i}`}
                x1={p.x} y1={p.y} x2={synthX} y2={midY}
                delay={i * 0.25}
                color={synthDone ? '#50dc8c' : '#4A7BFF'}
              />
            ))}

            {/* Specialist nodes */}
            {specialists.map((key, i) => {
              const p = specPositions[i]
              const status = agents[key]?.status ?? 'idle'
              const isActive = status === 'thinking' || status === 'streaming'
              const isDone = status === 'complete'

              return (
                <g key={key}>
                  {isActive && (
                    <motion.circle
                      cx={p.x} cy={p.y}
                      r={nodeR + 7}
                      fill="none"
                      stroke="rgba(74,123,255,0.35)"
                      strokeWidth="1.5"
                      filter="url(#ring-glow)"
                      animate={{ r: [nodeR + 5, nodeR + 10, nodeR + 5], opacity: [0.5, 0.9, 0.5] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
                    />
                  )}
                  <circle
                    cx={p.x} cy={p.y} r={nodeR}
                    fill={isActive ? 'rgba(74,123,255,0.14)' : isDone ? 'rgba(80,220,140,0.10)' : 'rgba(255,255,255,0.55)'}
                    stroke={isActive ? 'rgba(74,123,255,0.5)' : isDone ? 'rgba(80,220,140,0.4)' : 'rgba(74,123,255,0.15)'}
                    strokeWidth="1.5"
                  />
                  <text x={p.x} y={p.y + 7} textAnchor="middle" fontSize="17"
                    fontFamily="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif"
                    style={{ userSelect: 'none' }}>
                    {ICONS[key] ?? '👨‍⚕️'}
                  </text>
                  {isDone && (
                    <>
                      <circle cx={p.x + nodeR - 4} cy={p.y - nodeR + 7} r={5.5}
                        fill="rgba(80,220,140,0.95)" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
                      <path d={`M${p.x + nodeR - 7.5},${p.y - nodeR + 7} l2.3,2.3 l3.8,-3.8`}
                        stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </>
                  )}
                </g>
              )
            })}

            {/* Triage anchor node */}
            <g>
              {phase === 'triage' && (
                <motion.circle cx={triageX} cy={midY} r={nodeR + 6}
                  fill="none" stroke="rgba(255,195,80,0.4)" strokeWidth="1.5"
                  animate={{ r: [nodeR + 4, nodeR + 9, nodeR + 4], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />
              )}
              <circle cx={triageX} cy={midY} r={nodeR}
                fill={triageDone ? 'rgba(74,123,255,0.14)' : 'rgba(255,255,255,0.55)'}
                stroke={triageDone ? 'rgba(74,123,255,0.5)' : 'rgba(74,123,255,0.15)'}
                strokeWidth="1.5" />
              <text x={triageX} y={midY + 7} textAnchor="middle" fontSize="15"
                fontFamily="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif"
                style={{ userSelect: 'none' }}>🔀</text>
              <text x={triageX} y={midY + nodeR + 13} textAnchor="middle"
                fontSize="8" fill="rgba(74,123,255,0.6)" fontWeight="600" letterSpacing="0.3">
                TRIAGE
              </text>
            </g>

            {/* Synthesis anchor node */}
            <g>
              {synthActive && (
                <motion.circle cx={synthX} cy={midY} r={nodeR + 6}
                  fill="none" stroke="rgba(74,123,255,0.4)" strokeWidth="1.5"
                  animate={{ r: [nodeR + 4, nodeR + 10, nodeR + 4], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
              )}
              <circle cx={synthX} cy={midY} r={nodeR}
                fill={synthDone ? 'rgba(80,220,140,0.12)' : synthActive ? 'rgba(74,123,255,0.14)' : 'rgba(255,255,255,0.55)'}
                stroke={synthDone ? 'rgba(80,220,140,0.5)' : synthActive ? 'rgba(74,123,255,0.5)' : 'rgba(74,123,255,0.15)'}
                strokeWidth="1.5" />
              <text x={synthX} y={midY + 7} textAnchor="middle" fontSize="15"
                fontFamily="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif"
                style={{ userSelect: 'none' }}>
                {synthDone ? '✅' : '🧬'}
              </text>
              <text x={synthX} y={midY + nodeR + 13} textAnchor="middle"
                fontSize="8" fill="rgba(74,123,255,0.6)" fontWeight="600" letterSpacing="0.3">
                SYNTHESIS
              </text>
            </g>
          </svg>

          {/* Status label */}
          <div style={{ padding: '0 14px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.15, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: synthDone ? '#50dc8c' : activeCount > 0 ? '#4A7BFF' : '#ffc350',
                boxShadow: synthDone ? '0 0 8px rgba(80,220,140,0.5)' : activeCount > 0 ? '0 0 8px rgba(74,123,255,0.6)' : '0 0 8px rgba(255,195,80,0.5)',
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.2px' }}>
              {synthDone
                ? 'All agents complete · synthesis done'
                : synthActive
                  ? 'Synthesizing specialist findings…'
                  : activeCount > 0
                    ? `${activeCount} agent${activeCount > 1 ? 's' : ''} consulting in parallel`
                    : 'Agents ready · awaiting dispatch'}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

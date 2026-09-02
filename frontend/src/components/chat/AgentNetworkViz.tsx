import { motion, AnimatePresence } from 'framer-motion'
import { AgentCardState } from '../../types/agent'

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
      animate={{
        cx: [x1, x1, x2, x2],
        cy: [y1, y1, y2, y2],
        opacity: [0, 1, 1, 0],
      }}
      transition={{ duration: 2, delay, repeat: Infinity, ease: 'linear' }}
    />
  )
}

export default function AgentNetworkViz({ specialists, agents, visible }: Props) {
  const N = specialists.length
  if (N < 2) return null

  const W = 480
  const H = 90
  const nodeR = 24
  const padding = 48

  const spacing = (W - padding * 2) / Math.max(N - 1, 1)
  const positions = specialists.map((_, i) => ({
    x: N === 1 ? W / 2 : padding + i * spacing,
    y: H / 2,
  }))

  const pairs: [number, number][] = []
  if (N <= 3) {
    for (let i = 0; i < N; i++)
      for (let j = i + 1; j < N; j++)
        pairs.push([i, j])
  } else {
    for (let i = 0; i < N - 1; i++)
      pairs.push([i, i + 1])
  }

  const activeCount = specialists.filter(
    (k) => agents[k]?.status === 'thinking' || agents[k]?.status === 'streaming'
  ).length

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
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="ring-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Connection lines */}
            {pairs.map(([i, j]) => {
              const p1 = positions[i]
              const p2 = positions[j]
              return (
                <line
                  key={`line-${i}-${j}`}
                  x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  stroke="rgba(74,123,255,0.18)"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                />
              )
            })}

            {/* Signal dots */}
            {pairs.flatMap(([i, j], pairIdx) => {
              const p1 = positions[i]
              const p2 = positions[j]
              const c1 = signalColors[pairIdx % signalColors.length]
              const c2 = signalColors[(pairIdx + 2) % signalColors.length]
              return [
                <Signal key={`sig-${i}-${j}-a`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} delay={pairIdx * 0.4} color={c1} />,
                <Signal key={`sig-${i}-${j}-b`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} delay={pairIdx * 0.4 + 1.0} color={c1} />,
                <Signal key={`sig-${i}-${j}-c`} x1={p2.x} y1={p2.y} x2={p1.x} y2={p1.y} delay={pairIdx * 0.4 + 0.5} color={c2} />,
              ]
            })}

            {/* Agent nodes */}
            {specialists.map((key, i) => {
              const p = positions[i]
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

                  {/* Node background */}
                  <circle
                    cx={p.x} cy={p.y} r={nodeR}
                    fill={
                      isActive ? 'rgba(74,123,255,0.14)'
                        : isDone ? 'rgba(80,220,140,0.10)'
                          : 'rgba(255,255,255,0.55)'
                    }
                    stroke={
                      isActive ? 'rgba(74,123,255,0.5)'
                        : isDone ? 'rgba(80,220,140,0.4)'
                          : 'rgba(74,123,255,0.15)'
                    }
                    strokeWidth="1.5"
                  />

                  {/* Emoji icon */}
                  <text
                    x={p.x} y={p.y + 8}
                    textAnchor="middle"
                    fontSize="20"
                    fontFamily="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif"
                    style={{ userSelect: 'none' }}
                  >
                    {ICONS[key] ?? '👨‍⚕️'}
                  </text>

                  {/* Done indicator — small green filled circle (no emoji) */}
                  {isDone && (
                    <>
                      <circle
                        cx={p.x + nodeR - 5} cy={p.y - nodeR + 8}
                        r={6}
                        fill="rgba(80,220,140,0.95)"
                        stroke="rgba(255,255,255,0.9)"
                        strokeWidth="1.5"
                      />
                      {/* Tiny checkmark path */}
                      <path
                        d={`M${p.x + nodeR - 8.5},${p.y - nodeR + 8} l2.5,2.5 l4,-4`}
                        stroke="#fff"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Status label */}
          <div style={{
            padding: '0 14px 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}>
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.15, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: activeCount > 0 ? '#4A7BFF' : '#50dc8c',
                boxShadow: activeCount > 0 ? '0 0 8px rgba(74,123,255,0.6)' : '0 0 8px rgba(80,220,140,0.5)',
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.2px' }}>
              {activeCount > 0
                ? `${activeCount} agent${activeCount > 1 ? 's' : ''} communicating in parallel`
                : 'All agents done · synthesizing findings…'}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

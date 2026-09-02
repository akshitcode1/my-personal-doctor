import { motion, AnimatePresence } from 'framer-motion'
import { Square } from 'lucide-react'
import { useAgentStore } from '../../stores/agentStore'
import AgentCard from './AgentCard'
import SynthesisPanel from './SynthesisPanel'
import LoadingPulse from '../ui/LoadingPulse'
import AgentNetworkViz from './AgentNetworkViz'

interface Props {
  onStop: () => void
}

const AGENT_ICONS: Record<string, string> = {
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

const AGENT_LABELS: Record<string, string> = {
  general_practitioner: 'General Practitioner',
  cardiologist: 'Cardiologist',
  orthopedist: 'Orthopedist',
  gynecologist: 'Gynecologist',
  neurologist: 'Neurologist',
  dermatologist: 'Dermatologist',
  gastroenterologist: 'Gastroenterologist',
  pulmonologist: 'Pulmonologist',
  pediatrician: 'Pediatrician',
  psychiatrist: 'Psychiatrist',
  dentist: 'Dentist',
}

function ParallelOrbs({ count }: { count: number }) {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{ duration: 1.2, delay: i * 0.25, repeat: Infinity }}
          style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-blue)' }}
        />
      ))}
    </div>
  )
}

export default function AgentConversation({ onStop }: Props) {
  const { phase, selectedSpecialists, agents, synthesisTokens, isGenerating, responseMode } = useAgentStore()

  if (phase === 'idle') return null

  const isMultiAgent = responseMode === 'multi_agent'
  const isManual = responseMode === 'manual'
  const activeCount = selectedSpecialists.filter((k) => agents[k]?.status === 'streaming' || agents[k]?.status === 'thinking').length
  const isParallel = selectedSpecialists.length > 1

  return (
    <AnimatePresence>
      <motion.div
        key="agent-conversation"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ marginBottom: 16, position: 'relative' }}
      >
        {/* Stop button */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{ position: 'absolute', top: -8, right: 0, zIndex: 10 }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStop}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(248,113,113,0.12)',
                  border: '1px solid rgba(248,113,113,0.35)',
                  borderRadius: 20, padding: '5px 12px',
                  cursor: 'pointer', color: '#f87171',
                  fontSize: 12, fontWeight: 600,
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 2px 12px rgba(248,113,113,0.15)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.22)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)' }}
              >
                <Square size={11} fill="#f87171" />
                Stop generating
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Triage phase */}
        {phase === 'triage' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(74,123,255,0.05)',
              border: '1px solid rgba(74,123,255,0.25)',
              borderRadius: 14,
              backdropFilter: 'blur(10px)',
            }}
          >
            <LoadingPulse size="sm" />
            <div>
              <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>
                {isMultiAgent ? 'AI Routing Engine' : 'Preparing response…'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                {isMultiAgent ? 'Analyzing query and selecting specialists…' : 'Processing your question…'}
              </div>
            </div>
          </motion.div>
        )}

        {/* Consulting + synthesizing phases */}
        {(phase === 'consulting' || phase === 'synthesizing' || phase === 'complete') && (
          <>
            {/* Multi-agent council header */}
            {isParallel && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  marginBottom: 14,
                  padding: '14px 18px',
                  borderRadius: 16,
                  background: 'linear-gradient(135deg, rgba(74,123,255,0.08) 0%, rgba(168,85,247,0.06) 100%)',
                  border: '1px solid rgba(74,123,255,0.28)',
                  backdropFilter: 'blur(14px)',
                  boxShadow: '0 4px 24px rgba(74,123,255,0.1)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* Animated background shimmer */}
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(74,123,255,0.06) 50%, transparent 100%)',
                    pointerEvents: 'none',
                  }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
                  {/* Icon cluster */}
                  <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                      style={{
                        position: 'absolute', inset: 0,
                        border: '1.5px dashed rgba(74,123,255,0.35)',
                        borderRadius: '50%',
                      }}
                    />
                    <div style={{
                      position: 'absolute', inset: 6,
                      background: 'rgba(74,123,255,0.15)',
                      borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                    }}>
                      🤖
                    </div>
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isManual ? 'Manual Specialist Council' : 'AI Medical Council'}
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        background: 'rgba(74,123,255,0.2)',
                        border: '1px solid rgba(74,123,255,0.4)',
                        color: '#7aa3ff',
                        padding: '2px 8px',
                        borderRadius: 20,
                      }}>
                        {selectedSpecialists.length} Specialists
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                      <ParallelOrbs count={selectedSpecialists.length} />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {activeCount > 0
                          ? `${activeCount} specialist${activeCount > 1 ? 's' : ''} working simultaneously`
                          : phase === 'synthesizing' || phase === 'complete'
                            ? 'All consultations complete · synthesizing…'
                            : 'Initializing specialists…'}
                      </span>
                    </div>
                  </div>

                  {/* Specialist pills */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {selectedSpecialists.map((key, i) => {
                      const agentStatus = agents[key]?.status
                      const isActive = agentStatus === 'streaming' || agentStatus === 'thinking'
                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.07 }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 9px', borderRadius: 20,
                            background: isActive ? 'rgba(74,123,255,0.12)' : agentStatus === 'complete' ? 'rgba(80,220,140,0.10)' : 'rgba(74,123,255,0.04)',
                            border: isActive ? '1px solid rgba(74,123,255,0.35)' : agentStatus === 'complete' ? '1px solid rgba(80,220,140,0.3)' : '1px solid rgba(74,123,255,0.10)',
                            fontSize: 11,
                            color: isActive ? '#4A7BFF' : agentStatus === 'complete' ? '#16a34a' : 'var(--text-muted)',
                            fontWeight: 500,
                            transition: 'all 0.3s',
                          }}
                        >
                          <span style={{ fontSize: 10 }}>{AGENT_ICONS[key] ?? '👨‍⚕️'}</span>
                          {AGENT_LABELS[key]?.split(' ')[0] ?? key}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Single-agent header (generic mode) */}
            {!isParallel && selectedSpecialists.length === 1 && (phase === 'consulting' || phase === 'synthesizing' || phase === 'complete') && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 12,
                  fontSize: 12, color: 'var(--text-muted)',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(74,123,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
                }}>
                  {AGENT_ICONS[selectedSpecialists[0]] ?? '🩺'}
                </div>
                <span>{isManual ? 'Manual consult' : 'Quick consult'} · {AGENT_LABELS[selectedSpecialists[0]] ?? 'Doctor'}</span>
              </motion.div>
            )}

            {/* Multi-agent communication animation */}
            <AgentNetworkViz
              specialists={selectedSpecialists}
              agents={agents}
              visible={isParallel && phase === 'consulting'}
            />

            {/* Agent cards */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: isParallel ? 4 : 0,
            }}>
              {selectedSpecialists.map((key) => (
                agents[key] && (
                  <AgentCard
                    key={key}
                    agentKey={key}
                    state={agents[key]}
                    isParallel={isParallel}
                  />
                )
              ))}
            </div>
          </>
        )}

        {/* Synthesis panel */}
        {(phase === 'synthesizing' || phase === 'complete') && (
          <SynthesisPanel tokens={synthesisTokens} isComplete={phase === 'complete'} />
        )}
      </motion.div>
    </AnimatePresence>
  )
}

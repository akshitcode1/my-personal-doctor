import { motion, AnimatePresence } from 'framer-motion'
import { useAgentStore, ResponseMode } from '../../stores/agentStore'

const SPECIALISTS = [
  { key: 'general_practitioner', icon: '🩺', label: 'General Practitioner' },
  { key: 'cardiologist',         icon: '🫀', label: 'Cardiologist' },
  { key: 'neurologist',          icon: '🧠', label: 'Neurologist' },
  { key: 'orthopedist',          icon: '🦴', label: 'Orthopedist' },
  { key: 'dermatologist',        icon: '🔬', label: 'Dermatologist' },
  { key: 'gynecologist',         icon: '⚕️', label: 'Gynecologist' },
  { key: 'gastroenterologist',   icon: '🍃', label: 'Gastroenterologist' },
  { key: 'pulmonologist',        icon: '🫁', label: 'Pulmonologist' },
  { key: 'pediatrician',         icon: '👶', label: 'Pediatrician' },
  { key: 'psychiatrist',         icon: '🧬', label: 'Psychiatrist' },
  { key: 'dentist',              icon: '🦷', label: 'Dentist' },
]

const MODES: { key: ResponseMode; icon: string; title: string; subtitle: string; activeColor: string; activeBg: string; activeBorder: string }[] = [
  {
    key: 'generic',
    icon: '🩺',
    title: 'General Doctor Agent',
    subtitle: 'Quick Response',
    activeColor: 'var(--text-primary)',
    activeBg: 'rgba(74,123,255,0.08)',
    activeBorder: 'rgba(74,123,255,0.25)',
  },
  {
    key: 'multi_agent',
    icon: '🤖',
    title: 'Multiple Specialists',
    subtitle: 'AI Council',
    activeColor: '#4A7BFF',
    activeBg: 'rgba(74,123,255,0.10)',
    activeBorder: 'rgba(74,123,255,0.35)',
  },
  {
    key: 'manual',
    icon: '🎯',
    title: 'Choose Specialists',
    subtitle: 'Manual Selection',
    activeColor: '#7c3aed',
    activeBg: 'rgba(124,58,237,0.10)',
    activeBorder: 'rgba(124,58,237,0.30)',
  },
]

export default function AgentSettingsSidebar() {
  const { responseMode, manualSpecialists, setResponseMode, toggleManualSpecialist } = useAgentStore()

  return (
    <div style={{
      width: 216,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid rgba(124,58,237,0.10)',
      background: 'linear-gradient(180deg, rgba(242,236,255,0.98) 0%, rgba(234,225,255,0.97) 100%)',
      backdropFilter: 'blur(20px)',
      overflow: 'hidden',
    }}>

      {/* Header */}
      <div style={{
        padding: '14px 14px 10px',
        borderBottom: '1px solid rgba(124,58,237,0.10)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(74,123,255,0.18), rgba(124,58,237,0.18))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
          }}>
            🎛️
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Agent Mode</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Choose how AI responds</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 16px' }}>

        {/* Mode cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {MODES.map((m) => {
            const active = responseMode === m.key
            return (
              <motion.button
                key={m.key}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setResponseMode(m.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 11px', borderRadius: 12,
                  border: active ? `1px solid ${m.activeBorder}` : '1px solid rgba(74,123,255,0.10)',
                  background: active ? m.activeBg : 'rgba(255,255,255,0.45)',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'all 0.2s',
                  boxShadow: active ? '0 2px 10px rgba(74,123,255,0.10)' : 'none',
                }}
              >
                {/* Radio dot */}
                <div style={{
                  width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                  border: active ? `2px solid ${m.activeColor}` : '2px solid rgba(74,123,255,0.25)',
                  background: active ? m.activeColor : 'transparent',
                  transition: 'all 0.2s',
                }} />

                <span style={{ fontSize: 16, flexShrink: 0 }}>{m.icon}</span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 11, fontWeight: active ? 600 : 400,
                    color: active ? m.activeColor : 'var(--text-secondary)',
                    lineHeight: 1.3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {m.title}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                    {m.subtitle}
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Specialist multi-select */}
        <AnimatePresence>
          {responseMode === 'manual' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(124,58,237,0.12)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Specialists
                  </span>
                  {manualSpecialists.length > 0 && (
                    <span style={{
                      fontSize: 9, fontWeight: 700,
                      background: 'rgba(124,58,237,0.12)',
                      border: '1px solid rgba(124,58,237,0.28)',
                      color: '#7c3aed', padding: '1px 6px', borderRadius: 8,
                    }}>
                      {manualSpecialists.length} selected
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {SPECIALISTS.map((s) => {
                    const checked = manualSpecialists.includes(s.key)
                    return (
                      <motion.button
                        key={s.key}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleManualSpecialist(s.key)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '7px 9px', borderRadius: 9,
                          border: checked
                            ? '1px solid rgba(124,58,237,0.35)'
                            : '1px solid rgba(74,123,255,0.10)',
                          background: checked ? 'rgba(124,58,237,0.09)' : 'rgba(255,255,255,0.45)',
                          cursor: 'pointer', width: '100%', textAlign: 'left',
                          transition: 'all 0.15s',
                        }}
                      >
                        {/* Checkbox */}
                        <div style={{
                          width: 14, height: 14, borderRadius: 4, flexShrink: 0,
                          border: checked ? '2px solid #7c3aed' : '2px solid rgba(74,123,255,0.22)',
                          background: checked ? '#7c3aed' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 8, color: '#fff', fontWeight: 700,
                          transition: 'all 0.15s',
                        }}>
                          {checked && '✓'}
                        </div>
                        <span style={{ fontSize: 14, flexShrink: 0 }}>{s.icon}</span>
                        <span style={{
                          fontSize: 11, fontWeight: checked ? 600 : 400,
                          color: checked ? '#7c3aed' : 'var(--text-secondary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {s.label}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>

                {manualSpecialists.length === 0 && (
                  <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', padding: '6px 0' }}>
                    Select at least one specialist
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info footer */}
        <div style={{
          marginTop: 16, padding: '10px',
          borderRadius: 10,
          background: 'rgba(74,123,255,0.06)',
          border: '1px solid rgba(74,123,255,0.12)',
          fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5,
        }}>
          {responseMode === 'generic' && 'Single GP response — fastest mode.'}
          {responseMode === 'multi_agent' && 'AI selects 1–3 relevant specialists automatically.'}
          {responseMode === 'manual' && (
            manualSpecialists.length === 0
              ? 'Select specialists above to consult.'
              : `${manualSpecialists.length > 1 ? `${manualSpecialists.length} specialists` : '1 specialist'} will be consulted${manualSpecialists.length > 1 ? ' in parallel' : ''}.`
          )}
        </div>
      </div>
    </div>
  )
}

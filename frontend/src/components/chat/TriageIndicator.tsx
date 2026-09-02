import { motion } from 'framer-motion'

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

const LABELS: Record<string, string> = {
  general_practitioner: 'GP',
  cardiologist: 'Cardiologist',
  orthopedist: 'Orthopedist',
  gynecologist: 'Gynecologist',
  neurologist: 'Neurologist',
  dermatologist: 'Dermatologist',
  gastroenterologist: 'Gastro',
  pulmonologist: 'Pulmonologist',
  pediatrician: 'Pediatrician',
  psychiatrist: 'Psychiatrist',
  dentist: 'Dentist',
}

export default function TriageIndicator({ specialists }: { specialists: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Consulting:</span>
      {specialists.map((s, i) => (
        <motion.div
          key={s}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 20,
            background: 'var(--accent-blue-dim)',
            border: '1px solid rgba(74,123,255,0.30)',
            fontSize: 12,
            color: 'var(--accent-blue)',
            fontWeight: 500,
          }}
        >
          <span>{ICONS[s] ?? '👨‍⚕️'}</span>
          {LABELS[s] ?? s}
        </motion.div>
      ))}
    </div>
  )
}

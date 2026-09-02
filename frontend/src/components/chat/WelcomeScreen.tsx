import { motion } from 'framer-motion'

const SUGGESTIONS = [
  { icon: '🤒', text: 'I have a headache and fever for 3 days' },
  { icon: '🦷', text: 'I have chest pain when I exercise' },
  { icon: '🦴', text: 'My knee hurts after running' },
  { icon: '😰', text: "I'm feeling anxious and can't sleep" },
  { icon: '🧒', text: 'My child has a rash and high temperature' },
  { icon: '💊', text: 'What are the side effects of ibuprofen?' },
]

interface Props {
  onSuggestion: (text: string) => void
}

export default function WelcomeScreen({ onSuggestion }: Props) {
  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      {/* Hero */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div style={{ fontSize: 64, marginBottom: 16, filter: 'drop-shadow(0 0 20px rgba(74,123,255,0.35))' }}>🩺</div>
        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.5px',
          marginBottom: 10,
        }}>
          My Personal Doctor
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 440, margin: '0 auto 40px' }}>
          Describe your symptoms and our AI specialists will consult each other to give you a comprehensive answer.
        </p>
      </motion.div>

      {/* Suggestion chips */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 10,
          maxWidth: 680,
          width: '100%',
        }}
      >
        {SUGGESTIONS.map((s) => (
          <motion.button
            key={s.text}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSuggestion(s.text)}
            style={{
              background: 'rgba(255,255,255,0.65)',
              border: '1px solid rgba(74,123,255,0.14)',
              borderRadius: 14,
              padding: '12px 16px',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              boxShadow: '0 2px 10px rgba(74,123,255,0.06)',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(74,123,255,0.35)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(74,123,255,0.12)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(74,123,255,0.14)'
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(74,123,255,0.06)'
            }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{s.text}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Specialist tags */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        style={{ marginTop: 36, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 600 }}
      >
        {['GP', 'Cardiologist', 'Neurologist', 'Dermatologist', 'Psychiatrist', 'Pediatrician', '+5 more'].map((name) => (
          <span key={name} style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            background: 'rgba(74,123,255,0.08)',
            border: '1px solid rgba(74,123,255,0.15)',
            borderRadius: 20,
            padding: '3px 10px',
          }}>
            {name}
          </span>
        ))}
      </motion.div>
    </motion.div>
  )
}

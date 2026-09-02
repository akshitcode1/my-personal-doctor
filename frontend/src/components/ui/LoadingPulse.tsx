import { motion } from 'framer-motion'

interface Props { size?: 'sm' | 'md' }

export default function LoadingPulse({ size = 'md' }: Props) {
  const sz = size === 'sm' ? 5 : 8
  const gap = size === 'sm' ? 3 : 5

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{
            display: 'block',
            width: sz,
            height: sz,
            borderRadius: '50%',
            background: 'var(--accent-blue)',
          }}
          animate={{ scale: [0.6, 1, 0.6], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  )
}

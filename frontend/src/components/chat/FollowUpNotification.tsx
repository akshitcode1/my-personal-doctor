import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, AlertTriangle } from 'lucide-react'
import { useAgentStore, FollowUpNotification as FollowUp } from '../../stores/agentStore'
import client from '../../api/client'

function NotificationCard({ fu }: { fu: FollowUp }) {
  const { dismissFollowUp } = useAgentStore()
  const isUrgent = fu.urgency === 'urgent'

  const handleDismiss = async () => {
    dismissFollowUp(fu.id)
    try {
      await client.post(`/follow-ups/${fu.id}/dismiss`)
    } catch { /* best-effort */ }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '12px 14px', borderRadius: 12,
        background: isUrgent ? 'rgba(248,113,113,0.08)' : 'rgba(74,123,255,0.06)',
        border: `1px solid ${isUrgent ? 'rgba(248,113,113,0.28)' : 'rgba(74,123,255,0.22)'}`,
        boxShadow: `0 2px 12px ${isUrgent ? 'rgba(248,113,113,0.08)' : 'rgba(74,123,255,0.06)'}`,
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: isUrgent ? 'rgba(248,113,113,0.15)' : 'rgba(74,123,255,0.12)',
        border: `1px solid ${isUrgent ? 'rgba(248,113,113,0.4)' : 'rgba(74,123,255,0.3)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isUrgent ? '#ef4444' : '#4A7BFF',
      }}>
        {isUrgent ? <AlertTriangle size={14} /> : <Clock size={14} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase',
          color: isUrgent ? '#ef4444' : '#4A7BFF', marginBottom: 4,
        }}>
          {isUrgent ? '⚡ Urgent Follow-up' : `🔔 Follow-up in ${fu.daysFromNow} day${fu.daysFromNow !== 1 ? 's' : ''}`}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
          {fu.question}
        </div>
      </div>

      <button
        onClick={handleDismiss}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: 4, borderRadius: 6, flexShrink: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
      >
        <X size={13} />
      </button>
    </motion.div>
  )
}

export default function FollowUpNotifications() {
  const { pendingFollowUps } = useAgentStore()

  if (pendingFollowUps.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <AnimatePresence mode="popLayout">
        {pendingFollowUps.slice(0, 3).map((fu) => (
          <NotificationCard key={fu.id} fu={fu} />
        ))}
      </AnimatePresence>
      {pendingFollowUps.length > 3 && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '4px 0' }}>
          +{pendingFollowUps.length - 3} more follow-ups scheduled
        </div>
      )}
    </div>
  )
}

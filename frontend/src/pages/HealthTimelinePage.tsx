import { useEffect, useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  Activity, Pill, Stethoscope, FlaskConical, FileText,
  Clock, CheckCircle, ChevronRight, Search, Bell, X,
  AlertCircle, Sparkles,
} from 'lucide-react'
import { fetchHealthTimeline, fetchHealthSummary, HealthEvent, HealthSummary } from '../api/timeline'
import { fetchFollowUps, resolveFollowUp, dismissFollowUp, FollowUp } from '../api/followups'

// ─── Design tokens ────────────────────────────────────────────────────────────
const TYPE_CFG = {
  symptom:    { label: 'Symptom',     Icon: Activity,     color: '#F59E0B', glow: 'rgba(245,158,11,0.22)',  bg: 'rgba(245,158,11,0.10)' },
  diagnosis:  { label: 'Diagnosis',   Icon: Stethoscope,  color: '#8B5CF6', glow: 'rgba(139,92,246,0.22)',  bg: 'rgba(139,92,246,0.09)' },
  medication: { label: 'Medication',  Icon: Pill,         color: '#10B981', glow: 'rgba(16,185,129,0.22)',  bg: 'rgba(16,185,129,0.09)' },
  test_result:{ label: 'Test Result', Icon: FlaskConical, color: '#0EA5E9', glow: 'rgba(14,165,233,0.22)',  bg: 'rgba(14,165,233,0.09)' },
  other:      { label: 'Other',       Icon: FileText,     color: '#6B7280', glow: 'rgba(107,114,128,0.16)', bg: 'rgba(107,114,128,0.07)' },
} as const

const SEV_CFG = {
  mild:     { color: '#16a34a', bg: 'rgba(22,163,74,0.10)',   label: 'Mild' },
  moderate: { color: '#D97706', bg: 'rgba(215,119,6,0.10)',   label: 'Moderate' },
  severe:   { color: '#DC2626', bg: 'rgba(220,38,38,0.10)',   label: 'Severe' },
} as const

// ─── Liquid glass style ───────────────────────────────────────────────────────
const glass = (tint = 'rgba(255,255,255,0.62)', extra = ''): React.CSSProperties => ({
  background: `linear-gradient(160deg, rgba(255,255,255,0.80) 0%, ${tint} 100%)`,
  backdropFilter: 'blur(32px) saturate(180%)',
  WebkitBackdropFilter: 'blur(32px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.88)',
  boxShadow: `0 2px 4px rgba(0,0,0,0.04), 0 12px 40px rgba(74,123,255,0.11), inset 0 1.5px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(74,123,255,0.06)${extra}`,
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function groupByMonth(events: HealthEvent[]) {
  const out: { key: string; label: string; events: HealthEvent[] }[] = []
  const idx = new Map<string, number>()
  for (const ev of events) {
    const d = new Date(ev.occurred_at)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    if (!idx.has(key)) { idx.set(key, out.length); out.push({ key, label, events: [] }) }
    out[idx.get(key)!].events.push(ev)
  }
  return out
}

// ─── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ segments, total }: { segments: { color: string; count: number }[]; total: number }) {
  const r = 44, cx = 56, cy = 56, circ = 2 * Math.PI * r
  let cum = 0
  return (
    <svg width={112} height={112} viewBox="0 0 112 112">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(74,123,255,0.08)" strokeWidth={11} />
      {segments.map((s, i) => {
        if (!s.count) return null
        const dash = (s.count / total) * circ
        const rotation = (cum / total) * 360 - 90
        cum += s.count
        return (
          <motion.circle
            key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={11} strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${Math.max(dash - 3, 0)} ${circ - Math.max(dash - 3, 0)}` }}
            transition={{ duration: 1.1, ease: 'easeOut', delay: i * 0.12 }}
            transform={`rotate(${rotation}, ${cx}, ${cy})`}
            style={{ filter: `drop-shadow(0 0 4px ${s.color}80)` }}
          />
        )
      })}
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize={22} fontWeight={800} fill="var(--text-primary)" style={{ fontVariantNumeric: 'tabular-nums' }}>{total}</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fontSize={9} fontWeight={600} fill="var(--text-muted)" letterSpacing="0.08em" style={{ textTransform: 'uppercase' }}>EVENTS</text>
    </svg>
  )
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ value, color = 'var(--text-primary)' }: { value: number; color?: string }) {
  const [n, setN] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const visible = useInView(ref, { once: true })
  useEffect(() => {
    if (!visible) return
    if (value === 0) { setN(0); return }
    let raf: number
    const t0 = Date.now(), dur = 1000
    const tick = () => {
      const p = Math.min((Date.now() - t0) / dur, 1)
      setN(Math.round((1 - Math.pow(1 - p, 3)) * value))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [visible, value])
  return <span ref={ref} style={{ color, fontVariantNumeric: 'tabular-nums' }}>{n}</span>
}

// ─── Event card ───────────────────────────────────────────────────────────────
function EventCard({ ev, index, isLast }: { ev: HealthEvent; index: number; isLast: boolean }) {
  const [open, setOpen] = useState(false)
  const cfg = TYPE_CFG[ev.event_type as keyof typeof TYPE_CFG] ?? TYPE_CFG.other
  const { Icon } = cfg
  const sev = ev.severity ? SEV_CFG[ev.severity as keyof typeof SEV_CFG] : null
  const d = new Date(ev.occurred_at)
  const dateFmt = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const timeFmt = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const hasDetail = Boolean(ev.description)

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.045, 0.35), duration: 0.26, ease: 'easeOut' }}
      style={{ display: 'flex', gap: 0, alignItems: 'flex-start' }}
    >
      {/* Rail */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40, flexShrink: 0 }}>
        {/* Glassy dot */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%', marginTop: 12, flexShrink: 0, zIndex: 1,
          background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.90), ${cfg.bg})`,
          border: `1.5px solid rgba(255,255,255,0.80)`,
          boxShadow: `0 2px 12px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.90), 0 0 0 3px ${cfg.glow}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={13} color={cfg.color} />
        </div>
        {!isLast && (
          <div style={{
            width: 1.5, flex: 1, minHeight: 16, marginTop: 4,
            background: `linear-gradient(to bottom, ${cfg.color}50, rgba(74,123,255,0.06))`,
          }} />
        )}
      </div>

      {/* Liquid glass card */}
      <motion.div
        onClick={() => hasDetail && setOpen(o => !o)}
        whileHover={hasDetail ? { y: -1, boxShadow: `0 6px 28px ${cfg.glow}, 0 12px 40px rgba(74,123,255,0.12), inset 0 1.5px 0 rgba(255,255,255,0.95)` } : {}}
        transition={{ duration: 0.15 }}
        style={{
          flex: 1, marginBottom: isLast ? 0 : 10, marginLeft: 10,
          ...glass(`rgba(240,244,255,0.58)`, `, 0 0 0 0 transparent`),
          borderLeft: `3px solid ${cfg.color}`,
          borderRadius: '0 16px 16px 0',
          padding: '13px 16px 12px',
          cursor: hasDetail ? 'pointer' : 'default',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Specular shimmer strip */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1.5,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.70), transparent)',
          pointerEvents: 'none',
        }} />

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          {/* Type badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, marginTop: 1,
            background: cfg.bg, border: `1px solid ${cfg.color}30`,
            borderRadius: 6, padding: '2px 7px',
          }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: cfg.color }}>
              {cfg.label}
            </span>
          </div>

          {/* Title */}
          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ev.title}
          </span>

          {/* Date + expand */}
          <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>{dateFmt}</div>
              <div style={{ fontSize: 9.5, color: 'var(--text-muted)', fontFamily: 'monospace', opacity: 0.65 }}>{timeFmt}</div>
            </div>
            {hasDetail && (
              <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.18 }}>
                <ChevronRight size={13} color="var(--text-muted)" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Severity pill */}
        {sev && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: sev.bg, border: `1px solid ${sev.color}25`,
              borderRadius: 20, padding: '2px 8px',
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: sev.color }} />
              <span style={{ fontSize: 10.5, fontWeight: 600, color: sev.color }}>{sev.label}</span>
            </div>
          </div>
        )}

        {/* Expandable description */}
        <AnimatePresence>
          {open && ev.description && (
            <motion.div
              key="desc"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                marginTop: 10, paddingTop: 10,
                borderTop: '1px solid rgba(74,123,255,0.10)',
                fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.7,
              }}>
                {ev.description}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ─── Follow-up card ───────────────────────────────────────────────────────────
function FollowUpCard({ fu, onResolve, onDismiss }: { fu: FollowUp; onResolve: () => void; onDismiss: () => void }) {
  const due = new Date(fu.scheduled_for) <= new Date()
  const urgent = fu.urgency === 'urgent'
  const accent = urgent || due ? '#DC2626' : '#4A7BFF'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
      style={{
        ...glass('rgba(240,244,255,0.52)'),
        borderLeft: `3px solid ${accent}`,
        borderRadius: '0 14px 14px 0',
        padding: '11px 14px',
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginTop: 1,
        background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.85), ${urgent || due ? 'rgba(220,38,38,0.10)' : 'rgba(74,123,255,0.08)'})`,
        border: '1px solid rgba(255,255,255,0.75)',
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.90), 0 2px 8px ${urgent || due ? 'rgba(220,38,38,0.18)' : 'rgba(74,123,255,0.12)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {urgent || due ? <AlertCircle size={13} color="#DC2626" /> : <Clock size={13} color="#4A7BFF" />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.45 }}>
          {fu.follow_up_question}
        </div>
        <div style={{ fontSize: 10.5, color: due ? '#DC2626' : 'var(--text-muted)', marginTop: 4, fontWeight: due ? 600 : 400 }}>
          {due ? '⚠ Due now' : `Due ${new Date(fu.scheduled_for).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
        <button onClick={onResolve} style={{
          display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 600,
          color: '#16a34a', background: 'rgba(22,163,74,0.09)', border: '1px solid rgba(22,163,74,0.22)',
          borderRadius: 8, padding: '3px 8px', cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          <CheckCircle size={10} /> Done
        </button>
        <button onClick={onDismiss} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10.5, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.40)',
          border: '1px solid rgba(74,123,255,0.12)', borderRadius: 8, padding: '3px 8px', cursor: 'pointer',
        }}>
          <X size={10} />
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HealthTimelinePage() {
  const [events, setEvents]       = useState<HealthEvent[]>([])
  const [summary, setSummary]     = useState<HealthSummary | null>(null)
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')
  const [search, setSearch]       = useState('')
  const [fuOpen, setFuOpen]       = useState(true)

  useEffect(() => {
    Promise.all([fetchHealthTimeline(200), fetchHealthSummary(), fetchFollowUps()])
      .then(([tl, sm, fu]) => { setEvents(tl.events); setSummary(sm); setFollowUps(fu.follow_ups) })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let evs = filter === 'all' ? events : events.filter(e => e.event_type === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      evs = evs.filter(e => e.title.toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q))
    }
    return evs
  }, [events, filter, search])

  const groups = useMemo(() => groupByMonth(filtered), [filtered])

  const donutSegments = useMemo(() => Object.entries(TYPE_CFG).map(([k, c]) => ({
    color: c.color,
    count: summary?.by_type[k] || 0,
  })), [summary])

  const dueCount = followUps.filter(f => new Date(f.scheduled_for) <= new Date()).length

  const handleResolve = async (id: string) => { await resolveFollowUp(id); setFollowUps(f => f.filter(x => x.id !== id)) }
  const handleDismiss = async (id: string) => { await dismissFollowUp(id); setFollowUps(f => f.filter(x => x.id !== id)) }

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '20px 28px 18px',
        borderBottom: '1px solid rgba(74,123,255,0.10)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(238,242,255,0.40) 100%)',
        backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
      }}>
        {/* Title */}
        <div style={{ marginRight: 4 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent-blue)', marginBottom: 3 }}>Health Record</div>
          <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>Timeline</div>
        </div>

        <div style={{ width: 1, height: 32, background: 'rgba(74,123,255,0.12)', flexShrink: 0 }} />

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {(['all', ...Object.keys(TYPE_CFG)] as string[]).map(f => {
            const active = filter === f
            const cfg = f !== 'all' ? TYPE_CFG[f as keyof typeof TYPE_CFG] : null
            const cnt = f === 'all' ? events.length : (summary?.by_type[f] || 0)
            return (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '4px 11px', borderRadius: 20, cursor: 'pointer', fontSize: 11.5,
                fontWeight: active ? 700 : 500,
                background: active
                  ? (cfg ? `linear-gradient(135deg, ${cfg.bg}, rgba(255,255,255,0.60))` : 'rgba(74,123,255,0.14)')
                  : 'rgba(255,255,255,0.55)',
                color: active ? (cfg?.color ?? 'var(--accent-blue)') : 'var(--text-muted)',
                border: `1px solid ${active ? (cfg ? cfg.color + '40' : 'rgba(74,123,255,0.28)') : 'rgba(255,255,255,0.80)'}`,
                backdropFilter: 'blur(10px)',
                boxShadow: active ? `0 2px 8px ${cfg?.glow ?? 'rgba(74,123,255,0.15)'}` : 'none',
                transition: 'all 0.15s', textTransform: 'capitalize',
              }}>
                {f === 'all' ? 'All' : f.replace('_', ' ')} <span style={{ opacity: 0.6 }}>·{cnt}</span>
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginLeft: 'auto', minWidth: 180 }}>
          <Search size={12} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            style={{
              paddingLeft: 30, paddingRight: 12, paddingTop: 6, paddingBottom: 6,
              borderRadius: 20, border: '1px solid rgba(255,255,255,0.82)',
              background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)',
              fontSize: 12, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', width: '100%',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.90), 0 2px 8px rgba(74,123,255,0.07)',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(74,123,255,0.45)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.82)' }}
          />
        </div>
      </div>

      {/* ── Body: 3-column ───────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.85, repeat: Infinity, ease: 'linear' }}
            style={{ width: 26, height: 26, borderRadius: '50%', border: '3px solid rgba(74,123,255,0.15)', borderTopColor: '#4A7BFF' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, gap: 0, overflow: 'hidden' }}>

          {/* ── Column 1: Stats ─────────────────────────────────────────────── */}
          <div style={{
            width: 240, flexShrink: 0, overflowY: 'auto',
            borderRight: '1px solid rgba(74,123,255,0.09)',
            padding: '24px 18px', display: 'flex', flexDirection: 'column', gap: 14,
          }}>

            {/* Donut card */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
              style={{ ...glass('rgba(235,240,255,0.55)'), borderRadius: 20, padding: '20px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>
                Health Overview
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <DonutChart segments={donutSegments} total={summary?.total ?? 0} />
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {Object.entries(TYPE_CFG).map(([k, cfg]) => {
                  const cnt = summary?.by_type[k] || 0
                  if (!cnt) return null
                  return (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, flexShrink: 0, boxShadow: `0 0 6px ${cfg.glow}` }} />
                      <span style={{ fontSize: 11.5, color: 'var(--text-secondary)', flex: 1, textAlign: 'left', textTransform: 'capitalize' }}>{cfg.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, fontVariantNumeric: 'tabular-nums' }}>{cnt}</span>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* Quick stats */}
            {[
              { label: 'Consultations', value: new Set(events.map(e => e.chat_id).filter(Boolean)).size, color: '#4A7BFF', delay: 0.1 },
              { label: 'This month', value: events.filter(e => { const d = new Date(e.occurred_at); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear() }).length, color: '#8B5CF6', delay: 0.18 },
              { label: 'Follow-ups', value: followUps.length, color: dueCount > 0 ? '#DC2626' : '#10B981', delay: 0.26 },
            ].map(s => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: s.delay, duration: 0.3 }}
                style={{ ...glass('rgba(240,244,255,0.50)'), borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                  background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), ${s.color}18)`,
                  border: '1px solid rgba(255,255,255,0.75)',
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.90), 0 2px 10px ${s.color}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: s.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                    <Counter value={s.value} color={s.color} />
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</span>
              </motion.div>
            ))}
          </div>

          {/* ── Column 2: Timeline ──────────────────────────────────────────── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 32px', minWidth: 0 }}>
            {groups.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ ...glass('rgba(235,240,255,0.55)'), borderRadius: 20, padding: '52px 24px', textAlign: 'center' }}>
                <Sparkles size={28} color="rgba(74,123,255,0.28)" style={{ marginBottom: 14, display: 'block', margin: '0 auto 14px' }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  {search ? 'No matching events' : 'No events yet'}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  {search ? 'Try a different term.' : 'Start a consultation — health events appear here automatically.'}
                </div>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {groups.map(group => (
                  <motion.div key={group.key} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ marginBottom: 28 }}>
                    {/* Month header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingLeft: 50 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'monospace', flexShrink: 0 }}>
                        {group.label}
                      </span>
                      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(74,123,255,0.18), transparent)' }} />
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace', flexShrink: 0 }}>{group.events.length}</span>
                    </div>

                    {group.events.map((ev, i) => (
                      <EventCard key={ev.id} ev={ev} index={i} isLast={i === group.events.length - 1} />
                    ))}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* ── Column 3: Follow-ups ────────────────────────────────────────── */}
          <div style={{
            width: 260, flexShrink: 0, overflowY: 'auto',
            borderLeft: '1px solid rgba(74,123,255,0.09)',
            padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            {followUps.length > 0 ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
                style={{ ...glass('rgba(235,240,255,0.52)'), borderRadius: 18, overflow: 'hidden' }}>
                {/* Accordion header */}
                <button onClick={() => setFuOpen(v => !v)} style={{
                  width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  borderBottom: fuOpen ? '1px solid rgba(74,123,255,0.10)' : 'none',
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 8,
                    background: dueCount > 0 ? 'rgba(220,38,38,0.10)' : 'rgba(74,123,255,0.08)',
                    border: `1px solid ${dueCount > 0 ? 'rgba(220,38,38,0.20)' : 'rgba(74,123,255,0.15)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Bell size={12} color={dueCount > 0 ? '#DC2626' : '#4A7BFF'} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-secondary)', flex: 1, textAlign: 'left' }}>
                    Follow-ups
                  </span>
                  {dueCount > 0 && (
                    <span style={{
                      fontSize: 9.5, fontWeight: 800, color: '#fff', background: '#DC2626',
                      borderRadius: 20, padding: '1px 7px', letterSpacing: '0.03em',
                    }}>{dueCount} due</span>
                  )}
                  <motion.div animate={{ rotate: fuOpen ? 90 : 0 }} transition={{ duration: 0.18 }}>
                    <ChevronRight size={13} color="var(--text-muted)" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {fuOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.22 }} style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <AnimatePresence mode="popLayout">
                          {followUps.map(fu => (
                            <FollowUpCard key={fu.id} fu={fu} onResolve={() => handleResolve(fu.id)} onDismiss={() => handleDismiss(fu.id)} />
                          ))}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                style={{ ...glass('rgba(235,240,255,0.50)'), borderRadius: 18, padding: '24px 16px', textAlign: 'center' }}>
                <CheckCircle size={22} color="rgba(16,185,129,0.40)" style={{ display: 'block', margin: '0 auto 10px' }} />
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>All clear</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>No pending follow-ups right now.</div>
              </motion.div>
            )}

            {/* Severity breakdown */}
            {summary && summary.total > 0 && Object.keys(summary.by_severity ?? {}).length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }}
                style={{ ...glass('rgba(235,240,255,0.50)'), borderRadius: 18, padding: '16px 16px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 12 }}>
                  By Severity
                </div>
                {Object.entries(SEV_CFG).map(([k, cfg]) => {
                  const cnt = summary.by_severity?.[k] || 0
                  if (!cnt) return null
                  const pct = Math.round((cnt / summary.total) * 100)
                  return (
                    <div key={k} style={{ marginBottom: 9 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{cfg.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, fontVariantNumeric: 'tabular-nums' }}>{cnt}</span>
                      </div>
                      <div style={{ height: 5, background: 'rgba(74,123,255,0.07)', borderRadius: 99 }}>
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                          style={{ height: '100%', background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}bb)`, borderRadius: 99, boxShadow: `0 0 8px ${cfg.bg}` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

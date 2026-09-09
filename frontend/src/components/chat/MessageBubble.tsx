import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Message, LabResult } from '../../types/chat'

interface Props { message: Message }

function LabResultsInline({ data }: { data: { results: LabResult[]; flagged_count: number } }) {
  const [expanded, setExpanded] = useState(false)
  const { results, flagged_count } = data

  const flagColor = (flag: string) => {
    if (flag === 'critical_low' || flag === 'critical_high') return { bg: 'rgba(248,113,113,0.12)', text: '#ef4444', label: '⚠ Critical' }
    if (flag === 'low') return { bg: 'rgba(251,191,36,0.12)', text: '#d97706', label: '↓ Low' }
    if (flag === 'high') return { bg: 'rgba(251,191,36,0.12)', text: '#d97706', label: '↑ High' }
    return { bg: 'rgba(80,220,140,0.10)', text: '#16a34a', label: '✓ Normal' }
  }

  const byCategory: Record<string, LabResult[]> = {}
  for (const r of results) {
    if (!byCategory[r.category]) byCategory[r.category] = []
    byCategory[r.category].push(r)
  }

  const shown = expanded ? results : results.slice(0, 6)

  return (
    <div style={{
      border: '1px solid rgba(168,85,247,0.22)',
      borderRadius: 14, overflow: 'hidden',
      background: 'rgba(255,255,255,0.85)',
      boxShadow: '0 2px 16px rgba(168,85,247,0.06)',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(74,123,255,0.06))',
        borderBottom: '1px solid rgba(168,85,247,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.3px' }}>🔬 LAB RESULTS ANALYSIS</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {results.length} biomarkers analyzed · {flagged_count} flagged
          </div>
        </div>
        {flagged_count > 0 && (
          <div style={{
            background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)',
            color: '#ef4444', fontSize: 11, fontWeight: 600,
            padding: '3px 10px', borderRadius: 20,
          }}>
            {flagged_count} abnormal
          </div>
        )}
      </div>

      {/* Results table */}
      <div style={{ padding: '8px 0' }}>
        {shown.map((r) => {
          const fc = flagColor(r.flag)
          const rangeWidth = r.normal_max - r.normal_min
          const pos = rangeWidth > 0 ? Math.min(Math.max((r.value - r.normal_min) / rangeWidth, 0), 1) : 0.5
          return (
            <div key={r.name} style={{
              padding: '8px 16px',
              borderBottom: '1px solid rgba(74,123,255,0.04)',
              display: 'flex', alignItems: 'center', gap: 12,
              background: r.flag !== 'normal' ? fc.bg : 'transparent',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {r.display_name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{r.category}</div>
              </div>
              {/* Visual range bar */}
              <div style={{ width: 80, flexShrink: 0 }}>
                <div style={{ height: 4, background: 'rgba(74,123,255,0.08)', borderRadius: 99, position: 'relative', overflow: 'visible' }}>
                  <div style={{
                    position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
                    left: `${pos * 100}%`,
                    width: 8, height: 8, borderRadius: '50%',
                    background: fc.text,
                    boxShadow: `0 0 4px ${fc.text}`,
                    zIndex: 1,
                  }} />
                  <div style={{ height: '100%', background: 'rgba(80,220,140,0.25)', borderRadius: 99 }} />
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{r.normal_min}</span><span>{r.normal_max}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: fc.text, fontVariantNumeric: 'tabular-nums' }}>
                  {r.value}
                  <span style={{ fontSize: 9, fontWeight: 400, marginLeft: 2 }}>{r.unit}</span>
                </div>
                <div style={{ fontSize: 10, color: fc.text, fontWeight: 600 }}>{fc.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {results.length > 6 && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: '100%', padding: '10px', border: 'none',
            background: 'rgba(74,123,255,0.04)', cursor: 'pointer',
            fontSize: 12, color: 'var(--accent-blue)', fontWeight: 600,
            borderTop: '1px solid rgba(74,123,255,0.08)',
          }}
        >
          {expanded ? '↑ Show less' : `↓ Show all ${results.length} results`}
        </button>
      )}
    </div>
  )
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}
      >
        <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          {/* Symptom photo thumbnail */}
          {message.image_url && (
            <div style={{
              borderRadius: '12px 12px 4px 12px', overflow: 'hidden',
              border: '2px solid rgba(74,123,255,0.3)',
              boxShadow: '0 4px 16px rgba(74,123,255,0.2)',
            }}>
              <img src={message.image_url} alt="Symptom" style={{ maxWidth: 220, maxHeight: 180, objectFit: 'cover', display: 'block' }} />
              <div style={{ padding: '4px 10px', background: 'rgba(74,123,255,0.85)', fontSize: 10, color: '#fff', fontWeight: 600, letterSpacing: '0.3px' }}>
                👁 Symptom photo attached
              </div>
            </div>
          )}
          {message.content && (
            <div style={{
              background: 'linear-gradient(135deg, #4A7BFF, #6366f1)',
              borderRadius: '18px 18px 4px 18px',
              padding: '12px 16px',
              color: '#fff',
              fontSize: 14,
              lineHeight: 1.6,
              boxShadow: '0 4px 20px rgba(74,123,255,0.30)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {message.content}
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // Lab results card
  if (message.content.startsWith('__LAB_RESULTS__')) {
    try {
      const jsonStr = message.content.replace('__LAB_RESULTS__\n', '')
      const labData = JSON.parse(jsonStr)
      return (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-start' }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(168,85,247,0.15)',
            border: '1px solid rgba(168,85,247,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0, marginTop: 2,
          }}>🔬</div>
          <div style={{ flex: 1 }}>
            <LabResultsInline data={labData} />
          </div>
        </motion.div>
      )
    } catch {
      // Fall through to normal render
    }
  }

  // Clarification card
  if (message.content.startsWith('__CLARIFICATION__')) {
    const body = message.content.replace('__CLARIFICATION__\n', '')
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-start' }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(255,195,80,0.18)', border: '1px solid rgba(255,195,80,0.40)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0, marginTop: 2,
        }}>🤔</div>
        <div style={{
          flex: 1, background: 'rgba(255,195,80,0.06)', border: '1px solid rgba(255,195,80,0.22)',
          borderRadius: '4px 18px 18px 18px', padding: '14px 18px',
          backdropFilter: 'blur(10px)', boxShadow: '0 2px 12px rgba(74,123,255,0.06)',
        }}>
          <div style={{ fontSize: 11, color: 'rgba(180,120,0,0.9)', fontWeight: 600, marginBottom: 8, letterSpacing: '0.3px' }}>FOLLOW-UP QUESTIONS</div>
          <div style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{body}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, borderTop: '1px solid rgba(74,123,255,0.08)', paddingTop: 8 }}>
            Please answer these questions in your next message for a more accurate consultation
          </div>
        </div>
      </motion.div>
    )
  }

  // Document summary card
  if (message.content.startsWith('__DOC_SUMMARY__')) {
    const body = message.content.replace('__DOC_SUMMARY__\n', '')
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-start' }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(80,220,140,0.15)', border: '1px solid rgba(80,220,140,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0, marginTop: 2,
        }}>📄</div>
        <div style={{
          flex: 1, background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(80,220,140,0.22)',
          borderRadius: '4px 18px 18px 18px', padding: '14px 18px',
          backdropFilter: 'blur(10px)', boxShadow: '0 2px 12px rgba(80,220,140,0.08)',
        }}>
          <div style={{ fontSize: 11, color: 'rgba(22,163,74,0.9)', fontWeight: 600, marginBottom: 8, letterSpacing: '0.3px' }}>DOCUMENT SUMMARY</div>
          <div style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text-secondary)' }}
            dangerouslySetInnerHTML={{ __html: body
              .replace(/\*\*(.*?)\*\*/g, `<strong style="color:var(--text-primary)">$1</strong>`)
              .replace(/^• (.+)$/gm, '<div style="padding-left:4px;margin:4px 0">• $1</div>')
            }} />
        </div>
      </motion.div>
    )
  }

  // Normal assistant message
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'flex-start' }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: '50%',
        background: 'rgba(74,123,255,0.12)', border: '1px solid rgba(74,123,255,0.28)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, flexShrink: 0, marginTop: 2,
      }}>🩺</div>

      <div style={{
        flex: 1, background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(74,123,255,0.14)',
        borderRadius: '4px 18px 18px 18px', padding: '14px 18px',
        backdropFilter: 'blur(10px)', boxShadow: '0 2px 12px rgba(74,123,255,0.07)',
      }}>
        <div style={{ fontSize: 11, color: 'var(--accent-blue)', fontWeight: 600, marginBottom: 8, letterSpacing: '0.3px' }}>
          MY PERSONAL DOCTOR
        </div>
        <div
          className="prose"
          style={{ fontSize: 14, lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          dangerouslySetInnerHTML={{
            __html: message.content
              .replace(/\*\*(.*?)\*\*/gs, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/gs, '<em>$1</em>')
              .replace(/^---+$/gm, '<hr style="border:none;border-top:1px solid rgba(74,123,255,0.12);margin:10px 0">')
              .replace(/^# (.+)$/gm, `<h2 style="color:rgba(13,22,64,0.92);font-size:15px;font-weight:700;margin:14px 0 6px">$1</h2>`)
              .replace(/^## (.+)$/gm, `<h3 style="color:rgba(13,22,64,0.92);font-size:14px;font-weight:600;margin:12px 0 6px">$1</h3>`)
              .replace(/^### (.+)$/gm, `<h4 style="color:rgba(13,22,64,0.70);font-size:13px;font-weight:600;margin:10px 0 4px">$1</h4>`)
              .replace(/^- (.+)$/gm, '<div style="padding-left:4px;margin:2px 0">• $1</div>')
          }}
        />
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, borderTop: '1px solid rgba(74,123,255,0.08)', paddingTop: 8 }}>
          For informational purposes only — not a substitute for professional medical advice
        </div>
      </div>
    </motion.div>
  )
}

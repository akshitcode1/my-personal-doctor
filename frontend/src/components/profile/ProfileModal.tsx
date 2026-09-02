import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, Save } from 'lucide-react'
import { useProfileStore } from '../../stores/profileStore'
import { useAuthStore } from '../../stores/authStore'

interface Props { open: boolean; onClose: () => void }

export default function ProfileModal({ open, onClose }: Props) {
  const { user } = useAuthStore()
  const { displayName, phone, avatarUrl, globalContext, load, save } = useProfileStore()
  const [name, setName] = useState('')
  const [ph, setPh] = useState('')
  const [ctx, setCtx] = useState('')
  const [avatar, setAvatar] = useState('')
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const docRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (open) {
      setName(displayName)
      setPh(phone)
      setCtx(globalContext)
      setAvatar(avatarUrl)
      setSaved(false)
    }
  }, [open, displayName, phone, globalContext, avatarUrl])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleDocChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setCtx(text.slice(0, 4000))
  }

  const handleSave = () => {
    save({ displayName: name, phone: ph, avatarUrl: avatar, globalContext: ctx })
    setSaved(true)
    setTimeout(onClose, 800)
  }

  const initials = (name || user?.email || 'U').slice(0, 2).toUpperCase()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(13,22,64,0.35)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          <motion.div
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480,
              background: 'rgba(255,255,255,0.96)',
              border: '1px solid rgba(74,123,255,0.18)',
              borderRadius: 24,
              padding: '28px 28px',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 24px 80px rgba(74,123,255,0.15), 0 4px 24px rgba(74,123,255,0.10)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>My Profile</h2>
              <button
                onClick={onClose}
                style={{
                  background: 'rgba(74,123,255,0.07)', border: '1px solid rgba(74,123,255,0.14)',
                  borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', padding: '5px 7px',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Avatar */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
              <div style={{ position: 'relative' }}>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: avatar ? 'transparent' : 'linear-gradient(135deg, #4A7BFF, #7B5EA7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, fontWeight: 700, color: '#fff',
                    cursor: 'pointer', overflow: 'hidden',
                    border: '3px solid rgba(74,123,255,0.35)',
                    boxShadow: '0 4px 16px rgba(74,123,255,0.20)',
                  }}
                >
                  {avatar ? <img src={avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="avatar" /> : initials}
                </div>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    position: 'absolute', bottom: 0, right: 0,
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', border: '2px solid #fff',
                    boxShadow: '0 2px 8px rgba(74,123,255,0.35)',
                  }}
                >
                  <Camera size={12} color="#fff" />
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              </div>
            </div>

            {/* Email (readonly) */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Email</label>
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(74,123,255,0.05)',
                border: '1px solid rgba(74,123,255,0.14)',
                color: 'var(--text-secondary)', fontSize: 14,
              }}>
                {user?.email}
              </div>
            </div>

            {/* Display Name */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Display Name</label>
              <input
                className="glass-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            {/* Phone */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Phone</label>
              <input
                className="glass-input"
                value={ph}
                onChange={(e) => setPh(e.target.value)}
                placeholder="+1 234 567 8900"
                type="tel"
              />
            </div>

            {/* Medical Context */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Medical History / Reference Document
                <span style={{ color: 'var(--accent-blue)', marginLeft: 6, fontWeight: 400, fontStyle: 'italic' }}>optional</span>
              </label>
              <textarea
                className="glass-input"
                value={ctx}
                onChange={(e) => setCtx(e.target.value)}
                placeholder="Paste your medical history, allergies, current medications, or chronic conditions here. Specialists will use this context in all your consultations."
                rows={4}
                style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
              />
              <button
                onClick={() => docRef.current?.click()}
                style={{
                  marginTop: 8, background: 'rgba(74,123,255,0.05)',
                  border: '1px dashed rgba(74,123,255,0.28)',
                  borderRadius: 8, padding: '7px 14px', color: 'var(--accent-blue)',
                  fontSize: 12, cursor: 'pointer', width: '100%',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(74,123,255,0.10)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(74,123,255,0.05)' }}
              >
                Upload document (.txt, .pdf text)
              </button>
              <input ref={docRef} type="file" accept=".txt,.md" style={{ display: 'none' }} onChange={handleDocChange} />
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              className="btn-glass btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14, gap: 8 }}
            >
              <Save size={15} />
              {saved ? 'Saved!' : 'Save Profile'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

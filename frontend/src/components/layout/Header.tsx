import { useState, useEffect } from 'react'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'
import { useProfileStore } from '../../stores/profileStore'
import { supabase } from '../../api/auth'
import ProfileModal from '../profile/ProfileModal'

export default function Header() {
  const { user, signOut } = useAuthStore()
  const { displayName, avatarUrl, load } = useProfileStore()
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => { load() }, [load])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    signOut()
  }

  const initials = (displayName || user?.email || 'U').slice(0, 2).toUpperCase()

  return (
    <>
      <header style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        borderBottom: '1px solid rgba(74,123,255,0.14)',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        flexShrink: 0,
        zIndex: 10,
        boxShadow: '0 1px 12px rgba(74,123,255,0.08)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 22 }}>🩺</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>My Personal Doctor</span>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Profile button */}
          <button
            onClick={() => setProfileOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(74,123,255,0.06)',
              border: '1px solid rgba(74,123,255,0.16)',
              borderRadius: 40,
              padding: '6px 14px 6px 6px',
              cursor: 'pointer',
              transition: 'all 0.18s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(74,123,255,0.4)'; e.currentTarget.style.background = 'rgba(74,123,255,0.12)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(74,123,255,0.16)'; e.currentTarget.style.background = 'rgba(74,123,255,0.06)' }}
          >
            {/* Avatar */}
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #4A7BFF, #7B5EA7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff',
              overflow: 'hidden', flexShrink: 0,
            }}>
              {avatarUrl
                ? <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="avatar" />
                : initials}
            </div>
            <div style={{ textAlign: 'left' }}>
              {displayName && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>{displayName}</div>}
              <div style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
          </button>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            title="Sign out"
            style={{
              background: 'rgba(74,123,255,0.05)',
              border: '1px solid rgba(74,123,255,0.14)',
              borderRadius: 10,
              padding: '7px 10px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.3)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(74,123,255,0.14)' }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}

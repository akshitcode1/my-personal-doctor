import { useState } from 'react'
import { useAuthStore } from './stores/authStore'
import { useAuth } from './hooks/useAuth'
import LoginForm from './components/auth/LoginForm'
import AppShell from './components/layout/AppShell'
import LoadingPulse from './components/ui/LoadingPulse'

export type AppView = 'chat' | 'timeline'

export default function App() {
  useAuth()
  const { session, loading } = useAuthStore()
  const [view, setView] = useState<AppView>('chat')

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)',
      }}>
        <LoadingPulse />
      </div>
    )
  }

  if (!session) return <LoginForm />

  return <AppShell view={view} setView={setView} />
}

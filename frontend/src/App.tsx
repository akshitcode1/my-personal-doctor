import { useAuthStore } from './stores/authStore'
import { useAuth } from './hooks/useAuth'
import LoginForm from './components/auth/LoginForm'
import AppShell from './components/layout/AppShell'
import LoadingPulse from './components/ui/LoadingPulse'

export default function App() {
  useAuth() // Initializes auth listener
  const { session, loading } = useAuthStore()

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

  return session ? <AppShell /> : <LoginForm />
}

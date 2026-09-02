import { useEffect } from 'react'
import { supabase } from '../api/auth'
import { useAuthStore } from '../stores/authStore'

export function useAuth() {
  const { session, setSession, setLoading } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => {})

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })

    return () => subscription.unsubscribe()
  }, [setSession, setLoading])

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })

  const signInWithEmail = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUpWithEmail = (email: string, password: string) =>
    supabase.auth.signUp({ email, password })

  const signOut = () => supabase.auth.signOut()

  return { session, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }
}

import { create } from 'zustand'
import { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: false,
  setSession: (session) => set({ session, user: session?.user ?? null, loading: false }),
  setLoading: (loading) => set({ loading }),
  signOut: () => set({ user: null, session: null }),
}))

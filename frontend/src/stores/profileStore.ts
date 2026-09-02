import { create } from 'zustand'

interface Profile {
  displayName: string
  phone: string
  avatarUrl: string
  globalContext: string
}

interface ProfileStore extends Profile {
  load: () => void
  save: (p: Partial<Profile>) => void
}

const KEY = 'mpd_profile'

const defaults: Profile = { displayName: '', phone: '', avatarUrl: '', globalContext: '' }

function readStorage(): Profile {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return defaults
  }
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  ...defaults,
  load: () => set(readStorage()),
  save: (p) => {
    const next = { ...get(), ...p }
    set(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* quota */ }
  },
}))

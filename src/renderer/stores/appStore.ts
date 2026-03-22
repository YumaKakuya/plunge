import { create } from 'zustand'
import type { AppMode, LaunchView, ToyView } from '@/shared/types'

type Theme = 'light' | 'dark'

interface AppState {
  mode: AppMode
  setMode: (mode: AppMode) => void
  launchView: LaunchView
  setLaunchView: (view: LaunchView) => void
  toyView: ToyView
  setToyView: (view: ToyView) => void
  expandedCard: string | null
  setExpandedCard: (card: string | null) => void
  toggleCard: (card: string) => void
  theme: Theme
  toggleTheme: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  mode: 'launch',
  setMode: (mode) => set({ mode }),
  launchView: 'project',
  setLaunchView: (launchView) => set({ launchView }),
  toyView: 'clipper',
  setToyView: (toyView) => set({ toyView }),
  expandedCard: null,
  setExpandedCard: (expandedCard) => set({ expandedCard }),
  toggleCard: (card) => set({ expandedCard: get().expandedCard === card ? null : card }),
  theme: (localStorage.getItem('plunge-theme') as Theme) || 'light',
  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light'
    document.documentElement.classList.toggle('dark', next === 'dark')
    localStorage.setItem('plunge-theme', next)
    set({ theme: next })
  },
}))

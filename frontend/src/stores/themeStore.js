import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const themeStore = create(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    { name: 'tt-theme' }
  )
)

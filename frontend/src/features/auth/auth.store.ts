import { create } from "zustand"
import type { AuthUser } from "./auth.service"

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  onboardingPending: boolean   // true only right after register

  setAuth: (user: AuthUser, token: string, onboarding?: boolean) => void
  clearAuth: () => void
  completeOnboarding: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),
  onboardingPending: false,

  setAuth: (user, token, onboarding = false) => {
    localStorage.setItem("token", token)
    set({ user, token, isAuthenticated: true, onboardingPending: onboarding })
  },

  clearAuth: () => {
    localStorage.removeItem("token")
    set({ user: null, token: null, isAuthenticated: false, onboardingPending: false })
  },

  completeOnboarding: () => {
    set({ onboardingPending: false })
  },
}))

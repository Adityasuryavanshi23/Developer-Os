import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "../features/auth/auth.store"

// Blocks logged-in users from seeing login/register.
// Exception: if onboardingPending is true (just registered), let them through to /onboarding.
export default function GuestRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const onboardingPending = useAuthStore((s) => s.onboardingPending)

  if (isAuthenticated && !onboardingPending) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

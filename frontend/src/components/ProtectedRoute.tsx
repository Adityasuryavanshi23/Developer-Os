import { useEffect } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "../features/auth/auth.store"
import { authService } from "../features/auth/auth.service"

// Wrap any route with this to make it login-required.
// If not authenticated → redirect to /login
// If authenticated → render the child route normally.
// Also re-hydrates the user object from /auth/me on page reload
// (Zustand is in-memory only — user is lost on refresh unless we refetch)
export default function ProtectedRoute() {
  const { isAuthenticated, user, setAuth, token } = useAuthStore()

  useEffect(() => {
    // If we have a token but no user object (e.g. after page refresh), refetch /me
    if (isAuthenticated && !user && token) {
      authService.getMe()
        .then((me) => {
          setAuth(me, token)
        })
        .catch(() => {/* token expired — api interceptor will redirect to /login */})
    }
  }, [isAuthenticated, user, token, setAuth])



  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

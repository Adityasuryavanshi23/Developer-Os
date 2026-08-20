import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"

import ProtectedRoute from "./components/ProtectedRoute"
import GuestRoute from "./components/GuestRoute"
import DashboardLayout from "./components/DashboardLayout"
import LoginPage from "./features/auth/LoginPage"
import RegisterPage from "./features/auth/RegisterPage"
import OnboardingPage from "./features/dashboard/OnboardingPage"
import DashboardPage from "./features/dashboard/DashboardPage"
import LearningPage from "./features/learning/LearningPage"
import TasksPage from "./features/tasks/TasksPage"
import RevisionPage from "./features/revision/RevisionPage"
import AnalyticsPage from "./features/analytics/AnalyticsPage"
import SettingsPage from "./features/settings/SettingsPage"
import InterviewPage from "./features/interview/InterviewPage"
import RoutinePage from "./features/routine/RoutinePage"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>

          {/* Guest only */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Onboarding — no guard, handles redirect internally */}
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Protected — all inside DashboardLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard"  element={<DashboardPage />} />
              <Route path="/learning"   element={<LearningPage />} />
              <Route path="/tasks"      element={<TasksPage />} />
              <Route path="/revision"   element={<RevisionPage />} />
              <Route path="/analytics"  element={<AnalyticsPage />} />
              <Route path="/interview"  element={<InterviewPage />} />
              <Route path="/settings"   element={<SettingsPage />} />
              <Route path="/routine"    element={<RoutinePage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes> 
      </BrowserRouter>
      <Toaster
        position="top-right"
        duration={3500}
        gap={12}
        toastOptions={{
          style: {
            background: "linear-gradient(135deg, rgba(0,8,24,0.97) 0%, rgba(0,20,50,0.97) 100%)",
            border: "1px solid rgba(0,200,255,0.55)",
            color: "#e2f0ff",
            fontFamily: "monospace",
            fontSize: "0.85rem",
            fontWeight: 500,
            borderRadius: "8px",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            boxShadow: [
              "0 0 0 1px rgba(0,200,255,0.12)",
              "0 0 40px rgba(0,200,255,0.18)",
              "0 20px 60px rgba(0,0,0,0.7)",
              "inset 0 1px 0 rgba(0,200,255,0.15)",
            ].join(", "),
            padding: "1rem 1.1rem",
            minWidth: "320px",
          },
        }}
      />
    </QueryClientProvider>
  )
}

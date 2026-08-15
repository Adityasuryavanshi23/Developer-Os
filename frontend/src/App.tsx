import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

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
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

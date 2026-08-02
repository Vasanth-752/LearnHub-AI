import { Routes, Route, Navigate, useEffect } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ThemeProvider } from './hooks/useTheme'
import { useAuthStore } from './store/authStore'
import { ErrorBoundary } from './components/ui'
import PageWrapper from './components/layout/PageWrapper'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import DashboardPage from './pages/DashboardPage'
import ExplorePage from './pages/ExplorePage'
import VaultPage from './pages/VaultPage'
import PathwaysPage from './pages/PathwaysPage'
import BookmarksPage from './pages/BookmarksPage'
import PulsePage from './pages/PulsePage'
import SettingsPage from './pages/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'

function PublicRoute({ children }) {
  const { user, initialized } = useAuthStore()

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return children
}

function AppRoutes() {
  const { initializeAuth } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute><LandingPage /></PublicRoute>} path="/" />
        <Route element={<PublicRoute><LoginPage /></PublicRoute>} path="/login" />
        <Route element={<PublicRoute><RegisterPage /></PublicRoute>} path="/register" />
        <Route element={<AuthCallbackPage />} path="/auth/callback" />

        {/* Protected Routes - App Layout with Sidebar */}
        <Route element={
          <ProtectedRoute>
            <PageWrapper />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="vault" element={<VaultPage />} />
          <Route path="pathways" element={<PathwaysPage />} />
          <Route path="bookmarks" element={<BookmarksPage />} />
          <Route path="dashboard" element={<PulsePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </ThemeProvider>
  )
}
import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { CenteredSpinner } from '@/components/ui/feedback'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { me } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { useSyncReplay } from '@/hooks/useSyncReplay'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import Dashboard from '@/pages/dashboard/Dashboard'
import ApplicationsList from '@/pages/applications/ApplicationsList'
import ApplicationForm from '@/pages/applications/ApplicationForm'
import Metrics from '@/pages/metrics/Metrics'
import Exports from '@/pages/exports/Exports'
import Developer from '@/pages/developer/Developer'
import AccountSettings from '@/pages/account/AccountSettings'
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy'

export default function App() {
  useSyncReplay()
  const [booted, setBooted] = useState(false)
  const accessToken = useAuthStore((s) => s.accessToken)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)

  // Restore the user profile if we already hold a token.
  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      if (!useAuthStore.getState().accessToken) {
        setBooted(true)
        return
      }
      try {
        const user = await me()
        if (!cancelled) setUser(user)
      } catch (error) {
        if (
          typeof error === 'object' &&
          error &&
          'response' in error &&
          [401, 403].includes((error as { response?: { status?: number } }).response?.status ?? 0)
        ) {
          logout()
        }
      } finally {
        if (!cancelled) setBooted(true)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [setUser, logout])

  if (!booted) return <CenteredSpinner label="Starting Applywell…" />

  return (
    <>
      <OfflineBanner />
      <Routes>
      <Route path="/login" element={accessToken ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={accessToken ? <Navigate to="/dashboard" replace /> : <Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/applications" element={<ApplicationsList />} />
        <Route path="/applications/new" element={<ApplicationForm />} />
        <Route path="/applications/:id/edit" element={<ApplicationForm />} />
        <Route path="/metrics" element={<Metrics />} />
        <Route path="/exports" element={<Exports />} />
        <Route path="/developer" element={<Developer />} />
        <Route path="/account" element={<AccountSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </>
  )
}

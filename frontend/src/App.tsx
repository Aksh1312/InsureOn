import { Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import ProtectedRoute, { AdminRoute } from './components/ProtectedRoute'
import OnboardingGuard from './components/OnboardingGuard'
import Landing from './pages/Landing'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Policies from './pages/Policies'
import Claims from './pages/Claims'
import Payouts from './pages/Payouts'
import Smartwork from './pages/Smartwork'
import Profile from './pages/Profile'
import OnboardingWizard from './pages/OnboardingWizard'
import PayoutCenter from './pages/PayoutCenter'
import Settings from './pages/Settings'
import AdminDashboard from './pages/AdminDashboard'
import AdminLogin from './pages/AdminLogin'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingWizard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <AppShell />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="policies" element={<Policies />} />
        <Route path="claims" element={<Claims />} />
        <Route path="payouts" element={<Payouts />} />
        <Route path="payout-center" element={<PayoutCenter />} />
        <Route path="smartwork" element={<Smartwork />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App

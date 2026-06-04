import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import LoadingScreen from './ui/LoadingScreen'

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { isReady } = useAuth()
  const { data: profile, isLoading, isError } = useProfile()
  const location = useLocation()

  if (!isReady || isLoading) {
    return <LoadingScreen message="Setting up your workspace…" />
  }

  const needsOnboarding = isError || !profile

  if (needsOnboarding) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />
  }

  return <>{children}</>
}

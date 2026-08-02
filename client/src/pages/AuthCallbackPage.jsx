import { useEffect, useState } from 'react'
import { Loader2, BookOpen, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../services/api'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { initializeAuth, session } = useAuthStore()
  const [status, setStatus] = useState('loading') // loading, success, error

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Check for error in URL params
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (error) {
          throw new Error(errorDescription || error)
        }

        // Initialize auth to pick up the session from the URL
        await initializeAuth()

        const { session } = useAuthStore.getState()
        if (session) {
          // Sync profile with backend
          try {
            await api.post('/auth/sync', {
              user_id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.full_name || '',
              avatar_url: session.user.user_metadata?.avatar_url || null,
            })
          } catch (syncError) {
            console.warn('Profile sync failed (non-critical):', syncError)
          }

          setStatus('success')
          toast.success('Successfully signed in!')
          // Redirect to dashboard after a short delay
          setTimeout(() => navigate('/'), 1500)
        } else {
          throw new Error('No session found after OAuth callback')
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setStatus('error')
        toast.error(err.message || 'Authentication failed')
      }
    }

    handleAuth()
  }, [searchParams, navigate, initializeAuth])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
          </div>
          <h1 className="font-heading font-semibold text-xl text-[var(--color-text)] mb-2">
            Completing sign in...
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Please wait while we redirect you.
          </p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[rgba(74,222,128,0.12)] flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-[var(--color-success)]" />
          </div>
          <h1 className="font-heading font-semibold text-xl text-[var(--color-text)] mb-2">
            Welcome back!
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-[rgba(163,81,57,0.12)] flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-[var(--color-danger)]" />
        </div>
        <h1 className="font-heading font-semibold text-xl text-[var(--color-text)] mb-2">
          Sign in failed
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-6">
          Something went wrong during authentication. Please try again.
        </p>
        <Button variant="primary" asChild>
          <a href="/login">Try Again</a>
        </Button>
      </div>
    </div>
  )
}
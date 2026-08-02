import { Outlet } from 'react-router-dom'
import { ErrorBoundary } from '../ui'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </div>
  )
}
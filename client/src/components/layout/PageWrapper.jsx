import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ErrorBoundary } from '../ui'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import BottomBar from './BottomBar'
import { useState, useEffect } from 'react'

export default function PageWrapper() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Handle mobile sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const closeSidebar = () => setSidebarOpen(false)
  const toggleSidebarCollapse = () => setSidebarCollapsed(!sidebarCollapsed)

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-[var(--color-overlay)] md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        className={sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      />

      {/* Main Content */}
      <main
        className={`
          min-h-screen
          transition-all duration-300 ease-out
          ${sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'}
          pt-16 pb-[72px] md:pb-0
        `}
        role="main"
      >
        <Navbar onMenuClick={toggleSidebar} />
        <div className="p-4 md:p-6 lg:p-8">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </ErrorBoundary>
        </div>
      </main>

      {/* Bottom Bar (Mobile) */}
      <BottomBar />
    </div>
  )
}
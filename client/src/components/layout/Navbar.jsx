import { NavLink, useLocation } from 'react-router-dom'
import { Menu, LogOut, User, Bell, Sun, Moon } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../store/authStore'
import { useTheme } from '../../hooks/useTheme'
import { Button } from '../ui'

export default function Navbar({ onMenuClick }) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  const getPageTitle = () => {
    const titles = {
      '/': 'Dashboard',
      '/explore': 'Explore',
      '/vault': 'Vault',
      '/pathways': 'Pathways',
      '/bookmarks': 'Bookmarks',
      '/dashboard': 'Pulse',
      '/settings': 'Settings',
    }
    return titles[location.pathname] || 'LearnHub AI'
  }

  return (
    <header
      className={`
        fixed top-0 left-[260px] right-0 z-30 h-16
        bg-[var(--color-surface)]
        border-b border-[var(--color-border)]
        transition-all duration-300 ease-out
      `}
      role="banner"
    >
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Mobile Menu Button & Page Title */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={onMenuClick}
            aria-label="Open menu"
            aria-expanded="false"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="font-heading font-semibold text-lg text-[var(--color-text)] hidden sm:block">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="hidden sm:flex"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="sm" aria-label="Notifications">
            <Bell className="w-5 h-5" />
          </Button>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 p-1 rounded-md"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-expanded={showUserMenu}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary-muted)] flex items-center justify-center">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="w-8 h-8 rounded-full"
                    aria-hidden="true"
                  />
                ) : (
                  <User className="w-5 h-5 text-[var(--color-primary)]" aria-hidden="true" />
                )}
              </div>
              <span className="hidden md:block text-sm font-medium text-[var(--color-text)]">
                {user?.email || 'User'}
              </span>
            </Button>

            {showUserMenu && (
              <div
                className={`
                  absolute right-0 top-full mt-2 w-48
                  bg-[var(--color-surface)]
                  border border-[var(--color-border)]
                  rounded-lg shadow-[var(--shadow-lg)]
                  py-2 animate-fade-in-up
                `}
                role="menu"
                aria-orientation="vertical"
              >
                <div className="px-4 py-2 border-b border-[var(--color-border)]">
                  <p className="text-sm font-medium text-[var(--color-text)] truncate">
                    {user?.email || 'User'}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">
                    {user?.user_metadata?.full_name || ''}
                  </p>
                </div>
                <NavLink
                  to="/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-elevated)]"
                  role="menuitem"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="w-4 h-4" aria-hidden="true" />
                  Profile
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-elevated)]"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
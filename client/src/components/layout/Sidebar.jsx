import { NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard,
  Search,
  FolderOpen,
  Map,
  Bookmark,
  BarChart2,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  BookOpen,
} from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import { Button } from '../ui'

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/explore', label: 'Explore', icon: Search },
  { path: '/vault', label: 'Vault', icon: FolderOpen },
  { path: '/pathways', label: 'Pathways', icon: Map },
  { path: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { path: '/dashboard', label: 'Pulse', icon: BarChart2 },
]

const SIDEBAR_ITEMS = [
  ...NAV_ITEMS,
  { path: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ collapsed, onToggleCollapse }) {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  return (
    <aside
      className={`
        fixed left-0 top-0 z-40 h-full
        bg-[var(--color-surface)]
        border-r border-[var(--color-border)]
        transition-all duration-300 ease-out
        ${collapsed ? 'w-[72px]' : 'w-[260px]'}
      `}
      aria-label="Main navigation"
    >
      <div className="flex flex-col h-full">
        {/* Logo / Brand */}
        <div className={`
          flex items-center justify-between
          h-16 px-4 border-b border-[var(--color-border)]
          ${collapsed ? 'justify-center' : ''}
        `}>
          {!collapsed && (
            <NavLink to="/" className="flex items-center gap-2" aria-label="LearnHub AI Home">
              <BookOpen className="w-6 h-6 text-[var(--color-primary)]" aria-hidden="true" />
              <span className="font-heading font-bold text-lg text-[var(--color-text)]">
                LearnHub AI
              </span>
            </NavLink>
          )}
          {collapsed && (
            <NavLink to="/" className="p-2" aria-label="LearnHub AI Home">
              <BookOpen className="w-6 h-6 text-[var(--color-primary)]" aria-hidden="true" />
            </NavLink>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={collapsed ? 'ml-auto' : ''}
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2" role="navigation" aria-label="Main">
          <ul className="space-y-1" role="list">
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path))
              const Icon = item.icon

              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center gap-3
                      px-3 py-2.5 rounded-md
                      text-sm font-medium
                      transition-all duration-200 ease-out
                      ${isActive
                        ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-elevated)]'
                      }
                      ${collapsed ? 'justify-center' : ''}
                    `}
                    aria-current={isActive ? 'page' : undefined}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Theme Toggle & Footer */}
        <div className="p-4 border-t border-[var(--color-border)]">
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-5 h-5" aria-hidden="true" />
                {!collapsed && <span>Light Mode</span>}
              </>
            ) : (
              <>
                <Moon className="w-5 h-5" aria-hidden="true" />
                {!collapsed && <span>Dark Mode</span>}
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  )
}
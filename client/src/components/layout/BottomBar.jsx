import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  FolderOpen,
  Map,
  BarChart2,
} from 'lucide-react'

const BOTTOM_NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/explore', label: 'Explore', icon: Search },
  { path: '/vault', label: 'Vault', icon: FolderOpen },
  { path: '/pathways', label: 'Pathways', icon: Map },
  { path: '/dashboard', label: 'Pulse', icon: BarChart2 },
]

export default function BottomBar() {
  const location = useLocation()

  return (
    <nav
      className={`
        fixed bottom-0 left-0 right-0 z-40 h-[72px]
        bg-[var(--color-surface)]
        border-t border-[var(--color-border)]
        md:hidden
      `}
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around h-full">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex flex-col items-center gap-1
                px-3 py-2
                text-xs font-medium
                transition-all duration-200 ease-out
                touch-manipulation
                ${isActive
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)]'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <Icon className="w-6 h-6" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
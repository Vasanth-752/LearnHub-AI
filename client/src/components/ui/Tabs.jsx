import { createContext, useContext, useState } from 'react'

/**
 * Warm Flat 2.0 Tabs component set.
 * Provides Tabs, TabList, Tab, TabPanel — a composable accessible tab system.
 *
 * Usage:
 *   <Tabs value={activeTab} onValueChange={setActiveTab}>
 *     <TabList>
 *       <Tab value="notes">Notes</Tab>
 *       <Tab value="videos">Videos</Tab>
 *     </TabList>
 *     <TabPanel value="notes">Notes content</TabPanel>
 *     <TabPanel value="videos">Videos content</TabPanel>
 *   </Tabs>
 */

const TabsContext = createContext(null)

export function Tabs({ value, onValueChange, children, className = '' }) {
  // Support both controlled (value prop) and uncontrolled usage
  const [internalValue, setInternalValue] = useState(value ?? '')
  const activeTab = value !== undefined ? value : internalValue

  const handleChange = (newValue) => {
    if (onValueChange) {
      onValueChange(newValue)
    } else {
      setInternalValue(newValue)
    }
  }

  return (
    <TabsContext.Provider value={{ activeTab, handleChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabList({ children, className = '' }) {
  return (
    <div
      role="tablist"
      className={`flex gap-1 bg-[var(--color-bg)] p-1 rounded-lg border border-[var(--color-border)] ${className}`}
    >
      {children}
    </div>
  )
}

export function Tab({ value, children, className = '', disabled = false }) {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tab must be used within a Tabs component')
  }

  const { activeTab, handleChange } = context
  const isActive = activeTab === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => !disabled && handleChange(value)}
      className={`
        px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      style={{
        background: isActive ? 'var(--color-surface)' : 'transparent',
        color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        border: isActive ? '1px solid var(--color-border-hover)' : '1px solid transparent',
      }}
    >
      {children}
    </button>
  )
}

export function TabPanel({ value, children, className = '' }) {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('TabPanel must be used within a Tabs component')
  }

  const { activeTab } = context

  if (activeTab !== value) return null

  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  )
}

export default Tabs

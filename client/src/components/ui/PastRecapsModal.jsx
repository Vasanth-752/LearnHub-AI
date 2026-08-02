import { useState, useEffect, useRef } from 'react'
import { X, Calendar, Sparkles } from 'lucide-react'
import Button from './Button'
import Card from './Card'
import Skeleton from './Skeleton'
import { createPortal } from 'react-dom'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function PastRecapsModal({ isOpen, onClose }) {
  const [recaps, setRecaps] = useState([])
  const [loading, setLoading] = useState(true)
  const overlayRef = useRef(null)
  const contentRef = useRef(null)
  const previousActiveElement = useRef(null)

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement
      document.body.style.overflow = 'hidden'
      contentRef.current?.focus()
      document.addEventListener('keydown', handleKeyDown)
      fetchRecaps()
    } else {
      document.body.style.overflow = ''
      previousActiveElement.current?.focus()
    }

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    }
    if (e.key === 'Tab') {
      trapFocus(e)
    }
  }

  const trapFocus = (e) => {
    const focusableElements = contentRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (!focusableElements?.length) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault()
      lastElement.focus()
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault()
      firstElement.focus()
    }
  }

  const fetchRecaps = async () => {
    try {
      setLoading(true)
      const response = await api.get('/recap')
      // Skip the very first one as it's the current week, just show the historical ones
      setRecaps(response.data.data.slice(1) || [])
    } catch (error) {
      toast.error('Failed to load past recaps')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div 
        ref={contentRef}
        tabIndex={-1}
        className="relative bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-slide-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div>
            <h2 id="modal-title" className="font-heading font-semibold text-lg text-[var(--color-text)]">Past Recaps</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">Your historical learning summaries</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i} padding="md" className="animate-pulse">
                <Skeleton variant="text" lines={3} />
              </Card>
            ))
          ) : recaps.length > 0 ? (
            recaps.map(recap => (
              <PastRecapItem key={recap.id} recap={recap} />
            ))
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-3" />
              <h3 className="font-medium text-[var(--color-text)] mb-1">No past recaps</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                You only have your current weekly recap. Check back next week!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

function PastRecapItem({ recap }) {
  const start = new Date(recap.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  const end = new Date(recap.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <Card padding="md" className="border-[var(--color-border)]">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
        <h4 className="font-heading font-semibold text-[var(--color-text)]">
          {start} – {end}
        </h4>
      </div>
      <p className="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed">
        {recap.insight}
      </p>
      
      <div className="flex gap-4 border-t border-[var(--color-border)] pt-3">
        <div className="text-center flex-1">
          <p className="font-bold text-[var(--color-text)] text-sm">{recap.stats_snapshot?.topics_explored || 0}</p>
          <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Topics</p>
        </div>
        <div className="text-center flex-1">
          <p className="font-bold text-[var(--color-text)] text-sm">{recap.stats_snapshot?.notes_saved || 0}</p>
          <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Notes</p>
        </div>
        <div className="text-center flex-1">
          <p className="font-bold text-[var(--color-text)] text-sm">{recap.stats_snapshot?.milestones_completed || 0}</p>
          <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Milestones</p>
        </div>
      </div>
    </Card>
  )
}

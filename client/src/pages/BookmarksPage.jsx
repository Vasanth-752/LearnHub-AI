import { useState, useEffect } from 'react'
import { Loader2, Bookmark, PlayCircle, Award, FileText, Trash2, Filter } from 'lucide-react'
import { Button, Card, Badge, Skeleton, EmptyState, ConfirmModal } from '../components/ui'
import api from '../services/api'
import toast from 'react-hot-toast'

const BOOKMARK_TYPES = [
  { id: 'all', label: 'All', icon: Bookmark },
  { id: 'videos', label: 'Videos', icon: PlayCircle },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'notes', label: 'Notes', icon: FileText },
]

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [deletingBookmark, setDeletingBookmark] = useState(null)

  useEffect(() => {
    fetchBookmarks()
  }, [])

  const fetchBookmarks = async () => {
    try {
      const response = await api.get('/bookmarks')
      setBookmarks(response.data.data || [])
    } catch (error) {
      toast.error('Failed to load bookmarks')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingBookmark) return
    try {
      await api.delete(`/bookmarks/${deletingBookmark.id}`)
      setBookmarks(bookmarks.filter(b => b.id !== deletingBookmark.id))
      toast.success('Bookmark removed')
    } catch (error) {
      toast.error('Failed to remove bookmark')
    } finally {
      setDeletingBookmark(null)
    }
  }

  const filteredBookmarks = activeFilter === 'all'
    ? bookmarks
    : bookmarks.filter(b => b.type === activeFilter)

  const typeLabels = {
    videos: 'Video',
    certifications: 'Certification',
    notes: 'Note',
  }

  const typeIcons = {
    videos: PlayCircle,
    certifications: Award,
    notes: FileText,
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in-up">
        <div className="flex gap-2">
          <Skeleton variant="rectangular" width="30%" height="48px" />
          <Skeleton variant="rectangular" width="200px" height="48px" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} padding="md">
              <Skeleton variant="text" lines={3} />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-[var(--color-text)]">Bookmarks</h1>
          <p className="text-[var(--color-text-secondary)]">Your saved videos, certifications, and notes</p>
        </div>
        <div className="flex gap-1 bg-[var(--color-bg)] p-1 rounded-lg border border-[var(--color-border)]">
          {BOOKMARK_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => setActiveFilter(type.id)}
              className="px-3 py-1.5 text-sm rounded-md transition-all duration-200"
              style={{
                background: activeFilter === type.id ? 'var(--color-surface)' : 'transparent',
                color: activeFilter === type.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                border: activeFilter === type.id ? '1px solid var(--color-border-hover)' : '1px solid transparent',
              }}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookmarks Grid */}
      {filteredBookmarks.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBookmarks.map(bookmark => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onDelete={setDeletingBookmark}
              typeLabels={typeLabels}
              typeIcons={typeIcons}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bookmark}
          title={activeFilter === 'all' ? 'No bookmarks yet' : `No ${activeFilter} bookmarked`}
          description={activeFilter === 'all'
            ? 'Bookmark videos, certifications, or notes from Explore to save them for later.'
            : `No ${activeFilter} have been bookmarked yet.`}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deletingBookmark}
        onClose={() => setDeletingBookmark(null)}
        title="Remove Bookmark"
        description="Are you sure you want to remove this bookmark?"
        confirmLabel="Remove"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  )
}

function BookmarkCard({ bookmark, onDelete, typeLabels, typeIcons }) {
  const TypeIcon = typeIcons[bookmark.type] || Bookmark

  return (
    <Card hover padding="md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <TypeIcon className="w-4 h-4 text-[var(--color-primary)]" />
            <Badge variant="neutral" className="text-xs">{typeLabels[bookmark.type] || bookmark.type}</Badge>
          </div>
          <h4 className="font-medium text-[var(--color-text)] mb-1 line-clamp-2">{bookmark.title}</h4>
          {bookmark.channel && <p className="text-sm text-[var(--color-text-secondary)]">{bookmark.channel}</p>}
          {bookmark.provider && <p className="text-sm text-[var(--color-text-secondary)]">{bookmark.provider}</p>}
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            Saved {new Date(bookmark.created_at).toLocaleDateString()}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onDelete(bookmark)} className="text-[var(--color-danger)]" aria-label="Remove bookmark">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )
}